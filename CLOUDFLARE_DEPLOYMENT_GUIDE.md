# 🚀 DuitTrack - Cloudflare Pages Deployment Guide

**Production-Ready Deployment for Cloudflare Pages**

> Last Updated: 2025-10-27
> Status: ✅ Ready for Cloudflare Pages Deployment

---

## 🎯 Why Cloudflare Pages?

### ✨ Free Forever Features:
- ♾️ **Unlimited Bandwidth** - No limits!
- 🌍 **200+ CDN Locations** - Fastest global delivery
- 🛡️ **Free DDoS Protection** - Enterprise-grade security
- 🔒 **Free SSL Certificate** - HTTPS by default
- 🚀 **500 Builds/Month** - More than enough
- 💰 **Zero Cost** - No credit system, truly free!

---

## 📦 Prerequisites

### 1. Cloudflare Account (FREE)
- Sign up at: https://dash.cloudflare.com/sign-up
- No credit card required!

### 2. Git Repository
- Your code must be on GitHub, GitLab, or Bitbucket
- Make sure your latest code is pushed

### 3. Firebase Setup (REQUIRED) 🔥
Your app uses Firebase for authentication and database. You need:
- Firebase project already created at: https://console.firebase.google.com/
- Firestore Database enabled
- Google Authentication enabled

---

## 🚀 Deployment Steps

### STEP 1: Push Your Code to GitHub

Make sure all changes are committed and pushed:

```bash
git add .
git commit -m "Migrate to Cloudflare Pages"
git push origin main
```

### STEP 2: Connect Repository to Cloudflare Pages

1. **Login to Cloudflare Dashboard**
   - Go to: https://dash.cloudflare.com/
   - Login with your account

2. **Navigate to Workers & Pages**
   - Click **"Workers & Pages"** from the left sidebar
   - Click **"Create application"** button
   - Select **"Pages"** tab
   - Click **"Connect to Git"**

3. **Authorize Git Provider**
   - Select **GitHub** (or your git provider)
   - Click **"Authorize Cloudflare Pages"**
   - Grant access to your repositories

4. **Select Repository**
   - Find and select **"DuitTrack"** repository
   - Click **"Begin setup"**

### STEP 3: Configure Build Settings

Enter these EXACT settings:

```
Project name:           duittrack (or your preferred name)
Production branch:      main
Framework preset:       SvelteKit
Build command:          npm run build
Build output directory: .svelte-kit/cloudflare
Root directory:         /
```

**Environment Variables (Build Settings):**
Set Node version:
```
NODE_VERSION = 20
```

### STEP 4: Set Environment Variables

Scroll down to **"Environment variables"** section and add these:

Click **"Add variable"** for each:

```bash
# Firebase Configuration
FIREBASE_API_KEY = AIzaSyDBT1eHe31e2Gk-ZHTg_lhbwqU2YXW2DlM
FIREBASE_AUTH_DOMAIN = duittrack.firebaseapp.com
FIREBASE_PROJECT_ID = duittrack
FIREBASE_STORAGE_BUCKET = duittrack.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID = 278657280930
FIREBASE_APP_ID = 1:278657280930:web:fda1c3f6e3d7076c1020fb
FIREBASE_MEASUREMENT_ID = G-SSR2FSQD83
```

⚠️ **Note:** Untuk production yang lebih aman, sebaiknya pindahkan Firebase credentials ke environment variables instead of hardcoding di `firebase.ts`.

### STEP 5: Deploy!

1. Click **"Save and Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. You'll get a URL like: `https://duittrack.pages.dev`

🎉 **Congratulations!** Your app is now live on Cloudflare Pages!

---

## 🔧 Post-Deployment Configuration

### A. Update Google OAuth Settings

Your app uses Google Sign-In, so you need to add the Cloudflare domain:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project

2. **Navigate to Credentials**
   - Go to: **APIs & Services** → **Credentials**
   - Click on your **OAuth 2.0 Client ID**

3. **Add Authorized Origins**
   Add your Cloudflare Pages URL:
   ```
   https://duittrack.pages.dev
   ```

   If you have a custom domain, add it too:
   ```
   https://yourdomain.com
   ```

4. **Add Authorized Redirect URIs**
   Add these URLs:
   ```
   https://duittrack.pages.dev/__/auth/handler
   ```

   If custom domain:
   ```
   https://yourdomain.com/__/auth/handler
   ```

5. Click **"Save"**

### B. Update Firebase Authorized Domains

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your **duittrack** project

