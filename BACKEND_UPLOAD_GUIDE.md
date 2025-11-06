# 📦 Backend Files Upload Guide for PythonAnywhere

## 🎯 What Files to Upload

You need to upload **ALL files from the `backend` folder** to PythonAnywhere.

---

## 📁 Complete Backend Folder Structure

Here's what should be in your `backend` folder:

```
backend/
├── api_server.py          ✅ REQUIRED - Main FastAPI application
├── requirements_deploy.txt ✅ REQUIRED - Python dependencies
├── requirements.txt       ⚠️ Optional (has many packages, use requirements_deploy.txt instead)
├── Procfile              ⚠️ Not needed for PythonAnywhere (for Railway/Render)
├── runtime.txt           ⚠️ Not needed for PythonAnywhere
├── data/                 ✅ REQUIRED - Contains CSV and JSON data files
│   ├── events.csv
│   ├── monument_history.json
│   └── monument_info.json
├── model/                ✅ REQUIRED - Contains ML model file
│   └── fast_monument_cnn.pth
└── offline_sos.db        ⚠️ Will be created automatically (SQLite database)
```

---

## ✅ REQUIRED Files (Must Upload)

### 1. **api_server.py** ⭐ MOST IMPORTANT
- This is your main FastAPI application
- Contains all API endpoints
- **MUST be uploaded**

### 2. **requirements_deploy.txt** ⭐ IMPORTANT
- Contains all Python packages needed
- Used to install dependencies
- **MUST be uploaded**

### 3. **data/** folder ⭐ IMPORTANT
- Contains:
  - `events.csv` - Event data
  - `monument_history.json` - Monument history
  - `monument_info.json` - Monument information
- **MUST be uploaded** (keep folder structure)

### 4. **model/** folder ⭐ IMPORTANT
- Contains:
  - `fast_monument_cnn.pth` - Machine learning model for monument detection
- **MUST be uploaded** (keep folder structure)

---

## ⚠️ Optional Files (Not Critical)

### 5. **requirements.txt**
- Has many packages (from conda environment)
- **Can skip** - use `requirements_deploy.txt` instead

### 6. **Procfile**
- Only needed for Railway/Render
- **Not needed for PythonAnywhere**

### 7. **runtime.txt**
- Only needed for Railway/Render
- **Not needed for PythonAnywhere**

### 8. **offline_sos.db**
- SQLite database file
- **Will be created automatically** when app runs
- Don't need to upload (but you can if you have existing data)

---

## 🚀 Upload Methods

### Method 1: Upload as ZIP (Easiest) ⭐ RECOMMENDED

**Step 1: Prepare ZIP file on your computer**
1. Navigate to your project folder
2. Right-click on `backend` folder
3. Select "Compress" or "Send to" → "Compressed (zipped) folder"
4. You'll get `backend.zip`

**Step 2: Upload to PythonAnywhere**
1. Go to PythonAnywhere → **"Files"** tab
2. Navigate to `/home/yourusername/`
3. Click **"Upload a file"** button
4. Select `backend.zip`
5. Wait for upload to complete

**Step 3: Extract ZIP file**
1. Click on `backend.zip` in the file list
2. Click **"Extract"** button
3. You'll now have `/home/yourusername/backend/` folder with all files

**Step 4: Verify files are there**
1. Click on `backend` folder
2. You should see:
   - ✅ `api_server.py`
   - ✅ `requirements_deploy.txt`
   - ✅ `data/` folder
   - ✅ `model/` folder

---

### Method 2: Upload Individual Files (If ZIP doesn't work)

**Step 1: Create backend folder**
1. Go to PythonAnywhere → **"Files"** tab
2. Navigate to `/home/yourusername/`
3. Click **"New directory"**
4. Name it: `backend`
5. Click **"Create"**

**Step 2: Upload main file**
1. Click into `backend` folder
2. Click **"Upload a file"**
3. Upload `api_server.py`
4. Wait for upload

**Step 3: Upload requirements file**
1. Still in `backend` folder
2. Click **"Upload a file"**
3. Upload `requirements_deploy.txt`
4. Wait for upload

