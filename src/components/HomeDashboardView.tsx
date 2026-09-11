/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Folder,
  FolderPlus,
  FileText,
  Upload,
  Sparkles,
  Globe,
  Calendar,
  CheckCircle2,
  Trash2,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Plus,
  Edit2,
  BookOpen,
  ArrowRight,
  Eye,
  X,
  FileUp,
  Sliders,
  Check,
  Wifi,
  WifiOff,
  Lightbulb,
  Award,
  Layers,
  Search,
  Palette,
  Image as ImageIcon,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Folder as FolderType, CourseDocument, GeneratedQAItem, StudyCalendarEvent } from '../types';
import { chunkDocumentText } from '../lib/rag';
import { putToStore, deleteFromStore } from '../lib/db';
import { generateLocalQuestionsFromDocuments } from '../lib/offlineQuestionGenerator';
import {
  PRESET_FOLDER_IMAGES,
  FolderPresetImage,
  getFolderImage,
  NOTEBOOK_FOLDER_ART,
  CREATIVE_STUDY_ART,
  LOFI_2D_STUDY_DESK,
  ISOMETRIC_2D_LAB,
  CREATIVE_2D_LEARNING,
} from '../lib/courseImages';
import { AnimatedStudyCompanion, CompanionMood } from './AnimatedStudyCompanion';
import { CoverImageSelectorModal } from './CoverImageSelectorModal';

interface HomeDashboardViewProps {
  courses: FolderType[];
  currentCourse: FolderType | null;
  documents: CourseDocument[];
  calendarEvents?: StudyCalendarEvent[];
  onSelectCourse: (folder: FolderType | null) => void;
  onAddCourse: (folder: FolderType) => void;
  onDeleteCourse: (folderId: string) => void;
  onDocumentAdded: (doc: CourseDocument) => void;
  onDeleteDocument: (docId: string) => void;
  onNavigateToStudy?: (folder?: FolderType, event?: StudyCalendarEvent) => void;
}

