# Study Buddy AI — Comprehensive Build & Deployment Guide

This guide covers building, packaging, signing, and deploying **Study Buddy AI** across all supported targets:
- **Web / PWA**: Cloudflare Pages, Cloud Run, Vercel, or any static host.
- **Android**: Installable native APK and Google Play Store App Bundle (`.aab`) via Capacitor.
- **Windows**: Native NSIS Desktop Installer (`.exe`) and standalone Portable binary (`.exe`) via Electron.

---

## 📋 System Prerequisites

| Platform | Required Tooling | Version |
| :--- | :--- | :--- |
| **Common** | Node.js | `>= 20.0.0` (LTS recommended) |
| | npm | `>= 10.0.0` |
| **Android** | Java Development Kit (JDK) | JDK 17 (e.g. Eclipse Temurin 17) |
| | Android SDK & Command Line Tools | Platform 34 (Android 14), Build-Tools 34.0.0 |
| | Android Studio (Optional for GUI) | Hedgehog or newer |
| | Gradle Wrapper | Bundled in `./android/gradlew` (v8.2.1) |
| **Windows** | Operating System | Windows 10/11 or Ubuntu with Wine for cross-build |
| | Electron Builder | Bundled in `package.json` (`v26.15.3`) |
| **Cloudflare**| Wrangler CLI (Optional) | `npm i -g wrangler` or `npx wrangler` |

---

## 🌐 1. Web Application & PWA Build

### Production Build
```bash
# 1. Install dependencies
npm ci

# 2. Build Vite bundle, PWA Service Worker, and Node/Express bundle
npm run build
```
This produces:
- `dist/index.html`: Optimized HTML entry point.
- `dist/assets/*`: Content-hashed JavaScript, CSS, and images.
- `dist/manifest.webmanifest`: Web App Manifest with icons and display modes.
- `dist/sw.js`: Workbox precache service worker.
- `dist/server.cjs`: Self-contained Node.js Express server with sourcemap.

### Deploying to Cloudflare Pages
```bash
# Option A: Direct deploy via Wrangler CLI
npx wrangler pages deploy dist --project-name=study-buddy-ai

# Option B: Git Push
# Push to GitHub -> Cloudflare Pages builds with:
# Build Command: npm run build:pages
# Output directory: dist
# Node Version: 20
```

---

## 📱 2. Android APK & AAB Packaging (Capacitor)

### Step 2.1: Sync Web Assets to Native Android Project
```bash
# Builds the web application and syncs assets + plugins to android/
npm run build:android
```
Capacitor updates `android/app/src/main/assets/public` and configures Android plugins.

### Step 2.2: Generate a Keystore for Production Signing (One-time)
```bash
keytool -genkey -v -keystore study-buddy-release.keystore \
  -alias studybuddy \
  -keyalg RSA -keysize 2048 -validity 10000
```
Store this keystore in a safe place. Never commit `.keystore` or `.jks` files to git.

### Step 2.3: Build Debug APK (For Local Device Testing)
```bash
cd android
./gradlew assembleDebug
```
Output:
`android/app/build/outputs/apk/debug/app-debug.apk`

### Step 2.4: Build Release APK & App Bundle (AAB)
```bash
cd android
./gradlew assembleRelease bundleRelease
```
Outputs:
- Unsigned APK: `android/app/build/outputs/apk/release/app-release-unsigned.apk`
- Google Play AAB: `android/app/build/outputs/bundle/release/app-release.aab`

### Step 2.5: Sign Release APK with `apksigner`
```bash
# 1. Align the APK
$ANDROID_HOME/build-tools/34.0.0/zipalign -v -p 4 \
  android/app/build/outputs/apk/release/app-release-unsigned.apk \
  study-buddy-ai-aligned.apk

# 2. Sign the aligned APK
$ANDROID_HOME/build-tools/34.0.0/apksigner sign \
  --ks study-buddy-release.keystore \
  --ks-key-alias studybuddy \
  --out study-buddy-ai.apk \
  study-buddy-ai-aligned.apk

# 3. Verify signature
$ANDROID_HOME/build-tools/34.0.0/apksigner verify --verbose study-buddy-ai.apk
```

