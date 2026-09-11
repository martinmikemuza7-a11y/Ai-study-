import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  Smartphone,
  Monitor,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  Lock,
  Layers,
  FileText
} from 'lucide-react';
import heroShowcaseImg from '../../assets/images/hero_app_showcase_1789027952814.jpg';
import mobileShowcaseImg from '../../assets/images/mobile_app_showcase_1789027968794.jpg';

interface AppDemoSectionProps {
  onLaunchWebApp: () => void;
}

export const AppDemoSection: React.FC<AppDemoSectionProps> = ({ onLaunchWebApp }) => {
  const [activeTab, setActiveTab] = useState<'interactive' | 'mobile' | 'desktop' | 'vault'>('interactive');

  // Interactive Demo Question State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  const sampleQuestion = {
    question: 'How does client-side AES-256-GCM encryption guarantee privacy for uploaded academic notes?',
    options: [
      'Notes are transmitted in plaintext to a remote cloud server for analysis.',
      'Cryptographic keys are derived locally using PBKDF2 in device memory with zero plaintext cloud transit.',
      'Files are only password-protected with a simple 4-digit PIN stored in cookies.',
      'Only the title of the document is encrypted while the body text remains public.',
    ],
    correctIndex: 1,
    verifiedAnswer: 'B. Cryptographic keys are derived locally using PBKDF2 in device memory with zero plaintext cloud transit.',
    explanation:
      'With client-side AES-256-GCM, the master encryption key is derived directly on your phone or computer using 100,000 PBKDF2 rounds. Plaintext documents are never stored or transmitted over remote network infrastructure.',
    citedExcerpt:
      'Document Architecture §4.2: "IndexedDB stores ciphertexts generated via SubtleCrypto. All cryptographic operations remain strictly sandboxed within the host device memory."',
  };

  return (
    <section id="demo" className="py-16 sm:py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>Interactive Demo & Screenshots</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            See AI Study in Action
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
            Explore native Android and Windows screenshots or test our active recall practice question engine right here.
          </p>
        </div>

        {/* Demo Mode Tabs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('interactive')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'interactive'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Live Question Demo</span>
          </button>

          <button
            onClick={() => setActiveTab('mobile')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'mobile'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
            <span>Android APK Screenshots</span>
          </button>

          <button
            onClick={() => setActiveTab('desktop')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'desktop'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 text-sky-500" />
            <span>Windows EXE Desktop</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'vault'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-purple-500" />
            <span>Security Vault</span>
          </button>
        </div>

        {/* Tab Content Display Area */}
        <div className="mt-8 max-w-4xl mx-auto">
          {/* 1. Live Interactive Question Demo */}
          {activeTab === 'interactive' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6 animate-fadeIn">
              {/* Question header info */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center">
                    Q1
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    Multiple Choice • Active Recall
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Source: Cryptography_Handbook.pdf</span>
                </div>
              </div>

              {/* Question prompt */}
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {sampleQuestion.question}
              </h3>

              {/* Options list */}
              <div className="space-y-2.5">
                {sampleQuestion.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === sampleQuestion.correctIndex;

                  let optClass = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 text-slate-800 dark:text-slate-200 hover:border-indigo-400';
                  if (isAnswerRevealed) {
                    if (isCorrect) {
                      optClass = 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 font-semibold ring-2 ring-emerald-500/30';
                    } else if (isSelected) {
                      optClass = 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/60 text-rose-900 dark:text-rose-100';
                    }
                  } else if (isSelected) {
                    optClass = 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-semibold ring-2 ring-indigo-500/30';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedOption(idx)}
                      className={`w-full p-3.5 rounded-2xl border text-xs sm:text-sm text-left transition flex items-start gap-3 cursor-pointer ${optClass}`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 pt-0.5">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Reveal and Verify Button */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsAnswerRevealed(!isAnswerRevealed)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
                >
                  {isAnswerRevealed ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>Hide Verified Answer</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>Reveal Verified Answer & Citation</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onLaunchWebApp}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Test in Full Web App</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Answer and Reasoning Card */}
              {isAnswerRevealed && (
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-500/30 space-y-3 text-xs animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px] tracking-wide">
                      VERIFIED CORRECT ANSWER
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {sampleQuestion.verifiedAnswer}
                    </span>
                  </div>

                  <div className="text-slate-700 dark:text-slate-300 leading-relaxed border-l-2 border-emerald-500 pl-3">
                    <strong className="text-slate-900 dark:text-white">Explanation: </strong>
                    {sampleQuestion.explanation}
                  </div>

                  <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-500/20 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold block mb-1">
                      📖 CITED DOCUMENT SOURCE:
                    </span>
                    "{sampleQuestion.citedExcerpt}"
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Mobile Android Screenshot Showcase */}
          {activeTab === 'mobile' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-emerald-500" />
                    Android Mobile-First Interface
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Fast touch interactions, bottom drawer navigation, and zero-latency local question generation.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                  APK Ready
                </span>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-[16/9] bg-slate-950">
                <img
                  src={mobileShowcaseImg}
                  alt="AI Study Android App Screenshot"
                  className="w-full h-full object-cover object-center"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white mb-0.5">Offline Fast Engine</div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Instant flashcard swipes and question generation on airplane mode.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white mb-0.5">Thumb Navigation</div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Bottom navigation optimized for single-handed mobile use.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white mb-0.5">Zero Battery Drain</div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Optimized local compute without background cloud polling.</p>
                </div>
              </div>
            </div>
          )}

          {/* 3. Windows Desktop Showcase */}
          {activeTab === 'desktop' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-sky-500" />
                    Windows 7, 8, 10 & 11 Desktop Experience
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Expanded bento-grid layout, multi-file drag and drop, and side-by-side study calendar timetable.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-bold">
                  EXE Installer
                </span>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-[16/9] bg-slate-950">
                <img
                  src={heroShowcaseImg}
                  alt="AI Study Windows Desktop Interface"
                  className="w-full h-full object-cover object-top"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white mb-0.5">Multi-Window Study</div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Keep study timetable and active questions open simultaneously.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white mb-0.5">Bulk File Ingestion</div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Drag entire folders of PDFs and Word docs directly into the app.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white mb-0.5">Hardware Acceleration</div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Silky 60fps animations and instant local search indexing.</p>
                </div>
              </div>
            </div>
          )}

          {/* 4. Security Vault Showcase */}
          {activeTab === 'vault' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Encrypted Cryptographic Memory Vault
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Zero-knowledge security architecture implemented client-side.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30">
                  AES-256-GCM
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    PBKDF2 Key Derivation
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                    100,000 salt iterations resist brute force attacks. Keys exist only in RAM during your session.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Zero Plaintext Transmission
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                    Your academic papers, notes, and quiz answers are never sent to unencrypted third parties.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={onLaunchWebApp}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <span>Explore Vault in App</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
