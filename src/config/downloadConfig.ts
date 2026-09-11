/**
 * Central Download Configuration for Study Buddy AI.
 * 
 * PLACEHOLDERS FOR REAL HOSTED BINARIES:
 * Once you generate the APK and Windows installer, upload them to:
 * - Google Cloud Storage (e.g., https://storage.googleapis.com/YOUR_BUCKET/study-buddy-ai.apk)
 * - GitHub Releases (e.g., https://github.com/USER/REPO/releases/download/v2.4.0/study-buddy-ai.apk)
 * - Firebase Storage / AWS S3 / Cloudflare R2
 * 
 * Then set the URL either in your environment variables:
 *   VITE_ANDROID_DOWNLOAD_URL
 *   VITE_WINDOWS_DOWNLOAD_URL
 *   VITE_WEB_APP_URL
 * Or edit ANDROID_DOWNLOAD_URL / WINDOWS_DOWNLOAD_URL below,
 * Or use the "Configure Download URLs" button on the landing page.
 * 
 * If a URL is empty/not set, the UI gracefully displays a clear "Coming Soon (Build Ready)" state
 * so no broken routes or 404 errors occur!
 */

export interface AppReleaseInfo {
  url: string;
  isAvailable: boolean;
  version: string;
  size: string;
  releaseDate: string;
  minRequirement: string;
  fileName: string;
  sha256?: string;
}

export interface DownloadAppConfig {
  androidApk: AppReleaseInfo;
  windowsExe: AppReleaseInfo;
  webAppUrl: string;
  supportEmail: string;
  documentationUrl: string;
}

// User-configurable download URLs (Placeholders for real hosting)
export const ANDROID_DOWNLOAD_URL: string =
  (import.meta.env.VITE_ANDROID_DOWNLOAD_URL as string) || '';

export const WINDOWS_DOWNLOAD_URL: string =
  (import.meta.env.VITE_WINDOWS_DOWNLOAD_URL as string) || '';

export const WEB_APP_URL: string =
  (import.meta.env.VITE_WEB_APP_URL as string) || '/?view=app';

/**
 * Validates whether a download URL is a valid external hosted link (HTTP/HTTPS)
 * and not an unhosted internal placeholder endpoint like /api/download/* or /downloads/*.
 */
export function isValidDownloadUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  // Disallow internal routes that don't host compiled binaries
  if (
    trimmed.startsWith('/api/download') ||
    trimmed.startsWith('/downloads') ||
    trimmed.startsWith('/apk') ||
    trimmed.startsWith('/windows') ||
    trimmed.startsWith('/android')
  ) {
    return false;
  }
  // Must be an actual HTTP or HTTPS protocol URL
  return trimmed.startsWith('https://') || trimmed.startsWith('http://');
}

export const DEFAULT_DOWNLOAD_CONFIG: DownloadAppConfig = {
  androidApk: {
    url: isValidDownloadUrl(ANDROID_DOWNLOAD_URL) ? ANDROID_DOWNLOAD_URL : '',
    isAvailable: isValidDownloadUrl(ANDROID_DOWNLOAD_URL),
    fileName: 'study-buddy-ai.apk',
    version: 'v2.4.0',
    size: '15-30 MB',
    releaseDate: 'September 2026',
    minRequirement: 'Android 8.0+ (Oreo or later)',
  },
  windowsExe: {
    url: isValidDownloadUrl(WINDOWS_DOWNLOAD_URL) ? WINDOWS_DOWNLOAD_URL : '',
    isAvailable: isValidDownloadUrl(WINDOWS_DOWNLOAD_URL),
    fileName: 'study-buddy-ai-setup.exe',
    version: 'v2.4.0',
    size: '60-80 MB',
    releaseDate: 'September 2026',
    minRequirement: 'Windows 10, 11 (64-bit / 32-bit)',
  },
  webAppUrl: WEB_APP_URL,
  supportEmail: 'support@studybuddy.ai',
  documentationUrl: '#faq',
};

const LOCAL_STORAGE_KEY = 'study_buddy_custom_download_config';

/**
 * Loads current download configuration, prioritizing any custom valid URLs set in localStorage
 * or environment variables, and ensuring empty/invalid URLs reflect isAvailable: false.
 */
export function getDownloadConfig(): DownloadAppConfig {
  try {
    const custom = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
    if (custom) {
      const parsed = JSON.parse(custom);
      
      const rawAndroid = parsed.androidApk?.url;
      const validAndroidUrl = isValidDownloadUrl(rawAndroid)
        ? rawAndroid.trim()
        : (isValidDownloadUrl(ANDROID_DOWNLOAD_URL) ? ANDROID_DOWNLOAD_URL : '');
      
      const rawWindows = parsed.windowsExe?.url;
      const validWindowsUrl = isValidDownloadUrl(rawWindows)
        ? rawWindows.trim()
        : (isValidDownloadUrl(WINDOWS_DOWNLOAD_URL) ? WINDOWS_DOWNLOAD_URL : '');

      // Sanitize stored config if it held legacy internal URLs like /api/download/*
      let needsResave = false;
      if (rawAndroid && !isValidDownloadUrl(rawAndroid)) {
        parsed.androidApk.url = '';
        parsed.androidApk.isAvailable = false;
        needsResave = true;
      }
      if (rawWindows && !isValidDownloadUrl(rawWindows)) {
        parsed.windowsExe.url = '';
        parsed.windowsExe.isAvailable = false;
        needsResave = true;
      }
      if (needsResave && typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
      }

      return {
        ...DEFAULT_DOWNLOAD_CONFIG,
        ...parsed,
        androidApk: {
          ...DEFAULT_DOWNLOAD_CONFIG.androidApk,
          ...(parsed.androidApk || {}),
          url: validAndroidUrl,
          isAvailable: Boolean(validAndroidUrl && validAndroidUrl.length > 0),
        },
        windowsExe: {
          ...DEFAULT_DOWNLOAD_CONFIG.windowsExe,
          ...(parsed.windowsExe || {}),
          url: validWindowsUrl,
          isAvailable: Boolean(validWindowsUrl && validWindowsUrl.length > 0),
        },
      };
    }
  } catch (e) {
    console.error('Error loading custom download config:', e);
  }
  return DEFAULT_DOWNLOAD_CONFIG;
}

/**
 * Saves customized download URLs to localStorage
 */
export function saveDownloadConfig(config: Partial<DownloadAppConfig>): void {
  try {
    const current = getDownloadConfig();
    const updated = {
      ...current,
      ...config,
    };
    if (config.androidApk) {
      const isOk = isValidDownloadUrl(config.androidApk.url);
      updated.androidApk.url = isOk ? config.androidApk.url.trim() : '';
      updated.androidApk.isAvailable = isOk;
    }
    if (config.windowsExe) {
      const isOk = isValidDownloadUrl(config.windowsExe.url);
      updated.windowsExe.url = isOk ? config.windowsExe.url.trim() : '';
      updated.windowsExe.isAvailable = isOk;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error('Error saving custom download config:', e);
  }
}
