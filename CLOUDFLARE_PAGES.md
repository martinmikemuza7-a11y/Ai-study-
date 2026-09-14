# Deploying Study Buddy AI on Cloudflare Pages

This project is fully configured for deployment on **Cloudflare Pages**, including static frontend hosting, client-side SPA routing, native downloadable packages, and Cloudflare Pages Functions for Gemini AI features.

---

## 🚀 Quick Deployment Guide

### Option 1: Git Integration (Recommended)

1. Push your repository to **GitHub** or **GitLab**.
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Compute (Workers & Pages)** > **Create application** > **Pages** > **Connect to Git**.
3. Select your repository and configure the build settings:

| Setting | Value | Notes |
| :--- | :--- | :--- |
| **Framework preset** | `Vite` | Or choose `None` |
| **Build command** | `npm run build:pages` | Or `npm run build` |
| **Build output directory** | `dist` | Destination for Vite compiled assets |
| **Root directory** | `/` | Keep as repository root |

4. Under **Environment variables (advanced)**, add:
   - `NODE_VERSION` = `20`
   - `GEMINI_API_KEY` = `your_gemini_api_key_here` *(Click **Encrypt** to protect your key)*

5. Click **Save and Deploy**. Cloudflare Pages will build and deploy your application to a `*.pages.dev` subdomain.

---

### Option 2: Direct Upload via Wrangler CLI

If deploying directly from your machine or terminal without Git:

```bash
# 1. Install dependencies
npm ci

# 2. Build the project
npm run build:pages

# 3. Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name=study-buddy-ai
```

---

## ⚙️ Included Cloudflare Configurations

The repository includes pre-configured files specifically tuned for Cloudflare Pages:

| File | Purpose |
| :--- | :--- |
| `wrangler.toml` | Declares project name, `dist` output folder, Node.js compatibility (`nodejs_compat`), and runtime flags. |
| `public/_headers` | Configures HTTP security headers (`X-Frame-Options`, `nosniff`), long-term caching for hashed `/assets/*`, and disables caching for the service worker (`/sw.js`). |
| `public/_redirects` | Provides SPA fallback routing (`/* -> /index.html 200`) and vanity shortlinks for downloads (`/apk`, `/windows`, `/windows-portable`, `/source`). |
| `public/_routes.json` | Optimizes Cloudflare Pages Functions routing: routes `/api/*` to edge workers while serving all static assets and downloads directly from the Cloudflare global CDN. |
| `functions/api/*` | Serverless edge handlers for `/api/health`, `/api/tutor`, `/api/quiz/generate`, `/api/study/generate`, and `/api/questions/generate-from-source`. |

---

## 🔐 Environment Variables

| Variable | Required | Description |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | Optional | Powers online Socratic AI Tutoring, question generation, and web research grounding. If omitted, the app automatically falls back to its built-in local offline engine. |
| `NODE_VERSION` | Recommended | Set to `20` in Cloudflare Pages settings to match the runtime environment. |

> **Offline-First Resilience**: Even without a `GEMINI_API_KEY`, the application works 100% in local offline mode using on-device IndexedDB storage and client-side encryption.

---

## ✅ Deployment Verification Checklist

After your deployment completes, verify the following endpoints:

1. **Web App**: Open `https://<your-project>.pages.dev` to verify the dashboard and study views load.
2. **Health Check**: Open `https://<your-project>.pages.dev/api/health` to confirm Pages Functions are active.
3. **Downloads**:
   - `https://<your-project>.pages.dev/apk` (redirects to Android APK)
   - `https://<your-project>.pages.dev/windows` (redirects to Windows installer)
   - `https://<your-project>.pages.dev/source` (redirects to source ZIP)
4. **PWA Offline Mode**: Check that the service worker registers at `/sw.js` and caches resources for offline use.
