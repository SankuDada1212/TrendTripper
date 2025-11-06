# 🚀 Deploy Both Frontend & Backend on ONE Platform (FREE)

Here are the best **FREE** platforms where you can deploy both frontend and backend together:

---

## 🥇 Option 1: Render (Recommended - Easiest)

**Why Render?**
- ✅ Free tier available
- ✅ Deploy both frontend and backend in one project
- ✅ Automatic SSL
- ✅ Easy setup

### Steps:

1. **Push code to GitHub**

2. **Go to [render.com](https://render.com) and sign up**

3. **Deploy Backend First:**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Settings:
     - **Name:** `trend-tripper-backend`
     - **Root Directory:** `backend`
     - **Environment:** `Python 3`
     - **Build Command:** `pip install -r requirements_deploy.txt`
     - **Start Command:** `uvicorn api_server:app --host 0.0.0.0 --port $PORT`
   - Add Environment Variables:
     ```
     SECRET_KEY=your-secret-key
     GEOAPIFY_API_KEY=your-key
     TWILIO_ACCOUNT_SID=your-sid
     TWILIO_AUTH_TOKEN=your-token
     TWILIO_PHONE_NUMBER=your-number
     ```
   - Click "Create Web Service"
   - **Copy the URL** (e.g., `https://trend-tripper-backend.onrender.com`)

4. **Deploy Frontend:**
   - Click "New" → "Static Site"
   - Connect the same GitHub repository
   - Settings:
     - **Name:** `trend-tripper-frontend`
     - **Root Directory:** `./` (root)
     - **Build Command:** `npm install && npm run build`
     - **Publish Directory:** `dist`
   - Add Environment Variable:
     ```
     VITE_API_URL=https://trend-tripper-backend.onrender.com
     ```
   - Click "Create Static Site"

**Result:** 
- Frontend: `https://trend-tripper-frontend.onrender.com`
- Backend: `https://trend-tripper-backend.onrender.com`

**Note:** Free tier spins down after 15 minutes of inactivity (wakes up on first request)

---

## 🥈 Option 2: Railway (Best Performance)

**Why Railway?**
- ✅ $5 free credit monthly
- ✅ No spin-down (always on)
- ✅ Deploy both in one project
- ✅ Better performance

### Steps:

1. **Go to [railway.app](https://railway.app) and sign up**

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Deploy Backend:**
   - Click "+ New" → "GitHub Repo"
   - Select your repo
   - Railway auto-detects it's Python
   - Configure:
     - **Root Directory:** `backend`
     - **Start Command:** `uvicorn api_server:app --host 0.0.0.0 --port $PORT`
   - Add environment variables
   - **Copy the URL** (e.g., `https://your-backend.up.railway.app`)

4. **Deploy Frontend:**
   - Click "+ New" → "GitHub Repo" (same repo)
   - Configure:
     - **Root Directory:** `./` (root)
     - **Build Command:** `npm install && npm run build`
     - **Start Command:** `npx serve -s dist -l $PORT`
   - Add environment variable:
     ```
     VITE_API_URL=https://your-backend.up.railway.app
     ```

**Result:**
- Both services in one Railway project
- Frontend and backend URLs provided

---

## 🥉 Option 3: Vercel (Frontend + Serverless Backend)

**Why Vercel?**
- ✅ Excellent for frontend
- ✅ Can add API routes (but FastAPI needs adaptation)
- ✅ Best CDN performance

### Steps:

1. **Deploy Frontend to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repo
   - Settings:
     - **Framework:** Vite
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
   - Add environment variable:
     ```
     VITE_API_URL=https://your-backend-url.com
     ```

2. **For Backend:** Use one of these:
   - **Option A:** Deploy backend separately on Render/Railway (free)
   - **Option B:** Convert FastAPI to Vercel serverless functions (requires code changes)

**Note:** Vercel is best for frontend, but FastAPI backend works better on Render/Railway.

---

## 🏆 BEST RECOMMENDATION: Render

**Why?**
- ✅ Truly free (no credit card needed)
- ✅ Deploy both frontend and backend easily
- ✅ Same platform = easier management
- ✅ Automatic SSL
- ✅ Simple setup

### Quick Render Setup:

```bash
# 1. Make sure you have these files:

# backend/requirements_deploy.txt (already created)
# backend/Procfile (already created)
# package.json (already exists)
```

**Then:**
1. Push to GitHub
2. Deploy backend as "Web Service" on Render
3. Deploy frontend as "Static Site" on Render
4. Done! Both on same platform

---

## 📝 Important: Update CORS

After deploying, update `backend/api_server.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://trend-tripper-frontend.onrender.com",  # Your frontend URL
        "http://localhost:8080",  # Keep for local dev
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🎯 Quick Comparison

| Platform | Free Tier | Both Services | Spin Down | Ease |
|----------|-----------|---------------|-----------|------|
| **Render** | ✅ Yes | ✅ Yes | ⚠️ 15min | ⭐⭐⭐⭐⭐ |
| **Railway** | ✅ $5 credit | ✅ Yes | ❌ No | ⭐⭐⭐⭐ |
| **Vercel** | ✅ Yes | ⚠️ Partial | ❌ No | ⭐⭐⭐ |

---

## 🚀 Final Recommendation

**Use Render** - It's the easiest way to deploy both frontend and backend on one platform for free!

1. Sign up at [render.com](https://render.com)
2. Deploy backend as "Web Service"
3. Deploy frontend as "Static Site"
4. Both managed in one dashboard
5. Free forever (with spin-down on inactivity)

---

**Need help?** Check the main `DEPLOYMENT_GUIDE.md` for detailed instructions!

