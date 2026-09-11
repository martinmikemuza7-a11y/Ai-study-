/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  ChevronDown,
  Download,
  Folder,
  FolderOpen,
  Plus,
  FileText,
  Sun,
  Moon,
} from 'lucide-react';
import { Course, CourseDocument, VaultState } from '../types';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  currentCourse: Course | null;
  courses: Course[];
  documents?: CourseDocument[];
  vaultState: VaultState;
  onSelectCourse: (course: Course) => void;
  onDeselectCourse?: () => void;
  onNavigateToCourses?: () => void;
  onNavigateToDocs?: () => void;
  onOpenCourseModal: () => void;
  onToggleVaultLock: () => void;
  onOpenVaultTab: () => void;
  onNavigateToLanding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCourse,
  courses,
  documents = [],
  vaultState,
  onSelectCourse,
  onDeselectCourse,
  onNavigateToCourses,
  onNavigateToDocs,
  onOpenCourseModal,
  onToggleVaultLock,
  onOpenVaultTab,
  onNavigateToLanding,
}) => {
  const isOnline = useOnlineStatus();
  const { theme, toggleTheme } = useTheme();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);

  const currentCourseDocsCount = currentCourse
    ? documents.filter((d) => d.courseId === currentCourse.id).length
    : 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors relative">
      {/* Top Prismatic Gradient Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-violet-600 via-indigo-500 via-cyan-400 via-emerald-400 to-amber-400 animate-gradient" />

      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 px-3 sm:px-6 py-2.5">
        {/* Brand & Course Switcher */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 shrink-0 transition-transform hover:scale-105">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-sm leading-tight text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                AI Study
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 shadow-xs">
                  AES-256
                </span>
              </h1>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Offline Academic Platform</p>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          {/* Active Course Folder Selector Pill */}
          <div className="relative">
            <button
              onClick={() => setCourseDropdownOpen(!courseDropdownOpen)}
              style={
                currentCourse && currentCourse.color
                  ? {
                      borderColor: `${currentCourse.color}50`,
                      boxShadow: `0 0 12px ${currentCourse.color}20`,
                    }
                  : undefined
              }
              className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 text-xs transition active:scale-98 max-w-[210px] sm:max-w-[300px] ${
                currentCourse
                  ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-750 border-slate-300 dark:border-slate-750 text-slate-800 dark:text-slate-200'
                  : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border-indigo-200 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-200 font-medium'
              }`}
              title={
                currentCourse
                  ? `Active Folder: ${currentCourse.name} (${currentCourseDocsCount} files stored)`
                  : 'No folder selected (click to open or select a folder)'
              }
            >
              {currentCourse ? (
                <>
                  <FolderOpen
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: currentCourse.color || '#6366f1' }}
                  />
                  <span className="font-medium truncate">{currentCourse.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60 shrink-0">
                    {currentCourseDocsCount} {currentCourseDocsCount === 1 ? 'file' : 'files'}
                  </span>
                </>
              ) : (
                <>
                  <Folder className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="truncate">Select Folder</span>
                  <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-mono">
                    Empty
                  </span>
                </>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0 ml-0.5" />
            </button>

            {/* Quick Dropdown Menu */}
            {courseDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setCourseDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-1.5 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl shadow-2xl py-1.5 z-50 text-xs">
                  <div className="px-3 py-1 flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span>Folders ({courses.length})</span>
                    {onNavigateToCourses && (
                      <button
                        onClick={() => {
                          onNavigateToCourses();
                          setCourseDropdownOpen(false);
                        }}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-normal normal-case"
                      >
                        All Folders Hub
                      </button>
                    )}
                  </div>

                  <div className="max-h-56 overflow-y-auto px-1 py-1 space-y-0.5">
                    {courses.length === 0 ? (
                      <div className="px-3 py-3 text-center text-slate-500 dark:text-slate-400 text-xs">
                        No folders yet. Create your first folder on the Home tab.
                      </div>
                    ) : (
                      courses.map((course) => {
                        const isSelected = currentCourse?.id === course.id;
                        const docCount = documents.filter((d) => d.courseId === course.id).length;
                        return (
                          <div
                            key={course.id}
                            className={`flex items-center justify-between px-2.5 py-2 rounded-lg transition ${
                              isSelected
                                ? 'bg-indigo-50 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200 font-semibold'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <button
                              onClick={() => {
                                onSelectCourse(course);
                                setCourseDropdownOpen(false);
                              }}
                              className="flex items-center gap-2 min-w-0 text-left flex-1"
                            >
                              <div
                                className="w-3 h-3 rounded-sm shrink-0"
                                style={{ backgroundColor: course.color }}
                              />
                              <div className="min-w-0">
                                <div className="truncate text-xs font-semibold">
                                  {course.name}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                                  <FileText className="w-2.5 h-2.5 text-indigo-500" />
                                  <span>{docCount} {docCount === 1 ? 'file' : 'files'}</span>
                                </div>
                              </div>
                            </button>

                            {onNavigateToDocs && (
                              <button
                                onClick={() => {
                                  onSelectCourse(course);
                                  setCourseDropdownOpen(false);
                                  onNavigateToDocs();
                                }}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-indigo-600 hover:text-white transition shrink-0 ml-1.5"
                                title="Open this course folder's files"
                              >
                                Files
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700/60 mt-1 pt-1 px-1 space-y-0.5">
                    {currentCourse && onDeselectCourse && (
                      <button
                        onClick={() => {
                          onDeselectCourse();
                          setCourseDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-medium flex items-center gap-1.5 transition"
                      >
                        <span className="w-2 h-2 rounded-full border border-amber-500" />
                        Deselect Folder (Leave Empty)
                      </button>
                    )}

                    {onNavigateToCourses && (
                      <button
                        onClick={() => {
                          onNavigateToCourses();
                          setCourseDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-medium flex items-center gap-1.5 transition"
                      >
                        <Folder className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        Browse Course Folders Hub...
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setCourseDropdownOpen(false);
                        onOpenCourseModal();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white font-medium flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      Create New Course Folder...
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Controls: Theme Toggle, Connectivity, PWA Install, Vault Status */}
        <div className="flex items-center gap-2">
          {/* Back to Landing Page & Native Downloads */}
          {onNavigateToLanding && (
            <button
              onClick={onNavigateToLanding}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50/50 dark:hover:bg-slate-750 transition active:scale-95 cursor-pointer shadow-2xs"
              title="View Landing Page, APK & Windows EXE downloads"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden md:inline">Landing & Downloads</span>
              <span className="md:hidden">Apps</span>
            </button>
          )}

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-lg border transition active:scale-95 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 border-slate-300 dark:border-slate-700 hover:border-amber-400/50 dark:hover:border-indigo-500/50"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle light and dark theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 hover:-rotate-12 transition-transform drop-shadow-[0_0_8px_rgba(79,70,229,0.4)]" />
            )}
          </button>

          {/* Online / Offline Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition shadow-xs ${
              isOnline
                ? 'bg-emerald-500/10 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shadow-emerald-500/10'
                : 'bg-amber-500/10 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-500/30 shadow-amber-500/10'
            }`}
            title={isOnline ? 'Online: Hybrid Gemini 3.8 Flash & Local RAG active' : 'Offline: Local RAG & Socratic AI active from IndexedDB cache'}
          >
            {isOnline ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="hidden md:inline">Online (Gemini)</span>
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-pulse relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="hidden md:inline">Offline Mode</span>
              </>
            )}
          </div>

          {/* PWA Install Button */}
          {isInstallable && !isInstalled && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-md shadow-indigo-500/25 transition active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          {isIOS && !isInstalled && (
            <button
              onClick={() => setShowIOSModal(true)}
              className="flex items-center gap-1 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs px-2.5 py-1 rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install</span>
            </button>
          )}

          {/* Vault Security Status / Lock Toggle */}
          <button
            onClick={onToggleVaultLock}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition active:scale-95 shadow-xs ${
              vaultState.isUnlocked
                ? 'bg-emerald-500/15 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 shadow-emerald-500/10'
                : 'bg-rose-500/15 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/20 shadow-rose-500/10'
            }`}
            title={vaultState.isUnlocked ? 'Vault Unlocked (AES-256 active). Click to lock.' : 'Vault Locked. Click to unlock with passphrase.'}
          >
            {vaultState.isUnlocked ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Vault Open</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span className="hidden sm:inline">Vault Locked</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-800 dark:text-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Install on iPhone / iPad</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Offline-ready native web app</p>
              </div>
            </div>
            <ol className="space-y-3 text-xs text-slate-700 dark:text-slate-300 list-decimal list-inside bg-slate-100 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-750">
              <li>Tap the <strong className="text-slate-900 dark:text-white">Share</strong> button in the Safari bottom toolbar.</li>
              <li>Scroll down and select <strong className="text-slate-900 dark:text-white">Add to Home Screen</strong>.</li>
              <li>Tap <strong className="text-slate-900 dark:text-white">Add</strong> in the top right corner.</li>
            </ol>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-semibold text-white transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
