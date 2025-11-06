# 🚀 Free Deployment Guide for Trend Tripper

This guide covers deploying both frontend and backend for **FREE** using various platforms.

## 📋 Prerequisites

1. **GitHub Account** (for code hosting)
2. **Environment Variables** ready
3. **API Keys** (Geoapify, Twilio, etc.)

---

## 🎨 Frontend Deployment (FREE Options)

### Option 1: Vercel (Recommended - Easiest)

**Pros:** Zero config, automatic deployments, free SSL, CDN

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "New Project"
   - Import your repository
   - Configure:
     - **Framework Preset:** Vite
     - **Root Directory:** `./` (root)
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
   - Add Environment Variables:
     - `VITE_API_URL` = `https://your-backend-url.com`
   - Click "Deploy"

3. **Update API URL:**
   - In `src/lib/api.ts`, update the base URL to your backend URL
   - Or use environment variable: `import.meta.env.VITE_API_URL`

**Result:** Your frontend will be live at `https://your-project.vercel.app`

---

### Option 2: Netlify (Alternative)

1. **Push to GitHub** (same as above)

2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub
   - Click "Add new site" → "Import an existing project"
   - Select your repository
   - Build settings:
     - **Build command:** `npm run build`
     - **Publish directory:** `dist`
   - Add environment variables
   - Click "Deploy site"

**Result:** Your frontend will be live at `https://your-project.netlify.app`

---

### Option 3: Cloudflare Pages

1. **Push to GitHub**