**Step 4: Upload data folder**
1. Still in `backend` folder
2. Click **"New directory"** → Name: `data`
3. Click into `data` folder
4. Upload:
   - `events.csv`
   - `monument_history.json`
   - `monument_info.json`

**Step 5: Upload model folder**
1. Go back to `backend` folder
2. Click **"New directory"** → Name: `model`
3. Click into `model` folder
4. Upload:
   - `fast_monument_cnn.pth`

---

### Method 3: Using Git (Advanced) ⭐ BEST FOR UPDATES

**Step 1: Open Bash console**
1. Go to PythonAnywhere → **"Consoles"** tab
2. Click **"Bash"**

**Step 2: Clone repository**
```bash
cd ~
git clone https://github.com/yourusername/trend-tripper-explorer.git
```

**Step 3: Move backend folder**
```bash
cd trend-tripper-explorer
mv backend ~/backend
cd ~
ls backend  # Verify files are there
```

---

## ✅ Verification Checklist

After uploading, verify you have:

- [ ] `/home/yourusername/backend/api_server.py` exists
- [ ] `/home/yourusername/backend/requirements_deploy.txt` exists
- [ ] `/home/yourusername/backend/data/` folder exists
  - [ ] `data/events.csv` exists
  - [ ] `data/monument_history.json` exists
  - [ ] `data/monument_info.json` exists
- [ ] `/home/yourusername/backend/model/` folder exists
  - [ ] `model/fast_monument_cnn.pth` exists

---

## 🎯 Quick Answer: What to Upload FIRST?

### **Upload Order (Priority):**

1. **FIRST:** `api_server.py` ⭐ (Most important - your app won't work without it)
2. **SECOND:** `requirements_deploy.txt` ⭐ (Needed to install dependencies)
3. **THIRD:** `data/` folder ⭐ (Contains required data files)
4. **FOURTH:** `model/` folder ⭐ (Contains ML model for monument detection)

### **Easiest Method:**

**Just upload the entire `backend` folder as ZIP!** 
- PythonAnywhere will extract it
- All files will be in the right place
- Folder structure will be preserved

---

## 📝 File Sizes (So you know what to expect)

- `api_server.py` - ~200KB (text file)
- `requirements_deploy.txt` - ~1KB (text file)
- `data/events.csv` - Varies (could be 1-10MB)
- `data/monument_history.json` - Varies (could be 1-5MB)
- `data/monument_info.json` - Varies (could be 1-5MB)
- `model/fast_monument_cnn.pth` - **LARGE** (could be 50-200MB) ⚠️

**Note:** The model file is large. Upload may take 5-10 minutes depending on your internet speed.

---

## ⚠️ Important Notes

1. **Keep folder structure:** Make sure `data/` and `model/` are inside `backend/` folder
2. **File paths:** PythonAnywhere will use `/home/yourusername/backend/` as the base path
3. **Database:** `offline_sos.db` will be created automatically when you first run the app
4. **Permissions:** PythonAnywhere will set correct permissions automatically

---

## 🐛 Troubleshooting

**Problem: Files not showing after upload**
- ✅ Refresh the page
- ✅ Check you're in the right directory
- ✅ Verify file names are correct (case-sensitive)

**Problem: ZIP file won't extract**
- ✅ Try uploading individual files instead
- ✅ Check ZIP file isn't corrupted
- ✅ Make sure ZIP file is under 100MB (PythonAnywhere limit)

**Problem: Model file too large**
- ✅ PythonAnywhere free tier has 512MB storage limit
- ✅ If model is too large, you may need to:
  - Use a smaller model
  - Or upgrade to paid tier
  - Or host model separately (e.g., Google Drive, S3)

**Problem: Can't find files after upload**
- ✅ Check you're in `/home/yourusername/backend/`
- ✅ Use "Search" function in Files tab
- ✅ Verify file names match exactly

---

## ✅ Summary

**What to upload FIRST:**
1. ⭐ **api_server.py** (Main application)
2. ⭐ **requirements_deploy.txt** (Dependencies)
3. ⭐ **data/** folder (Data files)
4. ⭐ **model/** folder (ML model)

**Easiest way:**
- Upload entire `backend` folder as ZIP file
- Extract in PythonAnywhere
- Done! ✅

---

**After uploading, continue with the main setup guide to install dependencies and configure the web app!**

