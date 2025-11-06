# 🆓 100% FREE Deployment Options (No Credit Card Required)

Here are the **completely free** options for deploying Trend Tripper:

---

## 🎨 Frontend Deployment (100% FREE)

### ✅ Option 1: Vercel (BEST - Recommended)
- **Free Tier:**
  - ✅ Unlimited deployments
  - ✅ 100GB bandwidth/month
  - ✅ Free SSL certificate
  - ✅ Automatic deployments from GitHub
  - ✅ No credit card required
  - ✅ No time limits
  - ✅ Custom domain support

**Steps:**
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
3. Click "New Project" → Import repository
4. Build settings:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add environment variable: `VITE_API_URL`
6. Deploy!

**Result:** `https://your-project.vercel.app` (FREE forever)

---

### ✅ Option 2: Netlify
- **Free Tier:**
  - ✅ 100GB bandwidth/month
  - ✅ 300 build minutes/month
  - ✅ Free SSL
  - ✅ No credit card required
  - ✅ No time limits

**Steps:**
1. Push to GitHub
2. Go to [netlify.com](https://netlify.com) → Sign up
3. "Add new site" → Import from Git
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add environment variables
6. Deploy!

**Result:** `https://your-project.netlify.app` (FREE forever)

---

### ✅ Option 3: Cloudflare Pages
- **Free Tier:**
  - ✅ Unlimited bandwidth
  - ✅ Unlimited builds
  - ✅ Free SSL
  - ✅ No credit card required
  - ✅ No time limits

**Steps:**
1. Push to GitHub
2. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
3. Create project → Connect GitHub
4. Build settings:
   - Framework: Vite
   - Build command: `npm run build`
   - Build output: `dist`
5. Deploy!

**Result:** `https://your-project.pages.dev` (FREE forever)

---

### ✅ Option 4: GitHub Pages (Simple but limited)
- **Free Tier:**
  - ✅ 1GB storage
  - ✅ 100GB bandwidth/month
  - ✅ Free SSL
  - ✅ No credit card required

**Steps:**
1. Build your project: `npm run build`
2. Push `dist` folder to `gh-pages` branch
3. Enable GitHub Pages in repository settings
4. Select `gh-pages` branch as source

**Result:** `https://yourusername.github.io/trend-tripper` (FREE forever)

---

## 🔧 Backend Deployment (100% FREE)

### ⚠️ Important Note:
Most backend hosting requires a credit card for free tier, but here are the truly free options:

---

### ✅ Option 1: Render (FREE with limitations)
- **Free Tier:**
  - ✅ 750 hours/month (enough for 24/7)
  - ✅ Spins down after 15 min inactivity (wakes on request)
  - ✅ 512MB RAM
  - ✅ Free SSL
  - ⚠️ Requires credit card (but won't charge you)

**Steps:**
1. Go to [render.com](https://render.com) → Sign up
2. "New" → "Web Service"
3. Connect GitHub repository
4. Settings:
   - **Root Directory:** `backend`
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements_deploy.txt`
   - **Start Command:** `uvicorn api_server:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Deploy!

**Result:** `https://your-project.onrender.com` (FREE, but spins down when inactive)

---

### ✅ Option 2: PythonAnywhere (100% FREE - No credit card)
- **Free Tier:**
  - ✅ 1 web app
  - ✅ 512MB storage
  - ✅ Always-on (no spin down)
  - ✅ Free subdomain
  - ✅ No credit card required
  - ⚠️ Limited to 1 web app per account

**Steps:**
1. Sign up at [pythonanywhere.com](https://www.pythonanywhere.com)
2. Upload your `backend` folder via Files tab
3. Install dependencies in Bash console:
   ```bash
   pip3.10 install --user -r requirements_deploy.txt
   ```
4. Create Web App:
   - Go to "Web" tab
   - "Add a new web app" → Manual configuration → Python 3.10
5. Edit WSGI file:
   ```python
   import sys
   path = '/home/yourusername/backend'
   if path not in sys.path:
       sys.path.append(path)
   
   from api_server import app
   application = app
   ```
6. Add environment variables in "Web" → "Environment variables"
7. Reload web app

**Result:** `https://yourusername.pythonanywhere.com` (FREE forever, always-on)

---

### ✅ Option 3: Fly.io (FREE with limitations)
- **Free Tier:**
  - ✅ 3 shared-cpu VMs
  - ✅ 3GB persistent storage
  - ✅ 160GB outbound data transfer
  - ✅ Free SSL
  - ⚠️ Requires credit card (but won't charge if you stay within limits)

**Steps:**
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Sign up at [fly.io](https://fly.io)
3. Create `fly.toml` in backend folder (see DEPLOYMENT_GUIDE.md)
4. Run: `fly launch`
5. Set secrets: `fly secrets set SECRET_KEY="..." GEOAPIFY_API_KEY="..."`
6. Deploy: `fly deploy`

**Result:** `https://your-project.fly.dev` (FREE within limits)

---

### ✅ Option 4: Railway (FREE with $5 credit)
- **Free Tier:**
  - ✅ $5 free credit/month
  - ✅ Enough for small apps
  - ✅ No credit card required for first month
  - ⚠️ After $5 credit, requires payment method

**Steps:**
1. Go to [railway.app](https://railway.app) → Sign up
2. "New Project" → "Deploy from GitHub"
3. Select repository
4. Set root directory: `backend`
5. Add environment variables
6. Deploy!

**Result:** `https://your-project.up.railway.app` (FREE for first month, then $5/month)

---

## 🎯 BEST FREE COMBINATION (No Credit Card)

### Recommended Setup:
1. **Frontend:** Vercel (100% free, no credit card)
2. **Backend:** PythonAnywhere (100% free, no credit card, always-on)

### Why This Combo?
- ✅ Both 100% free forever
- ✅ No credit card required
- ✅ Always-on backend (no spin down)
- ✅ Fast frontend with CDN
- ✅ Free SSL on both
- ✅ Easy to set up

---

## 📊 Comparison Table

| Platform | Frontend/Backend | Free Tier | Credit Card | Always-On | Best For |
|----------|-----------------|-----------|-------------|-----------|----------|
| **Vercel** | Frontend | ✅ Unlimited | ❌ No | ✅ Yes | Production |
| **Netlify** | Frontend | ✅ 100GB/month | ❌ No | ✅ Yes | Production |
| **Cloudflare Pages** | Frontend | ✅ Unlimited | ❌ No | ✅ Yes | Production |
| **PythonAnywhere** | Backend | ✅ 1 app | ❌ No | ✅ Yes | **Best Free Backend** |
| **Render** | Backend | ✅ 750hrs/month | ⚠️ Yes | ⚠️ Spins down | Development |
| **Fly.io** | Backend | ✅ 3 VMs | ⚠️ Yes | ✅ Yes | Production |
| **Railway** | Backend | ✅ $5/month | ⚠️ After trial | ✅ Yes | Production |

---

## 🚀 Quick Start (100% Free, No Credit Card)

### Step 1: Deploy Frontend (Vercel)
```bash
# 1. Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Go to vercel.com and import repository
# 3. Add VITE_API_URL environment variable
# 4. Deploy!
```

### Step 2: Deploy Backend (PythonAnywhere)
```bash
# 1. Sign up at pythonanywhere.com
# 2. Upload backend folder
# 3. Install dependencies
# 4. Create web app
# 5. Add environment variables
# 6. Reload!
```

### Step 3: Connect Them
- Update `VITE_API_URL` in Vercel to your PythonAnywhere URL
- Update CORS in backend to allow Vercel domain

---

## 💡 Pro Tips

1. **For Development:** Use Render (spins down but free)
2. **For Production:** Use PythonAnywhere (always-on, free)
3. **Frontend:** Always use Vercel (best free option)
4. **Database:** SQLite works fine for free tier (included with PythonAnywhere)

---

## ⚠️ Limitations to Know

### PythonAnywhere Free Tier:
- ✅ 1 web app only
- ✅ 512MB storage
- ✅ Can't install system packages
- ✅ Limited to Python packages

### Render Free Tier:
- ⚠️ Spins down after 15 min inactivity
- ⚠️ First request after spin-down takes ~30 seconds
- ⚠️ Requires credit card (but won't charge)

### Vercel/Netlify Free Tier:
- ✅ No real limitations for small projects
- ✅ Perfect for frontend hosting

---

## 🎉 Conclusion

**Best 100% Free Setup (No Credit Card):**
- Frontend: **Vercel** 
- Backend: **PythonAnywhere**

Both are completely free, no credit card required, and perfect for your project!

---

**Need help?** Check `DEPLOYMENT_GUIDE.md` for detailed step-by-step instructions!

