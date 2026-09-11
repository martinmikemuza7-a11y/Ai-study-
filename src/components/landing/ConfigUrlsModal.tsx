import React, { useState } from 'react';
import { DownloadAppConfig, getDownloadConfig, saveDownloadConfig, DEFAULT_DOWNLOAD_CONFIG } from '../../config/downloadConfig';
import { X, Check, RotateCcw, Link2, Smartphone, Monitor } from 'lucide-react';

interface ConfigUrlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (newConfig: DownloadAppConfig) => void;
}

export const ConfigUrlsModal: React.FC<ConfigUrlsModalProps> = ({ isOpen, onClose, onSaved }) => {
  const currentConfig = getDownloadConfig();
  const [apkUrl, setApkUrl] = useState(currentConfig.androidApk.url);
  const [apkVersion, setApkVersion] = useState(currentConfig.androidApk.version);
  const [apkSize, setApkSize] = useState(currentConfig.androidApk.size);

  const [exeUrl, setExeUrl] = useState(currentConfig.windowsExe.url);
  const [exeVersion, setExeVersion] = useState(currentConfig.windowsExe.version);
  const [exeSize, setExeSize] = useState(currentConfig.windowsExe.size);

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanApkUrl = apkUrl.trim();
    const cleanExeUrl = exeUrl.trim();

    const updated: DownloadAppConfig = {
      ...currentConfig,
      androidApk: {
        ...currentConfig.androidApk,
        url: cleanApkUrl,
        isAvailable: Boolean(cleanApkUrl.length > 0),
        version: apkVersion.trim() || currentConfig.androidApk.version,
        size: apkSize.trim() || currentConfig.androidApk.size,
      },
      windowsExe: {
        ...currentConfig.windowsExe,
        url: cleanExeUrl,
        isAvailable: Boolean(cleanExeUrl.length > 0),
        version: exeVersion.trim() || currentConfig.windowsExe.version,
        size: exeSize.trim() || currentConfig.windowsExe.size,
      },
    };

    saveDownloadConfig(updated);
    onSaved(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleReset = () => {
    setApkUrl(DEFAULT_DOWNLOAD_CONFIG.androidApk.url);
    setApkVersion(DEFAULT_DOWNLOAD_CONFIG.androidApk.version);
    setApkSize(DEFAULT_DOWNLOAD_CONFIG.androidApk.size);

    setExeUrl(DEFAULT_DOWNLOAD_CONFIG.windowsExe.url);
    setExeVersion(DEFAULT_DOWNLOAD_CONFIG.windowsExe.version);
    setExeSize(DEFAULT_DOWNLOAD_CONFIG.windowsExe.size);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Configure App Download URLs</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Replace placeholder links with your hosted APK & EXE files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 space-y-5 overflow-y-auto flex-1">
          <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
            <p className="font-semibold">💡 Configurable Storage Notice</p>
            <p className="text-slate-600 dark:text-slate-300">
              You can paste links from GitHub Releases, AWS S3, Google Drive direct download, Firebase Storage, or Cloudflare R2.
              Changes persist in browser local storage and are also editable in <code className="font-mono bg-indigo-100 dark:bg-indigo-900/50 px-1 py-0.5 rounded">src/config/downloadConfig.ts</code>.
            </p>
          </div>

          {/* Android APK Settings */}
          <div className="space-y-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>Android APK Configuration</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Download URL (.apk)
              </label>
              <input
                type="text"
                value={apkUrl}
                onChange={(e) => setApkUrl(e.target.value)}
                placeholder="e.g. https://storage.googleapis.com/my-bucket/app.apk (leave empty for Coming Soon)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={apkVersion}
                  onChange={(e) => setApkVersion(e.target.value)}
                  placeholder="v2.4.0"
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  File Size
                </label>
                <input
                  type="text"
                  value={apkSize}
                  onChange={(e) => setApkSize(e.target.value)}
                  placeholder="28.4 MB"
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Windows EXE Settings */}
          <div className="space-y-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Monitor className="w-4 h-4 text-sky-500" />
              <span>Windows EXE Configuration</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Download URL (.exe installer)
              </label>
              <input
                type="text"
                value={exeUrl}
                onChange={(e) => setExeUrl(e.target.value)}
                placeholder="e.g. https://storage.googleapis.com/my-bucket/setup.exe (leave empty for Coming Soon)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={exeVersion}
                  onChange={(e) => setExeVersion(e.target.value)}
                  placeholder="v2.4.0"
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  File Size
                </label>
                <input
                  type="text"
                  value={exeSize}
                  onChange={(e) => setExeSize(e.target.value)}
                  placeholder="64.8 MB"
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/25 transition flex items-center gap-1.5"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save URLs</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
