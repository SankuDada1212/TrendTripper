from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import torch
from torchvision import transforms, models, datasets
from PIL import Image
import io, os, json, requests
import sqlite3
from typing import Optional
import csv
import pandas as pd
import datetime as dt
from random import choice
import hashlib
import secrets
import jwt
from datetime import datetime, timedelta

# Load .env automatically if present
try:
    from dotenv import load_dotenv
    # Load env from backend/.env
    CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
    load_dotenv(os.path.join(CURRENT_DIR, ".env"))
except Exception:
    pass

try:
    from twilio.rest import Client as TwilioClient
except Exception:
    TwilioClient = None  # Twilio may not be installed in some environments

# Mood analysis dependencies
try:
    from transformers import pipeline
    SENTIMENT_AVAILABLE = True
except Exception:
    SENTIMENT_AVAILABLE = False

# Geocoding dependencies
try:
    from geopy.geocoders import Nominatim
    from urllib.parse import quote_plus
    GEOCODING_AVAILABLE = True
except Exception:
    GEOCODING_AVAILABLE = False

# ----------------------------
# Config
# ----------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

IMG_SIZE = 128
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "fast_monument_cnn.pth")
DATA_DIR = r"C:\Users\sanke\Documents\Project\dataset"
INFO_FILE = os.path.join(BASE_DIR, "data", "monument_info.json")
HISTORY_FILE = os.path.join(BASE_DIR, "data", "monument_history.json")
N8N_WEBHOOK = "https://sanket0208.app.n8n.cloud/webhook/monument"
EVENTS_CSV = os.path.join(BASE_DIR, "data", "events.csv")

# ----------------------------
# SOS Config (env-driven)
# ----------------------------
SOS_DB_FILE = os.path.join(BASE_DIR, "offline_sos.db")
USER_DB_FILE = os.path.join(BASE_DIR, "users.db")
# Use a fixed SECRET_KEY for development (should be in .env for production)
# This ensures tokens remain valid across server restarts
SECRET_KEY = os.environ.get("SECRET_KEY", "trend-tripper-secret-key-change-in-production-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

SOS_CONTACTS = os.environ.get(
    "SOS_CONTACTS",
    ""  # Set via environment variable
).split(",") if os.environ.get("SOS_CONTACTS") else []
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_NUMBER = os.environ.get("TWILIO_NUMBER", "")
TWILIO_WHATSAPP_FROM = os.environ.get("TWILIO_WHATSAPP_FROM", "")  # e.g., whatsapp:+14155238886
TWILIO_ENABLE_WHATSAPP = os.environ.get("TWILIO_ENABLE_WHATSAPP", "0").lower() in ["1", "true", "yes"]
twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) if (TwilioClient and TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN) else None

# ----------------------------
# Booking/Dash-equivalent data setup
# ----------------------------
DIST_FILE = r"C:\\Users\\sanke\\Documents\\Project\\Python\\Rishi\\Lets\\Dist.xlsx"
FLIGHT_FILE = r"C:\\Users\\sanke\\Documents\\Project\\Python\\Rishi\\Lets\\flight.xlsx"

def _safe_float(val, default=0.0):
    try:
        if isinstance(val, str):
            val = val.replace(",", "").strip()
        return float(val)
    except Exception:
        return float(default)

try:
    df_dist = pd.read_excel(DIST_FILE) if os.path.exists(DIST_FILE) else pd.DataFrame(
        columns=["City", "Origin Place", "Destination Place", "Distance (km)"]
    )
except Exception:
    df_dist = pd.DataFrame(columns=["City", "Origin Place", "Destination Place", "Distance (km)"])

try:
    df_flight = pd.read_excel(FLIGHT_FILE) if os.path.exists(FLIGHT_FILE) else pd.DataFrame(
        columns=["From City", "To City", "Distance (km)", "Avg Flight Duration (h:mm)", "Airline Examples"]
    )
except Exception:
    df_flight = pd.DataFrame(columns=["From City", "To City", "Distance (km)", "Avg Flight Duration (h:mm)", "Airline Examples"])

def _fmt_flight_time(x):
    if pd.isna(x):
        return ""
    if isinstance(x, (dt.datetime, dt.time, pd.Timestamp)):
        total_minutes = x.hour * 60 + x.minute
    elif isinstance(x, dt.timedelta):
        total_minutes = int(x.total_seconds() // 60)
    else:
        try:
            s = str(x).strip()
            # Accept formats like 6:49, 06:49
            h, m = map(int, s.split(":"))
            total_minutes = h * 60 + m
        except Exception:
            return str(x)
    return f"{total_minutes // 60}:{total_minutes % 60:02d}"

if not df_flight.empty and "Avg Flight Duration (h:mm)" in df_flight.columns:
    df_flight["Avg Flight Duration (h:mm)"] = df_flight["Avg Flight Duration (h:mm)"].apply(_fmt_flight_time)
if not df_flight.empty and "Distance (km)" in df_flight.columns:
    df_flight["Distance (km)"] = df_flight["Distance (km)"].apply(lambda v: _safe_float(v))

# Extract flight cities properly
flight_cities = []
if not df_flight.empty and "From City" in df_flight.columns and "To City" in df_flight.columns:
    from_cities = df_flight["From City"].dropna().unique().tolist()
    to_cities = df_flight["To City"].dropna().unique().tolist()
    flight_cities = sorted(list(set(from_cities + to_cities)))

vehicles = {
    "AUTO": {"fare_per_km": 12, "icon": "🛺", "min_fare": 80, "platform_fee": 5},
    "MICRO": {"fare_per_km": 20, "icon": "🚗", "min_fare": 50},
    "MINI": {"fare_per_km": 30, "icon": "🚙", "min_fare": 80},
    "PRIME": {"fare_per_km": 50, "icon": "🚖", "min_fare": 150},
    "LUX": {"fare_per_km": 100, "icon": "🚘", "min_fare": 300},
}

states = {
    "Maharashtra": ["Mumbai", "Pune"],
    "Gujarat": ["Ahmedabad", "Surat"],
    "Karnataka": ["Bangalore"],
    "Tamil Nadu": ["Chennai"],
    "West Bengal": ["Kolkata"],
    "Tamil Nadu South": ["Kanyakumari"],
}

places_map = {}
if not df_dist.empty:
    for c in df_dist["City"].dropna().unique():
        subset = df_dist[df_dist["City"] == c]
        origin_places = subset["Origin Place"].dropna().unique().tolist()
        dest_places = subset["Destination Place"].dropna().unique().tolist()
        places_map[c] = sorted(list({*origin_places, *dest_places}))

_pending_booking: dict | None = None
_booking_history: list[dict] = []

# ----------------------------
# Mood Analysis Setup (Code 1)
# ----------------------------
sentiment_classifier = None
if SENTIMENT_AVAILABLE:
    try:
        os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
        os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
        sentiment_classifier = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english"
        )
        print("✅ Sentiment analysis model loaded successfully.")
    except Exception as e:
        print(f"⚠️ Could not load sentiment model: {e}")
        sentiment_classifier = None


def analyze_mood(text: str) -> dict:
    """Analyzes the sentiment of the input text using BERT-based pipeline."""
    if not sentiment_classifier:
        return {'label': 'NEUTRAL', 'score': 0.5}
    
    try:
        result = sentiment_classifier(text)[0]
        sentiment = result['label'].upper()
        score = result['score']
        
        # Custom logic: low-confidence score as NEUTRAL
        if score < 0.65 and (sentiment == 'NEGATIVE' or sentiment == 'POSITIVE'):
            sentiment = 'NEUTRAL'
        
        return {'label': sentiment, 'score': score}
    except Exception as e:
        print(f"Error in mood analysis: {e}")
        return {'label': 'NEUTRAL', 'score': 0.5}


# ----------------------------
# Place Recommendation Setup (Code 2)
# ----------------------------
def get_coordinates(address: str):
    """Convert address into latitude & longitude using OpenStreetMap."""
    if not GEOCODING_AVAILABLE:
        return None, None
    try:
        geolocator = Nominatim(user_agent="trend_trip_planner")
        location = geolocator.geocode(address, timeout=10)
        if location:
            return location.latitude, location.longitude
    except Exception as e:
        print(f"[Warning] Geocoding failed: {e}")
    return None, None