2. **Navigate to Authentication**
   - Click **"Authentication"** from left sidebar
   - Go to **"Settings"** tab
   - Scroll to **"Authorized domains"**

3. **Add Your Cloudflare Domain**
   Click **"Add domain"** and add:
   ```
   duittrack.pages.dev
   ```

   If you have custom domain:
   ```
   yourdomain.com
   ```

4. Click **"Add"**

### C. Create Firebase Indexes

**CRITICAL:** Your Firestore queries require composite indexes.

**Option A: Automatic (Recommended)**
1. Open your deployed app: `https://duittrack.pages.dev`
2. Sign in with Google
3. Try to add an expense or view dashboard
4. Open browser console (F12)
5. Firebase will show index creation links - click them!
6. Wait 5-10 minutes for indexes to build

**Option B: Manual Setup**
Go to Firebase Console → Firestore Database → Indexes

**Create Index 1: Expenses by Period**
- Collection ID: `expenses`
- Fields indexed:
  - `periodId` (Ascending)
  - `date` (Descending)
- Query scope: Collection

**Create Index 2: Expenses by Category**
- Collection ID: `expenses`
- Fields indexed:
  - `category` (Ascending)
  - `periodId` (Ascending)
  - `date` (Descending)
- Query scope: Collection

---

## 🔒 Security Configuration

### Firestore Security Rules

**IMPORTANT:** Protect your user data with proper security rules!

1. **Go to Firebase Console**
   - Navigate to **Firestore Database** → **Rules**

2. **Update Rules**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // User profiles
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);

      // User expenses subcollection
      match /expenses/{expenseId} {
        allow read, write: if isOwner(userId);
      }

      // User budgets subcollection
      match /budgets/{budgetId} {
        allow read, write: if isOwner(userId);
      }
    }
  }
}
```

3. Click **"Publish"**

---

## 🔄 Continuous Deployment

### Automatic Deploys

Cloudflare Pages automatically deploys when you push to your repository:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin main

# Cloudflare will automatically build and deploy!
```

### Preview Deployments

Every pull request gets its own preview URL automatically!

### Rollback

If something goes wrong:
1. Go to Cloudflare Dashboard → Workers & Pages → Your Project
2. Click **"Deployments"** tab
3. Find a previous successful deployment
4. Click **"..."** → **"Rollback to this deployment"**

---

## 🎨 Custom Domain (Optional)

Want to use your own domain? (e.g., `duittrack.com`)

### Prerequisites
- You need to own a domain
- Domain can be registered anywhere (Namecheap, GoDaddy, etc.)

### Setup Steps

1. **Add Domain to Cloudflare Pages**
   - Go to your project in Cloudflare Dashboard
   - Click **"Custom domains"** tab
   - Click **"Set up a custom domain"**
   - Enter your domain: `duittrack.com`

2. **Update DNS Records**

   **If domain is already on Cloudflare:**
   - Cloudflare will automatically create CNAME record

   **If domain is elsewhere:**
   - Add CNAME record:
     ```
     Type: CNAME
     Name: @ (or www)
     Target: duittrack.pages.dev
     ```

3. **Wait for DNS Propagation** (5-30 minutes)

4. **Update Firebase & Google OAuth**
   - Repeat Post-Deployment Configuration steps A & B
   - Add your custom domain to authorized domains

---

## 🧪 Testing Checklist

After deployment, test these:

### Authentication
- [ ] Google Sign-In works
- [ ] User redirected to dashboard after login
- [ ] User redirected to home after logout
- [ ] Onboarding flow for new users works

### Core Features
- [ ] Dashboard loads data correctly
- [ ] Can add/edit/delete expenses
- [ ] Budget setup and modification works
- [ ] Period selector works across pages
- [ ] PWA manifest loads without errors

### Console Checks
- [ ] No critical errors in browser console
- [ ] Firebase indexes created successfully
- [ ] Security headers applied (check Network tab)
- [ ] PWA icons loading correctly

### Performance
- [ ] Page loads fast (< 2 seconds)
- [ ] No layout shifts
- [ ] Smooth transitions

---

## 🐛 Troubleshooting

### Issue: Build Failed

**Error:** `Cannot find module '@sveltejs/adapter-cloudflare'`

**Solution:**
```bash
npm install -D @sveltejs/adapter-cloudflare
git add package.json package-lock.json
git commit -m "Add Cloudflare adapter"
git push
```

### Issue: Google Sign-In Not Working

