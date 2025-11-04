# 🚀 Quick Deployment Guide (5 Minutes)

## Easiest Method: Cloudflare Tunnel (Free & Private)

### Step 1: Install Cloudflare Tunnel
```bash
# Windows - Download from:
https://github.com/cloudflare/cloudflared/releases

# Or use Chocolatey:
choco install cloudflared

# Or use npm:
npm install -g cloudflared
```

### Step 2: Start Your Backend
```bash
cd backend
python -m uvicorn api_server:app --host 0.0.0.0 --port 8000
```
Keep this terminal open!

### Step 3: Start Your Frontend
```bash
# In a new terminal
npm run dev
```
Note: It will run on `http://localhost:5173` (or similar)

### Step 4: Create Tunnel for Backend
```bash
# In a new terminal
cloudflared tunnel --url http://localhost:8000
```
**Copy the URL** it gives you (looks like: `https://xxxxx.trycloudflare.com`)

### Step 5: Create Tunnel for Frontend
```bash
# In another new terminal
cloudflared tunnel --url http://localhost:5173
```
**Copy this URL too**

### Step 6: Update Frontend to Use Backend URL
Edit `src/lib/api.ts`:
- Find `const API_URL = "http://localhost:8000"`
- Replace with your backend Cloudflare URL: `const API_URL = "https://your-backend-url.trycloudflare.com"`

### Step 7: Rebuild Frontend
```bash
npm run build
npm run preview
```

### Step 8: Share the Frontend URL!
Share the frontend Cloudflare URL with your friends. They'll need to enter the password: **TrendTripper2024**

---

## ⚠️ Important Notes:

1. **Change the password** in `src/components/PasswordGate.tsx` (line 5)
2. **Cloudflare tunnels expire** when you close the terminal - they're for temporary sharing
3. **For permanent deployment**, use Railway or Render (see DEPLOYMENT.md)

---

## Alternative: Railway (Permanent & Free)

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repo
5. Railway auto-detects and deploys!
6. Add password protection in Railway settings

---

## Need Help?

- **Backend not starting?** Check if port 8000 is available
- **Frontend not working?** Make sure backend URL is correct in `api.ts`
- **Password not working?** Check `PasswordGate.tsx` - the default is `TrendTripper2024`

