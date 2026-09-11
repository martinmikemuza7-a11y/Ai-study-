/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Award,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle2,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { Course, EncryptedRecordEnvelope, VaultState } from '../types';
import { getAllFromStore } from '../lib/db';
import { decryptAcademicRecord } from '../lib/crypto';

interface MasteryAnalyticsViewProps {
  currentCourse: Course | null;
  vaultState: VaultState;
  cryptoKey: CryptoKey | null;
  onLaunchTopicQuiz: (topicId: string) => void;
  onOpenVault: () => void;
  onPickCourse?: () => void;
  availableCourses?: Course[];
  onSelectCourse?: (course: Course) => void;
}

export const MasteryAnalyticsView: React.FC<MasteryAnalyticsViewProps> = ({
  currentCourse,
  vaultState,
  cryptoKey,
  onLaunchTopicQuiz,
  onOpenVault,
  onPickCourse,
  availableCourses = [],
  onSelectCourse,
}) => {
  const [gradeRecords, setGradeRecords] = useState<any[]>([]);

  useEffect(() => {
    const fetchEncryptedGrades = async () => {
      if (!cryptoKey || !currentCourse) {
        setGradeRecords([]);
        return;
      }

      try {
        const allEnvelopes = await getAllFromStore<EncryptedRecordEnvelope>('encrypted_records');
        const courseEnvelopes = allEnvelopes.filter(
          (e) => e.courseId === currentCourse.id && e.entityType === 'academic_grade'
        );

        const decryptedList: any[] = [];
        for (const env of courseEnvelopes) {
          try {
            const data = await decryptAcademicRecord<Record<string, any>>(env, cryptoKey);
            decryptedList.push({ id: env.id, ...data });
          } catch (e) {
            console.warn('Could not decrypt record', env.id);
          }
        }
        setGradeRecords(decryptedList);
      } catch (err) {
        console.error('Failed to load grades:', err);
      }
    };

    fetchEncryptedGrades();
  }, [cryptoKey, currentCourse?.id, vaultState.isUnlocked]);

  if (!currentCourse) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-5 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center text-indigo-400 mx-auto shadow-inner">
          <BookOpen className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">No Course Selected for Mastery Analytics</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1.5">
            Knowledge progress, topic decay alerts, and encrypted assessment grades are scoped to individual courses. Pick a course to inspect analytics.
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

  const avgMastery = Math.round(
    currentCourse.topics.reduce((acc, t) => acc + t.masteryPercentage, 0) /
      (currentCourse.topics.length || 1)
  );

  const weakTopics = currentCourse.topics.filter((t) => t.masteryPercentage < 70);
  const masteredTopics = currentCourse.topics.filter((t) => t.masteryPercentage >= 80);

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 pb-24 space-y-6">
      {/* Course Mastery Overview Card */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-xs px-2 py-0.5 rounded font-mono font-semibold"
                style={{ backgroundColor: `${currentCourse.color}20`, color: currentCourse.color }}
              >
                {currentCourse.code}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {currentCourse.name}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Bayesian topic mastery estimated from active recall and Socratic checkpoints.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-900 px-5 py-3 rounded-2xl border border-slate-750 self-start sm:self-auto">
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-400 font-mono">
                {avgMastery}%
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                Overall Mastery
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>Syllabus Proficiency</span>
            <span>{avgMastery}% of target mastery</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-750">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${avgMastery}%`,
                backgroundColor: currentCourse.color || '#6366f1',
              }}
            />
          </div>
        </div>
      </div>

      {/* Weak Topics Alert / Action Banner */}
      {weakTopics.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-200">
                Weak Topic Identified: {weakTopics[0].name} ({weakTopics[0].masteryPercentage}%)
              </span>
              <p className="text-amber-300/80 mt-0.5">
                Targeting your lowest-mastery concepts accelerates exam readiness.
              </p>
            </div>
          </div>

          <button
            onClick={() => onLaunchTopicQuiz(weakTopics[0].id)}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold px-3.5 py-1.5 rounded-xl transition shadow-md shadow-amber-600/20 active:scale-95 shrink-0 self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Practice Weak Spot</span>
          </button>
        </div>
      )}

      {/* Topic Mastery Breakdown */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          Course Topics Mastery Breakdown
        </h3>

        <div className="space-y-3">
          {currentCourse.topics.map((topic) => {
            let color = 'bg-amber-500';
            if (topic.masteryPercentage >= 80) color = 'bg-emerald-500';
            else if (topic.masteryPercentage < 60) color = 'bg-rose-500';

            return (
              <div
                key={topic.id}
                className="bg-slate-900/80 border border-slate-750 rounded-xl p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">{topic.name}</span>
                    <span className="text-[11px] text-slate-500 block">
                      {topic.questionsAnswered} adaptive questions completed
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-white text-xs">
                      {topic.masteryPercentage}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${color}`}
                    style={{ width: `${topic.masteryPercentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Encrypted Academic Transcript / Gradebook */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">
              Encrypted Academic Records ({gradeRecords.length})
            </h3>
          </div>

          <button
            onClick={onOpenVault}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
          >
            {vaultState.isUnlocked ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>Vault Active</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-400">Unlock to View Grades</span>
              </>
            )}
          </button>
        </div>

        {vaultState.isUnlocked ? (
          gradeRecords.length > 0 ? (
            <div className="space-y-2.5">
              {gradeRecords.map((grade) => (
                <div
                  key={grade.id}
                  className="bg-slate-900 border border-slate-750 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-white">{grade.title}</div>
                    <div className="text-slate-400 text-[11px] font-serif mt-0.5">
                      {grade.encryptedNotes || grade.instructorFeedback}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
                      {grade.gradeLetter} ({grade.percentageScore}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800 p-4">
              No grade evaluations logged yet for {currentCourse.code}. Add one in the Encrypted Vault tab.
            </div>
          )
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-400 space-y-2">
            <Lock className="w-6 h-6 text-rose-400 mx-auto" />
            <p className="font-medium text-slate-300">
              Academic Grade Records are zero-knowledge encrypted at rest.
            </p>
            <p className="text-[11px] text-slate-500">
              Unlock the vault with your passphrase to decrypt grades and evaluations in memory.
            </p>
            <button
              onClick={onOpenVault}
              className="mt-2 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl font-semibold transition"
            >
              Unlock Vault
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
