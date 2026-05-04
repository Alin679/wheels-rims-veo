# Deployment Guide - Wheels Rims Veo

Deploy your full-stack app to **Render** (backend) + **GitHub Pages** (frontend) + **MongoDB Atlas** (database).

---

## Step 1: Setup MongoDB Atlas (Cloud Database)

1. Go to [mongodb.com/cloud](https://www.mongodb.com/cloud/atlas)
2. Create a **free account** and sign in
3. Create a **new project** (name: `wheels-rims-veo`)
4. Create a **new cluster** (M0 Free tier)
5. Set **username/password** for database user
6. Add your IP to **IP Whitelist** (or allow 0.0.0.0/0)
7. Click **Connect** → Copy connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/car_sales?retryWrites=true&w=majority
   ```
8. Save this - you'll need it for Render!

---

## Step 2: Deploy Backend to Render

### 2.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub account
3. Give permissions to your `wheels-rims-veo` repo

### 2.2 Create Web Service
1. Dashboard → **New** → **Web Service**
2. Select your GitHub repo: `wheels-rims-veo`
3. Configure:
   - **Name:** `wheels-rims-veo-api`
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm --prefix server start`
   - **Root Directory:** (leave empty, it auto-detects)

### 2.3 Add Environment Variables
1. Go to **Environment** tab
2. Add these variables:
   ```
   MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/car_sales?retryWrites=true&w=majority
   JWT_SECRET = your_secure_random_string_here (e.g., use: openssl rand -base64 32)
   NODE_ENV = production
   ADMIN_EMAIL = admin@veocars.ro
   ADMIN_PASSWORD = Admin123!
   ADMIN_NAME = Admin VeoCars
   ```
3. Click **Deploy**

### 2.4 Get Your Backend URL
After deploy, Render gives you a URL like:
```
https://wheels-rims-veo-api.onrender.com
```
**Save this URL!**

---

## Step 3: Deploy Frontend to GitHub Pages

### 3.1 Enable GitHub Pages
1. Go to your repo settings: `https://github.com/Alin679/wheels-rims-veo/settings`
2. **Pages** → Source: **Deploy from a branch**
3. Branch: **gh-pages** → Save

### 3.2 Update GitHub Actions Workflow
The workflow in `.github/workflows/deploy.yml` will:
- Build your React app
- Deploy to GitHub Pages automatically
- Build env var `VITE_API_URL` with your Render backend URL

Edit `.github/workflows/deploy.yml` and update line with your Render API URL:
```yaml
VITE_API_URL: https://wheels-rims-veo-api.onrender.com
```

### 3.3 Push to GitHub
```bash
git add .
git commit -m "Add deployment configuration for Render + GitHub Pages"
git push origin main
```

The workflow runs automatically! Check **Actions** tab to see deploy status.

Your frontend will be live at:
```
https://alin679.github.io/wheels-rims-veo/
```

---

## Step 4: Update Frontend API URL

The frontend needs to know where your backend is. Open `client/src/App.jsx` and find all `fetch('/api/...` calls.

**Option A - Environment Variable (Recommended)**
```javascript
// In App.jsx, replace fetch calls like:
fetch('/api/health')

// With:
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
fetch(`${API_URL}/api/health`)
```

**Option B - Automatic via Vite**
The `vite.config.js` already has the setup. Just ensure `VITE_API_URL` is set in GitHub Actions (it is).

---

## Step 5: Testing

### Local Testing
```bash
npm run dev
```
Visit `http://localhost:3000` - should work with local backend

### Production Testing
1. Check GitHub Actions: `https://github.com/Alin679/wheels-rims-veo/actions`
2. If green ✅: Deploy successful
3. Visit `https://alin679.github.io/wheels-rims-veo/`
4. Login should work (connected to production MongoDB + Render API)

---

## Common Issues

### Issue: "CORS error" or "Cannot reach backend"
**Fix:**
- Verify `VITE_API_URL` in GitHub Actions matches your Render URL
- Check Render env vars are set correctly
- Add your frontend URL to server CORS whitelist (already done in code)

### Issue: "Database connection failed"
**Fix:**
- MongoDB Atlas connection string is correct
- IP whitelist allows Render's IPs
- Database user password is correct

### Issue: Frontend shows "0 results"
**Fix:**
- Backend may not have seeded data yet
- Login with admin account and add cars manually
- Or check Render logs for errors

---

## Updating Your App

1. Make changes locally
2. Test with `npm run dev`
3. Commit and push:
   ```bash
   git add .
   git commit -m "Your message"
   git push origin main
   ```
4. GitHub Actions automatically:
   - Builds frontend → GitHub Pages
   - (Backend auto-redeploys on Render if you push changes to `server/` folder)

---

## Stop/Pause Deployment

- **Render:** Go to service settings → Suspend
- **GitHub Pages:** Settings → Pages → Disable

---

## Useful Commands

```bash
# Test build locally
npm run build

# Check what will deploy
git log --oneline

# Connect to MongoDB Atlas (optional - CLI)
mongosh "mongodb+srv://username:password@cluster.mongodb.net/car_sales"
```

---

## Dashboard Links

- **Render Dashboard:** https://dashboard.render.com
- **MongoDB Atlas:** https://cloud.mongodb.com
- **GitHub Actions:** https://github.com/Alin679/wheels-rims-veo/actions
- **GitHub Pages Settings:** https://github.com/Alin679/wheels-rims-veo/settings/pages

---

**Done!** Your app is now live and automatically deploys on every push to `main`. 🚀
