/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  BookOpen,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  Award,
  HelpCircle,
  FileQuestion,
  ToggleLeft,
  AlignLeft,
  FileText,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  Course,
  CourseDocument,
  StudyCalendarEvent,
  StudyMethod,
  StudyQuestionItem,
  AdaptiveDifficulty,
} from '../types';
import { generateStudyQuestions } from '../lib/studyEngine';
import {
  getCalendarEvents,
  saveCalendarEvent,
  deleteCalendarEvent,
  markEventCompleted,
} from '../lib/calendarStorage';
import { TROPHY_BADGE_IMG, getCourseImage } from '../lib/courseImages';

interface StudyTabViewProps {
  courses: Course[];
  currentCourse: Course | null;
  documents: CourseDocument[];
  initialEvent?: StudyCalendarEvent | null;
  onSelectCourse: (course: Course | null) => void;
  onSaveToVault?: (record: any) => void;
}

export const StudyTabView: React.FC<StudyTabViewProps> = ({
  courses,
  currentCourse,
  documents,
  initialEvent,
  onSelectCourse,
  onSaveToVault,
}) => {
  // Calendar and Schedule State
  const [calendarEvents, setCalendarEvents] = useState<StudyCalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Form state for scheduling
  const [schedCourseId, setSchedCourseId] = useState<string>(
    currentCourse?.id || courses[0]?.id || ''
  );
  const [schedDate, setSchedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [schedTime, setSchedTime] = useState<string>('10:00');
  const [schedMethod, setSchedMethod] = useState<StudyMethod>('multiple_choice');
  const [schedTargetQuestions, setSchedTargetQuestions] = useState<number>(4);

  // Active Studying State
  const [isStudying, setIsStudying] = useState<boolean>(false);
  const [activeSessionEvent, setActiveSessionEvent] = useState<StudyCalendarEvent | null>(null);
  const [activeCourse, setActiveCourse] = useState<Course | null>(currentCourse || courses[0] || null);
  const [activeMethod, setActiveMethod] = useState<StudyMethod>('multiple_choice');
  const [questions, setQuestions] = useState<StudyQuestionItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // Current Question User Interaction State
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [userTextAnswer, setUserTextAnswer] = useState<string>('');
  const [showTextExplanation, setShowTextExplanation] = useState<boolean>(false);
  const [userScores, setUserScores] = useState<boolean[]>([]);
  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);

  // Load calendar events
  useEffect(() => {
    const loaded = getCalendarEvents();
    setCalendarEvents(loaded);
  }, []);

  // Update schedCourseId when currentCourse changes
  useEffect(() => {
    if (currentCourse) {
      setSchedCourseId(currentCourse.id);
      if (!isStudying) {
        setActiveCourse(currentCourse);
      }
    }
  }, [currentCourse, isStudying]);

  // If passed an initialEvent (e.g. from Home tab click), launch study right away
  useEffect(() => {
    if (initialEvent) {
      const matchedCourse = courses.find((c) => c.id === initialEvent.courseId);
      if (matchedCourse) {
        startStudySession(matchedCourse, initialEvent.studyMethod, initialEvent);
      }
    }
  }, [initialEvent]);

  // Start study session
  const startStudySession = (
    course: Course,
    method: StudyMethod,
    event?: StudyCalendarEvent | null
  ) => {
    setActiveCourse(course);
    setActiveMethod(method);
    setActiveSessionEvent(event || null);

    // Generate questions where AI gets questions and answers first!
    const targetCount = event ? event.targetQuestions : 4;
    const generated = generateStudyQuestions(course, method, documents, targetCount);

    setQuestions(generated);
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setHasAnswered(false);
    setUserTextAnswer('');
    setShowTextExplanation(false);
    setUserScores([]);
    setIsSessionComplete(false);
    setSessionStartTime(Date.now());
    setIsStudying(true);
  };

  // Handle user selecting an option in multiple choice or true/false
  const handleSelectOption = (idx: number) => {
    if (hasAnswered) return;

    setSelectedOptionIndex(idx);
    setHasAnswered(true);

    const currentQ = questions[currentQuestionIndex];
    const isCorrect = idx === currentQ.correctOptionIndex;
    setUserScores((prev) => [...prev, isCorrect]);
  };

  // Handle text submission for short answer or explain
  const handleSubmitTextAnswer = () => {
    if (!userTextAnswer.trim()) return;
    setHasAnswered(true);
    setShowTextExplanation(true);
    // User answered thoughtfully; count as successful engagement
    setUserScores((prev) => [...prev, true]);
  };

  // Proceed to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
      setHasAnswered(false);
      setUserTextAnswer('');
      setShowTextExplanation(false);
    } else {
      // Finished all questions!
      setIsSessionComplete(true);
      if (activeSessionEvent) {
        const correctCount = userScores.filter(Boolean).length;
        const total = questions.length || 1;
        const finalScore = Math.round((correctCount / total) * 100);
        const updated = markEventCompleted(activeSessionEvent.id, finalScore);
        setCalendarEvents(updated);
      }
    }
  };

  // Scheduling a new study event
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const course = courses.find((c) => c.id === schedCourseId);
    if (!course) return;

    const newEvt: StudyCalendarEvent = {
      id: `evt_${Date.now()}`,
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      courseColor: course.color,
      date: schedDate,
      time: schedTime,
      studyMethod: schedMethod,
      targetQuestions: schedTargetQuestions,
      completed: false,
    };

    const updated = saveCalendarEvent(newEvt);
    setCalendarEvents(updated);
    setShowScheduleModal(false);
    setSelectedDate(schedDate);
  };

  const handleDeleteSchedule = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteCalendarEvent(id);
    setCalendarEvents(updated);
  };

  // Calendar dates helper
  const getDaysInMonth = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push(dateStr);
    }
    return days;
  };

  const daysGrid = getDaysInMonth();
  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const eventsOnSelectedDate = calendarEvents.filter((e) => e.date === selectedDate);

  const getMethodBadge = (m: StudyMethod) => {
    switch (m) {
      case 'multiple_choice':
        return { label: 'Multiple Choice (Q&A)', icon: <FileQuestion className="w-3.5 h-3.5" /> };
      case 'short_answer':
        return { label: 'Short Answer', icon: <AlignLeft className="w-3.5 h-3.5" /> };
      case 'true_false':
        return { label: 'True / False', icon: <ToggleLeft className="w-3.5 h-3.5" /> };
      case 'explain':
        return { label: 'Explain Questions', icon: <HelpCircle className="w-3.5 h-3.5" /> };
    }
  };

  // --------------------------------------------------------------------------
  // ACTIVE STUDY SESSION VIEW
  // --------------------------------------------------------------------------
  if (isStudying && activeCourse && questions.length > 0) {
    const currentQ = questions[currentQuestionIndex];
    const totalQ = questions.length;
    const progressPercent = ((currentQuestionIndex + 1) / totalQ) * 100;

    // If session is complete, display result summary
    if (isSessionComplete) {
      const correctCount = userScores.filter(Boolean).length;
      const scorePercentage = Math.round((correctCount / totalQ) * 100);

      const isGreatScore = scorePercentage >= 75;

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto px-4 py-8 pb-28 space-y-6 text-slate-900 dark:text-white"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-xl transition-colors relative overflow-hidden">
            {/* Top gradient hairline */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500" />

            <div className="relative mx-auto w-24 h-24 rounded-3xl overflow-hidden shadow-2xl p-1 border-2 border-amber-400/40 bg-gradient-to-tr from-amber-500/20 via-purple-500/20 to-cyan-500/20 group">
              <img
                src={TROPHY_BADGE_IMG}
                alt="Study Trophy Badge"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                🎉 Study Session Complete
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold">
                {activeCourse.code}: {activeCourse.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {getMethodBadge(activeMethod).label} • {totalQ} Questions Practiced
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
              <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Score</span>
                <span
                  className="text-2xl font-black font-mono"
                  style={{ color: isGreatScore ? '#10b981' : '#6366f1' }}
                >
                  {scorePercentage}%
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Correct</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {correctCount}/{totalQ}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Status</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 mt-1">
                  <Check className="w-4 h-4" /> {isGreatScore ? 'Mastered' : 'Reviewed'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  startStudySession(activeCourse, activeMethod, activeSessionEvent);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 px-5 py-2.5 rounded-2xl font-semibold text-xs border border-slate-300 dark:border-slate-700 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Practice Again</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsStudying(false);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-2.5 rounded-2xl font-semibold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Back to Study Calendar</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto px-4 py-6 pb-28 space-y-6">
        {/* Top Navigation & Session Progress Bar */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setIsStudying(false)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Exit Session</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shadow-xs">
              <img
                src={getCourseImage(activeCourse)}
                alt={activeCourse.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800/40">
              {activeCourse.code}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Question {currentQuestionIndex + 1} of {totalQ}
            </span>
          </div>
        </div>

        {/* Progress bar with smooth animation */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
          />
        </div>

        {/* Question Card with interactive animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 transition-colors relative overflow-hidden"
          >
            {/* Top ambient color stripe matching course */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: activeCourse.color || '#6366f1' }}
            />

            {/* Topic & Method Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 flex items-center gap-1.5 shadow-xs">
                  {getMethodBadge(currentQ.method).icon}
                  {getMethodBadge(currentQ.method).label}
                </span>
                {currentQ.topicName && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                    Topic: {currentQ.topicName}
                  </span>
                )}
              </div>

              {currentQ.sourceTitle && (
                <span className="text-[10px] text-slate-400 font-mono">
                  Ref: {currentQ.sourceTitle}
                </span>
              )}
            </div>

            {/* Question Text */}
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {currentQ.question}
            </h2>

            {/* ------------------------------------------------------------- */}
            {/* METHOD 1: MULTIPLE CHOICE OR TRUE / FALSE */}
            {/* ------------------------------------------------------------- */}
            {(currentQ.method === 'multiple_choice' || currentQ.method === 'true_false') && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Select your answer below:
                </p>

                <div className="space-y-2.5">
                  {currentQ.options?.map((option, idx) => {
                    const isSelected = selectedOptionIndex === idx;
                    const isCorrect = idx === currentQ.correctOptionIndex;

                    const letterColors = [
                      'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-400/30',
                      'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-400/30',
                      'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/30',
                      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/30',
                    ];
                    const badgeColor = letterColors[idx % letterColors.length];

                    let btnStyle =
                      'bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800';

                    if (hasAnswered) {
                      if (isCorrect) {
                        btnStyle =
                          'bg-emerald-500/15 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-100 border-emerald-500 ring-2 ring-emerald-500/40 shadow-sm';
                      } else if (isSelected && !isCorrect) {
                        btnStyle =
                          'bg-rose-500/15 dark:bg-rose-950/70 text-rose-950 dark:text-rose-100 border-rose-500 ring-2 ring-rose-500/40 shadow-sm';
                      } else {
                        btnStyle =
                          'opacity-40 bg-slate-50 dark:bg-slate-850 text-slate-500 border-slate-200 dark:border-slate-800';
                      }
                    }

                    return (
                      <motion.button
                        key={idx}
                        whileHover={!hasAnswered ? { scale: 1.01, x: 3 } : {}}
                        whileTap={!hasAnswered ? { scale: 0.99 } : {}}
                        disabled={hasAnswered}
                        onClick={() => handleSelectOption(idx)}
                        className={`w-full text-left p-4 rounded-2xl border transition flex items-start gap-3 relative cursor-pointer ${btnStyle}`}
                      >
                        <span className={`w-7 h-7 rounded-xl border flex items-center justify-center text-xs font-bold font-mono shrink-0 shadow-xs ${badgeColor}`}>
                          {String.fromCharCode(65 + idx)}
                        </span>

                        <span className="text-xs sm:text-sm font-semibold leading-relaxed flex-1 mt-0.5">
                          {option}
                        </span>

                        {hasAnswered && isCorrect && (
                          <div className="flex items-center gap-1 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400">
                            <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-500/20">
                              +1 Pt
                            </span>
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        )}
                        {hasAnswered && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* METHOD 2: SHORT ANSWER */}
            {/* ------------------------------------------------------------- */}
            {currentQ.method === 'short_answer' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Type your concise response:
                </p>

                <textarea
                  rows={3}
                  disabled={hasAnswered}
                  value={userTextAnswer}
                  onChange={(e) => setUserTextAnswer(e.target.value)}
                  placeholder="Enter your short answer here..."
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                />

                {!hasAnswered && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmitTextAnswer}
                    disabled={!userTextAnswer.trim()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition"
                  >
                    Submit Answer for AI Comparison
                  </motion.button>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* METHOD 3: EXPLAIN QUESTIONS */}
            {/* ------------------------------------------------------------- */}
            {currentQ.method === 'explain' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Synthesize and explain the core mechanism:
                </p>

                <textarea
                  rows={4}
                  disabled={hasAnswered}
                  value={userTextAnswer}
                  onChange={(e) => setUserTextAnswer(e.target.value)}
                  placeholder="Explain why and how this phenomenon occurs in detail..."
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                />

                {!hasAnswered && (
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmitTextAnswer}
                      disabled={!userTextAnswer.trim()}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition"
                    >
                      Submit Explanation
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserTextAnswer('(Reviewed Model Explanation)');
                        setHasAnswered(true);
                        setShowTextExplanation(true);
                        setUserScores((prev) => [...prev, true]);
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition"
                    >
                      Reveal AI Explanation First
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* EXPLANATION BOX: "show the correct answer explaining why it" */}
            {/* ------------------------------------------------------------- */}
            {hasAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-4 sm:p-5 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wide">
                    Correct Answer & Pedagogical Explanation
                  </span>
                </div>

                {/* The Correct Answer (pre-generated by AI first) */}
                <div className="bg-white/90 dark:bg-slate-900/90 border border-indigo-200/60 dark:border-indigo-800/40 rounded-xl p-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                  <span className="text-indigo-600 dark:text-indigo-400 mr-2 font-mono">Answer:</span>
                  {currentQ.correctAnswer}
                </div>

                {/* Explanation of WHY it is correct */}
                <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
                  <p className="font-medium text-slate-900 dark:text-white text-xs">
                    Why this answer is correct:
                  </p>
                  <p>{currentQ.explanation}</p>

                  {/* Key concepts/points breakdown if available */}
                  {currentQ.keyPoints && currentQ.keyPoints.length > 0 && (
                    <div className="pt-2 border-t border-indigo-200/50 dark:border-indigo-800/30">
                      <span className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-300 block mb-1">
                        Core Concepts Required:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {currentQ.keyPoints.map((kp, kIdx) => (
                          <span
                            key={kIdx}
                            className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 font-mono"
                          >
                            ✓ {kp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Next Question Button */}
                <div className="pt-2 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNextQuestion}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition"
                  >
                    <span>
                      {currentQuestionIndex + 1 < totalQ ? 'Next Question' : 'Complete Session'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STUDY CALENDAR & SCHEDULING HUB
  // --------------------------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* 1. Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 transition-colors relative overflow-hidden"
      >
        {/* Top radiant line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-pink-500" />

        {/* Ambient background glow */}
        <div className="absolute -top-16 -right-16 w-52 h-52 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1.5 max-w-2xl relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Study Calendar & Schedule
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Active Study & Scheduled Questions
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Set dates and times for your study sessions. The AI will send questions for your chosen courses using multiple choice, short answer, true/false, or conceptual explanation methods.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 relative z-10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-2xl shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Study Session</span>
          </motion.button>
        </div>
      </motion.div>

      {/* 2. Calendar Grid + Day Details 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Month Calendar (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {currentMonthName}
              </h2>
            </div>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/40 transition cursor-pointer"
            >
              Today
            </button>
          </div>

          {/* Weekday Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {daysGrid.map((dateStr, idx) => {
              if (!dateStr) {
                return <div key={`empty_${idx}`} className="h-11 sm:h-14 rounded-2xl" />;
              }

              const dayNum = parseInt(dateStr.split('-')[2], 10);
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const dayEvents = calendarEvents.filter((e) => e.date === dateStr);
              const hasEvents = dayEvents.length > 0;

              return (
                <motion.button
                  key={dateStr}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-11 sm:h-14 rounded-2xl flex flex-col items-center justify-center p-1 relative border transition cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white border-transparent shadow-md shadow-indigo-600/35'
                      : isToday
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-400 dark:border-indigo-500 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span
                    className={`text-xs sm:text-sm font-semibold ${
                      isSelected ? 'text-white font-bold' : ''
                    }`}
                  >
                    {dayNum}
                  </span>

                  {/* Dot indicator for scheduled sessions */}
                  {hasEvents && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 3).map((e) => (
                        <span
                          key={e.id}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: isSelected ? '#ffffff' : e.courseColor || '#6366f1',
                            boxShadow: isSelected
                              ? 'none'
                              : `0 0 5px ${e.courseColor || '#6366f1'}80`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Sessions Scheduled for Selected Date (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold block">
                  Selected Date
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>
              </div>

              <button
                onClick={() => {
                  setSchedDate(selectedDate);
                  setShowScheduleModal(true);
                }}
                className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 text-xs font-semibold flex items-center gap-1 hover:bg-indigo-100 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Time</span>
              </button>
            </div>

            {/* Sessions List */}
            <div className="mt-4 space-y-3">
              {eventsOnSelectedDate.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="text-xs">No study sessions scheduled for this date.</p>
                  <button
                    onClick={() => {
                      setSchedDate(selectedDate);
                      setShowScheduleModal(true);
                    }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold underline cursor-pointer"
                  >
                    Schedule study questions now
                  </button>
                </div>
              ) : (
                eventsOnSelectedDate.map((evt) => {
                  const evtCourse = courses.find((c) => c.id === evt.courseId);
                  const methodBadge = getMethodBadge(evt.studyMethod);

                  return (
                    <div
                      key={evt.id}
                      className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 relative shadow-sm"
                      style={{
                        borderLeftColor: evt.courseColor || '#6366f1',
                        borderLeftWidth: '4px',
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          {evtCourse && (
                            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs">
                              <img
                                src={getCourseImage(evtCourse)}
                                alt={evt.courseName}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: evt.courseColor }}
                              />
                              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                {evt.courseCode}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-indigo-500" />
                                {evt.time}
                              </span>
                            </div>
                            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                              {evt.courseName}
                            </h4>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDeleteSchedule(evt.id, e)}
                          className="text-slate-400 hover:text-rose-500 transition p-1 cursor-pointer"
                          title="Delete scheduled session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                          {methodBadge.icon}
                          {methodBadge.label} ({evt.targetQuestions} Qs)
                        </span>

                        {evt.completed ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Completed ({evt.score}%)
                          </span>
                        ) : (
                          <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={() => {
                              if (evtCourse) {
                                startStudySession(evtCourse, evt.studyMethod, evt);
                              }
                            }}
                            className="py-1 px-3 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition cursor-pointer"
                            style={{
                              background: `linear-gradient(135deg, ${evt.courseColor || '#6366f1'}, #6366f1)`,
                            }}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Start Questions Now</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Instant Launcher */}
          {courses.length > 0 && (
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 rounded-2xl p-3 text-center space-y-2">
              <span className="text-[11px] text-indigo-900 dark:text-indigo-200 font-semibold flex items-center justify-center gap-1">
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                Want to study right away?
              </span>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {courses.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => startStudySession(c, 'multiple_choice')}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border text-[11px] font-mono transition cursor-pointer hover:shadow-xs"
                    style={{ borderColor: `${c.color}40`, color: c.color }}
                  >
                    Quick {c.code}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Schedule Study Session Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 my-auto space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold">Schedule Study Questions</h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-3.5 text-xs">
              {/* Pick Course */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  1. Pick Course to Study *
                </label>
                <select
                  value={schedCourseId}
                  onChange={(e) => setSchedCourseId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pick Date & Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    2. Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    3. Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={schedTime}
                    onChange={(e) => setSchedTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Pick Study Method */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  4. Pick Study Method *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'multiple_choice', label: 'Multiple Choice (Q&A)' },
                    { id: 'short_answer', label: 'Short Answer' },
                    { id: 'true_false', label: 'True / False' },
                    { id: 'explain', label: 'Explain Questions' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSchedMethod(m.id as StudyMethod)}
                      className={`p-2.5 rounded-xl border text-left transition text-xs flex flex-col justify-between ${
                        schedMethod === m.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-semibold ring-1 ring-indigo-500'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Questions */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  5. Number of Questions
                </label>
                <div className="flex items-center gap-2">
                  {[3, 4, 5, 8].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSchedTargetQuestions(n)}
                      className={`flex-1 py-1.5 rounded-xl border text-center font-mono text-xs transition ${
                        schedTargetQuestions === n
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {n} Qs
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md"
                >
                  Add to Calendar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
