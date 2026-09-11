import React, { useState } from 'react';
import {
  Smartphone,
  Monitor,
  Download,
  Settings,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Info,
  Clock,
  Code2,
  Terminal,
  FolderCheck,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  UploadCloud,
  X
} from 'lucide-react';
import { DownloadAppConfig } from '../../config/downloadConfig';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface DownloadSectionProps {
  config: DownloadAppConfig;
  onOpenConfigModal: () => void;
  onLaunchWebApp: () => void;
  initialNoticePlatform?: 'android' | 'windows' | null;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({
  config,
  onOpenConfigModal,
  onLaunchWebApp,
  initialNoticePlatform,
}) => {
  const [infoModalPlatform, setInfoModalPlatform] = useState<'android' | 'windows' | null>(
    initialNoticePlatform || null
  );
  const [noticeBannerDismissed, setNoticeBannerDismissed] = useState(false);
  const { isInstallable, install } = usePWAInstall();

  const handleDownloadClick = (platform: 'android' | 'windows') => {
    const isAvailable =
      platform === 'android' ? config.androidApk.isAvailable : config.windowsExe.isAvailable;
    const url = (platform === 'android' ? config.androidApk.url : config.windowsExe.url) || '';

    if (
      !isAvailable ||
      !url.trim() ||
      url.startsWith('/api/') ||
      url.startsWith('/downloads') ||
      url.startsWith('/apk')
    ) {
      // Platform binary not yet hosted -> open informative build & hosting guide
      setInfoModalPlatform(platform);
      return;
    }

    // Direct download link to real hosted file (Cloud Storage, GitHub Releases, etc.)
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section
      id="downloads"
      className="py-16 sm:py-24 relative border-t border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900/60 dark:to-slate-950"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-96 pointer-events-none -z-10">
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 text-xs font-semibold">
            <Download className="w-3.5 h-3.5 text-indigo-500" />
            <span>Multi-Platform Access & Distribution</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Use on Web, Android, or Windows
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
            Study Buddy AI runs directly in your browser with offline PWA storage, and provides native Capacitor (Android) and Electron (Windows) project configurations.
          </p>
        </div>

        {/* Direct Navigation Notice Banner if redirected from /api/download/* or /apk */}
        {initialNoticePlatform && !noticeBannerDismissed && (
          <div className="mt-8 max-w-3xl mx-auto p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-slate-800 dark:text-slate-200 flex items-start justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-1">
                <p className="font-bold text-amber-900 dark:text-amber-200">
                  {initialNoticePlatform === 'android'
                    ? 'Android APK Binary Status'
                    : 'Windows Installer Status'}
                </p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {initialNoticePlatform === 'android'
                    ? 'The Android package is configured with Capacitor in the /android directory. If you are on an Android device, you can use Study Buddy AI right now in your browser with full offline storage and 1-click PWA home screen installation!'
                    : 'The Windows application is configured with Electron in the /electron directory. You can use Study Buddy AI right now in your browser with full offline storage!'}
                </p>
                <div className="pt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onLaunchWebApp}
                    className="font-bold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-700 cursor-pointer"
                  >
                    Open Web App Now →
                  </button>
                  <button
                    type="button"
                    onClick={() => setInfoModalPlatform(initialNoticePlatform)}
                    className="font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer"
                  >
                    View Build Instructions
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNoticeBannerDismissed(true)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              aria-label="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 3 Main Action Cards: Web App, Android APK, Windows App */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {/* Card 1: Web App (Ready to use right now) */}
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-indigo-500/10 via-white to-white dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 border-2 border-indigo-500/40 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Sparkles className="w-6 h-6 text-amber-300" />
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE NOW
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Study Buddy Web App
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Full interactive experience with AES-256 local encrypted storage, question generation, and study calendar in any browser.
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-b border-slate-100 dark:border-slate-800 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Deployment:</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">Cloud Run Ready</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Offline Storage:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">IndexedDB + AES-256</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Installable:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">PWA 1-Click Install</span>
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-2">
              <button
                type="button"
                onClick={onLaunchWebApp}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                id="btn-launch-web-app"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Open Web App</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {isInstallable && (
                <button
                  type="button"
                  onClick={install}
                  className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install as PWA App</span>
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Android APK */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Smartphone className="w-6 h-6" />
                </div>
                {config.androidApk.isAvailable ? (
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    HOSTED APK
                  </span>
                ) : (
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    BUILD READY
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Android APK
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Native Android package configured with Capacitor in the <code className="font-mono text-emerald-600 dark:text-emerald-400">/android</code> workspace directory.
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-b border-slate-100 dark:border-slate-800 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tooling:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">Capacitor 7.x</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Build Script:</span>
                  <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">npm run build:android</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Output Target:</span>
                  <span className="font-mono text-[11px] text-slate-500 truncate max-w-[140px]">android/.../app-debug.apk</span>
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-2">
              <button
                type="button"
                onClick={() => handleDownloadClick('android')}
                className={`w-full py-3.5 px-5 rounded-2xl font-extrabold text-sm shadow-md transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                  config.androidApk.isAvailable
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                }`}
                id="btn-download-android"
              >
                {config.androidApk.isAvailable ? (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Android APK</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Android APK — Coming Soon</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setInfoModalPlatform('android')}
                className="w-full py-1.5 text-center text-[11px] text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center gap-1 transition"
              >
                <HelpCircle className="w-3 h-3" />
                <span>Build & hosting instructions</span>
              </button>
            </div>
          </div>

          {/* Card 3: Windows App */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-sky-500/50 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/25">
                  <Monitor className="w-6 h-6" />
                </div>
                {config.windowsExe.isAvailable ? (
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                    HOSTED EXE
                  </span>
                ) : (
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    BUILD READY
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Windows App
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Native Windows desktop application configured with Electron and electron-builder in <code className="font-mono text-sky-600 dark:text-sky-400">/electron</code>.
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-b border-slate-100 dark:border-slate-800 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tooling:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">Electron 44 + Builder</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Build Script:</span>
                  <span className="font-mono text-[11px] text-sky-600 dark:text-sky-400 font-bold">npm run build:windows</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Output Target:</span>
                  <span className="font-mono text-[11px] text-slate-500 truncate max-w-[140px]">dist-electron/*.exe</span>
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-2">
              <button
                type="button"
                onClick={() => handleDownloadClick('windows')}
                className={`w-full py-3.5 px-5 rounded-2xl font-extrabold text-sm shadow-md transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                  config.windowsExe.isAvailable
                    ? 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-sky-600/30'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                }`}
                id="btn-download-windows"
              >
                {config.windowsExe.isAvailable ? (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Windows App</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Windows App — Coming Soon</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setInfoModalPlatform('windows')}
                className="w-full py-1.5 text-center text-[11px] text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 flex items-center justify-center gap-1 transition"
              >
                <HelpCircle className="w-3 h-3" />
                <span>Build & hosting instructions</span>
              </button>
            </div>
          </div>
        </div>

        {/* URL Configuration CTA Strip */}
        <div className="mt-8 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <UploadCloud className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>
              Hosting your APK or EXE on Google Cloud Storage or GitHub Releases?{' '}
              <button
                type="button"
                onClick={onOpenConfigModal}
                className="font-bold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-700 cursor-pointer"
              >
                Configure Download URLs
              </button>
            </span>
          </div>

          <button
            type="button"
            onClick={onLaunchWebApp}
            className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Launch Web App in browser →</span>
          </button>
        </div>
      </div>

      {/* Informative Build & Hosting Guide Modal */}
      {infoModalPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 text-slate-900 dark:text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {infoModalPlatform === 'android' ? (
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <Monitor className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold">
                    {infoModalPlatform === 'android'
                      ? 'Android APK Build & Hosting Guide'
                      : 'Windows App Build & Hosting Guide'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Native configuration is ready in this workspace
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInfoModalPlatform(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <p className="text-slate-600 dark:text-slate-300">
                {infoModalPlatform === 'android' ? (
                  <>
                    The native Android project has been generated with <strong>Capacitor</strong> in the{' '}
                    <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">/android</code> directory.
                  </>
                ) : (
                  <>
                    The Windows desktop application has been configured with <strong>Electron</strong> and{' '}
                    <strong>electron-builder</strong> in{' '}
                    <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">/electron</code>.
                  </>
                )}
              </p>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-850 font-mono text-[11px] space-y-1">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Build Command:</p>
                <p className="text-indigo-600 dark:text-indigo-400 font-bold">
                  {infoModalPlatform === 'android'
                    ? 'npm run build:android && cd android && ./gradlew assembleDebug'
                    : 'npm run build:windows'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-850 font-mono text-[11px] space-y-1">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Generated Output Location:</p>
                <p className="text-slate-800 dark:text-slate-200">
                  {infoModalPlatform === 'android'
                    ? 'android/app/build/outputs/apk/debug/app-debug.apk'
                    : 'dist-electron/Study Buddy AI Setup 2.4.0.exe'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>How to Provide the Download Link:</span>
                </p>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-amber-800 dark:text-amber-300">
                  <li>Upload the built file to Google Cloud Storage or GitHub Releases.</li>
                  <li>Copy the public HTTPS download URL.</li>
                  <li>Set it in <code>.env</code> as <code>{infoModalPlatform === 'android' ? 'VITE_ANDROID_DOWNLOAD_URL' : 'VITE_WINDOWS_DOWNLOAD_URL'}</code> or click below.</li>
                </ol>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setInfoModalPlatform(null);
                  onOpenConfigModal();
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
              >
                Configure URL Now
              </button>

              <button
                type="button"
                onClick={() => {
                  setInfoModalPlatform(null);
                  onLaunchWebApp();
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Use Web App Instead
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
