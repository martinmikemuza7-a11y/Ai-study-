import React from 'react';
import { ShieldCheck, Download, Sparkles, Heart, ArrowUp, Mail, ExternalLink, Lock } from 'lucide-react';

interface FooterProps {
  onOpenLegal: (type: 'privacy' | 'terms' | 'contact') => void;
  onLaunchWebApp: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenLegal,
  onLaunchWebApp,
  onScrollToSection,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-300 relative overflow-hidden">
      {/* Top Accent Gradient Line */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Col 1 & 2: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-lg text-white tracking-tight">AI Study</span>
                <span className="text-[10px] font-mono ml-2 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v2.4.0
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              The private, offline-first study companion. Convert course textbooks, syllabi, and notes into active recall practice questions with zero cloud leaks and client-side AES-256 encryption.
            </p>

            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>100% Client-Side Privacy Guaranteed</span>
            </div>
          </div>

          {/* Col 3: Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Platform</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onScrollToSection('features')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Key Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollToSection('demo')}
                  className="hover:text-white transition cursor-pointer"
                >
                  App Screenshots & Demo
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollToSection('downloads')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Download Native Apps
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollToSection('faq')}
                  className="hover:text-white transition cursor-pointer"
                >
                  FAQ & Installation
                </button>
              </li>
              <li>
                <button
                  onClick={onLaunchWebApp}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Launch Web App</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Downloads */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Direct Downloads</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onScrollToSection('downloads')}
                  className="hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>📱 Android APK (v2.4.0)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollToSection('downloads')}
                  className="hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>💻 Windows EXE (v2.4.0)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onLaunchWebApp}
                  className="hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🌐 Progressive Web App (PWA)</span>
                </button>
              </li>
              <li>
                <span className="text-[11px] text-slate-500 block pt-1">
                  SHA-256 checksums verified
                </span>
              </li>
            </ul>
          </div>

          {/* Col 5: Legal & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Trust & Support</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal('privacy')}
                  className="hover:text-white transition cursor-pointer flex items-center gap-1"
                >
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal('terms')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal('contact')}
                  className="hover:text-white transition cursor-pointer flex items-center gap-1"
                >
                  <Mail className="w-3 h-3 text-indigo-400" />
                  <span>Contact Support</span>
                </button>
              </li>
              <li>
                <span className="text-[11px] text-slate-500 block pt-1">
                  Security Audited: 2026
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AI Study Platform. Built for academic excellence & private learning.</p>

          <div className="flex items-center gap-6">
            <button
              onClick={() => onOpenLegal('privacy')}
              className="hover:text-slate-300 transition cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onOpenLegal('terms')}
              className="hover:text-slate-300 transition cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              onClick={() => onOpenLegal('contact')}
              className="hover:text-slate-300 transition cursor-pointer"
            >
              Contact
            </button>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer ml-2"
              title="Scroll to top"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
