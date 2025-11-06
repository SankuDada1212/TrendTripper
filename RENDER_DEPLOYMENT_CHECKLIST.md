# 🔍 Render Deployment Issues Checklist

## Issues Found:

### 1. ❌ Monument Shows "Unknown"
**Problem:** Model file and data files missing on Render

**Files Needed:**
- `backend/model/fast_monument_cnn.pth` (ML model file)
- `backend/data/monument_info.json` (monument information)
- `backend/data/monument_history.json` (monument history)

**Fix:**
1. Make sure these files are committed to GitHub
2. Check if they're in `.gitignore` (they shouldn't be)
3. Verify files exist in your repo:
   ```bash
   ls backend/model/
   ls backend/data/
   ```
4. If missing, add them:
   ```bash
   git add backend/model/fast_monument_cnn.pth
   git add backend/data/monument_info.json
   git add backend/data/monument_history.json
   git commit -m "Add monument model and data files"
   git push
   ```

**Check in Render:**
- Go to your backend service → "Logs" tab
- Look for errors like: "FileNotFoundError" or "model not found"
- Check if model loads: Look for "model loaded" or similar messages

---

### 2. ❌ Mood Always Shows "NEUTRAL"
**Problem:** Transformers library might not be installed or failing

**Check:**
1. **In Render Dashboard:**
   - Go to backend service → "Environment" tab
   - Check if `SENTIMENT_AVAILABLE` would be True
   
2. **Check Logs:**
   - Look for: "Error in mood analysis" or import errors
   - Check if transformers is installed

**Fix:**
1. **Add transformers to requirements:**
   - Edit `backend/requirements_deploy.txt`
   - Add: `transformers==4.56.2`
   - Add: `torch==2.7.1` (if not already there)
   
2. **Redeploy backend**

3. **Check the analyze_mood function:**
   - It should use transformers pipeline
   - If transformers fails, it falls back to "NEUTRAL"

**Quick Test:**
- Check Render logs when you submit mood analysis
- Look for any Python errors

---

### 3. ❌ Bookings Showing "Any Places" / Empty
**Problem:** Hardcoded Windows file paths don't exist on Render

**Files Referenced (but don't exist on server):**
```python
DIST_FILE = r"C:\\Users\\sanke\\Documents\\Project\\Python\\Rishi\\Lets\\Dist.xlsx"
FLIGHT_FILE = r"C:\\Users\\sanke\\Documents\\Project\\Python\\Rishi\\Lets\\flight.xlsx"
```

**Fix Options:**

**Option 1: Upload Files to Render**
1. Add these files to your repo:
   ```bash
   # Create data directory if needed
   mkdir -p backend/data
   # Copy your Excel files there
   cp "path/to/Dist.xlsx" backend/data/
   cp "path/to/flight.xlsx" backend/data/
   ```
2. Update `api_server.py`:
   ```python
   DIST_FILE = os.path.join(BASE_DIR, "data", "Dist.xlsx")
   FLIGHT_FILE = os.path.join(BASE_DIR, "data", "flight.xlsx")
   ```
3. Commit and push

**Option 2: Use Mock Data (Quick Fix)**
- The code already has fallback to empty DataFrame
- But bookings might need the actual data

**Check in Render:**
- Go to backend logs
- Look for: "FileNotFoundError" or "Dist.xlsx" errors
- Check if bookings endpoint returns data

---

## 🔧 Quick Fixes to Apply:

### Step 1: Update File Paths in `api_server.py`

Change these lines (around line 78-82, 109-110):

**FROM:**
```python
DATA_DIR = r"C:\Users\sanke\Documents\Project\dataset"
DIST_FILE = r"C:\\Users\\sanke\\Documents\\Project\\Python\\Rishi\\Lets\\Dist.xlsx"
FLIGHT_FILE = r"C:\\Users\\sanke\\Documents\\Project\\Python\\Rishi\\Lets\\flight.xlsx"
```

**TO:**
```python
DATA_DIR = os.path.join(BASE_DIR, "dataset")  # Optional, only if you have dataset
DIST_FILE = os.path.join(BASE_DIR, "data", "Dist.xlsx")  # If file exists
FLIGHT_FILE = os.path.join(BASE_DIR, "data", "flight.xlsx")  # If file exists
```

### Step 2: Add Missing Dependencies

Update `backend/requirements_deploy.txt`:
```txt
# Add these if missing:
transformers==4.56.2
torch==2.7.1
torchvision==0.22.1
```

### Step 3: Verify Files Are Committed

Check what's in your repo:
```bash
git ls-files backend/model/
git ls-files backend/data/
```

If files are missing, add them:
```bash
git add backend/model/*.pth
git add backend/data/*.json
git add backend/data/*.xlsx  # If you have them
git commit -m "Add required model and data files"
git push
```

---

## 📋 Render Dashboard Checks:

### Backend Service:
1. **Logs Tab:**
   - Check for Python errors
   - Look for "FileNotFoundError"
   - Check model loading messages
   - Check mood analysis errors

2. **Environment Tab:**
   - Verify all environment variables are set
   - Check `SECRET_KEY`, `GEOAPIFY_API_KEY`, etc.

3. **Settings Tab:**
   - Verify "Root Directory" is set to `backend`
   - Check build command and start command

### Files to Verify in GitHub:
- ✅ `backend/model/fast_monument_cnn.pth` (should be committed)
- ✅ `backend/data/monument_info.json`
- ✅ `backend/data/monument_history.json`
- ✅ `backend/data/events.csv`
- ⚠️ `backend/data/Dist.xlsx` (if bookings need it)
- ⚠️ `backend/data/flight.xlsx` (if bookings need it)

---

## 🚨 Most Likely Issues:

1. **Model file not uploaded** → Monument shows "Unknown"
2. **Transformers not installed** → Mood always "NEUTRAL"
3. **Excel files missing** → Bookings empty/error

---

## ✅ Quick Test Commands:

After fixing, test in Render logs:
1. Upload a monument image → Check logs for model loading
2. Submit mood analysis → Check for transformers errors
3. Try bookings → Check for file path errors

---

**Priority Fix Order:**
1. Fix file paths (use `os.path.join` instead of hardcoded Windows paths)
2. Add missing files to GitHub
3. Update requirements.txt
4. Redeploy
5. Check logs for errors

