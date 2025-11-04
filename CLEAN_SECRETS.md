# 🔒 Clean Secrets from Git History

This guide will help you remove hardcoded secrets from your code and Git history.

## ✅ Step 1: Secrets Already Cleaned

I've already cleaned the secrets from your code:
- ✅ `backend/api_server.py` - Now uses environment variables only
- ✅ `DEPLOYMENT.md` - Placeholder values instead of real secrets
- ✅ `.gitignore` - Updated to ignore `.env` files
- ✅ `backend/.env.example` - Template file created

## 📝 Step 2: Create Your .env File

Create `backend/.env` file (this will NOT be committed to Git):

```bash
cd backend
copy .env.example .env
# Or on Linux/Mac: cp .env.example .env
```

Then edit `backend/.env` and add your real credentials:

```env
TWILIO_ACCOUNT_SID=YOUR_ACTUAL_ACCOUNT_SID_HERE
TWILIO_AUTH_TOKEN=YOUR_ACTUAL_AUTH_TOKEN_HERE
TWILIO_NUMBER=YOUR_ACTUAL_TWILIO_NUMBER_HERE
SOS_CONTACTS=+91XXXXXXXXXX,+91XXXXXXXXXX
```

**⚠️ Replace the placeholder values with your actual Twilio credentials!**

## 🧹 Step 3: Clean Git History

### Option A: Using git-filter-repo (Recommended)

1. **Install git-filter-repo:**
   ```bash
   pip install git-filter-repo
   ```

2. **Remove secrets from Git history:**
   ```bash
   # This rewrites history to remove sensitive data
   git-filter-repo --path backend/api_server.py --path DEPLOYMENT.md --invert-paths
   ```

3. **Re-add the cleaned files:**
   ```bash
   git add backend/api_server.py DEPLOYMENT.md
   git commit -m "Clean: Removed hardcoded secrets"
   ```

4. **Force push (⚠️ WARNING: This rewrites history!):**
   ```bash
   git push -u origin main --force
   ```

### Option B: Using BFG Repo-Cleaner (Alternative)

1. **Install BFG:**
   ```bash
   # Download from: https://rtyley.github.io/bfg-repo-cleaner/
   ```

2. **Create a passwords.txt file with your actual secrets:**
   ```
   YOUR_TWILIO_ACCOUNT_SID
   YOUR_TWILIO_AUTH_TOKEN
   YOUR_TWILIO_NUMBER
   ```
   
   **⚠️ Replace with your actual secret values!**

3. **Clean the repository:**
   ```bash
   java -jar bfg.jar --replace-text passwords.txt
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

4. **Force push:**
   ```bash
   git push --force --all
   ```

### Option C: Manual Clean (If above don't work)

1. **Create a new branch:**
   ```bash
   git checkout --orphan clean-history
   git add .
   git commit -m "Initial commit - cleaned secrets"
   ```

2. **Delete old branch and rename:**
   ```bash
   git branch -D main
   git branch -m main
   ```

3. **Force push:**
   ```bash
   git push -f origin main
   ```

## ⚠️ Important Warnings

1. **Backup your repository first!**
   ```bash
   git clone <your-repo-url> backup-repo
   ```

2. **Notify collaborators** - They'll need to re-clone after you force push

3. **After force push:**
   - All collaborators must: `git fetch origin` then `git reset --hard origin/main`
   - Or they can re-clone the repository

## ✅ Step 4: Verify Secrets Are Gone

After cleaning, verify:

```bash
# Check that secrets are not in current files
# Replace YOUR_SECRET with your actual secret values
grep -r "YOUR_TWILIO_ACCOUNT_SID" .
grep -r "YOUR_TWILIO_AUTH_TOKEN" .

# Should return nothing (no matches)
```

## 🔐 Step 5: Update GitHub Secrets Scanner

GitHub scans for secrets automatically. After cleaning:

1. Go to your repository on GitHub
2. Settings → Security → Secret scanning
3. If secrets are detected, they should be marked as "Resolved" after you push the cleaned version

## 📋 Checklist

- [ ] Secrets removed from `backend/api_server.py`
- [ ] Secrets removed from `DEPLOYMENT.md`
- [ ] `.env` file created (and NOT committed)
- [ ] `.gitignore` updated to ignore `.env`
- [ ] Git history cleaned (using one of the methods above)
- [ ] Force pushed to GitHub
- [ ] Verified no secrets in current code
- [ ] Updated collaborators about the history rewrite

## 🆘 Troubleshooting

**GitHub still detecting secrets?**
- Wait a few minutes for GitHub to re-scan
- Check if secrets exist in other files (use the grep commands above)
- Check GitHub's "Security" tab for details

**Force push rejected?**
- Make sure you have write access to the repository
- Try: `git push -u origin main --force-with-lease` (safer)

**Need to keep secrets somewhere?**
- Use environment variables (already set up)
- Use GitHub Secrets (for CI/CD)
- Use deployment platform's secret management (Railway, Render, etc.)

