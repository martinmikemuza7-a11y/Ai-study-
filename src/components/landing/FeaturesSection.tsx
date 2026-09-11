import React from 'react';
import {
  FileText,
  ShieldCheck,
  WifiOff,
  Calendar,
  CheckCircle2,
  FolderLock,
  Layers,
  Sparkles,
  Zap,
  Lock,
  BrainCircuit,
  Award
} from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <BrainCircuit className="w-6 h-6 text-indigo-500" />,
      title: 'Adaptive Question Synthesis',
      description:
        'Transform dense PDF slides, textbooks, and notes into 4 powerful testing modalities: Multiple Choice, Short Answer, True/False, and In-Depth Conceptual Explanations.',
      badge: 'Active Recall',
      gradient: 'from-indigo-500/10 via-purple-500/10 to-transparent',
      borderColor: 'group-hover:border-indigo-500/50',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />,
      title: 'AES-256 On-Device Cryptographic Vault',
      description:
        'Zero cloud leakage. All uploaded materials and practice tests are protected on-device with PBKDF2 (100k rounds) and AES-256-GCM. Lock your vault anytime.',
      badge: 'Zero Surveillance',
      gradient: 'from-emerald-500/10 via-teal-500/10 to-transparent',
      borderColor: 'group-hover:border-emerald-500/50',
    },
    {
      icon: <WifiOff className="w-6 h-6 text-amber-500" />,
      title: '100% True Offline Functionality',
      description:
        'Study with zero latency anywhere—airplanes, subway commutes, or rural campus libraries. The client-side RAG engine generates questions with no internet required.',
      badge: 'No Internet Needed',
      gradient: 'from-amber-500/10 via-orange-500/10 to-transparent',
      borderColor: 'group-hover:border-amber-500/50',
    },
    {
      icon: <Calendar className="w-6 h-6 text-purple-500" />,
      title: 'Spaced Repetition & Study Calendar',
      description:
        'Schedule daily exam sprints with target question volumes and time slots. Spaced intervals prevent forgetting curves and guarantee long-term retention.',
      badge: 'Retention Engine',
      gradient: 'from-purple-500/10 via-pink-500/10 to-transparent',
      borderColor: 'group-hover:border-purple-500/50',
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-cyan-500" />,
      title: 'Verifiable Explanations with Citations',
      description:
        'Never doubt an answer. Every generated quiz item reveals step-by-step reasoning and quotes exact excerpts from your uploaded document files.',
      badge: 'No Hallucinations',
      gradient: 'from-cyan-500/10 via-blue-500/10 to-transparent',
      borderColor: 'group-hover:border-cyan-500/50',
    },
    {
      icon: <FolderLock className="w-6 h-6 text-rose-500" />,
      title: 'Course Folders with Custom Aesthetics',
      description:
        'Organize files into clean colored folders with custom 2D artwork covers, topic tagging, word count counters, and individual subject progress metrics.',
      badge: 'Visual Organization',
      gradient: 'from-rose-500/10 via-red-500/10 to-transparent',
      borderColor: 'group-hover:border-rose-500/50',
    },
  ];

  const benefits = [
    {
      stat: '4x',
      label: 'Faster Exam Readiness',
      desc: 'Active recall testing beats passive re-reading every single time.',
    },
    {
      stat: '100%',
      label: 'Local Client Privacy',
      desc: 'No corporate servers ever ingest or resell your syllabus materials.',
    },
    {
      stat: '0 ms',
      label: 'Offline Delay',
      desc: 'Immediate question synthesis without waiting for server queue bottlenecks.',
    },
    {
      stat: '4+',
      label: 'Study Formats',
      desc: 'Multiple choice, short answer, true/false, and conceptual depth modes.',
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-24 relative border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-indigo-500" />
            <span>Built for High-Performing Students</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Engineered for Mastery. Designed for Total Privacy.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
            Everything you need to conquer midterms, finals, and professional certifications without ever sacrificing the security of your notes.
          </p>
        </div>

        {/* Benefits Metric Strip */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {benefits.map((b, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-1"
            >
              <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {b.stat}
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {b.label}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {b.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Features 6-Card Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item, idx) => (
            <div
              key={idx}
              className={`group relative p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${item.borderColor} transition-all duration-300 hover:shadow-xl flex flex-col justify-between overflow-hidden`}
            >
              {/* Subtle top ambient glow */}
              <div
                className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${item.gradient} pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`}
              />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-xs">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {item.badge}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="relative z-10 mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                  <Sparkles className="w-3 h-3" />
                  Instant on-device
                </span>
                <span className="font-mono">Ready to study</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
