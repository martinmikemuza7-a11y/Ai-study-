/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MessageCircle, Volume2, X, Zap, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

export type CompanionMood = 'idle' | 'happy' | 'celebrating' | 'thinking' | 'encouraging';

interface AnimatedStudyCompanionProps {
  mood: CompanionMood;
  streakCount?: number;
  lastMessage?: string;
  operationalMode: 'offline' | 'online';
}

const STUDY_TIPS = [
  'Active recall with questions strengthens memory retention by over 50%!',
  'Take a 5-minute break every 25 minutes (Pomodoro technique) to stay sharp.',
  'Reviewing the source excerpt cements true conceptual understanding.',
  'Try explaining this concept out loud in your own simple words.',
  'Offline mode operates 100% on your device with zero data leaving your browser.',
];

export const AnimatedStudyCompanion: React.FC<AnimatedStudyCompanionProps> = ({
  mood,
  streakCount = 0,
  lastMessage,
  operationalMode,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [isWinking, setIsWinking] = useState(false);

  // Trigger celebration confetti when mood becomes 'celebrating'
  useEffect(() => {
    if (mood === 'celebrating') {
      try {
        confetti({
          particleCount: 55,
          spread: 60,
          origin: { y: 0.82, x: 0.9 },
          colors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'],
          ticks: 180,
          gravity: 0.9,
          scalar: 0.85,
        });
      } catch {
        // Fallback gracefully
      }
      setSpeechBubble('🎉 Brilliant answer! Keep the momentum!');
      const timer = setTimeout(() => setSpeechBubble(null), 4000);
      return () => clearTimeout(timer);
    } else if (mood === 'thinking') {
      setSpeechBubble('🔍 Analyzing documents on-device...');
      const timer = setTimeout(() => setSpeechBubble(null), 3000);
      return () => clearTimeout(timer);
    } else if (mood === 'encouraging') {
      setSpeechBubble('💪 Good attempt! Read the cited quote to nail it next time!');
      const timer = setTimeout(() => setSpeechBubble(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [mood]);

  // Periodic random wink
  useEffect(() => {
    const interval = setInterval(() => {
      setIsWinking(true);
      setTimeout(() => setIsWinking(false), 240);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClickCompanion = () => {
    const randomTip = STUDY_TIPS[Math.floor(Math.random() * STUDY_TIPS.length)];
    setSpeechBubble(randomTip);
    setIsWinking(true);
    setTimeout(() => setIsWinking(false), 300);
  };

  if (isMinimized) {
    return (
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 p-2.5 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white shadow-xl hover:scale-105 transition cursor-pointer flex items-center gap-1.5 border-2 border-white/50 shadow-indigo-500/30"
        title="Open 2D Study Companion"
      >
        <span className="text-base">✨</span>
        <span className="text-xs font-bold pr-1">Lumi</span>
      </motion.button>
    );
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end pointer-events-none">
      {/* Speech Bubble */}
      <AnimatePresence>
        {speechBubble && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9 }}
            className="mb-2 max-w-xs p-3 rounded-2xl bg-white dark:bg-slate-850 border border-indigo-200 dark:border-indigo-800/80 shadow-xl text-slate-800 dark:text-slate-100 text-xs font-medium relative pointer-events-auto"
          >
            <button
              onClick={() => setSpeechBubble(null)}
              className="absolute top-1.5 right-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3 h-3" />
            </button>
            <p className="pr-3 leading-snug">{speechBubble}</p>
            {/* Speech bubble tail pointer */}
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white dark:bg-slate-850 border-r border-b border-indigo-200 dark:border-indigo-800/80 transform rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2D Animated Character Container */}
      <motion.div
        onClick={handleClickCompanion}
        className="relative group cursor-pointer pointer-events-auto select-none"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Ambient 2D Glow Ring */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.35, 0.65, 0.35],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: 'easeInOut',
          }}
          className="absolute -inset-2 rounded-full bg-gradient-to-tr from-indigo-500/30 via-purple-500/30 to-pink-500/30 blur-md pointer-events-none"
        />

        {/* Orbiting 2D Star/Sparks when thinking or celebrating */}
        {(mood === 'thinking' || mood === 'celebrating') && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
            className="absolute -inset-3 pointer-events-none"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-300 shadow-sm shadow-yellow-400/80 absolute top-0 left-1/2 -translate-x-1/2" />
            <div className="w-2 h-2 rounded-full bg-pink-400 shadow-sm shadow-pink-400/80 absolute bottom-0 right-2" />
          </motion.div>
        )}

        {/* 2D Vector Character Body (SVG) */}
        <motion.div
          animate={{
            y: mood === 'celebrating' ? [0, -14, 0] : [0, -5, 0],
            rotate: mood === 'celebrating' ? [0, -6, 6, 0] : [0, 1.5, -1.5, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: mood === 'celebrating' ? 0.7 : 2.6,
            ease: 'easeInOut',
          }}
          className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-b from-indigo-500 via-purple-600 to-indigo-700 shadow-xl border-2 border-white/50 dark:border-white/30 p-1 flex items-center justify-center"
        >
          {/* SVG 2D Face Features */}
          <svg viewBox="0 0 64 64" className="w-full h-full">
            {/* Blushing cheeks */}
            <circle cx="16" cy="38" r="4.5" fill="#f472b6" opacity="0.65" />
            <circle cx="48" cy="38" r="4.5" fill="#f472b6" opacity="0.65" />

            {/* Left Eye */}
            {isWinking ? (
              <path
                d="M 17 30 Q 23 26 25 30"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            ) : mood === 'celebrating' ? (
              <path
                d="M 18 31 Q 23 23 26 31"
                stroke="#ffffff"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              <circle cx="22" cy="28" r="3.8" fill="#ffffff">
                <animate
                  attributeName="cy"
                  values="28;29;28"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
            )}

            {/* Right Eye */}
            {mood === 'celebrating' ? (
              <path
                d="M 38 31 Q 43 23 46 31"
                stroke="#ffffff"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              <circle cx="42" cy="28" r="3.8" fill="#ffffff">
                <animate
                  attributeName="cy"
                  values="28;29;28"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
            )}

            {/* Eye sparkle highlights */}
            {!isWinking && mood !== 'celebrating' && (
              <>
                <circle cx="23.5" cy="26.5" r="1.3" fill="#ffffff" opacity="0.9" />
                <circle cx="43.5" cy="26.5" r="1.3" fill="#ffffff" opacity="0.9" />
              </>
            )}

            {/* Mouth */}
            {mood === 'celebrating' ? (
              <path
                d="M 26 38 Q 32 47 38 38 Z"
                fill="#fde047"
                stroke="#ffffff"
                strokeWidth="1.2"
              />
            ) : mood === 'thinking' ? (
              <ellipse cx="32" cy="40" rx="3" ry="2.2" fill="#ffffff" />
            ) : (
              <path
                d="M 27 38 Q 32 44 37 38"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />
            )}

            {/* Little 2D Antennas / Leaf sprout */}
            <path
              d="M 32 10 Q 35 2 41 4 Q 37 8 32 11"
              fill="#4ade80"
              stroke="#22c55e"
              strokeWidth="0.8"
            />
          </svg>

          {/* Badge: Streak or Mode */}
          {streakCount > 1 && (
            <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-red-500 text-white text-[9px] font-black shadow-md flex items-center gap-0.5 border border-white">
              <span>🔥</span>
              <span>{streakCount}</span>
            </div>
          )}

          {/* Minimize button on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-slate-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm"
            title="Minimize"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};
