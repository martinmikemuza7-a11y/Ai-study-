/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Plus, Folder, FolderOpen, Check, Layers, User, Calendar, FileText } from 'lucide-react';
import { Course, CourseDocument } from '../types';

interface CourseModalProps {
  isOpen: boolean;
  courses: Course[];
  documents?: CourseDocument[];
  currentCourse: Course | null;
  onSelectCourse: (course: Course | null) => void;
  onAddCourse: (newCourse: Course) => void;
  onClose: () => void;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  courses,
  documents = [],
  currentCourse,
  onSelectCourse,
  onAddCourse,
  onClose,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [instructor, setInstructor] = useState('');
  const [term, setTerm] = useState('Fall 2026');
  const [color, setColor] = useState('#6366f1');
  const [topicInput, setTopicInput] = useState('');

  if (!isOpen) return null;

  const colorOptions = [
    '#6366f1', // Indigo
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#3b82f6', // Blue
  ];

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
        description: `Core module topic for ${code}`,
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
      topics: parsedTopics.length > 0 ? parsedTopics : [
        {
          id: `topic_default_1`,
          name: 'Fundamental Principles',
          description: 'Introduction and core concepts',
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
    setIsCreating(false);
    setCode('');
    setName('');
    setInstructor('');
    setTopicInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Course Folders & Storage</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {!isCreating ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Course Folders ({courses.length})
                </span>
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Folder
                </button>
              </div>

              {currentCourse && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectCourse(null);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-750 text-amber-300 hover:text-amber-200 text-xs flex items-center justify-between transition"
                >
                  <span>Leave Unselected (Empty Workspace)</span>
                  <span className="text-[10px] text-slate-400">Clear selection</span>
                </button>
              )}

              {courses.length === 0 ? (
                <div className="text-center py-6 px-4 bg-slate-800/40 rounded-xl border border-dashed border-slate-750">
                  <p className="text-xs text-slate-400 mb-2">No course folders created yet.</p>
                  <button
                    type="button"
                    onClick={() => setIsCreating(true)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    + Create your first course folder
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {courses.map((course) => {
                    const isSelected = currentCourse?.id === course.id;
                    const courseFiles = documents.filter((d) => d.courseId === course.id);
                    const avgMastery = Math.round(
                      course.topics.reduce((acc, t) => acc + t.masteryPercentage, 0) /
                        (course.topics.length || 1)
                    );

                    return (
                      <div
                        key={course.id}
                        onClick={() => {
                          onSelectCourse(course);
                          onClose();
                        }}
                        className={`cursor-pointer rounded-xl p-4 border transition ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/40'
                            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md"
                            style={{ backgroundColor: course.color }}
                          >
                            {isSelected ? (
                              <FolderOpen className="w-5 h-5 text-white" />
                            ) : (
                              <Folder className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
                                {course.code}
                              </span>
                              <h3 className="text-sm font-semibold text-white">{course.name}</h3>
                              {isSelected && (
                                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                                  <Check className="w-3 h-3" /> Active
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" /> {course.instructor}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {course.term}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-indigo-300 font-mono">
                                <FileText className="w-3 h-3" /> {courseFiles.length} files
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Mastery Gauge */}
                        <div className="text-right shrink-0">
                          <div className="text-xs font-semibold text-slate-200">
                            {avgMastery}%
                          </div>
                          <div className="text-[10px] text-slate-400">Mastery</div>
                        </div>
                      </div>

                      {/* Topic Pill Previews */}
                      <div className="mt-3 flex flex-wrap gap-1.5 pt-2.5 border-t border-slate-750">
                        {course.topics.map((topic) => (
                          <span
                            key={topic.id}
                            className="text-[11px] bg-slate-900/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/50"
                          >
                            {topic.name} ({topic.masteryPercentage}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Create Course Folder</h3>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Course Code (e.g. PHYS-101)
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="PHYS-101"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Academic Term
                  </label>
                  <input
                    type="text"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Fall 2026"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Course Name / Title
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Classical Mechanics & Thermodynamics"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Instructor Name
                </label>
                <input
                  type="text"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  placeholder="Prof. Jane Doe"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Folder Color Accent
                </label>
                <div className="flex gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition ${
                        color === c ? 'ring-2 ring-white scale-110 shadow' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Course Topics / Syllabus Modules (1 per line)
                </label>
                <textarea
                  rows={3}
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="Newtonian Kinematics&#10;Angular Momentum & Gyroscopes&#10;Thermal Equilibrium & Entropy"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-medium text-slate-300 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-semibold text-white transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
                >
                  <Folder className="w-3.5 h-3.5" />
                  Save & Open Folder
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
