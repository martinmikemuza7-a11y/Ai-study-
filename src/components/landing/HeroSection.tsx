import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, WifiOff, Download, Smartphone, Monitor, CheckCircle2, FileText, Zap } from 'lucide-react';
import heroShowcaseImg from '../../assets/images/hero_app_showcase_1789027952814.jpg';
import { DownloadAppConfig } from '../../config/downloadConfig';

interface HeroSectionProps {
  onLaunchWebApp: () => void;
  onScrollToDownloads: () => void;
  config?: DownloadAppConfig;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onLaunchWebApp,
  onScrollToDownloads,
  config,
}) => {
  const androidUrl =
    config?.androidApk?.url && config.androidApk.url.trim().length > 0
      ? config.androidApk.url.trim()
      : '/downloads/study-buddy-ai.apk';

  const windowsUrl =
    config?.windowsExe?.url && config.windowsExe.url.trim().length > 0
      ? config.windowsExe.url.trim()
      : '/downloads/study-buddy-ai-setup.exe';

  return (
    <section className="relative pt-8 pb-16 sm:pt-16 sm:pb-24 overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-10 left-1/4 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-20 right-1/4 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute top-40 left-1/2 -translate-x-1/2 w-96 h-60 rounded-full bg-cyan-500/15 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 shadow-sm text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300 animate-pulse" />
            <span>AI Study v2.4 Now Available</span>
            <span className="w-1 h-1 rounded-full bg-indigo-400" />
            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
              Android APK & Windows EXE
            </span>
          </div>

          {/* App Name & Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Master Any Subject Faster with{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              Private, Offline-First
            </span>{' '}
            AI Intelligence
          </h1>

          {/* Tagline / Subheading */}
          <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-2xl font-normal leading-relaxed">
            Upload textbooks, lecture slides, or syllabi in seconds. AI Study transforms complex documents into adaptive practice questions, verified answers, and spaced repetition schedules—with military-grade AES-256 client-side encryption.
          </p>

          {/* Call to Action Buttons: Exactly Three Clear Primary Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto pt-2">
            {/* 1. Use Online */}
            <button
              onClick={onLaunchWebApp}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-600/30 transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer group"
              id="hero-btn-use-online"
            >
              <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
              <span>Use Online</span>
              <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* 2. Download Android */}
            <a
              href={androidUrl}
              download="study-buddy-ai.apk"
              target={androidUrl.startsWith('http') ? '_blank' : undefined}
              rel={androidUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/30 transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              id="hero-btn-download-android"
              title="Download Android APK package directly (1.6 MB)"
            >
              <Smartphone className="w-4 h-4" />
              <span>Download Android</span>
              <Download className="w-3.5 h-3.5 opacity-80" />
            </a>

            {/* 3. Download Windows */}
            <a
              href={windowsUrl}
              download="study-buddy-ai-setup.exe"
              target={windowsUrl.startsWith('http') ? '_blank' : undefined}
              rel={windowsUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-sky-600/30 transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              id="hero-btn-download-windows"
              title="Download PC Windows Desktop Installer (.EXE)"
            >
              <Monitor className="w-4 h-4" />
              <span>Download Windows</span>
              <Download className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>

          {/* Sub-note for portable edition & verification hashes */}
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>Also available:</span>
            <a
              href="/downloads/study-buddy-ai-windows.zip"
              download="study-buddy-ai-windows.zip"
              className="underline hover:text-sky-600 dark:hover:text-sky-400"
            >
              Portable Windows (.ZIP)
            </a>
            <span>•</span>
            <button
              type="button"
              onClick={onScrollToDownloads}
              className="underline hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
            >
              View SHA-256 release checksums
            </button>
          </div>

          {/* Trust Highlights Checklist */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>AES-256 On-Device Vault</span>
            </span>
            <span className="flex items-center gap-1.5">
              <WifiOff className="w-4 h-4 text-amber-500 shrink-0" />
              <span>100% Offline Capable</span>
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>PDF, DOCX & Markdown</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-purple-500 shrink-0" />
              <span>Instant AI Questions</span>
            </span>
          </div>
        </div>

        {/* Hero App Showcase Visual Mockup */}
        <div className="mt-12 sm:mt-16 max-w-5xl mx-auto">
          <div className="relative rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-indigo-500/20 via-purple-500/10 to-transparent border border-slate-200/80 dark:border-slate-800/80 shadow-2xl">
            {/* Window header simulation */}
            <div className="bg-slate-900 rounded-t-2xl px-4 py-3 flex items-center justify-between border-b border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-[11px] text-slate-300 hidden sm:inline">
                  ai-study.app — Verified Practice Questions & Study Calendar
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-semibold border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE / OFFLINE HYBRID
                </span>
              </div>
            </div>

            {/* Showcase Image with interactive floating cards */}
            <div className="relative rounded-b-2xl overflow-hidden bg-slate-950 aspect-[16/9] sm:aspect-[16/8]">
              <img
                src={heroShowcaseImg}
                alt="AI Study App Interface Showcase"
                className="w-full h-full object-cover object-top"
                loading="eager"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20 pointer-events-none" />

              {/* Floating interactive badge bottom left */}
              <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md p-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 shadow-xl text-left text-xs">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    ACTIVE QUESTION GENERATOR
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Exam Prep Mode</span>
                </div>
                <p className="font-semibold text-white text-xs sm:text-sm">
                  "Generates Multiple Choice, Short Answer, True/False & Socratic Inquiries directly from your course files."
                </p>
                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-indigo-300">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Verified Citation & Reasoning Included
                  </span>
                  <button
                    onClick={onLaunchWebApp}
                    className="font-bold underline hover:text-white transition cursor-pointer"
                  >
                    Try Live →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
