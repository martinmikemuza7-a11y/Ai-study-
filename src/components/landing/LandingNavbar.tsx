import React, { useState } from 'react';
import { ShieldCheck, Download, Sparkles, Sun, Moon, Menu, X, ArrowRight, Smartphone, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface LandingNavbarProps {
  onLaunchWebApp: () => void;
  onScrollToSection: (sectionId: string) => void;
  onOpenConfigModal: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onLaunchWebApp,
  onScrollToSection,
  onOpenConfigModal,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    onScrollToSection(sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      {/* Top Colorful Accent Line */}
      <div className="h-1 w-full bg-gradient-to-r from-violet-600 via-indigo-500 via-cyan-400 via-emerald-400 to-amber-400 animate-gradient" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0 transition-transform hover:scale-105">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                AI Study
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25">
                v2.4
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block font-medium">
              Encrypted Offline AI Learning
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <button
            onClick={() => handleNavClick('features')}
            className="px-3 py-2 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => handleNavClick('demo')}
            className="px-3 py-2 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer"
          >
            App Demo
          </button>
          <button
            onClick={() => handleNavClick('downloads')}
            className="px-3 py-2 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-indigo-500" />
            <span>Download Apps</span>
          </button>
          <button
            onClick={() => handleNavClick('faq')}
            className="px-3 py-2 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer"
          >
            FAQ
          </button>
        </nav>

        {/* Desktop Actions */}
        <div className="flex items-center gap-2">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-slate-900/80 transition active:scale-95 cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 drop-shadow-[0_0_8px_rgba(79,70,229,0.4)]" />
            )}
          </button>

          {/* Quick Download Anchor CTA */}
          <button
            onClick={() => handleNavClick('downloads')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-900 transition active:scale-95 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-indigo-500" />
            <span>Download</span>
          </button>

          {/* Main "Open Web App" Button */}
          <button
            onClick={onLaunchWebApp}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-md shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
            id="nav-btn-open-web-app"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Open Web App</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Open navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-3 animate-fadeIn">
          <div className="flex flex-col space-y-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <button
              onClick={() => handleNavClick('features')}
              className="px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 text-left transition"
            >
              Key Features & Benefits
            </button>
            <button
              onClick={() => handleNavClick('demo')}
              className="px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 text-left transition"
            >
              App Screenshots & Interactive Demo
            </button>
            <button
              onClick={() => handleNavClick('downloads')}
              className="px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 text-left transition flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-500" />
                Download App (Android & Windows)
              </span>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md border border-emerald-500/30">
                Direct
              </span>
            </button>
            <button
              onClick={() => handleNavClick('faq')}
              className="px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 text-left transition"
            >
              Frequently Asked Questions (FAQ)
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLaunchWebApp();
              }}
              className="w-full py-3 px-4 rounded-xl text-center text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Launch Web App Directly</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenConfigModal();
              }}
              className="text-center text-[11px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 py-1"
            >
              Configure Download URLs
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
