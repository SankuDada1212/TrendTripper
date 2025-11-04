from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import torch
from torchvision import transforms, datasets, models
import os
import json
import io

# ----------------------------
# Config
# ----------------------------
IMG_SIZE = 128
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODEL_PATH = "C:\\Users\\sanke\\Documents\\Project\\FYProject\\LYPROJECT\\fast_monument_cnn.pth"
DATA_DIR = "C:\\Users\\sanke\\Documents\\Project\\dataset"
INFO_FILE = "C:\\Users\\sanke\\Documents\\Project\\FYProject\\LYPROJECT\\monument_info.json"

# ----------------------------
# Initialize FastAPI app
# ----------------------------
app = FastAPI(title="Monument Search API")

# Allow all CORS origins (so your frontend can call it)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Load dataset + labels
# ----------------------------
dataset = datasets.ImageFolder(DATA_DIR)
class_names = dataset.classes

# Load monument info (if available)
if os.path.exists(INFO_FILE):
    with open(INFO_FILE, "r", encoding="utf-8") as f:
        monument_info = json.load(f)
else:
    monument_info = {}

# ----------------------------
# Model setup
# ----------------------------
transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

model = models.resnet18(weights=None)  # updated to avoid 'pretrained' warning
model.fc = torch.nn.Linear(model.fc.in_features, len(class_names))
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model = model.to(DEVICE)
model.eval()

# ----------------------------
# Prediction function
# ----------------------------
def predict_image(image: Image.Image):
    image_tensor = transform(image).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        outputs = model(image_tensor)
        _, predicted = torch.max(outputs, 1)
    class_name = class_names[predicted.item()]
    description = monument_info.get(class_name, "No information available.")
    return class_name, description

# ----------------------------
# API routes
# ----------------------------
@app.get("/")
def root():
    return {"message": "Welcome to the Monument Search API!"}

@app.post("/predict")
async def predict_monument(file: UploadFile = File(...)):
    """
    Upload an image and get predicted monument name + info.
    """
    try:
        # Read image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Predict
        class_name, description = predict_image(image)

        return {
            "monument": class_name,
            "description": description
        }

    except Exception as e:
        return {"error": str(e)}