def get_places_osm(lat: float, lon: float, radius: int = 10000, tag_key: str = "amenity", tag_value: str = "restaurant"):
    """Query Overpass API for specific tag and value."""
    try:
        query = f"""
        [out:json];
        node["{tag_key}"="{tag_value}"](around:{radius},{lat},{lon});
        out center;
        """
        url = "http://overpass-api.de/api/interpreter"
        response = requests.get(url, params={'data': query}, timeout=20)
        data = response.json()
        
        places = []
        for element in data.get('elements', []):
            name = element['tags'].get('name', 'Unnamed Place')
            lat_p, lon_p = element.get('lat'), element.get('lon')
            if lat_p and lon_p:
                places.append({
                    'name': name,
                    'lat': lat_p,
                    'lon': lon_p,
                    'tag_key': tag_key,
                    'tag_value': tag_value
                })
        return places[:8]
    except Exception as e:
        print(f"[Error fetching {tag_value}]: {e}")
        return []


def recommend_places_osm(address: str, mood: str = "NEUTRAL", food_pref: str = "any", radius_km: int = 10):
    """Recommend mood-matched places near the user."""
    lat, lon = get_coordinates(address)
    if not lat or not lon:
        return [{"name": "❌ Could not find location.", "lat": None, "lon": None, "maps_link": None, "category": "Error"}]
    
    # Expanded mood map
    mood_map = {
        "POSITIVE": [("amenity", "cafe"), ("leisure", "park"), ("tourism", "theme_park"), ("shop", "mall")],
        "NEGATIVE": [("natural", "beach"), ("tourism", "viewpoint"), ("tourism", "temple"), ("leisure", "garden")],
        "NEUTRAL": [("tourism", "museum"), ("leisure", "park"), ("tourism", "landmark")],
        "ROMANTIC": [("tourism", "viewpoint"), ("leisure", "park"), ("amenity", "restaurant"), ("tourism", "lake")],
    }
    
    tags = mood_map.get(mood.upper(), [("amenity", "restaurant")])
    
    all_places = []
    for tag_key, tag_value in tags:
        results = get_places_osm(lat, lon, radius_km * 1000, tag_key, tag_value)
        all_places.extend(results)
    
    # Fallback
    if not all_places:
        print("[Info] No mood-based results found — showing restaurants as fallback.")
        all_places = get_places_osm(lat, lon, radius_km * 1000, "amenity", "restaurant")
    
    # Construct Google Maps direct links
    final_results = []
    for r in all_places:
        name = r['name']
        if r['lat'] and r['lon']:
            maps_link = f"https://www.google.com/maps/place/{quote_plus(name)}/@{r['lat']},{r['lon']},17z"
        else:
            maps_link = f"https://www.google.com/maps/search/{quote_plus(name)}"
        
        # Optional food type icon
        lower_name = name.lower()
        if "veg" in lower_name and "non" not in lower_name:
            icon = "🟢 Veg"
        elif "non" in lower_name or "bar" in lower_name:
            icon = "🔴 Non-Veg"
        else:
            if r['tag_key'] in ["natural", "tourism", "leisure"]:
                icon = "🏞️"
            else:
                icon = "🟡 Mixed"
        
        final_results.append({
            "name": name,
            "maps_link": maps_link,
            "category": f"{r['tag_value'].replace('_', ' ').title()} {icon}",
            "lat": r['lat'],
            "lon": r['lon']
        })
    
    return final_results[:10]

# ----------------------------
# Authentication & User Database Setup
# ----------------------------
security = HTTPBearer()

