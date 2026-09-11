/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  Plus,
  Search,
  Check,
  Trash2,
  Sparkles,
  ArrowRight,
  User,
  Calendar,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { Course, CourseDocument, NavigationTab } from '../types';
import { getCourseImage, PRESET_COURSE_IMAGES } from '../lib/courseImages';

export const STARTER_COURSE_TEMPLATES: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>[] = [];

interface CoursePickerViewProps {
  courses: Course[];
  currentCourse: Course | null;
  documents?: CourseDocument[];
  onSelectCourse: (course: Course | null) => void;
  onDeselectCourse?: () => void;
  onAddCourse: (course: Course) => void;
  onUpdateCourse?: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onLoadSampleCourses?: () => void;
  onClearAllCourses?: () => void;
  onNavigateToTab?: (tab: NavigationTab) => void;
}

export const CoursePickerView: React.FC<CoursePickerViewProps> = ({
  courses,
  currentCourse,
  documents = [],
  onSelectCourse,
  onDeselectCourse,
  onAddCourse,
  onDeleteCourse,
  onNavigateToTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Custom Course Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [instructor, setInstructor] = useState('');
  const [term, setTerm] = useState('Fall 2026');
  const [color, setColor] = useState('#6366f1');
  const [topicInput, setTopicInput] = useState('');

  const colorOptions = [
    '#6366f1', // Indigo
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#3b82f6', // Blue
  ];

  const filteredCourses = courses.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.instructor.toLowerCase().includes(q) ||
      c.topics.some((t) => t.name.toLowerCase().includes(q))
    );
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    const parsedTopics = topicInput
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t, idx) => ({
        id: `topic_${code.toLowerCase().replace(/[^a-z0-9]/g, '')}_${idx}`,
        name: t,
        description: `Core topic for ${code}`,
        masteryPercentage: 50,
        questionsAnswered: 0,
        lastStudiedAt: new Date().toISOString(),
      }));

    const newCourse: Course = {
      id: `course_${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      instructor: instructor.trim() || 'Staff Faculty',
      term: term.trim() || 'Fall 2026',
      color,
      iconName: 'Folder',
      topics:
        parsedTopics.length > 0
          ? parsedTopics
          : [
              {
                id: `topic_${Date.now()}_1`,
                name: 'Foundations & Core Principles',
                description: 'Core concepts and definitions',
                masteryPercentage: 50,
                questionsAnswered: 0,
                lastStudiedAt: new Date().toISOString(),
              },
            ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddCourse(newCourse);
    onSelectCourse(newCourse);
    setShowCreateForm(false);
    setCode('');
    setName('');
    setInstructor('');
    setTopicInput('');
  };

  const handleEnrollTemplate = (template: typeof STARTER_COURSE_TEMPLATES[0]) => {
    const exists = courses.find((c) => c.code === template.code);
    if (exists) {
      onSelectCourse(exists);
      return;
    }

    const now = new Date().toISOString();
    const newCourse: Course = {
      ...template,
      id: `course_${template.code.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    onAddCourse(newCourse);
    onSelectCourse(newCourse);
    setShowTemplates(false);
  };

  const getFilesForCourse = (courseId: string) => {
    return documents.filter((d) => d.courseId === courseId);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* Top Banner / Selection Status */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden transition-colors">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5" />
                Course Folders & Storage
              </span>
              {currentCourse ? (
                <span className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1 font-medium">
                  <Check className="w-3 h-3" /> Active Folder: {currentCourse.code}
                </span>
              ) : (
                <span className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/40 font-medium">
                  No Course Folder Selected (Workspace Empty)
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              {currentCourse ? (
                <>
                  <FolderOpen
                    className="w-6 h-6 shrink-0"
                    style={{ color: currentCourse.color || '#6366f1' }}
                  />
                  <span>Selected Folder: {currentCourse.name}</span>
                </>
              ) : (
                <>
                  <Folder className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Course Folders Directory</span>
                </>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Each course acts as a dedicated storage folder for your study materials, lecture slides, and notes. The AI parses the files stored in each folder for local RAG answers and adaptive question-and-answer generation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {currentCourse && (
              <button
                onClick={() => (onDeselectCourse ? onDeselectCourse() : onSelectCourse(null))}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 transition active:scale-95"
                title="Deselect active course folder and leave workspace empty"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Leave Unselected
              </button>
            )}
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setShowTemplates(false);
              }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              {showCreateForm ? 'Cancel Creation' : 'New Course Folder'}
            </button>
          </div>
        </div>
      </div>

      {/* Inline Course Creation / Customization Form */}
      {showCreateForm && (
        <div className="bg-white/95 dark:bg-slate-900/95 border border-indigo-200 dark:border-indigo-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 animate-fadeIn transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Create & Customize Course Folder</h2>
            </div>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Course Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. PHYS-201, STAT-101, LIT-300"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Academic Term
                </label>
                <input
                  type="text"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Fall 2026"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Course Folder Name / Full Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Modern Physics & Quantum Mechanics"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Instructor Name
                </label>
                <input
                  type="text"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  placeholder="Prof. Jane Doe"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Folder Color Accent
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition ${
                        color === c ? 'ring-2 ring-indigo-500 dark:ring-white scale-110 shadow-md' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                      title={`Select ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Syllabus Topics (One per line — used for RAG calibration & quiz generation)
              </label>
              <textarea
                rows={3}
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Wave-Particle Duality & De Broglie Hypothesis&#10;Schrödinger Equation in One Dimension&#10;Quantum Harmonic Oscillators"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Once created, you can open this course folder to upload PDF/text notes for the AI to parse.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-xs font-medium text-slate-700 dark:text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
              >
                <Folder className="w-3.5 h-3.5" />
                Create Course Folder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Enrolled Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Course Folders ({courses.length})
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, title, topic..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-sm"
            />
          </div>

          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className={`text-xs px-3 py-1.5 rounded-xl border font-medium flex items-center gap-1.5 transition shadow-sm ${
              showTemplates
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Presets</span>
          </button>
        </div>
      </div>

      {/* Starter Presets Shelf (Collapsible) */}
      {showTemplates && (
        <div className="bg-slate-50 dark:bg-slate-900/70 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-4 sm:p-5 space-y-3 animate-fadeIn transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Quick-Start Course Folder Presets
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">1-click create</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {STARTER_COURSE_TEMPLATES.map((tmpl) => {
              const alreadyEnrolled = courses.some((c) => c.code === tmpl.code);
              return (
                <div
                  key={tmpl.code}
                  className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-850 hover:border-indigo-400 dark:hover:border-indigo-500/50 rounded-2xl overflow-hidden flex flex-col justify-between transition group shadow-sm"
                >
                  {/* Preset Picture Banner */}
                  <div className="relative h-24 overflow-hidden bg-slate-900">
                    <img
                      src={tmpl.imageUrl}
                      alt={tmpl.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white">
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1"
                        style={{ backgroundColor: tmpl.color }}
                      >
                        <Folder className="w-3 h-3" />
                        {tmpl.code}
                      </span>
                      <span className="text-[10px] text-white/80 font-mono">{tmpl.term}</span>
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition line-clamp-1">
                        {tmpl.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {tmpl.instructor} • {tmpl.topics.length} topics
                      </p>
                    </div>

                    <button
                      onClick={() => handleEnrollTemplate(tmpl)}
                      disabled={alreadyEnrolled}
                      className={`w-full py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        alreadyEnrolled
                          ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-default'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                      }`}
                    >
                      {alreadyEnrolled ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          Add Preset Folder
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Enrolled Course Folders Grid */}
      {courses.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-sm transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto shadow-inner">
            <Folder className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Your Course Folder Workspace is Empty</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              Create your first custom course folder to begin. Each course is a folder where you can store lecture notes, slides, and syllabus files for the AI to perform local RAG and generate adaptive questions and answers.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Create Custom Course Folder
            </button>
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-medium px-4 py-2.5 rounded-xl transition active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Starter Presets
            </button>
          </div>
        </div>
      ) : filteredCourses.length === 0 ? (
        /* Search Not Found */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500 dark:text-slate-400 text-xs shadow-sm">
          No course folders matching &ldquo;{searchQuery}&rdquo;. Try another search term or create a new folder.
        </div>
      ) : (
        /* Active Course Folders Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCourses.map((course) => {
            const isSelected = currentCourse?.id === course.id;
            const courseFiles = getFilesForCourse(course.id);
            const avgMastery = Math.round(
              course.topics.reduce((acc, t) => acc + t.masteryPercentage, 0) /
                (course.topics.length || 1)
            );

            return (
              <div
                key={course.id}
                className={`relative rounded-3xl border transition flex flex-col justify-between gap-3.5 overflow-hidden group shadow-sm ${
                  isSelected
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-400/40 dark:ring-indigo-500/50 shadow-md'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg'
                }`}
              >
                {/* Course Picture Banner */}
                <div className="relative h-28 overflow-hidden bg-slate-900">
                  <img
                    src={getCourseImage(course)}
                    alt={course.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-black/20" />

                  {/* Badges on Picture */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span
                      className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg text-white shadow-md flex items-center gap-1"
                      style={{ backgroundColor: course.color }}
                    >
                      {isSelected ? <FolderOpen className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
                      {course.code}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-black/60 text-white/90 backdrop-blur-xs">
                      📁 {courseFiles.length} {courseFiles.length === 1 ? 'file' : 'files'}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    {isSelected && (
                      <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full border border-white/40 bg-emerald-600/90 backdrop-blur-xs flex items-center gap-1 shadow-sm">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete course folder for "${course.code}: ${course.name}"? All associated topic records will be removed.`)) {
                          onDeleteCourse(course.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-black/50 hover:bg-rose-600 text-white/80 hover:text-white transition cursor-pointer backdrop-blur-xs"
                      title="Delete course folder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="px-5 pb-5 space-y-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {course.name}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{course.instructor} • {course.term}</span>
                    </div>
                  </div>

                  {/* Files & RAG Status Callout */}
                  <div className="mt-3 py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="text-[11px]">
                        {courseFiles.length > 0
                          ? `${courseFiles.length} study files ready for RAG & AI quizzes`
                          : 'Folder empty — upload notes for AI RAG'}
                      </span>
                    </div>
                    {onNavigateToTab && (
                      <button
                        onClick={() => {
                          onSelectCourse(course);
                          onNavigateToTab('docs');
                        }}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-0.5 shrink-0 ml-2"
                      >
                        <span>Manage</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Bayesian Mastery Score */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Topic Mastery Score</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{avgMastery}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${avgMastery}%`,
                          backgroundColor:
                            avgMastery >= 80 ? '#10b981' : avgMastery >= 60 ? '#6366f1' : '#f59e0b',
                        }}
                      />
                    </div>
                  </div>

                  {/* Topics Pills */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {course.topics.slice(0, 3).map((topic) => (
                      <span
                        key={topic.id}
                        className="text-[10px] bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700/50"
                      >
                        {topic.name}
                      </span>
                    ))}
                    {course.topics.length > 3 && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 px-1.5 py-0.5">
                        +{course.topics.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions: Open Folder & Files, Launch Tutor, Practice Quiz */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        onSelectCourse(course);
                        if (onNavigateToTab) onNavigateToTab('docs');
                      }}
                      className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-750 transition"
                      title="Open this course folder to store and view files for RAG"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Folder Files</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectCourse(course);
                        if (onNavigateToTab) onNavigateToTab('quiz');
                      }}
                      className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-750 transition"
                      title="Generate questions and answers based on this course"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      <span>Quiz (Q&A)</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <button
                        onClick={() => (onDeselectCourse ? onDeselectCourse() : onSelectCourse(null))}
                        className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        Deselect Folder
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectCourse(course)}
                        className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition active:scale-98"
                      >
                        <Folder className="w-3.5 h-3.5" />
                        Select Course Folder
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