const FOLDER_COLORS = [
  { name: 'Indigo Dream', hex: '#6366f1', bg: 'from-indigo-500/20 to-purple-500/10' },
  { name: 'Cyan Electric', hex: '#06b6d4', bg: 'from-cyan-500/20 to-blue-500/10' },
  { name: 'Emerald Forest', hex: '#10b981', bg: 'from-emerald-500/20 to-teal-500/10' },
  { name: 'Violet Nebula', hex: '#8b5cf6', bg: 'from-purple-500/20 to-indigo-500/10' },
  { name: 'Amber Sunset', hex: '#f59e0b', bg: 'from-amber-500/20 to-orange-500/10' },
  { name: 'Rose Blossom', hex: '#ec4899', bg: 'from-pink-500/20 to-rose-500/10' },
  { name: 'Crimson Flame', hex: '#ef4444', bg: 'from-red-500/20 to-amber-500/10' },
  { name: 'Sapphire Blue', hex: '#3b82f6', bg: 'from-blue-500/20 to-indigo-500/10' },
];

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  courses: folders,
  currentCourse: activeFolder,
  documents,
  onSelectCourse: setActiveFolder,
  onAddCourse,
  onDeleteCourse,
  onDocumentAdded,
  onDeleteDocument,
  onNavigateToStudy,
}) => {
  // Folder Management State
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0].hex);
  const [newFolderImage, setNewFolderImage] = useState(PRESET_FOLDER_IMAGES[0].url);

  // 2D Cover Image Selector Modal state
  const [coverPickerFolder, setCoverPickerFolder] = useState<FolderType | null>(null);
  const [showCoverPickerForNew, setShowCoverPickerForNew] = useState(false);

  // 2D Animated Companion & Practice Streak state
  const [companionMood, setCompanionMood] = useState<CompanionMood>('idle');
  const [questionStreak, setQuestionStreak] = useState<number>(0);

  // Rename Folder State
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Mode: Online (Gemini AI + Web Search) vs Offline (100% Local On-Device)
  const [operationalMode, setOperationalMode] = useState<'offline' | 'online'>('offline');

  // Document Upload State
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [viewingDoc, setViewingDoc] = useState<CourseDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Documents belonging to active folder
  const activeDocs = documents.filter((d) => activeFolder && d.courseId === activeFolder.id);

  // AI Question Generation State
  const [generationSource, setGenerationSource] = useState<'document' | 'brainstorm_web'>('document');
  const [questionType, setQuestionType] = useState<'all' | 'multiple_choice' | 'short_answer' | 'true_false' | 'explain'>('all');
  const [questionCount, setQuestionCount] = useState<number>(4);
  const [customFocus, setCustomFocus] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQAItem[]>([]);
  const [studyMode, setStudyMode] = useState<'practice' | 'review'>('practice');
  const [webSources, setWebSources] = useState<{ uri: string; title: string }[]>([]);

  // ---------------------------------------------------------------------------
  // Folder Handlers
  // ---------------------------------------------------------------------------
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const newFolder: FolderType = {
      id: `folder_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newFolderName.trim(),
      color: newFolderColor,
      imageUrl: newFolderImage,
      topics: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddCourse(newFolder);
    setActiveFolder(newFolder);
    setNewFolderName('');
    setShowNewFolderModal(false);
    setCompanionMood('happy');
  };

  const handleApplyCoverToFolder = async (folder: FolderType, preset: FolderPresetImage) => {
    const updated: FolderType = {
      ...folder,
      imageUrl: preset.url,
      updatedAt: new Date().toISOString(),
    };
    await putToStore('courses', updated);
    onAddCourse(updated);
    if (activeFolder?.id === folder.id) {
      setActiveFolder(updated);
    }
    setCompanionMood('happy');
  };

  const handleStartRename = (folder: FolderType) => {
    setEditingFolderId(folder.id);
    setRenameValue(folder.name);
  };

  const handleSaveRename = async (folder: FolderType) => {
    if (!renameValue.trim()) return;
    const updated: FolderType = {
      ...folder,
      name: renameValue.trim(),
      updatedAt: new Date().toISOString(),
    };
    await putToStore('courses', updated);
    onAddCourse(updated);
    setEditingFolderId(null);
  };

  // ---------------------------------------------------------------------------
  // Document Upload Handlers
  // ---------------------------------------------------------------------------
  const processUploadedFile = async (file: File) => {
    if (!activeFolder) {
      setUploadError('Please select or create a folder first before uploading.');
      return;
    }

    try {
      setUploadError(null);
      const text = await file.text();
      if (!text || text.trim().length < 10) {
        setUploadError(`File "${file.name}" appears to be empty or unreadable.`);
        return;
      }

      const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
      const chunks = chunkDocumentText(docId, activeFolder.id, cleanTitle, text);

      const newDoc: CourseDocument = {
        id: docId,
        courseId: activeFolder.id,
        title: cleanTitle,
        category: 'lecture_notes',
        content: text,
        contentHash: `hash_${Date.now()}`,
        wordCount: text.split(/\s+/).filter(Boolean).length,
        chunks,
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await putToStore('course_documents', newDoc);
      onDocumentAdded(newDoc);
    } catch (err: any) {
      console.error('Upload processing error:', err);
      setUploadError(`Failed to process file "${file.name}": ${err?.message || 'Unknown error'}`);
    }
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => processUploadedFile(file));
  };

  const handleSavePastedDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFolder) {
      setUploadError('Please select or create a folder first.');
      return;
    }
    if (!pasteTitle.trim() || !pasteContent.trim()) {
      setUploadError('Please provide both a document title and text content.');
      return;
    }

    try {
      const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const chunks = chunkDocumentText(docId, activeFolder.id, pasteTitle.trim(), pasteContent.trim());

      const newDoc: CourseDocument = {
        id: docId,
        courseId: activeFolder.id,
        title: pasteTitle.trim(),
        category: 'lecture_notes',
        content: pasteContent.trim(),
        contentHash: `hash_${Date.now()}`,
        wordCount: pasteContent.trim().split(/\s+/).filter(Boolean).length,
        chunks,
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await putToStore('course_documents', newDoc);
      onDocumentAdded(newDoc);
      setPasteTitle('');
      setPasteContent('');
      setShowPasteModal(false);
      setUploadError(null);
    } catch (err: any) {
      setUploadError(`Failed to save document: ${err?.message || 'Error'}`);
    }
  };

  // ---------------------------------------------------------------------------
  // Question Generation Handler (Online vs Offline)
  // ---------------------------------------------------------------------------
  const handleGenerateQuestions = async () => {
    if (!activeFolder) {
      setUploadError('Please select or create a folder first.');
      return;
    }

    if (activeDocs.length === 0 && (operationalMode === 'offline' || generationSource === 'document')) {
      setUploadError('Please upload at least one document into this folder to generate questions.');
      return;
    }

    setIsGenerating(true);
    setUploadError(null);
    setCompanionMood('thinking');

    // 1. OFFLINE MODE: 100% On-Device local document intelligence
    if (operationalMode === 'offline') {
      setGenerationStatus(`Running On-Device local engine: extracting questions and verified answers from ${activeDocs.length} uploaded document${activeDocs.length > 1 ? 's' : ''}...`);

      setTimeout(() => {
        try {
          const localQuestions = generateLocalQuestionsFromDocuments(
            activeDocs,
            activeFolder.name,
            questionCount,
            questionType
          );

          if (localQuestions.length > 0) {
            setGeneratedQuestions(localQuestions);
            setWebSources([]);
            setCompanionMood('happy');
          } else {
            setUploadError('Not enough readable sentences found in uploaded files. Please upload longer notes.');
            setCompanionMood('idle');
          }
        } catch (err: any) {
          console.error('Local question generation failed:', err);
          setUploadError('Failed to parse uploaded documents locally.');
          setCompanionMood('idle');
        } finally {
          setIsGenerating(false);
          setGenerationStatus('');
        }
      }, 500);
      return;
    }

    // 2. ONLINE MODE: Gemini API + Live Web Search Grounding
    setGenerationStatus(
      generationSource === 'brainstorm_web'
        ? 'Online Mode: Searching the live web with Google Search grounding & synthesizing questions...'
        : `Online Mode: Gemini is analyzing ${activeDocs.length} uploaded document${activeDocs.length > 1 ? 's' : ''}...`
    );

    try {
      const response = await fetch('/api/questions/generate-from-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderName: activeFolder.name,
          mode: generationSource,
          documents: activeDocs.map((d) => ({
            title: d.title,
            content: d.content,
          })),
          questionType,
          count: questionCount,
          customFocus,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.useLocalFallback || !data.questions || data.questions.length === 0) {
        console.warn('API returned fallback, generating locally with on-device engine.');
        const localQuestions = generateLocalQuestionsFromDocuments(
          activeDocs,
          activeFolder.name,
          questionCount,
          questionType
        );
        if (localQuestions.length > 0) {
          setGeneratedQuestions(localQuestions);
          setCompanionMood('happy');
        } else {
          throw new Error(data.error || 'Failed to generate questions.');
        }
      } else {
        setGeneratedQuestions(data.questions);
        setCompanionMood('happy');
        if (data.webSources) {
          setWebSources(data.webSources);
        }
      }
    } catch (err: any) {
      console.warn('Network or API issue, falling back to local extraction:', err);
      const localQuestions = generateLocalQuestionsFromDocuments(
        activeDocs,
        activeFolder.name,
        questionCount,
        questionType
      );
      if (localQuestions.length > 0) {
        setGeneratedQuestions(localQuestions);
        setCompanionMood('happy');
      } else {
        setCompanionMood('idle');
        setUploadError(
          operationalMode === 'online' && generationSource === 'brainstorm_web'
            ? 'Web search requires an active network connection and API key. Switch to Offline Mode to practice from uploaded files!'
            : 'Could not generate questions. Ensure uploaded documents have sufficient readable text.'
        );
      }
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setGeneratedQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          const isCorrect = q.correctOptionIndex === optionIndex;
          if (isCorrect) {
            setCompanionMood('celebrating');
            setQuestionStreak((s) => s + 1);
            try {
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.65 },
                colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'],
              });
            } catch {
              // fallback gracefully
            }
          } else {
            setCompanionMood('encouraging');
            setQuestionStreak(0);
          }
          return {
            ...q,
            userSelectedOptionIndex: optionIndex,
            isRevealed: true,
          };
        }
        return q;
      })
    );
  };

  const handleToggleReveal = (questionId: string) => {
    setGeneratedQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, isRevealed: !q.isRevealed } : q))
    );
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return {
          label: 'Multiple Choice',
          pill: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
          gradient: 'from-indigo-600 to-blue-600',
        };
      case 'short_answer':
        return {
          label: 'Short Answer',
          pill: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          gradient: 'from-emerald-600 to-teal-600',
        };
      case 'true_false':
        return {
          label: 'True / False',
          pill: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
          gradient: 'from-amber-500 to-orange-500',
        };
      case 'explain':
        return {
          label: 'Conceptual Explain',
          pill: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
          gradient: 'from-purple-600 to-pink-600',
        };
      default:
        return {
          label: type,
          pill: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
          gradient: 'from-slate-600 to-slate-800',
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-8">
      {/* --------------------------------------------------------------------- */}
      {/* 1. Colorful Hero Banner with Pictures & Online / Offline Mode Switch */}
      {/* --------------------------------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden border border-indigo-500/20 dark:border-indigo-500/30 shadow-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 text-white p-6 sm:p-8"
      >
        {/* Top Prismatic Gradient Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-400 via-purple-400 via-pink-400 to-amber-400 animate-gradient" />

        {/* Ambient multi-colored luminous spheres */}
        <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-indigo-500/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 -mb-12 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full bg-pink-500/25 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            {/* Online / Offline Mode Selector Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 backdrop-blur-md border border-amber-400/40 text-amber-200 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
                Adaptive Study Engine
              </span>

              {/* Online / Offline Mode Switcher */}
              <div className="inline-flex p-1 rounded-full bg-black/50 border border-white/20 backdrop-blur-md shadow-inner">
                <button
                  type="button"
                  onClick={() => setOperationalMode('offline')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                    operationalMode === 'offline'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/40 ring-1 ring-white/30'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <WifiOff className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Offline Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOperationalMode('online')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                    operationalMode === 'online'
                      ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/40 ring-1 ring-white/30'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Wifi className="w-3.5 h-3.5 text-amber-300" />
                  <span>Online Mode</span>
                </button>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              {activeFolder ? (
                <span className="flex items-center gap-2.5">
                  <span
                    className="w-4 h-4 rounded-full inline-block shadow-sm"
                    style={{ backgroundColor: activeFolder.color || '#6366f1' }}
                  />
                  <span>Folder: {activeFolder.name}</span>
                </span>
              ) : (
                <span className="bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  Your Personalized Study Workspace
                </span>
              )}
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {operationalMode === 'offline'
                ? '🟢 Offline Mode Active: Extract questions and verified answers directly from your uploaded documents with zero network connection or external API requirement.'
                : '⚡ Online Mode Active: Enhanced with Gemini AI and optional live Google Search grounding for deep conceptual synthesis and citations.'}
            </p>

            {activeFolder && (
              <div className="flex items-center gap-3 pt-1 text-xs text-indigo-200">
                <span className="flex items-center gap-1.5 font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/25 border border-indigo-400/30 text-indigo-100">
                  <FileText className="w-3.5 h-3.5 text-cyan-300" />
                  {activeDocs.length} {activeDocs.length === 1 ? 'document' : 'documents'} uploaded
                </span>
                <span>•</span>
                <span className="text-slate-300">Custom folder active</span>
              </div>
            )}
          </div>

          {/* Right Picture Artwork Card */}
          <div className="hidden sm:flex items-center justify-center shrink-0">
            <div
              className="relative group w-48 h-32 md:w-56 md:h-36 rounded-2xl overflow-hidden border-2 shadow-2xl transition-all duration-300"
              style={{
                borderColor: activeFolder?.color ? `${activeFolder.color}80` : 'rgba(129, 140, 248, 0.5)',
                boxShadow: activeFolder?.color
                  ? `0 10px 30px -5px ${activeFolder.color}50`
                  : '0 10px 30px -5px rgba(99, 102, 241, 0.4)',
              }}
            >
              <img
                src={activeFolder?.imageUrl || NOTEBOOK_FOLDER_ART}
                alt="Study Art"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-bold text-white">
                <span className="truncate">{activeFolder ? activeFolder.name : 'Personal Library'}</span>
                <span
                  className="px-2 py-0.5 rounded-full font-mono text-[9px] shadow-sm"
                  style={{
                    backgroundColor: activeFolder?.color || '#6366f1',
                    color: '#ffffff',
                  }}
                >
                  {operationalMode.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* --------------------------------------------------------------------- */}
      {/* 2. Folders Section: Custom Folders with Pictures & Colors */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Folder className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Your Custom Folders
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 font-semibold">
                {folders.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Name folders whatever you want, pick cover picture artworks, and manage your study materials.
            </p>
          </div>

          <button
            onClick={() => setShowNewFolderModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition active:scale-98 cursor-pointer self-start sm:self-auto"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create New Folder</span>
          </button>
        </div>

        {/* Folders Grid with Pictures and Colors */}
        {folders.length === 0 ? (
          <div className="p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3 bg-white dark:bg-slate-900">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
              <FolderPlus className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Folders Created Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Create your first custom-named folder (e.g. "Biology Notes", "Exam Prep", "My Documents") to start uploading study files.
            </p>
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-sm transition inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Folder</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {folders.map((folder) => {
              const isSelected = activeFolder?.id === folder.id;
              const docCount = documents.filter((d) => d.courseId === folder.id).length;
              const coverImg = getFolderImage(folder);

              return (
                <motion.div
                  key={folder.id}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setActiveFolder(folder)}
                  style={
                    isSelected
                      ? {
                          borderColor: folder.color || '#6366f1',
                          boxShadow: `0 8px 24px -4px ${folder.color || '#6366f1'}35`,
                        }
                      : undefined
                  }
                  className={`group relative rounded-2xl border transition overflow-hidden cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'ring-2 ring-indigo-500/40 bg-white dark:bg-slate-850 shadow-lg'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-xs'
                  }`}
                >
                  {/* Top Folder Color Stripe */}
                  <div
                    className="h-1.5 w-full"
                    style={{ backgroundColor: folder.color || '#6366f1' }}
                  />

                  {/* Folder Cover Image with 2D Art & Hover Sheen */}
                  <div className="relative h-28 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={coverImg}
                      alt={folder.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                    {/* 2D Shimmer Light Sheen on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    {/* Color dot & document counter */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-white font-mono">
                      <span
                        className="w-2.5 h-2.5 rounded-full ring-1 ring-white/50"
                        style={{ backgroundColor: folder.color || '#6366f1' }}
                      />
                      <span>{docCount} {docCount === 1 ? 'file' : 'files'}</span>
                    </div>

                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}

                    <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
                      {editingFolderId === folder.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSaveRename(folder);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1"
                        >
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            autoFocus
                            className="bg-black/80 text-white px-2 py-0.5 rounded text-xs border border-indigo-400 outline-none w-full"
                          />
                          <button
                            type="submit"
                            className="p-1 text-emerald-400 hover:text-emerald-300"
                            title="Save name"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      ) : (
                        <h4 className="font-bold text-sm truncate drop-shadow-sm">{folder.name}</h4>
                      )}
                    </div>
                  </div>

                  {/* Folder Footer with Change Cover, Rename & Delete */}
                  <div className="p-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                    <span className="text-[11px] truncate font-medium">
                      {docCount === 0 ? 'Empty folder' : `${docCount} docs stored`}
                    </span>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setCoverPickerFolder(folder)}
                        className="p-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition"
                        title="Change 2D cover picture"
                      >
                        <Palette className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleStartRename(folder)}
                        className="p-1.5 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/60 rounded-lg transition"
                        title="Rename folder"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete folder "${folder.name}" and all documents inside it?`)) {
                            onDeleteCourse(folder.id);
                          }
                        }}
                        className="p-1.5 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition"
                        title="Delete folder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 3. Document Upload Option: Dedicated Upload Zone & Document Cards */}
      {/* --------------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Upload Documents
              {activeFolder ? (
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  into folder <strong className="text-indigo-600 dark:text-indigo-400 font-bold">"{activeFolder.name}"</strong>
                </span>
              ) : (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  (Please select a folder above first)
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Only documents you upload into this app will appear and be used for question generation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPasteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>Paste Notes</span>
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
            <span>{uploadError}</span>
            <button onClick={() => setUploadError(null)} className="p-1 hover:text-rose-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Drag & Drop File Upload Card */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            handleFilesSelected(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition cursor-pointer flex flex-col items-center justify-center gap-3 overflow-hidden ${
            isDragOver
              ? 'border-indigo-500 bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-pink-50/30 dark:from-indigo-950/60 dark:via-purple-950/30 dark:to-slate-900 ring-4 ring-indigo-500/25'
              : 'border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-indigo-50/20 to-white dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 shadow-xs'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.md,.pdf,.json,.csv,.doc,.docx"
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
            <FileUp className="w-7 h-7" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Click to browse or drop your study documents here
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports on-device document parsing with complete client privacy.
            </p>
          </div>

          {/* Supported Format Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
              .PDF
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              .MD
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
              .TXT
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
              .DOCX
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
              Paste Notes
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/60 shadow-2xs">
              Target folder: {activeFolder ? activeFolder.name : 'No folder selected'}
            </span>
          </div>
        </div>

        {/* Uploaded Documents List in Active Folder */}
        {activeDocs.length > 0 ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {activeDocs.length} uploaded document{activeDocs.length > 1 ? 's' : ''} in "{activeFolder?.name}"
              </span>
              <span>Click a document to preview text</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {activeDocs.map((doc) => {
                const lowerTitle = doc.title.toLowerCase();
                const isPdf = lowerTitle.endsWith('.pdf');
                const isMd = lowerTitle.endsWith('.md');
                const isDoc = lowerTitle.endsWith('.doc') || lowerTitle.endsWith('.docx');
                const isTxt = lowerTitle.endsWith('.txt');

                let badgeColor = 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
                let iconGradient = 'from-amber-500 to-orange-500 text-white';
                let extLabel = 'NOTE';

                if (isPdf) {
                  badgeColor = 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
                  iconGradient = 'from-rose-500 to-red-600 text-white';
                  extLabel = 'PDF';
                } else if (isMd) {
                  badgeColor = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
                  iconGradient = 'from-emerald-500 to-teal-600 text-white';
                  extLabel = 'MD';
                } else if (isDoc) {
                  badgeColor = 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30';
                  iconGradient = 'from-violet-500 to-purple-600 text-white';
                  extLabel = 'DOC';
                } else if (isTxt) {
                  badgeColor = 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30';
                  iconGradient = 'from-sky-500 to-blue-600 text-white';
                  extLabel = 'TXT';
                }

                return (
                  <div
                    key={doc.id}
                    onClick={() => setViewingDoc(doc)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5 transition group shadow-xs hover:shadow-md cursor-pointer relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${iconGradient} flex items-center justify-center shrink-0 shadow-sm shadow-black/10`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {doc.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 font-mono">
                            <span>{doc.wordCount.toLocaleString()} words</span>
                            <span>•</span>
                            <span>{doc.chunks.length} chunks</span>
                          </p>
                        </div>
                      </div>

                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${badgeColor}`}>
                        {extLabel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewingDoc(doc)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition"
                          title="View document text"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete document "${doc.title}"?`)) {
                              onDeleteDocument(doc.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 transition"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            No files uploaded into this folder yet. Drop or paste notes above!
          </div>
        )}
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 4. AI Question & Verified Answer Generator */}
      {/* --------------------------------------------------------------------- */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Generate Questions & Verified Answers
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {operationalMode === 'offline'
                ? '🟢 Offline Engine: Extracts questions, verified model answers, and direct cited quotes from your files on-device.'
                : '⚡ Online Engine: Uses Gemini AI + Google Search grounding for deep conceptual question generation.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                operationalMode === 'offline'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60'
              }`}
            >
              {operationalMode === 'offline' ? (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline (On-Device)</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Online (Gemini)</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Mode Selector (When Online) */}
        {operationalMode === 'online' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setGenerationSource('document')}
              className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-2.5 cursor-pointer ${
                generationSource === 'document'
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20'
                  : 'bg-slate-50 dark:bg-slate-850/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <FileText className="w-4 h-4" />
                </div>
                {generationSource === 'document' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                    Selected
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  From Uploaded Documents
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Synthesize questions and verified model answers cited directly from files in "{activeFolder?.name}".
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setGenerationSource('brainstorm_web')}
              className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-2.5 cursor-pointer ${
                generationSource === 'brainstorm_web'
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20'
                  : 'bg-slate-50 dark:bg-slate-850/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Globe className="w-4 h-4" />
                </div>
                {generationSource === 'brainstorm_web' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white">
                    Selected
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Brainstorm with Web Search
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  AI discovers conceptual questions and answers using live Google Search grounding citations.
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Options Bar: Question Type & Quantity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Question Style
            </label>
            <select
              value={questionType}
              onChange={(e: any) => setQuestionType(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
            >
              <option value="all">Mix: All Question Types</option>
              <option value="multiple_choice">Multiple Choice (4 Options)</option>
              <option value="short_answer">Short Answer Drill</option>
              <option value="true_false">True / False</option>
              <option value="explain">Conceptual Explanation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Question Count ({questionCount})
            </label>
            <input
              type="range"
              min={1}
              max={8}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full accent-indigo-600 mt-2"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Custom Keyword / Focus (Optional)
            </label>
            <input
              type="text"
              value={customFocus}
              onChange={(e) => setCustomFocus(e.target.value)}
              placeholder="e.g. key formulas, dates, definitions..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Generate Button & Progress */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {isGenerating ? (
              <span className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                <RefreshCw className="w-4 h-4 animate-spin" />
                {generationStatus}
              </span>
            ) : (
              <span>Ready to generate {questionCount} questions from "{activeFolder ? activeFolder.name : 'Folder'}"</span>
            )}
          </div>

          <button
            onClick={handleGenerateQuestions}
            disabled={isGenerating || !activeFolder}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/25 transition active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Questions & Answers</span>
              </>
            )}
          </button>
        </div>

        {/* 2D Animated Cognitive Scanner during question generation */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-xl space-y-3"
          >
            {/* 2D Moving Beam Sheen */}
            <motion.div
              animate={{ x: ['-100%', '250%'] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              className="absolute top-0 bottom-0 w-40 bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent pointer-events-none"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                    className="absolute inset-0 rounded-xl border-2 border-indigo-400/20 border-t-indigo-400"
                  />
                  <Zap className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    2D Cognitive Engine Analyzing
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                      {operationalMode.toUpperCase()}
                    </span>
                  </h4>
                  <p className="text-xs text-indigo-200/80">{generationStatus || 'Indexing text segments & extracting validated answers...'}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-xs text-indigo-300">
                <motion.span animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 0.8 }}>●</motion.span>
                <span>Processing</span>
              </div>
            </div>

            {/* 2D Progress Waveform */}
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative">
              <motion.div
                animate={{ width: ['15%', '60%', '92%', '45%', '90%'] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
              />
            </div>
          </motion.div>
        )}

        {/* Web Search Sources Citations (If online web search was used) */}
        {webSources.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 space-y-1.5">
            <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-600" />
              Verified Google Search Grounding Sources ({webSources.length})
            </h4>
            <div className="flex flex-wrap gap-2 pt-1">
              {webSources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-[11px] font-medium text-purple-700 dark:text-purple-300 hover:underline"
                >
                  <span className="truncate max-w-[180px]">{source.title || source.uri}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Generated Questions List with Verified Answers & Practice Mode */}
        {generatedQuestions.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Generated Q&A Set ({generatedQuestions.length} Questions)
                </h4>

                {questionStreak > 1 && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [1, 1.1, 1], opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] font-black flex items-center gap-1 shadow-sm"
                  >
                    <span>🔥</span>
                    <span>{questionStreak} streak!</span>
                  </motion.div>
                )}
              </div>

              <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
                <button
                  onClick={() => setStudyMode('practice')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    studyMode === 'practice'
                      ? 'bg-white dark:bg-slate-750 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Practice Test
                </button>
                <button
                  onClick={() => {
                    setStudyMode('review');
                    setGeneratedQuestions((prev) => prev.map((q) => ({ ...q, isRevealed: true })));
                  }}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    studyMode === 'review'
                      ? 'bg-white dark:bg-slate-750 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Reveal All Answers
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {generatedQuestions.map((item, index) => {
                const typeStyle = getTypeStyle(item.type);
                const isAnswerRevealed = item.isRevealed || studyMode === 'review';

                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    {/* Top Type Gradient Accent */}
                    <div className={`h-1 w-full bg-gradient-to-r ${typeStyle.gradient} absolute top-0 left-0`} />

                    {/* Header: Question Type & Question Index */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${typeStyle.gradient} text-white text-xs font-bold flex items-center justify-center shadow-xs`}>
                          {index + 1}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeStyle.pill}`}>
                          {typeStyle.label}
                        </span>
                      </div>

                      {item.sourceTitle && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[200px] sm:max-w-none">
                          Source: {item.sourceTitle}
                        </span>
                      )}
                    </div>

                    {/* Question Statement */}
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                      {item.question}
                    </h5>

                    {/* Multiple Choice / True-False Options */}
                    {item.options && item.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {item.options.map((option, optIdx) => {
                          const isSelected = item.userSelectedOptionIndex === optIdx;
                          const isCorrect = item.correctOptionIndex === optIdx;

                          let btnStyle = 'bg-slate-50 dark:bg-slate-850/70 border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500';
                          if (isAnswerRevealed) {
                            if (isCorrect) {
                              btnStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold ring-2 ring-emerald-400/40';
                            } else if (isSelected) {
                              btnStyle = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-200';
                            }
                          } else if (isSelected) {
                            btnStyle = 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 text-indigo-800 dark:text-indigo-200 font-bold ring-2 ring-indigo-400/40';
                          }

                          return (
                            <motion.button
                              key={optIdx}
                              type="button"
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleSelectOption(item.id, optIdx)}
                              className={`p-3 rounded-xl border text-xs text-left transition flex items-start gap-2 cursor-pointer ${btnStyle}`}
                            >
                              <span className="w-5 h-5 rounded-md bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border border-slate-200 dark:border-slate-600">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="flex-1 leading-snug">{option}</span>
                              {isAnswerRevealed && isCorrect && (
                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}

                    {/* Reveal Answer Toggle */}
                    <div className="pt-1 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleToggleReveal(item.id)}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                      >
                        {isAnswerRevealed ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>Hide Answer & Explanation</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>Reveal Verified Answer</span>
                          </>
                        )}
                      </button>

                      {isAnswerRevealed && (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified Model Answer
                        </span>
                      )}
                    </div>

                    {/* Answer & Explanation Box */}
                    {isAnswerRevealed && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-indigo-500/5 to-purple-500/5 border border-emerald-500/25 dark:border-emerald-500/20 space-y-2.5 text-xs shadow-inner"
                      >
                        <div className="flex items-start gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white font-bold text-[10px] shrink-0">
                            CORRECT
                          </span>
                          <span className="text-slate-900 dark:text-white font-bold text-sm">
                            {item.correctAnswer}
                          </span>
                        </div>

                        {item.explanation && (
                          <div className="text-slate-600 dark:text-slate-300 leading-relaxed pl-1 border-l-2 border-indigo-400/40">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              Reasoning:
                            </span>{' '}
                            {item.explanation}
                          </div>
                        )}

                        {item.documentExcerpt && (
                          <div className="mt-2 p-3 rounded-xl bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold block mb-1 text-[10px]">
                              📖 CITED DOCUMENT EXCERPT:
                            </span>
                            "{item.documentExcerpt}"
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 5. Modals: Create Folder, Paste Document, View Document */}
      {/* --------------------------------------------------------------------- */}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-600" />
                Create New Folder
              </h3>
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. My Science Notes, Chapter 5 Prep, Research Papers"
                  required
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Color Theme Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Accent Color Tag
                </label>
                <div className="flex flex-wrap gap-2">
                  {FOLDER_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setNewFolderColor(col.hex)}
                      className={`w-7 h-7 rounded-full transition cursor-pointer flex items-center justify-center ${
                        newFolderColor === col.hex ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    >
                      {newFolderColor === col.hex && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2D Cover Artwork Picture Picker */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cover Picture (2D Illustrated Anime/Lab)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCoverPickerForNew(true)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Browse 2D Gallery</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {PRESET_FOLDER_IMAGES.slice(0, 6).map((img) => (
                    <div
                      key={img.id}
                      onClick={() => setNewFolderImage(img.url)}
                      className={`relative h-16 rounded-xl overflow-hidden border transition cursor-pointer group ${
                        newFolderImage === img.url
                          ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={img.name} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <span className="absolute bottom-1 left-1.5 right-1.5 text-[9px] font-bold text-white truncate">
                        {img.name}
                      </span>
                      {newFolderImage === img.url && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Paste Document Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Paste Study Document Notes
              </h3>
              <button
                onClick={() => setShowPasteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePastedDoc} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Document Title
                </label>
                <input
                  type="text"
                  value={pasteTitle}
                  onChange={(e) => setPasteTitle(e.target.value)}
                  placeholder="e.g. Chapter 3 Summary, Lecture Transcript..."
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Content / Text
                </label>
                <textarea
                  rows={8}
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder="Paste lecture text, notes, book excerpts here. The AI will use this text to extract questions and verified answers."
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25"
                >
                  Save Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document View Inspector Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-md">
                    {viewingDoc.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {viewingDoc.wordCount.toLocaleString()} words • {viewingDoc.chunks.length} chunks
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingDoc(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {viewingDoc.content}
            </div>

            <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
              <span>Indexed on-device for RAG & Question extraction</span>
              <button
                onClick={() => setViewingDoc(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2D Illustrated Cover Picture Selector Modal for Existing Folder */}
      {coverPickerFolder && (
        <CoverImageSelectorModal
          isOpen={!!coverPickerFolder}
          folderName={coverPickerFolder.name}
          selectedImageUrl={coverPickerFolder.imageUrl || ''}
          onSelectImage={(preset) => handleApplyCoverToFolder(coverPickerFolder, preset)}
          onClose={() => setCoverPickerFolder(null)}
        />
      )}

      {/* 2D Illustrated Cover Picture Selector Modal for New Folder */}
      {showCoverPickerForNew && (
        <CoverImageSelectorModal
          isOpen={showCoverPickerForNew}
          folderName={newFolderName || 'New Folder'}
          selectedImageUrl={newFolderImage}
          onSelectImage={(preset) => {
            setNewFolderImage(preset.url);
            setShowCoverPickerForNew(false);
          }}
          onClose={() => setShowCoverPickerForNew(false)}
        />
      )}

      {/* 2D Animated Study Companion floating avatar with feedback & animations */}
      <AnimatedStudyCompanion
        mood={companionMood}
        streakCount={questionStreak}
        operationalMode={operationalMode}
        onTriggerJoy={() => {
          setCompanionMood('celebrating');
          try {
            confetti({
              particleCount: 40,
              spread: 55,
              origin: { x: 0.9, y: 0.85 },
            });
          } catch {
            // graceful fallback
          }
          setTimeout(() => setCompanionMood('happy'), 2500);
        }}
      />
    </div>
  );
};