2. **Deploy to Cloudflare:**
   - Go to [pages.cloudflare.com](https://pages.cloudflare.com)
   - Sign up and connect GitHub
   - Create new project
   - Select repository
   - Build settings:
     - **Framework preset:** Vite
     - **Build command:** `npm run build`
     - **Build output directory:** `dist`
   - Add environment variables
   - Deploy

**Result:** Your frontend will be live at `https://your-project.pages.dev`

---

## 🔧 Backend Deployment (FREE Options)

### Option 1: Railway (Recommended - Easiest)

**Pros:** Free tier, automatic deployments, PostgreSQL included

1. **Create `Procfile` in backend folder:**
   ```bash
   cd backend
   echo "web: uvicorn api_server:app --host 0.0.0.0 --port $PORT" > Procfile
   ```

2. **Create `runtime.txt` in backend folder:**
   ```
   python-3.11
   ```

3. **Create clean `requirements.txt` in backend folder:**
   ```txt
   fastapi==0.116.1
   uvicorn[standard]==0.35.0
   python-multipart==0.0.20
   python-dotenv==1.0.0
   PyJWT==2.10.1
   requests==2.32.5
   pandas==2.3.2
   pillow==11.3.0
   torch==2.7.1
   torchvision==0.22.1
   twilio==9.8.3
   geopy==2.4.1
   ```

4. **Deploy to Railway:**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Configure:
     - **Root Directory:** `backend`
     - **Start Command:** `uvicorn api_server:app --host 0.0.0.0 --port $PORT`
   - Add Environment Variables:
     - `SECRET_KEY` = (generate a random string)
     - `GEOAPIFY_API_KEY` = (your key)
     - `TWILIO_ACCOUNT_SID` = (your key)
     - `TWILIO_AUTH_TOKEN` = (your key)
     - `TWILIO_PHONE_NUMBER` = (your key)
   - Railway will auto-detect Python and deploy

**Result:** Your backend will be live at `https://your-project.up.railway.app`

---

### Option 2: Render

1. **Create `render.yaml` in backend folder:**
   ```yaml
   services:
     - type: web
       name: trend-tripper-backend
       env: python
       buildCommand: pip install -r requirements.txt
       startCommand: uvicorn api_server:app --host 0.0.0.0 --port $PORT
       envVars:
         - key: SECRET_KEY
           generateValue: true
         - key: GEOAPIFY_API_KEY
           sync: false
   ```

2. **Deploy to Render:**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub
   - Click "New" → "Web Service"
   - Connect your repository
   - Settings:
     - **Root Directory:** `backend`
     - **Environment:** Python 3
     - **Build Command:** `pip install -r requirements.txt`
     - **Start Command:** `uvicorn api_server:app --host 0.0.0.0 --port $PORT`
   - Add environment variables
   - Click "Create Web Service"

**Result:** Your backend will be live at `https://your-project.onrender.com`

---

### Option 3: Fly.io

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Create `fly.toml` in backend folder:**
   ```toml
   app = "trend-tripper-backend"
   primary_region = "iad"

   [build]

   [http_service]
     internal_port = 8000
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 0

   [[vm]]
     cpu_kind = "shared"
     cpus = 1
     memory_mb = 256
   ```

3. **Deploy:**
   ```bash
   cd backend
   fly launch
   fly secrets set SECRET_KEY="your-secret" GEOAPIFY_API_KEY="your-key"
   fly deploy
   ```

**Result:** Your backend will be live at `https://your-project.fly.dev`

---

### Option 4: PythonAnywhere (Free Tier)

1. **Sign up at [pythonanywhere.com](https://www.pythonanywhere.com)**

2. **Upload your code:**
   - Go to "Files" tab
   - Upload your `backend` folder

3. **Install dependencies:**
   - Open "Consoles" → "Bash"
   - Run: `pip3.10 install --user -r requirements.txt`

4. **Create Web App:**
   - Go to "Web" tab
   - Click "Add a new web app"
   - Choose "Manual configuration" → Python 3.10
   - Edit WSGI file:
     ```python
     import sys
     path = '/home/yourusername/backend'
     if path not in sys.path:
         sys.path.append(path)
     
     from api_server import app
     application = app
     ```

5. **Configure:**
   - Set source code directory
   - Add environment variables in "Web" → "Environment variables"
   - Reload web app

**Result:** Your backend will be live at `https://yourusername.pythonanywhere.com`

---

## 🔗 Connecting Frontend to Backend

### Update Frontend API URL

1. **Create `.env.production` in root:**
   ```env
   VITE_API_URL=https://your-backend-url.com
   ```

2. **Update `src/lib/api.ts`:**
   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
   ```

3. **Update CORS in backend (`api_server.py`):**
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[
           "https://your-frontend.vercel.app",
           "https://your-frontend.netlify.app",
           # Add all your frontend URLs
       ],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

---

## 📝 Important Notes

### Database (SQLite)
- SQLite works for free tiers but has limitations
- For production, consider:
  - **Supabase** (free PostgreSQL)
  - **Neon** (free PostgreSQL)
  - **Railway PostgreSQL** (included with Railway)

### Environment Variables
Make sure to set all required environment variables:
- `SECRET_KEY` (for JWT)
- `GEOAPIFY_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

### File Storage
- For production, use cloud storage:
  - **Cloudinary** (free tier)
  - **AWS S3** (free tier)
  - **Supabase Storage** (free tier)

---

## 🎯 Recommended Setup (Easiest)

1. **Frontend:** Vercel
2. **Backend:** Railway
3. **Database:** Railway PostgreSQL (or keep SQLite for now)

This combination gives you:
- ✅ Zero configuration
- ✅ Automatic deployments
- ✅ Free SSL certificates
- ✅ Good performance
- ✅ Easy to scale

---

## 🚨 Troubleshooting

### CORS Errors
- Make sure backend CORS includes your frontend URL
- Check that `allow_credentials=True` is set

### Build Failures
- Check Node.js version (should be 18+)
- Check Python version (should be 3.10+)
- Verify all dependencies in `package.json` and `requirements.txt`

### API Not Working
- Verify environment variables are set
- Check backend logs
- Ensure backend URL is correct in frontend

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

**Good luck with your deployment! 🚀**

