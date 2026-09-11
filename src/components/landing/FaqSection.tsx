import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck, WifiOff, FileText, Smartphone, Monitor } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Does AI Study work completely without an internet connection?',
      a: 'Yes, 100%. AI Study features an offline-first architecture. Once downloaded or cached in your browser, question synthesis, study calendar scheduling, and AES-256 vault unlocking execute completely on-device without contacting any remote cloud server.',
      category: 'Offline Engine',
    },
    {
      q: 'How does the on-device AES-256 cryptographic vault protect my files?',
      a: 'When you upload documents or lock your vault, content is encrypted using PBKDF2 with 100,000 salt rounds and the military-standard AES-256-GCM cipher via Web Cryptography API. Keys exist strictly in device memory during your active study session and are zeroed immediately upon locking.',
      category: 'Security & Privacy',
    },
    {
      q: 'What document formats are supported for question generation?',
      a: 'AI Study supports PDF documents (.pdf), Markdown notes (.md), plain text files (.txt), Microsoft Word files (.docx), JSON structured syllabi, and direct note pasting. All text extraction happens client-side.',
      category: 'File Support',
    },
    {
      q: 'How do I install the Android APK on my smartphone or tablet?',
      a: 'Click "Download Android APK" on this page to download the .apk file. When downloaded, tap the notification or open your Files app. If prompted by Android, enable "Install unknown apps" for your browser, then tap "Install". The app will appear on your home screen ready to use.',
      category: 'Installation',
    },
    {
      q: 'How do I install and run the Windows desktop application?',
      a: 'Click "Download Windows EXE" to save the installer. Double-click the downloaded setup file to install AI Study to your desktop and Start menu. On first launch, Windows SmartScreen may show an unknown publisher alert—simply click "More info" and then "Run anyway".',
      category: 'Installation',
    },
    {
      q: 'Is Windows 7 supported?',
      a: 'Yes, absolutely! AI Study includes full, dedicated compatibility with Windows 7 Service Pack 1 (SP1) across both 32-bit (x86) and 64-bit (x64) systems. We offer both a dedicated Windows 7 installer and a zero-install Portable ZIP. It works out-of-the-box with Mozilla Firefox 115 ESR, Google Chrome 109, Supermium, Edge, or your default system browser with zero .NET Framework prerequisites.',
      category: 'Windows 7 Support',
    },
    {
      q: 'What types of study questions can AI Study generate?',
      a: 'AI Study provides four core study modalities: Multiple Choice (with plausible distractors), Short Answer (active recall), True/False (with counter-evidence), and Deep Conceptual Explanations. Each answer includes verified reasoning and cited quotes from your original documents.',
      category: 'Study Modalities',
    },
    {
      q: 'Is AI Study free, and are there any recurring subscriptions?',
      a: 'AI Study is 100% free and open for personal educational use. There are no paywalls, subscriptions, or hidden feature gates. You can generate unlimited questions and organize unlimited course folders.',
      category: 'Pricing',
    },
    {
      q: 'Can I replace the download links with my own hosted server files?',
      a: 'Yes! The download buttons use configurable URLs. You can click "Configure Download URLs" right from the download section or landing header to update the target APK and EXE paths with your own hosting URLs (e.g., GitHub Releases, AWS S3, or Firebase).',
      category: 'Configuration',
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-16 sm:py-24 relative border-t border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
            <span>Got Questions? We Have Answers</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
            Learn more about our cryptographic guarantees, offline capabilities, and installation process.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-indigo-500/50 bg-white dark:bg-slate-900 shadow-md ring-1 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                      {faq.category}
                    </span>
                    <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {faq.q}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-indigo-500' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