def hash_password(password: str) -> str:
    """Hash password using SHA256 (for simplicity; use bcrypt in production)"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return hash_password(plain_password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def init_user_db():
    """Initialize user database with all tables"""
    conn = sqlite3.connect(USER_DB_FILE)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Add is_admin column if it doesn't exist (migration)
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0")
        conn.commit()
        print("✅ Added is_admin column to users table")
    except sqlite3.OperationalError:
        # Column already exists, ignore
        pass
    
    # Check if admin user exists, if not create one
    cursor.execute("SELECT id FROM users WHERE username = 'admin'")
    admin_user = cursor.fetchone()
    if not admin_user:
        admin_password_hash = hash_password("Sanket@2507")  # Default admin password
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, ?)",
            ("admin", "admin@trendtripper.com", admin_password_hash, 1)
        )
        conn.commit()
        print("✅ Admin user created: username='admin', password='Sanket@2507'")
    else:
        # Update existing admin password
        admin_password_hash = hash_password("Sanket@2507")
        cursor.execute(
            "UPDATE users SET password_hash = ? WHERE username = 'admin' AND is_admin = 1",
            (admin_password_hash,)
        )
        conn.commit()
        print("✅ Admin password updated: username='admin', password='Sanket@2507'")
    
    # User searches (monument searches)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_searches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            monument_name TEXT,
            search_data TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # User budget trips
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_budget_trips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            trip_name TEXT NOT NULL,
            budget REAL NOT NULL,
            categories TEXT,
            category_budgets TEXT,
            num_people INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # User expenses
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            trip_name TEXT NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            user_id_expense INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # User bookings
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            booking_data TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # User mood analysis
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_mood_analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            text_input TEXT,
            mood_result TEXT,
            recommendations TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # User restaurant searches
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_restaurant_searches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            search_params TEXT,
            results TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # User saved restaurants (for favorites)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_saved_restaurants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            restaurant_name TEXT NOT NULL,
            restaurant_data TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, restaurant_name)
        )
    """)
    
    # User events
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            event_id TEXT,
            event_data TEXT,
            action TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # User hotels
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_hotels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            hotel_id TEXT,
            hotel_data TEXT,
            action TEXT,
            booking_data TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    conn.commit()
    conn.close()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        # Convert string back to int
        try:
            user_id = int(user_id_str)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user ID in token"
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except (jwt.InvalidSignatureError, jwt.DecodeError, jwt.InvalidTokenError) as e:
        # Catch JWT-specific errors
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}"
        )
    except Exception as e:
        # Catch any other unexpected errors
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}"
        )
    
    conn = sqlite3.connect(USER_DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, is_admin FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return {"id": user[0], "username": user[1], "email": user[2], "is_admin": bool(user[3])}

# ----------------------------
# SOS Helpers (mirror Streamlit logic)
# ----------------------------
def init_sos_db():
    try:
        conn = sqlite3.connect(SOS_DB_FILE)
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS sos_alerts (
                id INTEGER PRIMARY KEY,
                message TEXT,
                status TEXT,
                timestamp TEXT
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def save_offline_alert(message: str):
    conn = sqlite3.connect(SOS_DB_FILE)
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO sos_alerts (message, status, timestamp) VALUES (?, ?, ?)",
            (message, "pending", dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
        )
        conn.commit()
    finally:
        conn.close()


def resend_pending_alerts() -> int:
    conn = sqlite3.connect(SOS_DB_FILE)
    sent = 0
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, message FROM sos_alerts WHERE status='pending'")
        rows = cursor.fetchall()
        for sos_id, message in rows:
            if send_sms_alert(message):
                cursor.execute("UPDATE sos_alerts SET status='sent' WHERE id=?", (sos_id,))
                conn.commit()
                sent += 1
    finally:
        conn.close()
    return sent


def get_ip_location_link() -> str:
    try:
        response = requests.get("https://ipinfo.io/", timeout=3)
        data = response.json()
        loc = data.get("loc")
        if loc:
            return f"https://maps.google.com/?q={loc}"
        return "Location unavailable"
    except Exception:
        return "Location unavailable"


def dummy_ai_predict(features: dict) -> str:
    # Same simple classifier: randomly predicts REAL vs FALSE
    return choice(["REAL", "FALSE"])


def send_sms_alert(message: str) -> list[str]:
    sids: list[str] = []
    try:
        if not twilio_client or not TWILIO_NUMBER:
            # Twilio not configured; simulate failure so it queues offline
            raise RuntimeError("Twilio not configured")
        for contact in SOS_CONTACTS:
            contact_num = contact.strip()
            if not contact_num:
                continue
            msg = twilio_client.messages.create(body=message, from_=TWILIO_NUMBER, to=contact_num)
            try:
                sids.append(getattr(msg, "sid", ""))
            except Exception:
                pass
        return sids
    except Exception as e:
        print(f"[Twilio] Send failed: {e}")
        return []


def send_whatsapp_alert(message: str) -> list[str]:
    sids: list[str] = []
    try:
        if not twilio_client or not TWILIO_WHATSAPP_FROM:
            raise RuntimeError("Twilio WhatsApp not configured")
        for contact in SOS_CONTACTS:
            contact_num = contact.strip()
            if not contact_num:
                continue
            to_wa = contact_num if contact_num.startswith("whatsapp:") else f"whatsapp:{contact_num}"
            msg = twilio_client.messages.create(body=message, from_=TWILIO_WHATSAPP_FROM, to=to_wa)
            try:
                sids.append(getattr(msg, "sid", ""))
            except Exception:
                pass
        return sids
    except Exception as e:
        print(f"[Twilio] WhatsApp send failed: {e}")
        return []

# ----------------------------
# Load model and dataset
# ----------------------------
class_names = []
if os.path.isdir(DATA_DIR):
    try:
        dataset = datasets.ImageFolder(DATA_DIR)
        class_names = dataset.classes
    except Exception:
        class_names = []

with open(INFO_FILE, "r", encoding="utf-8") as f:
    monument_info = json.load(f)

with open(HISTORY_FILE, "r", encoding="utf-8") as f:
    monument_history = json.load(f)

transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

model = models.resnet18(pretrained=False)
# Force number of classes to match training
model.fc = torch.nn.Linear(model.fc.in_features, 80)  # trained with 80 classes
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model.to(DEVICE)
model.eval()

# ----------------------------
# Helper function
# ----------------------------
def call_n8n_ai_agent(monument_name):
    payload = {"monument": monument_name}
    try:
        res = requests.post(N8N_WEBHOOK, json=payload, timeout=25)
        if res.status_code == 200:
            data = res.json()
            return data
        else:
            return {"error": f"Webhook failed: {res.status_code}"}
    except Exception as e:
        return {"error": str(e)}

# ----------------------------
# API Route
# ----------------------------
@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = transform(image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        outputs = model(image)
        _, predicted = torch.max(outputs, 1)

    if class_names:
        monument_name = class_names[predicted.item()]
    else:
        monument_name = "Unknown"

    description = monument_info.get(monument_name, "No information available.")

    ai_data = call_n8n_ai_agent(monument_name) or {}
    old_image = ai_data.get("old_image") if isinstance(ai_data, dict) else None
    new_image = ai_data.get("new_image") if isinstance(ai_data, dict) else None

    timeline = monument_history.get(monument_name, [])

    return {
        "monument": monument_name,
        "description": description,
        "old_image": old_image,
        "new_image": new_image,
        "timeline": timeline,
    }

# ----------------------------
# Additional info endpoint (compat with existing frontend calls)
# ----------------------------
@app.get("/get_monument_info")
def get_monument_info(monument_name: str):
    # Normalize monument name similar to earlier logic if underscores present
    name = monument_name.split("_")[0].strip()

    description = monument_info.get(name, "No information available.")
    timeline = monument_history.get(name, [])

    ai_data = call_n8n_ai_agent(name) or {}
    old_image = ai_data.get("old_image") if isinstance(ai_data, dict) else None
    new_image = ai_data.get("new_image") if isinstance(ai_data, dict) else None

    return {
        "monument": name,
        "description": description,
        "old_image": old_image,
        "new_image": new_image,
        "timeline": timeline,
    }

# ----------------------------
# Events from CSV
# ----------------------------
def calculate_event_price(artist: str, category: str, popularity: str, venue: str, event_name: str = "") -> float:
    """Calculate appropriate price for an event based on artist, category, popularity, and venue."""
    base_price = 500  # Base price in INR
    
    # Premium artists (higher pricing)
    premium_artists = [
        "ar rahman", "akon", "enrique iglesias", "calvin harris", "post malone", 
        "travis scott", "john mayer", "ap dhillon", "sonu nigam", "shaan",
        "sunidhi chauhan", "kailash kher", "hariharan", "papon"
    ]
    
    # Popular artists (mid-range pricing)
    popular_artists = [
        "jubin nautiyal", "sid sriram", "amit kumar", "javed ali", "kumar sanu",
        "mohammed irfan", "salman ali", "rahat fateh ali khan", "shilpa rao",
        "asees kaur", "harshdeep kaur", "palak muchhal", "shweta mohan"
    ]
    
    artist_lower = artist.lower().strip() if artist else ""
    event_name_lower = event_name.lower() if event_name else ""
    
    # Adjust price based on artist tier
    if any(pa in artist_lower for pa in premium_artists):
        base_price = 3500  # Premium artists
    elif any(pa in artist_lower for pa in popular_artists):
        base_price = 2000  # Popular artists
    elif artist_lower:
        base_price = 1200  # Other artists
    
    # Adjust based on category
    category_lower = category.lower() if category else ""
    if "comedy" in category_lower:
        base_price = min(base_price, 1500)  # Comedy shows are usually cheaper
    elif "food" in category_lower:
        base_price = min(base_price, 800)  # Food events are usually cheaper
    elif "festival" in category_lower or "sunburn" in event_name_lower:
        base_price = max(base_price, 4000)  # Festivals are usually more expensive
    
    # Adjust based on popularity if available
    if popularity:
        try:
            pop_value = float(popularity)
            if pop_value > 80:
                base_price *= 1.5
            elif pop_value > 60:
                base_price *= 1.2
        except:
            pass
    
    # Venue adjustments (premium venues cost more)
    venue_lower = venue.lower() if venue else ""
    if any(v in venue_lower for v in ["stadium", "arena", "auditorium", "palace"]):
        base_price *= 1.3
    elif any(v in venue_lower for v in ["club", "pub", "bar"]):
        base_price *= 0.8
    
    # Round to nearest 50
    return round(base_price / 50) * 50

@app.get("/api/events")
def get_events(city: Optional[str] = None):
    events = []
    if not os.path.isfile(EVENTS_CSV):
        print(f"⚠️ Events CSV file not found at: {EVENTS_CSV}")
        return {"events": events, "status": "file_not_found"}
    try:
        with open(EVENTS_CSV, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    artist = row.get("artist") or row.get("Artist") or ""
                    name = row.get("name") or row.get("Name") or "Untitled"
                    city_col = row.get("city") or row.get("City") or row.get("location") or row.get("Location") or ""
                    venue = row.get("venue") or row.get("Venue") or ""
                    dt = row.get("date") or row.get("Date") or ""
                    genres = row.get("genres") or row.get("Genres") or row.get("genre") or ""
                    popularity = row.get("popularity") or row.get("Popularity") or ""
                    
                    category = (
                        genres.split("/")[0] if "/" in genres
                        else genres.split(",")[0] if "," in genres
                        else genres or "Music"
                    ).strip().title()
                    
                    description = (
                        row.get("description") or row.get("Description")
                        or f"{artist} at {venue} • Genres: {genres} • Popularity: {popularity}".strip()
                    )

                    # Calculate price if not provided
                    csv_price = float(row.get("price") or row.get("Price") or 0)
                    if csv_price == 0:
                        price = calculate_event_price(artist, category, popularity, venue, name)
                    else:
                        price = csv_price

                    ev = {
                        "id": row.get("id") or row.get("ID") or row.get("Id") or name,
                        "name": name,
                        "date": dt,
                        "location": f"{city_col}{(' - ' + venue) if venue else ''}",
                        "description": description,
                        "price": price,
                        "imageUrl": row.get("imageUrl") or row.get("image") or row.get("Image") or "",
                        "category": category or "Music",
                        "artist": artist,
                    }
                    events.append(ev)
                except Exception as e:
                    print(f"⚠️ Error parsing event row: {e}")
                    continue

        print(f"✅ Loaded {len(events)} events from CSV")
    except Exception as e:
        print(f"❌ Error reading events CSV: {e}")
        return {"events": [], "status": "error", "message": str(e)}

    if city:
        city_lower = city.lower()
        events = [e for e in events if city_lower in (e.get("location") or "").lower()]

    return {"events": events, "status": "success", "count": len(events)}

# ----------------------------
# Booking endpoints (Dash-equivalent)
# ----------------------------
@app.get("/booking/config")
def booking_config():
    return {
        "states": states,
        "vehicles": vehicles,
        "flight_cities": flight_cities,
        "places": places_map,
    }

@app.get("/booking/flight_info")
def booking_flight_info(from_city: str, to_city: str):
    if not from_city or not to_city:
        return {"message": "Select both cities to view flight details.", "available": False}
    if df_flight.empty or "From City" not in df_flight.columns or "To City" not in df_flight.columns:
        return {"message": "No flight data available.", "available": False}
    row = df_flight[(df_flight["From City"] == from_city) & (df_flight["To City"] == to_city)]
    if row.empty:
        return {"message": f"No direct flights available between {from_city} and {to_city}.", "available": False}
    r = row.iloc[0]
    return {
        "available": True,
        "from_city": from_city,
        "to_city": to_city,
        "distance_km": _safe_float(r["Distance (km)"] if "Distance (km)" in r.index else 0),
        "duration": str(r["Avg Flight Duration (h:mm)"]) if "Avg Flight Duration (h:mm)" in r.index else "",
        "airline": str(r["Airline Examples"]) if "Airline Examples" in r.index else "",
    }

def _lookup_distance(city: str, origin: str, destination: str) -> float:
    if df_dist.empty:
        return 10.0
    match = df_dist[
        (df_dist["City"] == city)
        & (
            ((df_dist["Origin Place"] == origin) & (df_dist["Destination Place"] == destination))
            | ((df_dist["Origin Place"] == destination) & (df_dist["Destination Place"] == origin))
        )
    ]
    if not match.empty:
        try:
            return _safe_float(match["Distance (km)"].iloc[0], 10.0)
        except Exception:
            return 10.0
    return 10.0

@app.post("/booking/city/price")
def booking_city_price(payload: dict):
    global _pending_booking
    city = payload.get("city")
    origin = payload.get("origin")
    dest_city = payload.get("dest_city")
    destination = payload.get("destination")
    vehicle_name = payload.get("vehicle_name")

    if not all([city, origin, dest_city, destination, vehicle_name]):
        return {"error": "Missing required fields."}
    v = vehicles.get(vehicle_name)
    if not v:
        return {"error": "Invalid vehicle."}

    dist = _lookup_distance(city, origin, destination)
    fare = v["fare_per_km"]
    total = max(dist * fare, v["min_fare"])
    if vehicle_name == "AUTO":
        total += v.get("platform_fee", 0)

    _pending_booking = {
        "time": dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "trip_type": "City",
        "vehicle": f"{v['icon']} {vehicle_name}",
        "from_city": city,
        "from_place": origin,
        "to_city": dest_city,
        "to_place": destination,
        "distance": dist,
        "fare": fare,
        "final_price": round(total, 2),
        "payment_mode": None,
    }

    return {
        "summary": {
            "type": "City",
            "text": [
                f"🚕 City Trip: {city} → {dest_city}",
                f"Vehicle: {vehicle_name}",
                f"Distance: {dist:.1f} km",
                f"Total Fare: ₹{total:.2f}",
            ],
        },
        "pending": _pending_booking,
    }

@app.post("/booking/flight/price")
def booking_flight_price(payload: dict):
    global _pending_booking
    flight_from = payload.get("from_city")
    flight_to = payload.get("to_city")
    if not flight_from or not flight_to:
        return {"error": "Please select both cities for flight booking."}
    if df_flight.empty or "From City" not in df_flight.columns or "To City" not in df_flight.columns:
        return {"error": "No flight data available."}
    row = df_flight[(df_flight["From City"] == flight_from) & (df_flight["To City"] == flight_to)]
    if row.empty:
        return {"error": f"No direct flight from {flight_from} to {flight_to}."}
    r = row.iloc[0]
    dist = _safe_float(r["Distance (km)"] if "Distance (km)" in r.index else 0)
    airline = str(r["Airline Examples"]) if "Airline Examples" in r.index else ""
    total = round(4000 + dist * 3.5, 0)

    _pending_booking = {
        "time": dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "trip_type": "Flight",
        "vehicle": "✈️ Flight",
        "from_city": flight_from,
        "from_place": "-",
        "to_city": flight_to,
        "to_place": "-",
        "distance": dist,
        "fare": "-",
        "final_price": total,
        "payment_mode": None,
    }
    return {
        "summary": {
            "type": "Flight",
            "text": [
                f"✈️ Flight Booking: {flight_from} → {flight_to}",
                f"Airline: {airline}",
                f"Distance: {dist} km",
                f"Fare: ₹{total}",
            ],
        },
        "pending": _pending_booking,
    }

@app.post("/booking/confirm")
def booking_confirm(payload: dict):
    global _pending_booking
    mode = payload.get("payment_mode")
    if not _pending_booking:
        return {"error": "No pending booking."}
    _pending_booking["payment_mode"] = mode or _pending_booking.get("payment_mode")
    _booking_history.append(_pending_booking)
    saved = _pending_booking
    _pending_booking = None
    return {"saved": saved}

@app.get("/booking/history")
def booking_history():
    return {"history": _booking_history}

# ----------------------------
# SOS Endpoints (mirror Streamlit behavior)
# ----------------------------
@app.on_event("startup")
def _init_startup():
    init_sos_db()
    init_user_db()


@app.post("/api/sos")
def api_sos(payload: Optional[dict] = None):
    payload = payload or {}
    # Build location link: prefer lat/long from client else IP-based
    lat = payload.get("latitude") if isinstance(payload, dict) else None
    lon = payload.get("longitude") if isinstance(payload, dict) else None
    if lat is not None and lon is not None:
        location_link = f"https://maps.google.com/?q={lat},{lon}"
    else:
        location_link = get_ip_location_link()

    # ML prediction (dummy)
    features = {"time": dt.datetime.now().hour, "location": location_link}
    prediction = dummy_ai_predict(features)

    body = (
        f"🚨 HELP! I am in trouble.\n"
        f"Location: {location_link}\n"
        f"Time: {dt.datetime.now()}\n"
        f"AI Detection: {prediction}"
    )

    sids = send_sms_alert(body)
    if sids:
        return {"status": "sent", "message_sids": sids}
    else:
        save_offline_alert(body)
        return {"status": "queued", "message": "No internet/SMS failed. Saved offline."}


@app.post("/api/sos/retry")
def api_sos_retry():
    count = resend_pending_alerts()
    return {"retried": count}

@app.get("/api/sos/status")
def api_sos_status():
    return {
        "twilio_client": bool(twilio_client),
        "twilio_number_set": bool(TWILIO_NUMBER),
        "whatsapp_enabled": bool(TWILIO_ENABLE_WHATSAPP),
        "whatsapp_from_set": bool(os.environ.get("TWILIO_WHATSAPP_FROM")),
        "contacts_count": len(SOS_CONTACTS),
    }

# ----------------------------
# Mood Analysis Endpoints (Code 1 + Code 2 integration)
# ----------------------------
@app.post("/api/mood/analyze")
def api_mood_analyze(payload: dict):
    """Analyze mood from text input (Code 1)."""
    text = payload.get("text", "")
    if not text.strip():
        return {"error": "Text cannot be empty"}
    
    mood_result = analyze_mood(text)
    return {
        "mood": mood_result['label'],
        "confidence": mood_result['score'],
        "text": text
    }


@app.post("/api/mood/recommendations")
def api_mood_recommendations(payload: dict):
    """Get place recommendations based on mood (Code 2 + Code 3 integration)."""
    text = payload.get("text", "")
    address = payload.get("address", "")
    food_pref = payload.get("food_pref", "any")
    radius = payload.get("radius", 10)
    
    # First analyze mood from text
    mood_result = analyze_mood(text)
    mood = mood_result['label']
    
    # Then get recommendations
    recommendations = recommend_places_osm(address, mood, food_pref, radius)
    
    return {
        "mood": mood,
        "confidence": mood_result['score'],
        "recommendations": recommendations
    }

# ----------------------------
# Hotel Booking Endpoints (Indian Cities Focus)
# ----------------------------
INDIAN_HOTELS = {
    "Mumbai": [
        {"id": "mum_1", "name": "Taj Mahal Palace", "location": "Colaba, Mumbai", "price": 15000, "rating": 4.8, "type": "luxury", "amenities": ["Pool", "Spa", "Restaurant", "Gym", "Concierge", "Business Center", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"},
        {"id": "mum_2", "name": "The Oberoi Mumbai", "location": "Nariman Point, Mumbai", "price": 12000, "rating": 4.7, "type": "luxury", "amenities": ["Pool", "Spa", "Restaurant", "Gym", "Beach Access", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800"},
        {"id": "mum_3", "name": "ITC Maratha", "location": "Andheri East, Mumbai", "price": 8500, "rating": 4.5, "type": "luxury", "amenities": ["Pool", "Spa", "Restaurant", "Gym", "Business Center", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800"},
        {"id": "mum_4", "name": "The Leela Mumbai", "location": "Sahar, Mumbai", "price": 10000, "rating": 4.6, "type": "luxury", "amenities": ["Pool", "Spa", "Restaurant", "Gym", "Concierge", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800"},
        {"id": "mum_5", "name": "Lemon Tree Premier", "location": "Andheri, Mumbai", "price": 4500, "rating": 4.2, "type": "mid-range", "amenities": ["Pool", "Restaurant", "Gym", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800"},
        {"id": "mum_6", "name": "Treebo Trend", "location": "Bandra, Mumbai", "price": 2500, "rating": 3.8, "type": "budget", "amenities": ["Restaurant", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800"},
    ],
    "Pune": [
        {"id": "pune_1", "name": "JW Marriott Pune", "location": "Senapati Bapat Road, Pune", "price": 8000, "rating": 4.6, "type": "luxury", "amenities": ["Pool", "Spa", "Restaurant", "Gym", "Business Center", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"},
        {"id": "pune_2", "name": "Conrad Pune", "location": "Shivajinagar, Pune", "price": 9000, "rating": 4.7, "type": "luxury", "amenities": ["Pool", "Spa", "Restaurant", "Gym", "Concierge", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800"},
        {"id": "pune_3", "name": "Novotel Pune", "location": "Hinjawadi, Pune", "price": 5500, "rating": 4.3, "type": "mid-range", "amenities": ["Pool", "Restaurant", "Gym", "Business Center", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800"},
        {"id": "pune_4", "name": "Radisson Blu", "location": "Kharadi, Pune", "price": 6000, "rating": 4.4, "type": "mid-range", "amenities": ["Pool", "Restaurant", "Gym", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800"},
        {"id": "pune_5", "name": "Hotel Ganesha", "location": "Koregaon Park, Pune", "price": 3000, "rating": 3.9, "type": "budget", "amenities": ["Restaurant", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800"},
    ],
    "Ahmedabad": [
        {"id": "ahm_1", "name": "The Courtyard by Marriott", "location": "Prahlad Nagar, Ahmedabad", "price": 7000, "rating": 4.5, "type": "luxury", "amenities": ["Pool", "Spa", "Restaurant", "Gym", "Business Center", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"},
        {"id": "ahm_2", "name": "Hyatt Regency", "location": "Ashram Road, Ahmedabad", "price": 8500, "rating": 4.6, "type": "luxury", "amenities": ["Pool", "Spa", "Restaurant", "Gym", "Concierge", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800"},
        {"id": "ahm_3", "name": "Novotel Ahmedabad", "location": "Vastrapur, Ahmedabad", "price": 5000, "rating": 4.2, "type": "mid-range", "amenities": ["Pool", "Restaurant", "Gym", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800"},
        {"id": "ahm_4", "name": "Hotel Grand Bhagwati", "location": "Navrangpura, Ahmedabad", "price": 3500, "rating": 4.0, "type": "mid-range", "amenities": ["Restaurant", "Gym", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800"},
        {"id": "ahm_5", "name": "Hotel Fortune", "location": "CG Road, Ahmedabad", "price": 2800, "rating": 3.7, "type": "budget", "amenities": ["Restaurant", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800"},
    ],
    "Surat": [
        {"id": "sur_1", "name": "The Gateway Hotel", "location": "Athwa Lines, Surat", "price": 6000, "rating": 4.4, "type": "luxury", "amenities": ["Pool", "Restaurant", "Gym", "Business Center", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"},
        {"id": "sur_2", "name": "Hotel Grand Legacy", "location": "Adajan, Surat", "price": 4500, "rating": 4.1, "type": "mid-range", "amenities": ["Pool", "Restaurant", "Gym", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800"},
        {"id": "sur_3", "name": "Hotel President", "location": "Ring Road, Surat", "price": 3200, "rating": 3.9, "type": "mid-range", "amenities": ["Restaurant", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800"},
        {"id": "sur_4", "name": "Hotel Shree Samrat", "location": "City Light, Surat", "price": 2200, "rating": 3.6, "type": "budget", "amenities": ["Restaurant", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800"},
    ],
    "Bangalore": [
        {"id": "blr_1", "name": "The Leela Palace", "location": "Old Airport Road, Bangalore", "price": 14000, "rating": 4.8, "type": "luxury", "amenities": ["Pool", "Spa", "Restaurant", "Gym", "Concierge", "Business Center", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"},
        {"id": "blr_2", "name": "ITC Gardenia", "location": "Residency Road, Bangalore", "price": 11000, "rating": 4.7, "type": "luxury", "amenities": ["Pool", "Spa", "Restaurant", "Gym", "Business Center", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800"},
        {"id": "blr_3", "name": "Taj West End", "location": "Race Course Road, Bangalore", "price": 13000, "rating": 4.6, "type": "luxury", "amenities": ["Pool", "Spa", "Restaurant", "Gym", "Concierge", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800"},
        {"id": "blr_4", "name": "Radisson Blu Atria", "location": "Palace Road, Bangalore", "price": 7500, "rating": 4.4, "type": "mid-range", "amenities": ["Pool", "Restaurant", "Gym", "Business Center", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800"},
        {"id": "blr_5", "name": "Lemon Tree Hotel", "location": "Electronic City, Bangalore", "price": 5000, "rating": 4.2, "type": "mid-range", "amenities": ["Pool", "Restaurant", "Gym", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800"},
        {"id": "blr_6", "name": "Oyo Rooms", "location": "Koramangala, Bangalore", "price": 2000, "rating": 3.5, "type": "budget", "amenities": ["WiFi"], "imageUrl": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800"},
    ],
    "Chennai": [
        {"id": "chn_1", "name": "ITC Grand Chola", "location": "Guindy, Chennai", "price": 12000, "rating": 4.7, "type": "luxury", "amenities": ["Pool", "Spa", "Restaurant", "Gym", "Concierge", "Business Center", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"},
        {"id": "chn_2", "name": "The Leela Palace", "location": "Adyar, Chennai", "price": 11000, "rating": 4.6, "type": "luxury", "amenities": ["Pool", "Spa", "Restaurant", "Gym", "Beach Access", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800"},
        {"id": "chn_3", "name": "Taj Connemara", "location": "Nungambakkam, Chennai", "price": 9000, "rating": 4.5, "type": "luxury", "amenities": ["Pool", "Restaurant", "Gym", "Business Center", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800"},
        {"id": "chn_4", "name": "Radisson Blu", "location": "Egmore, Chennai", "price": 6000, "rating": 4.3, "type": "mid-range", "amenities": ["Pool", "Restaurant", "Gym", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800"},
        {"id": "chn_5", "name": "Hotel Savera", "location": "T Nagar, Chennai", "price": 4000, "rating": 4.0, "type": "mid-range", "amenities": ["Restaurant", "Gym", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800"},
        {"id": "chn_6", "name": "Hotel Green Park", "location": "Perungudi, Chennai", "price": 3500, "rating": 3.8, "type": "budget", "amenities": ["Restaurant", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800"},
    ],
    "Kolkata": [
        {"id": "kol_1", "name": "The Oberoi Grand", "location": "Chowringhee, Kolkata", "price": 10000, "rating": 4.7, "type": "luxury", "amenities": ["Pool", "Spa", "Restaurant", "Gym", "Concierge", "Business Center", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"},
        {"id": "kol_2", "name": "Taj Bengal", "location": "Alipore, Kolkata", "price": 9500, "rating": 4.6, "type": "luxury", "amenities": ["Pool", "Spa", "Restaurant", "Gym", "Concierge", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800"},
        {"id": "kol_3", "name": "ITC Sonar", "location": "EM Bypass, Kolkata", "price": 8000, "rating": 4.5, "type": "luxury", "amenities": ["Pool", "Spa", "Restaurant", "Gym", "Business Center", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800"},
        {"id": "kol_4", "name": "Novotel Kolkata", "location": "City Centre, Kolkata", "price": 5500, "rating": 4.3, "type": "mid-range", "amenities": ["Pool", "Restaurant", "Gym", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800"},
        {"id": "kol_5", "name": "Park Plaza", "location": "Park Street, Kolkata", "price": 4500, "rating": 4.1, "type": "mid-range", "amenities": ["Restaurant", "Gym", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800"},
        {"id": "kol_6", "name": "Hotel Hindustan International", "location": "BBD Bagh, Kolkata", "price": 3000, "rating": 3.9, "type": "budget", "amenities": ["Restaurant", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800"},
    ],
    "Kanyakumari": [
        {"id": "kkm_1", "name": "Sparsa Resort", "location": "Kanyakumari", "price": 5000, "rating": 4.3, "type": "mid-range", "amenities": ["Pool", "Restaurant", "Beach Access", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"},
        {"id": "kkm_2", "name": "Hotel Ocean Heritage", "location": "Beach Road, Kanyakumari", "price": 4000, "rating": 4.1, "type": "mid-range", "amenities": ["Restaurant", "Beach Access", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800"},
        {"id": "kkm_3", "name": "Hotel Sea View", "location": "Kanyakumari", "price": 3500, "rating": 3.9, "type": "mid-range", "amenities": ["Restaurant", "Beach Access", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800"},
        {"id": "kkm_4", "name": "Hotel Samudra", "location": "Kanyakumari", "price": 2800, "rating": 3.7, "type": "budget", "amenities": ["Restaurant", "WiFi"], "imageUrl": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800"},
    ],
}

INDIAN_CITIES = ["Mumbai", "Pune", "Ahmedabad", "Surat", "Bangalore", "Chennai", "Kolkata", "Kanyakumari"]


@app.get("/api/hotel")
def api_get_hotels(
    location: Optional[str] = None,
    checkIn: Optional[str] = None,
    checkOut: Optional[str] = None,
    guests: Optional[int] = None,
    hotel_type: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    min_rating: Optional[float] = None,
):
    """Get hotels filtered by location and other criteria."""
    try:
        hotels_list = []
        
        # If location specified, get hotels from that city
        if location and location in INDIAN_HOTELS:
            hotels_list = INDIAN_HOTELS[location].copy()
        else:
            # Otherwise return all hotels from all cities
            for city_hotels in INDIAN_HOTELS.values():
                hotels_list.extend(city_hotels)
        
        # Filter by hotel type
        if hotel_type and hotel_type != "all" and hotel_type:
            hotels_list = [h for h in hotels_list if h.get("type") == hotel_type]
        
        # Filter by price range
        if min_price is not None and min_price > 0:
            hotels_list = [h for h in hotels_list if h.get("price", 0) >= min_price]
        if max_price is not None and max_price < 20000:
            hotels_list = [h for h in hotels_list if h.get("price", 0) <= max_price]
        
        # Filter by rating
        if min_rating is not None and min_rating > 0:
            hotels_list = [h for h in hotels_list if h.get("rating", 0) >= min_rating]
        
        # Sort by rating (highest first)
        hotels_list.sort(key=lambda x: x.get("rating", 0), reverse=True)
        
        return {"hotels": hotels_list, "count": len(hotels_list), "status": "success"}
    except Exception as e:
        print(f"Error in api_get_hotels: {e}")
        return {"hotels": [], "count": 0, "status": "error", "message": str(e)}


@app.get("/api/hotel/cities")
def api_get_hotel_cities():
    """Get list of available cities."""
    try:
        return {"cities": INDIAN_CITIES, "status": "success"}
    except Exception as e:
        print(f"Error in api_get_hotel_cities: {e}")
        return {"cities": INDIAN_CITIES, "status": "error"}

# ----------------------------
# Authentication Endpoints
# ----------------------------
class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class DeleteTripRequest(BaseModel):
    trip_name: str

class DeleteBookingRequest(BaseModel):
    booking_id: str

class DeleteEventRequest(BaseModel):
    event_id: str

@app.post("/api/auth/register")
def register_user(user_data: UserRegister):
    """Register a new user"""
    conn = sqlite3.connect(USER_DB_FILE)
    cursor = conn.cursor()
    
    # Check if username or email already exists
    cursor.execute("SELECT id FROM users WHERE username = ? OR email = ?", (user_data.username, user_data.email))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    # Create user
    password_hash = hash_password(user_data.password)
    cursor.execute(
        "INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, ?)",
        (user_data.username, user_data.email, password_hash, 0)
    )
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    # Create access token (sub must be a string)
    access_token = create_access_token(data={"sub": str(user_id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": user_id, "username": user_data.username, "email": user_data.email, "is_admin": False}
    }

@app.post("/api/auth/login")
def login_user(user_data: UserLogin):
    """Login user and return JWT token"""
    conn = sqlite3.connect(USER_DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, password_hash, is_admin FROM users WHERE username = ?", (user_data.username,))
    user = cursor.fetchone()
    conn.close()
    
    if not user or not verify_password(user_data.password, user[3]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    # Create access token (sub must be a string)
    access_token = create_access_token(data={"sub": str(user[0])})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": user[0], "username": user[1], "email": user[2], "is_admin": bool(user[4])}
    }

@app.get("/api/auth/me")
def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return current_user

def get_admin_user(current_user: dict = Depends(get_current_user)):
    """Verify user is admin"""
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@app.get("/api/admin/users")
def get_all_users(admin_user: dict = Depends(get_admin_user)):
    """Get all users (admin only)"""
    conn = sqlite3.connect(USER_DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, is_admin, created_at FROM users ORDER BY created_at DESC")
    users = cursor.fetchall()
    conn.close()
    
    return {
        "users": [
            {
                "id": u[0],
                "username": u[1],
                "email": u[2],
                "is_admin": bool(u[3]),
                "created_at": u[4]
            }
            for u in users
        ]
    }

@app.get("/api/admin/user/{user_id}/data")
def get_user_data_admin(user_id: int, admin_user: dict = Depends(get_admin_user)):
    """Get all data for a specific user (admin only)"""
    conn = sqlite3.connect(USER_DB_FILE)
    cursor = conn.cursor()
    
    # Get user info
    cursor.execute("SELECT id, username, email, is_admin FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all user data (same as get_all_user_data but for specific user_id)
    # Get trips
    cursor.execute(
        "SELECT trip_name, budget, categories, category_budgets, num_people FROM user_budget_trips WHERE user_id = ?",
        (user_id,)
    )
    trips_rows = cursor.fetchall()
    trips = {}
    for row in trips_rows:
        trips[row[0]] = {
            "budget": row[1],
            "categories": json.loads(row[2]) if row[2] else [],
            "categoryBudgets": json.loads(row[3]) if row[3] else {},
            "numPeople": row[4]
        }
    
    # Get expenses
    cursor.execute(
        "SELECT trip_name, category, amount, user_id_expense, created_at FROM user_expenses WHERE user_id = ? ORDER BY created_at",
        (user_id,)
    )
    expenses_rows = cursor.fetchall()
    expenses = []
    for row in expenses_rows:
        expenses.append({
            "trip": row[0],
            "category": row[1],
            "amount": row[2],
            "userId": row[3] or 0,
            "timestamp": row[4]
        })
    
    # Get bookings
    cursor.execute(
        "SELECT booking_data, created_at FROM user_bookings WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,)
    )
    bookings_rows = cursor.fetchall()
    bookings = [json.loads(row[0]) for row in bookings_rows]
    
    # Get searches
    cursor.execute(
        "SELECT monument_name, search_data FROM user_searches WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        (user_id,)
    )
    searches_rows = cursor.fetchall()
    searches = []
    for row in searches_rows:
        searches.append({
            "monument": row[0],
            "data": json.loads(row[1]) if row[1] else {}
        })
    
    # Get mood analysis
    cursor.execute(
        "SELECT text_input, mood_result, recommendations FROM user_mood_analysis WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        (user_id,)
    )
    mood_rows = cursor.fetchall()
    moods = []
    for row in mood_rows:
        moods.append({
            "text_input": row[0],
            "mood_result": json.loads(row[1]) if row[1] else {},
            "recommendations": json.loads(row[2]) if row[2] else []
        })
    
    # Get restaurant searches
    cursor.execute(
        "SELECT search_params, results FROM user_restaurant_searches WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        (user_id,)
    )
    restaurant_rows = cursor.fetchall()
    restaurants = []
    for row in restaurant_rows:
        restaurants.append({
            "search_params": json.loads(row[0]) if row[0] else {},
            "results": json.loads(row[1]) if row[1] else []
        })
    
    # Get saved restaurants
    cursor.execute(
        "SELECT restaurant_name, restaurant_data FROM user_saved_restaurants WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        (user_id,)
    )
    saved_restaurant_rows = cursor.fetchall()
    saved_restaurants = []
    for row in saved_restaurant_rows:
        saved_restaurants.append({
            "restaurant_name": row[0],
            "restaurant_data": json.loads(row[1]) if row[1] else {}
        })
    
    # Get events
    cursor.execute(
        "SELECT event_id, event_data, action FROM user_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        (user_id,)
    )
    event_rows = cursor.fetchall()
    events = []
    for row in event_rows:
        events.append({
            "event_id": row[0],
            "event_data": json.loads(row[1]) if row[1] else {},
            "action": row[2]
        })
    
    # Get hotels
    cursor.execute(
        "SELECT hotel_id, hotel_data, action, booking_data FROM user_hotels WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        (user_id,)
    )
    hotel_rows = cursor.fetchall()
    hotels = []
    for row in hotel_rows:
        hotels.append({
            "hotel_id": row[0],
            "hotel_data": json.loads(row[1]) if row[1] else {},
            "action": row[2],
            "booking_data": json.loads(row[3]) if row[3] else None
        })
    
    conn.close()
    
    return {
        "user": {
            "id": user[0],
            "username": user[1],
            "email": user[2],
            "is_admin": bool(user[3])
        },
        "trips": trips,
        "expenses": expenses,
        "bookings": bookings,
        "searches": searches,
        "moods": moods,
        "restaurants": restaurants,
        "saved_restaurants": saved_restaurants,
        "events": events,
        "hotels": hotels
    }

@app.post("/api/admin/user/{user_id}/delete")
def delete_user_admin(user_id: int, admin_user: dict = Depends(get_admin_user)):
    """Delete a user and all their data (admin only)"""
    conn = sqlite3.connect(USER_DB_FILE)
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT id, username FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete user (cascade will delete all related data)
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": f"User '{user[1]}' and all their data deleted successfully"}

# ----------------------------
# User Data Persistence Endpoints
# ----------------------------
@app.get("/api/user/data")
def get_all_user_data(current_user: dict = Depends(get_current_user)):
    """Get all user data (trips, expenses, bookings, searches)"""
    user_id = current_user["id"]
    conn = sqlite3.connect(USER_DB_FILE)
    cursor = conn.cursor()
    
    # Get trips
    cursor.execute(
        "SELECT trip_name, budget, categories, category_budgets, num_people FROM user_budget_trips WHERE user_id = ?",
        (user_id,)
    )
    trips_rows = cursor.fetchall()
    trips = {}
    for row in trips_rows:
        trips[row[0]] = {
            "budget": row[1],
            "categories": json.loads(row[2]) if row[2] else [],
            "categoryBudgets": json.loads(row[3]) if row[3] else {},
            "numPeople": row[4]
        }
    
    # Get expenses
    cursor.execute(
        "SELECT trip_name, category, amount, user_id_expense, created_at FROM user_expenses WHERE user_id = ? ORDER BY created_at",
        (user_id,)
    )
    expenses_rows = cursor.fetchall()
    expenses = []
    for row in expenses_rows:
        expenses.append({
            "trip": row[0],
            "category": row[1],
            "amount": row[2],
            "userId": row[3] or 0,
            "timestamp": row[4]
        })
    
    # Get bookings
    cursor.execute(
        "SELECT booking_data, created_at FROM user_bookings WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,)
    )
    bookings_rows = cursor.fetchall()
    bookings = []
    for row in bookings_rows:
        bookings.append(json.loads(row[0]))
    
    # Get searches
    cursor.execute(
        "SELECT monument_name, search_data FROM user_searches WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        (user_id,)
    )
    searches_rows = cursor.fetchall()
    searches = []
    for row in searches_rows:
        searches.append({
            "monument": row[0],
            "data": json.loads(row[1]) if row[1] else {}
        })
    
    # Get mood analysis
    cursor.execute(
        "SELECT text_input, mood_result, recommendations FROM user_mood_analysis WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        (user_id,)
    )
    mood_rows = cursor.fetchall()
    moods = []
    for row in mood_rows:
        moods.append({
            "text_input": row[0],
            "mood_result": json.loads(row[1]) if row[1] else {},
            "recommendations": json.loads(row[2]) if row[2] else []
        })
    
    # Get restaurant searches
    cursor.execute(
        "SELECT search_params, results FROM user_restaurant_searches WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        (user_id,)
    )
    restaurant_rows = cursor.fetchall()
    restaurants = []
    for row in restaurant_rows:
        restaurants.append({
            "search_params": json.loads(row[0]) if row[0] else {},
            "results": json.loads(row[1]) if row[1] else []
        })
    
    # Get saved restaurants (favorites)
    cursor.execute(
        "SELECT restaurant_name, restaurant_data FROM user_saved_restaurants WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        (user_id,)
    )
    saved_restaurant_rows = cursor.fetchall()
    saved_restaurants = []
    for row in saved_restaurant_rows:
        saved_restaurants.append({
            "restaurant_name": row[0],
            "restaurant_data": json.loads(row[1]) if row[1] else {}
        })
    
    # Get events
    cursor.execute(
        "SELECT event_id, event_data, action FROM user_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        (user_id,)
    )
    event_rows = cursor.fetchall()
    events = []
    for row in event_rows:
        events.append({
            "event_id": row[0],
            "event_data": json.loads(row[1]) if row[1] else {},
            "action": row[2]
        })
    
    # Get hotels
    cursor.execute(
        "SELECT hotel_id, hotel_data, action, booking_data FROM user_hotels WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
        (user_id,)
    )
    hotel_rows = cursor.fetchall()
    hotels = []
    for row in hotel_rows:
        hotels.append({
            "hotel_id": row[0],
            "hotel_data": json.loads(row[1]) if row[1] else {},
            "action": row[2],
            "booking_data": json.loads(row[3]) if row[3] else None
        })
    
    conn.close()
    
    return {
        "trips": trips,
        "expenses": expenses,
        "bookings": bookings,
        "searches": searches,
        "moods": moods,
        "restaurants": restaurants,
        "saved_restaurants": saved_restaurants,
        "events": events,
        "hotels": hotels
    }

@app.post("/api/user/budget")
def save_budget_data(payload: dict, current_user: dict = Depends(get_current_user)):
    """Save budget trips and expenses"""
    user_id = current_user["id"]
    trips = payload.get("trips", {})
    expenses = payload.get("expenses", [])
    
    conn = sqlite3.connect(USER_DB_FILE)
    cursor = conn.cursor()
    
    # Delete old trips for this user (to replace with new ones)
    cursor.execute("DELETE FROM user_budget_trips WHERE user_id = ?", (user_id,))
    
    # Save/update trips
    for trip_name, trip_data in trips.items():
        cursor.execute(
            """INSERT INTO user_budget_trips 
               (user_id, trip_name, budget, categories, category_budgets, num_people)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                user_id,
                trip_name,
                trip_data.get("budget", 0),
                json.dumps(trip_data.get("categories", [])),
                json.dumps(trip_data.get("categoryBudgets", {})),
                trip_data.get("numPeople", 1)
            )
        )
    
    # Delete old expenses for this user (to replace with new ones)
    cursor.execute("DELETE FROM user_expenses WHERE user_id = ?", (user_id,))
    
    # Save expenses
    for expense in expenses:
        cursor.execute(
            "INSERT INTO user_expenses (user_id, trip_name, category, amount, user_id_expense) VALUES (?, ?, ?, ?, ?)",
            (
                user_id,
                expense.get("trip", ""),
                expense.get("category", ""),
                expense.get("amount", 0),
                expense.get("userId", 0)
            )
        )
    
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Budget data saved"}

@app.post("/api/user/budget/trip/delete")
def delete_budget_trip(payload: DeleteTripRequest, current_user: dict = Depends(get_current_user)):
    """Delete a budget trip and its expenses"""
    user_id = current_user["id"]
    trip_name = payload.trip_name
    
    conn = sqlite3.connect(USER_DB_FILE)
    cursor = conn.cursor()
    
    # Delete trip
    cursor.execute(
        "DELETE FROM user_budget_trips WHERE user_id = ? AND trip_name = ?",
        (user_id, trip_name)
    )
    
    # Delete all expenses for this trip
    cursor.execute(
        "DELETE FROM user_expenses WHERE user_id = ? AND trip_name = ?",
        (user_id, trip_name)
    )
    
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"Trip '{trip_name}' deleted successfully"}

@app.post("/api/user/bookings")
def save_booking(booking_data: dict, current_user: dict = Depends(get_current_user)):
    """Save a booking"""
    user_id = current_user["id"]
    conn = sqlite3.connect(USER_DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO user_bookings (user_id, booking_data) VALUES (?, ?)",
        (user_id, json.dumps(booking_data))
    )
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Booking saved"}

@app.get("/api/user/bookings")
def get_user_bookings(current_user: dict = Depends(get_current_user)):
    """Get all user bookings"""
    user_id = current_user["id"]
    conn = sqlite3.connect(USER_DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT booking_data FROM user_bookings WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    bookings = [json.loads(row[0]) for row in rows]
    return {"history": bookings}

@app.post("/api/user/searches")
def save_search(search_data: dict, current_user: dict = Depends(get_current_user)):
    """Save a monument search"""
    user_id = current_user["id"]
    monument_name = search_data.get("monument", "")
    conn = sqlite3.connect(USER_DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO user_searches (user_id, monument_name, search_data) VALUES (?, ?, ?)",
        (user_id, monument_name, json.dumps(search_data))
    )
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Search saved"}

@app.post("/api/user/mood")
def save_mood_analysis(mood_data: dict, current_user: dict = Depends(get_current_user)):
    """Save mood analysis result"""
    user_id = current_user["id"]
    conn = sqlite3.connect(USER_DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO user_mood_analysis (user_id, text_input, mood_result, recommendations) VALUES (?, ?, ?, ?)",
        (
            user_id,
            mood_data.get("text_input", ""),
            json.dumps(mood_data.get("mood_result", {})),
            json.dumps(mood_data.get("recommendations", []))
        )
    )
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Mood analysis saved"}

@app.post("/api/user/restaurants")
def save_restaurant_search(restaurant_data: dict, current_user: dict = Depends(get_current_user)):
    """Save restaurant search"""
    user_id = current_user["id"]
    conn = sqlite3.connect(USER_DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO user_restaurant_searches (user_id, search_params, results) VALUES (?, ?, ?)",
        (
            user_id,
            json.dumps(restaurant_data.get("search_params", {})),
            json.dumps(restaurant_data.get("results", []))
        )
    )
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Restaurant search saved"}

@app.post("/api/user/restaurants/save")
def save_restaurant_favorite(restaurant_data: dict, current_user: dict = Depends(get_current_user)):
    """Save a restaurant as favorite"""
    user_id = current_user["id"]
    restaurant_name = restaurant_data.get("restaurant_name")
    if not restaurant_name:
        raise HTTPException(status_code=400, detail="restaurant_name is required")
    
    conn = sqlite3.connect(USER_DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        """INSERT OR REPLACE INTO user_saved_restaurants (user_id, restaurant_name, restaurant_data) 
           VALUES (?, ?, ?)""",
        (
            user_id,
            restaurant_name,
            json.dumps(restaurant_data.get("restaurant_data", {}))
        )
    )
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Restaurant saved to favorites"}

@app.post("/api/user/restaurants/unsave")
def unsave_restaurant_favorite(restaurant_data: dict, current_user: dict = Depends(get_current_user)):
    """Remove a restaurant from favorites"""
    user_id = current_user["id"]
    restaurant_name = restaurant_data.get("restaurant_name")
    if not restaurant_name:
        raise HTTPException(status_code=400, detail="restaurant_name is required")
    
    conn = sqlite3.connect(USER_DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM user_saved_restaurants WHERE user_id = ? AND restaurant_name = ?",
        (user_id, restaurant_name)
    )
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Restaurant removed from favorites"}

@app.post("/api/user/events")
def save_event(event_data: dict, current_user: dict = Depends(get_current_user)):
    """Save event interaction (viewed, liked, etc.)"""
    user_id = current_user["id"]
    conn = sqlite3.connect(USER_DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO user_events (user_id, event_id, event_data, action) VALUES (?, ?, ?, ?)",
        (
            user_id,
            event_data.get("event_id", ""),
            json.dumps(event_data.get("event_data", {})),
            event_data.get("action", "viewed")
        )
    )
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Event saved"}

@app.post("/api/user/events/delete")
def delete_event_from_itinerary(payload: DeleteEventRequest, current_user: dict = Depends(get_current_user)):
    """Delete an event from itinerary"""
    user_id = current_user["id"]
    event_id = payload.event_id
    conn = sqlite3.connect(USER_DB_FILE)
    cursor = conn.cursor()
    
    # Delete events with "added_to_itinerary" action for this event_id
    cursor.execute(
        "DELETE FROM user_events WHERE user_id = ? AND event_id = ? AND action = 'added_to_itinerary'",
        (user_id, event_id)
    )
    
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Event removed from itinerary"}

@app.post("/api/user/hotels")
def save_hotel(hotel_data: dict, current_user: dict = Depends(get_current_user)):
    """Save hotel interaction (viewed, booked, etc.)"""
    user_id = current_user["id"]
    conn = sqlite3.connect(USER_DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO user_hotels (user_id, hotel_id, hotel_data, action, booking_data) VALUES (?, ?, ?, ?, ?)",
        (
            user_id,
            hotel_data.get("hotel_id", ""),
            json.dumps(hotel_data.get("hotel_data", {})),
            hotel_data.get("action", "viewed"),
            json.dumps(hotel_data.get("booking_data", {})) if hotel_data.get("booking_data") else None
        )
    )
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Hotel data saved"}

@app.post("/api/user/hotels/book")
def book_hotel(booking_data: dict, current_user: dict = Depends(get_current_user)):
    """Book a hotel"""
    user_id = current_user["id"]
    conn = sqlite3.connect(USER_DB_FILE)
    cursor = conn.cursor()
    
    # Save hotel booking
    cursor.execute(
        "INSERT INTO user_hotels (user_id, hotel_id, hotel_data, action, booking_data) VALUES (?, ?, ?, ?, ?)",
        (
            user_id,
            booking_data.get("hotel_id", ""),
            json.dumps(booking_data.get("hotel_data", {})),
            "booked",
            json.dumps(booking_data)
        )
    )
    
    # Also save as a booking
    cursor.execute(
        "INSERT INTO user_bookings (user_id, booking_data) VALUES (?, ?)",
        (user_id, json.dumps({
            "type": "hotel",
            "booking_data": booking_data,
            "created_at": dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }))
    )
    
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Hotel booked successfully", "booking": booking_data}

@app.post("/api/user/hotels/booking/delete")
def delete_hotel_booking(payload: DeleteBookingRequest, current_user: dict = Depends(get_current_user)):
    """Delete a hotel booking"""
    user_id = current_user["id"]
    booking_id = payload.booking_id
    
    conn = sqlite3.connect(USER_DB_FILE)
    cursor = conn.cursor()
    
    # Find the booking by hotel_id (which is the booking_id parameter)
    # We'll need to check both hotel_id and booking_data to find the exact booking
    cursor.execute(
        "SELECT id, hotel_id, booking_data FROM user_hotels WHERE user_id = ? AND hotel_id = ? AND action = 'booked'",
        (user_id, booking_id)
    )
    booking = cursor.fetchone()
    
    if not booking:
        conn.close()
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Delete from user_hotels
    cursor.execute(
        "DELETE FROM user_hotels WHERE user_id = ? AND id = ?",
        (user_id, booking[0])
    )
    
    # Also try to delete from user_bookings (find by hotel_id in booking_data)
    cursor.execute(
        "SELECT id, booking_data FROM user_bookings WHERE user_id = ?",
        (user_id,)
    )
    bookings = cursor.fetchall()
    for booking_row in bookings:
        try:
            booking_data = json.loads(booking_row[1])
            if booking_data.get("type") == "hotel" and booking_data.get("booking_data", {}).get("hotel_id") == booking_id:
                cursor.execute("DELETE FROM user_bookings WHERE id = ?", (booking_row[0],))
                break
        except:
            continue
    
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Hotel booking deleted successfully"}
