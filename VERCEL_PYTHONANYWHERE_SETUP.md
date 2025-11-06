# 🚀 Complete Setup Guide: Vercel (Frontend) + PythonAnywhere (Backend)

This is a **step-by-step guide** to deploy your Trend Tripper app for **FREE** with no credit card required.

---

## 📋 Prerequisites

1. ✅ GitHub account (free)
2. ✅ PythonAnywhere account (free)
3. ✅ Your code pushed to GitHub
4. ✅ Environment variables ready (API keys, etc.)

---

## 🎨 PART 1: Deploy Frontend to Vercel

### Step 1: Prepare Your Code

1. **Make sure your code is on GitHub:**
   ```bash
   # If not already on GitHub, create a repository and push:
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Check your `package.json` has build script:**
   ```json
   {
     "scripts": {
       "build": "vite build"
     }
   }
   ```
   ✅ This should already be there!

### Step 2: Sign Up for Vercel

1. Go to **[vercel.com](https://vercel.com)**
2. Click **"Sign Up"** (top right)
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account
5. Complete the signup process

### Step 3: Create New Project

1. After logging in, you'll see the Vercel dashboard
2. Click **"Add New..."** → **"Project"**
3. You'll see a list of your GitHub repositories
4. **Find and click on your `trend-tripper-explorer` repository**
5. Click **"Import"**

### Step 4: Configure Build Settings

Vercel will auto-detect Vite, but verify these settings:

**Framework Preset:** `Vite` (should be auto-detected)

**Root Directory:** `./` (leave as default - root of repo)

**Build and Output Settings:**
- **Build Command:** `npm run build` (should be auto-filled)
- **Output Directory:** `dist` (should be auto-filled)
- **Install Command:** `npm install` (should be auto-filled)

✅ All these should be correct by default!

### Step 5: Add Environment Variables

1. Scroll down to **"Environment Variables"** section
2. Click **"Add"** or **"Add Another"**
3. Add this variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://yourusername.pythonanywhere.com` 
     *(We'll get this URL after setting up PythonAnywhere - you can update it later)*
   - **Environments:** Check all (Production, Preview, Development)
4. Click **"Save"**

### Step 6: Deploy!

1. Scroll to the bottom
2. Click **"Deploy"** button
3. Wait 2-3 minutes for the build to complete
4. ✅ **Your frontend is now live!**

### Step 7: Get Your Frontend URL

1. After deployment completes, you'll see:
   - **Production URL:** `https://trend-tripper-explorer.vercel.app` (or similar)
   - Copy this URL - you'll need it for backend CORS setup!

### Step 8: Update API URL (After Backend is Ready)

1. Go to your project in Vercel dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Edit `VITE_API_URL`:
   - Change value to: `https://yourusername.pythonanywhere.com`
4. Click **"Save"**
5. Go to **"Deployments"** tab
6. Click **"..."** on latest deployment → **"Redeploy"**

---

## 🔧 PART 2: Deploy Backend to PythonAnywhere

### Step 1: Sign Up for PythonAnywhere

1. Go to **[pythonanywhere.com](https://www.pythonanywhere.com)**
2. Click **"Sign up for free account"**
3. Fill in:
   - Username (this will be your subdomain)
   - Email address
   - Password
4. Click **"Register"**
5. Check your email and verify your account
6. Log in to PythonAnywhere

### Step 2: Upload Your Backend Code

**Option A: Using Files Tab (Easier)**

1. In PythonAnywhere dashboard, click **"Files"** tab (top menu)
2. Navigate to `/home/yourusername/` (your home directory)
3. Click **"Upload a file"** button
4. Upload your entire `backend` folder as a ZIP file:
   - On your computer, zip the `backend` folder
   - Upload the ZIP file
5. After upload, click on the ZIP file
6. Click **"Extract"** button
7. You should now have `/home/yourusername/backend/` folder

**Option B: Using Git (Recommended)**

1. In PythonAnywhere dashboard, click **"Consoles"** tab
2. Click **"Bash"** to open a terminal
3. Run these commands:
   ```bash
   cd ~
   git clone https://github.com/yourusername/trend-tripper-explorer.git
   cd trend-tripper-explorer
   mv backend ~/backend
   cd ~
   ```

### Step 3: Install Dependencies

1. In PythonAnywhere, go to **"Consoles"** tab
2. Click **"Bash"** to open a terminal
3. Run these commands:
   ```bash
   cd ~/backend
   pip3.10 install --user -r requirements_deploy.txt
   ```
   
   **If `requirements_deploy.txt` doesn't exist, use:**
   ```bash
   pip3.10 install --user fastapi uvicorn python-multipart python-dotenv PyJWT requests pandas pillow geopy twilio
   ```

4. Wait for installation to complete (may take 5-10 minutes)

### Step 4: Create Web App

1. In PythonAnywhere dashboard, click **"Web"** tab (top menu)
2. Click **"Add a new web app"** button
3. Click **"Next"** (skip domain selection)
4. Select **"Manual configuration"**
5. Select **"Python 3.10"** (or latest available)
6. Click **"Next"**
7. Click **"Next"** again (skip template)
8. ✅ Your web app is created!

### Step 5: Configure Web App

1. In the **"Web"** tab, you'll see your web app configuration
2. Find **"Source code"** section:
   - Set to: `/home/yourusername/backend`
3. Find **"Working directory"** section:
   - Set to: `/home/yourusername/backend`

### Step 6: Edit WSGI Configuration File

1. In the **"Web"** tab, find **"WSGI configuration file"** section
2. Click on the file path (usually `/var/www/yourusername_pythonanywhere_com_wsgi.py`)
3. **Delete all the default code** and replace with:
   ```python
   import sys
   
   # Add your backend directory to the path
   path = '/home/yourusername/backend'
   if path not in sys.path:
       sys.path.insert(0, path)
   
   # Import your FastAPI app
   from api_server import app
   
   # Expose the app as 'application' (required by PythonAnywhere)
   application = app
   ```
4. **Important:** Replace `yourusername` with your actual PythonAnywhere username!
5. Click **"Save"** button

### Step 7: Add Environment Variables

1. In the **"Web"** tab, scroll down to **"Environment variables"** section
2. Click **"Add a new environment variable"**
3. Add each variable one by one:

   **Variable 1:**
   - Name: `SECRET_KEY`
   - Value: `your-secret-key-here` (generate a random string, e.g., use: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)

   **Variable 2:**
   - Name: `GEOAPIFY_API_KEY`
   - Value: `your-geoapify-api-key`

   **Variable 3:**
   - Name: `TWILIO_ACCOUNT_SID`
   - Value: `your-twilio-account-sid`

   **Variable 4:**
   - Name: `TWILIO_AUTH_TOKEN`
   - Value: `your-twilio-auth-token`

   **Variable 5:**
   - Name: `TWILIO_PHONE_NUMBER`
   - Value: `your-twilio-phone-number`

4. Click **"Add"** after each variable
5. ✅ All environment variables added!

### Step 8: Update CORS Settings

1. In PythonAnywhere, go to **"Files"** tab
2. Navigate to `/home/yourusername/backend/`
3. Click on `api_server.py` to edit it
4. Find the CORS middleware section (around line 100-110)
5. Update `allow_origins` to include your Vercel URL:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[
           "https://trend-tripper-explorer.vercel.app",  # Your Vercel URL
           "https://trend-tripper-explorer-*.vercel.app",  # Preview deployments
           "http://localhost:8080",
           "http://localhost:5173",
       ],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
       expose_headers=["*"],
   )
   ```
6. **Important:** Replace `trend-tripper-explorer` with your actual Vercel project name!
7. Click **"Save"**

### Step 9: Reload Web App

1. Go back to **"Web"** tab
2. Scroll to the top
3. Click the big green **"Reload yourusername.pythonanywhere.com"** button
4. Wait 10-20 seconds for reload
5. ✅ Your backend is now live!

### Step 10: Test Your Backend

1. Your backend URL is: `https://yourusername.pythonanywhere.com`
2. Test it by visiting: `https://yourusername.pythonanywhere.com/docs`
   - You should see the FastAPI documentation page!
3. If you see the docs, ✅ **Backend is working!**

---

## 🔗 PART 3: Connect Frontend and Backend

### Step 1: Update Vercel Environment Variable

1. Go to [vercel.com](https://vercel.com) and log in
2. Click on your project
3. Go to **"Settings"** → **"Environment Variables"**
4. Find `VITE_API_URL`
5. Click **"Edit"**
6. Change value to: `https://yourusername.pythonanywhere.com`
   *(Replace `yourusername` with your PythonAnywhere username)*
7. Click **"Save"**

### Step 2: Redeploy Frontend

1. In Vercel, go to **"Deployments"** tab
2. Find the latest deployment
3. Click **"..."** (three dots) → **"Redeploy"**
4. Wait for deployment to complete
5. ✅ Frontend now points to your backend!

### Step 3: Test Everything

1. Visit your Vercel URL: `https://trend-tripper-explorer.vercel.app`
2. Try logging in or using any feature
3. Open browser DevTools (F12) → Network tab
4. Check if API calls are going to: `https://yourusername.pythonanywhere.com`
5. ✅ If everything works, you're done!

---

## 🐛 Troubleshooting

### Frontend Issues

**Problem: Build fails on Vercel**
- ✅ Check that `package.json` has `"build": "vite build"`
- ✅ Make sure all dependencies are in `package.json`
- ✅ Check build logs in Vercel dashboard

**Problem: API calls fail (CORS error)**
- ✅ Make sure you updated CORS in `api_server.py` with your Vercel URL
- ✅ Reload PythonAnywhere web app after CORS changes
- ✅ Check browser console for exact error

**Problem: Environment variable not working**
- ✅ Make sure variable name is exactly `VITE_API_URL`
- ✅ Redeploy after adding/changing environment variables
- ✅ Check that variable is set for "Production" environment

### Backend Issues

**Problem: 500 Internal Server Error**
- ✅ Check PythonAnywhere **"Web"** tab → **"Error log"** for details
- ✅ Make sure all dependencies are installed
- ✅ Check WSGI file is correct
- ✅ Verify environment variables are set

**Problem: Module not found error**
- ✅ Make sure you installed all dependencies: `pip3.10 install --user -r requirements_deploy.txt`
- ✅ Check that `api_server.py` is in the correct location
- ✅ Verify WSGI file path is correct

**Problem: Database errors**
- ✅ SQLite database file needs write permissions
- ✅ Make sure database file path is correct in `api_server.py`
- ✅ Check PythonAnywhere **"Files"** tab for database file location

**Problem: Backend URL not accessible**
- ✅ Make sure you clicked "Reload" button in PythonAnywhere
- ✅ Wait 20-30 seconds after reload
- ✅ Check **"Web"** tab for any error messages
- ✅ Try accessing `/docs` endpoint to test

---

## 📝 Quick Checklist

### Frontend (Vercel)
- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] Build settings verified (Vite, `npm run build`, `dist`)
- [ ] Environment variable `VITE_API_URL` added
- [ ] Deployment successful
- [ ] Frontend URL copied

### Backend (PythonAnywhere)
- [ ] PythonAnywhere account created
- [ ] Backend code uploaded to `/home/yourusername/backend/`
- [ ] Dependencies installed (`pip3.10 install --user ...`)
- [ ] Web app created (Python 3.10, Manual configuration)
- [ ] Source code path set to `/home/yourusername/backend`
- [ ] WSGI file edited correctly
- [ ] Environment variables added (SECRET_KEY, GEOAPIFY_API_KEY, etc.)
- [ ] CORS updated with Vercel URL
- [ ] Web app reloaded
- [ ] Backend accessible at `/docs`

### Connection
- [ ] Vercel `VITE_API_URL` updated with PythonAnywhere URL
- [ ] Frontend redeployed
- [ ] Tested login/features
- [ ] API calls working
- [ ] No CORS errors

---

## 🎉 Success!

If you've completed all steps, your app should be:
- ✅ Frontend: `https://your-project.vercel.app`
- ✅ Backend: `https://yourusername.pythonanywhere.com`
- ✅ Both connected and working!

---

## 📞 Need Help?

1. **Vercel Issues:** Check Vercel dashboard → Deployments → Build logs
2. **PythonAnywhere Issues:** Check Web tab → Error log
3. **CORS Issues:** Make sure both URLs are correct in CORS settings
4. **API Issues:** Check browser DevTools → Network tab for errors

---

**Good luck with your deployment! 🚀**