---

## 🖥️ 3. Windows Native Desktop Build (Electron)

### Step 3.1: Build Installer & Portable Binaries
```bash
# 1. Build web assets first
npm run build

# 2. Run Electron Builder for Windows x64
npm run build:windows
```
Or with custom targets:
```bash
npx electron-builder --win nsis portable --x64
```
This produces in `dist-electron/`:
- `Study Buddy AI Setup 2.4.0.exe`: NSIS Setup Wizard (creates Desktop shortcut, Start menu entry, and uninstaller).
- `Study Buddy AI 2.4.0.exe`: Zero-install portable standalone executable.

---

## 🔄 4. CI/CD Pipeline (GitHub Actions)

The repository includes `.github/workflows/release.yml` which automatically:
1. Builds the Web PWA and verifies asset compilation.
2. Synchronizes Capacitor Android and runs `./gradlew assembleRelease bundleRelease`.
3. Signs the Android APK if secrets are configured.
4. Builds the Windows NSIS Installer and Portable `.exe` on a Windows runner.
5. Computes SHA-256 checksums (`checksums.txt`).
6. Publishes a GitHub Release with all binary assets attached.

### Required GitHub Secrets (Repository Settings > Secrets and variables > Actions):

| Secret Name | Description | Mandatory? |
| :--- | :--- | :--- |
| `GITHUB_TOKEN` | Automatically supplied by GitHub Actions | Built-in |
| `ANDROID_KEYSTORE_BASE64` | `base64 -w 0 study-buddy-release.keystore` | For signed APK |
| `ANDROID_KEYSTORE_PASSWORD` | Password of your keystore | For signed APK |
| `ANDROID_KEY_ALIAS` | Alias name used in keytool (e.g., `studybuddy`) | For signed APK |
| `ANDROID_KEY_PASSWORD` | Password for key alias | For signed APK |
| `GEMINI_API_KEY` | Server-side Gemini API key for deployed backend | Optional for build |

### Triggering a Release:
```bash
git tag -a v2.4.0 -m "Release v2.4.0"
git push origin v2.4.0
```
Or run the workflow manually via **Actions > Release Study Buddy AI > Run workflow**.

---

## 📦 5. Manual Release Upload Steps (If CI is not used)

If you prefer to package manually:

1. **Build all binaries**:
   - Web: `npm run build`
   - Android: `cd android && ./gradlew assembleRelease`
   - Windows: `npm run build:windows`
2. **Collect Release Files**:
   - `study-buddy-ai.apk`
   - `study-buddy-ai.aab`
   - `Study Buddy AI Setup 2.4.0.exe`
   - `Study Buddy AI 2.4.0.exe`
3. **Compute SHA-256 Checksums**:
   ```bash
   sha256sum *.apk *.aab *.exe > checksums.txt
   ```
4. **Create GitHub Release**:
   - Navigate to `https://github.com/<your-username>/study-buddy-ai/releases/new`.
   - Set tag to `v2.4.0`.
   - Title: `Study Buddy AI v2.4.0`.
   - Drag and drop `study-buddy-ai.apk`, `study-buddy-ai.aab`, `.exe` installers, and `checksums.txt`.
   - Click **Publish release**.

---

## 🔒 6. Security Architecture & Offline Separation

- **Zero Client-Side Secrets**: No `GEMINI_API_KEY` is embedded in the client code, Android APK, or Windows binaries. All online generative calls route through `/api/*` proxies.
- **Local Vault Encryption**: Course notes and user data in IndexedDB are protected using AES-256-GCM keys derived via PBKDF2 (100,000 iterations).
- **Clear Offline Separation**: When offline, the app utilizes client-side cached document RAG and Socratic study prompts from IndexedDB. It explicitly reports offline mode rather than claiming local neural generation.
- **Sync Deduplication**: Offline changes are queued in `sync_queue` with UUIDs and timestamped mutations, automatically syncing via Last-Write-Wins upon network restoration.
