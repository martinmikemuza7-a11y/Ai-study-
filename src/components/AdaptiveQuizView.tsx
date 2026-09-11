/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Award,
  BookOpen,
  Zap,
} from 'lucide-react';
import {
  AdaptiveDifficulty,
  Course,
  CourseDocument,
  QuizAttemptRecord,
  QuizQuestion,
  VaultState,
} from '../types';
import {
  calculateUpdatedMastery,
  getAdaptiveQuestionsForCourse,
  getNextDifficulty,
} from '../lib/quizEngine';
import { encryptAcademicRecord } from '../lib/crypto';
import { logSecurityEvent, putToStore } from '../lib/db';

interface AdaptiveQuizViewProps {
  currentCourse: Course | null;
  documents?: CourseDocument[];
  vaultState: VaultState;
  cryptoKey: CryptoKey | null;
  vaultSalt: Uint8Array;
  onUpdateCourse: (updatedCourse: Course) => void;
  onPickCourse?: () => void;
  availableCourses?: Course[];
  onSelectCourse?: (course: Course) => void;
}

export const AdaptiveQuizView: React.FC<AdaptiveQuizViewProps> = ({
  currentCourse,
  documents = [],
  vaultState,
  cryptoKey,
  vaultSalt,
  onUpdateCourse,
  onPickCourse,
  availableCourses = [],
  onSelectCourse,
}) => {
  const [difficulty, setDifficulty] = useState<AdaptiveDifficulty>('intermediate');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<boolean[]>([]);
  const [masteryDeltas, setMasteryDeltas] = useState<{ topicName: string; delta: number }[]>([]);

  // Initialize quiz session
  const startNewQuiz = (diff: AdaptiveDifficulty = difficulty) => {
    if (!currentCourse) return;
    const newQuestions = getAdaptiveQuestionsForCourse(currentCourse, diff, 4, documents);
    setQuestions(newQuestions);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setQuizComplete(false);
    setScoreHistory([]);
    setMasteryDeltas([]);
  };

  useEffect(() => {
    if (currentCourse) {
      startNewQuiz(difficulty);
    }
  }, [currentCourse?.id, documents.length]);

  if (!currentCourse) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-5 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center text-indigo-400 mx-auto shadow-inner">
          <BookOpen className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">No Course Selected for Adaptive Quizzing</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1.5">
            Adaptive tests dynamically scale difficulty and update Bayesian topic mastery probabilities based on your course syllabus. Pick a course to begin.
          </p>
        </div>

        {onPickCourse && (
          <button
            onClick={onPickCourse}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-95"
          >
            <BookOpen className="w-4 h-4" />
            Pick or Enroll in a Course
          </button>
        )}

        {availableCourses.length > 0 && (
          <div className="pt-6 border-t border-slate-800 max-w-sm mx-auto text-left">
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Quick Select Enrolled Course:
            </span>
            <div className="space-y-1.5">
              {availableCourses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectCourse && onSelectCourse(c)}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 text-xs text-slate-200 flex items-center justify-between transition group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="font-medium truncate">{c.code}: {c.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 group-hover:text-indigo-300 shrink-0 ml-2">
                    {c.term}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = async () => {
    if (selectedOption === null || isAnswerSubmitted || !currentQuestion) return;

    setIsAnswerSubmitted(true);
    const isCorrect = selectedOption === currentQuestion.correctAnswerIndex;
    const newHistory = [...scoreHistory, isCorrect];
    setScoreHistory(newHistory);

    // Update topic mastery score in current course
    const topic = currentCourse.topics.find((t) => t.id === currentQuestion.topicId);
    if (topic) {
      const oldMastery = topic.masteryPercentage;
      const newMastery = calculateUpdatedMastery(oldMastery, currentQuestion.difficulty, isCorrect);
      const delta = newMastery - oldMastery;

      setMasteryDeltas((prev) => [...prev, { topicName: topic.name, delta }]);

      const updatedTopics = currentCourse.topics.map((t) =>
        t.id === topic.id
          ? {
              ...t,
              masteryPercentage: newMastery,
              questionsAnswered: t.questionsAnswered + 1,
              lastStudiedAt: new Date().toISOString(),
            }
          : t
      );

      const updatedCourse: Course = {
        ...currentCourse,
        topics: updatedTopics,
        updatedAt: new Date().toISOString(),
      };

      await putToStore('courses', updatedCourse);
      onUpdateCourse(updatedCourse);
    }

    // Encrypt quiz attempt into database store (AES-256-GCM)
    if (cryptoKey) {
      try {
        const attemptRecord: QuizAttemptRecord = {
          id: `attempt_${Date.now()}`,
          courseId: currentCourse.id,
          topicId: currentQuestion.topicId,
          questionId: currentQuestion.id,
          questionText: currentQuestion.question,
          selectedOptionIndex: selectedOption,
          correctOptionIndex: currentQuestion.correctAnswerIndex,
          isCorrect,
          timeSpentSeconds: 12,
          difficulty: currentQuestion.difficulty,
          timestamp: new Date().toISOString(),
        };

        const encrypted = await encryptAcademicRecord(
          attemptRecord,
          cryptoKey,
          vaultSalt,
          'quiz_attempt',
          currentCourse.id
        );
        await putToStore('encrypted_records', encrypted);
        await logSecurityEvent(
          'RECORD_ENCRYPTED',
          `Quiz performance record encrypted at rest (Topic: ${currentQuestion.topicName})`,
          'SUCCESS',
          'quiz_attempt'
        );
      } catch (err) {
        console.error('Failed to encrypt quiz attempt:', err);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);

      // Adaptive difficulty progression
      const lastCorrect = scoreHistory[scoreHistory.length - 1];
      const nextDiff = getNextDifficulty(difficulty, lastCorrect);
      setDifficulty(nextDiff);
    } else {
      setQuizComplete(true);
    }
  };

  const difficultyColors = {
    beginner: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    intermediate: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    advanced: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    mastery: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  };

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-6 pb-24">
      {/* Top Banner & Adaptive Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Adaptive Mastery Testing
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time Bayesian mastery adjustments grounded in {currentCourse.code} lecture notes.
          </p>
        </div>

        {/* Difficulty Switcher */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 self-start sm:self-auto text-xs">
          {(['beginner', 'intermediate', 'advanced', 'mastery'] as AdaptiveDifficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => {
                setDifficulty(d);
                startNewQuiz(d);
              }}
              className={`capitalize px-2.5 py-1 rounded-lg transition font-medium text-[11px] ${
                difficulty === d
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {!quizComplete && currentQuestion ? (
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
          {/* Quiz Progress Header */}
          <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between bg-slate-850 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-300">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-slate-500">•</span>
              <span
                className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${
                  difficultyColors[currentQuestion.difficulty]
                }`}
              >
                {currentQuestion.difficulty}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-[11px] font-mono text-indigo-300">
                {currentQuestion.topicName}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-700/50 h-1.5">
            <div
              className="bg-indigo-500 h-1.5 transition-all duration-300"
              style={{
                width: `${((currentIndex + (isAnswerSubmitted ? 1 : 0)) / questions.length) * 100}%`,
              }}
            />
          </div>

          {/* Question Text */}
          <div className="p-5 sm:p-6 space-y-5">
            <h3 className="text-sm sm:text-base font-semibold text-white leading-relaxed">
              {currentQuestion.question}
            </h3>

            {/* Answer Options */}
            <div className="space-y-2.5">
              {currentQuestion.options.map((option, idx) => {
                let optionStyle =
                  'bg-slate-900/80 border-slate-750 text-slate-200 hover:bg-slate-750 hover:border-slate-650';

                if (selectedOption === idx) {
                  optionStyle = 'bg-indigo-950/60 border-indigo-500 text-white ring-1 ring-indigo-500';
                }

                if (isAnswerSubmitted) {
                  if (idx === currentQuestion.correctAnswerIndex) {
                    optionStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-100 ring-1 ring-emerald-500 font-medium';
                  } else if (selectedOption === idx) {
                    optionStyle = 'bg-rose-950/60 border-rose-500 text-rose-100 ring-1 ring-rose-500';
                  } else {
                    optionStyle = 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswerSubmitted}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm transition flex items-start justify-between gap-3 ${optionStyle}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full border border-current/40 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="leading-snug">{option}</span>
                    </div>

                    {isAnswerSubmitted && idx === currentQuestion.correctAnswerIndex && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    {isAnswerSubmitted && selectedOption === idx && idx !== currentQuestion.correctAnswerIndex && (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Grounded Explanation Block (Shows after submit) */}
            {isAnswerSubmitted && (
              <div
                className={`p-4 rounded-xl border space-y-2.5 transition text-xs sm:text-sm animate-fadeIn ${
                  selectedOption === currentQuestion.correctAnswerIndex
                    ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-100'
                    : 'bg-rose-950/30 border-rose-800/40 text-rose-100'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5">
                    {selectedOption === currentQuestion.correctAnswerIndex ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Correct!
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-400" /> Incorrect
                      </>
                    )}
                  </span>

                  {/* Grounded Badge */}
                  {currentQuestion.citedDocumentTitle && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      {currentQuestion.citedDocumentTitle}
                    </span>
                  )}
                </div>

                <p className="text-slate-300 leading-relaxed text-xs">
                  {currentQuestion.explanation}
                </p>

                {currentQuestion.citedPassageExcerpt && (
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-750 text-xs text-indigo-200 font-serif">
                    <span className="font-sans font-semibold text-[10px] uppercase text-indigo-400 block mb-1">
                      Source Excerpt:
                    </span>
                    "{currentQuestion.citedPassageExcerpt}"
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-750">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encrypted AES-256-GCM record</span>
              </div>

              {!isAnswerSubmitted ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={selectedOption === null}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-md shadow-indigo-600/20 active:scale-95"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-md shadow-indigo-600/20 active:scale-95"
                >
                  <span>{currentIndex + 1 < questions.length ? 'Next Question' : 'View Results'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Quiz Complete Summary Card */
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-500/20">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white">Quiz Session Completed!</h3>
            <p className="text-xs text-slate-400 mt-1">
              Course: <strong className="text-slate-200">{currentCourse.name}</strong>
            </p>
          </div>

          {/* Score Badge */}
          <div className="inline-flex items-center gap-3 bg-slate-900 px-6 py-3 rounded-2xl border border-slate-700">
            <div>
              <div className="text-2xl font-bold text-indigo-300">
                {scoreHistory.filter(Boolean).length} / {scoreHistory.length}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Correct Answers</div>
            </div>
            <div className="h-8 w-[1px] bg-slate-700" />
            <div>
              <div className="text-2xl font-bold text-emerald-400">
                {Math.round((scoreHistory.filter(Boolean).length / (scoreHistory.length || 1)) * 100)}%
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Accuracy</div>
            </div>
          </div>

          {/* Topic Mastery Deltas */}
          {masteryDeltas.length > 0 && (
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-750 text-left max-w-md mx-auto space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Bayesian Mastery Adjustments
              </h4>
              <div className="space-y-1.5">
                {masteryDeltas.map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 truncate max-w-[200px]">{d.topicName}</span>
                    <span
                      className={`font-mono font-semibold ${
                        d.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {d.delta >= 0 ? `+${d.delta}%` : `${d.delta}%`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-2">
            <button
              onClick={() => startNewQuiz(difficulty)}
              className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-md shadow-indigo-600/20 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Quiz Session</span>
            </button>
            <button
              onClick={() => startNewQuiz('advanced')}
              className="flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-650 text-slate-200 text-xs font-semibold px-5 py-2.5 rounded-xl transition"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Step Up to Advanced</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