**Solution:**
- Double-check you added Cloudflare domain to Google OAuth settings
- Make sure redirect URI includes `/__/auth/handler`
- Clear browser cache and try again

### Issue: Firestore Permission Denied

**Solution:**
- Check Firestore Security Rules are properly set
- Make sure user is authenticated
- Create required indexes (see Post-Deployment section C)

### Issue: "Firebase requires an index" Error

**Solution:**
- Click the index creation link in error message
- Wait 5-10 minutes for index to build
- Refresh the page

### Issue: CSP Blocking Resources

**Solution:**
- Check browser console for CSP violations
- Headers are configured in `static/_headers`
- If you need to add domains, edit that file and redeploy

---

## 📊 Monitoring & Analytics

### Cloudflare Analytics (Built-in)

View real-time analytics:
1. Go to Cloudflare Dashboard → Workers & Pages → Your Project
2. Click **"Analytics"** tab
3. See:
   - Page views
   - Unique visitors
   - Bandwidth usage
   - Request count
   - Error rates

### Firebase Analytics (Optional)

Your app already has Firebase Analytics configured!
View data at: https://console.firebase.google.com/ → Analytics

---

## 💰 Pricing & Limits

### Cloudflare Pages Free Tier:

| Feature | Free Tier |
|---------|-----------|
| **Bandwidth** | ♾️ Unlimited |
| **Builds** | 500/month |
| **Concurrent builds** | 1 |
| **Requests** | Unlimited |
| **Custom domains** | 100 |
| **Team members** | Unlimited |
| **DDoS protection** | ✅ Included |

### When You Might Need Paid Plan ($20/month):
- Need more than 500 builds/month
- Need more than 1 concurrent build
- Need advanced features (Access control, etc.)

**For most apps:** Free tier is MORE than enough! 🎉

---

## 🔐 Security Best Practices

### ✅ Already Configured:
- HTTPS enforced automatically
- Security headers in `_headers` file
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- HSTS enabled
- XSS Protection

### ⚠️ Recommended:
- [ ] Enable Firebase App Check for additional security
- [ ] Set up Firestore Security Rules (see above)
- [ ] Use environment variables for sensitive data
- [ ] Regularly update dependencies
- [ ] Monitor Firebase usage and set billing alerts

---

## 📝 Project Structure (Cloudflare-specific)

```
DuitTrack/
├── static/
│   ├── _headers          ← Security headers (Cloudflare)
│   ├── _redirects        ← SPA routing (Cloudflare)
│   └── manifest.json     ← PWA manifest
├── src/
│   └── ... (your app code)
├── svelte.config.js      ← Uses @sveltejs/adapter-cloudflare
├── package.json          ← Cloudflare adapter dependency
└── .svelte-kit/
    └── cloudflare/       ← Build output (deployed to Cloudflare)
```

---

## 🎯 Quick Reference

### Build Command
```bash
npm run build
```

### Build Output Directory
```
.svelte-kit/cloudflare
```

### Environment Variables Needed
```
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
FIREBASE_MEASUREMENT_ID
```

### Important URLs
- Cloudflare Dashboard: https://dash.cloudflare.com/
- Firebase Console: https://console.firebase.google.com/
- Google Cloud Console: https://console.cloud.google.com/

---

## 🆘 Need Help?

### Cloudflare Documentation
- Pages Documentation: https://developers.cloudflare.com/pages/
- SvelteKit Guide: https://developers.cloudflare.com/pages/framework-guides/deploy-a-svelte-kit-site/
- Migration Guide: https://developers.cloudflare.com/pages/migrations/migrating-from-netlify/

### Firebase Documentation
- Firestore Security Rules: https://firebase.google.com/docs/firestore/security/get-started
- Authentication: https://firebase.google.com/docs/auth/web/start

### Community Support
- Cloudflare Community: https://community.cloudflare.com/
- SvelteKit Discord: https://svelte.dev/chat

---

## ✅ Deployment Complete!

After following this guide, your **DuitTrack** app will be:

- 🚀 Live on Cloudflare Pages with unlimited bandwidth
- 🔒 Secured with enterprise-grade DDoS protection
- ⚡ Delivered via 200+ global CDN locations
- 📱 PWA-ready with manifest and service worker
- 🌍 Accessible worldwide with < 100ms latency
- 💰 **100% FREE** forever!

---

**Your app URL:**
```
https://duittrack.pages.dev
```

**Status:** ✅ **READY TO DEPLOY**

---

**Questions?** Contact: tegarerputra@outlook.com

**Last Updated:** 2025-10-27 by Claude Code Assistant
