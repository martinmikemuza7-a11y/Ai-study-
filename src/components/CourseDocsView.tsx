/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Folder,
  FolderOpen,
  Layers,
  Upload,
  Hash,
  Clock,
  Sparkles,
  ChevronRight,
  X,
  FileCheck,
  Trash2,
  MessageSquareQuote,
  Check,
} from 'lucide-react';
import { Course, CourseDocument, NavigationTab } from '../types';
import { chunkDocumentText } from '../lib/rag';
import { putToStore } from '../lib/db';

interface CourseDocsViewProps {
  currentCourse: Course | null;
  documents: CourseDocument[];
  onDocumentAdded: (doc: CourseDocument) => void;
  onDeleteDocument?: (docId: string) => void;
  onPickCourse?: () => void;
  availableCourses?: Course[];
  onSelectCourse?: (course: Course) => void;
  onNavigateToTab?: (tab: NavigationTab) => void;
}

export const CourseDocsView: React.FC<CourseDocsViewProps> = ({
  currentCourse,
  documents,
  onDocumentAdded,
  onDeleteDocument,
  onPickCourse,
  availableCourses = [],
  onSelectCourse,
  onNavigateToTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<CourseDocument | null>(documents[0] || null);
  const [activeTab, setActiveTab] = useState<'reader' | 'chunks'>('reader');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Upload Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<CourseDocument['category']>('lecture_notes');
  const [newContent, setNewContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Update selectedDoc if documents list changes
  React.useEffect(() => {
    if (!selectedDoc && documents.length > 0) {
      setSelectedDoc(documents[0]);
    } else if (selectedDoc && !documents.some((d) => d.id === selectedDoc.id)) {
      setSelectedDoc(documents[0] || null);
    }
  }, [documents, selectedDoc]);

  if (!currentCourse) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-5 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center text-indigo-400 mx-auto shadow-inner">
          <Folder className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">No Course Folder Selected</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1.5">
            Each course operates as a dedicated folder where syllabus files, slides, and notes are stored. The AI parses files in the active folder for RAG answering and quiz generation.
          </p>
        </div>

        {onPickCourse && (
          <button
            onClick={onPickCourse}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-95"
          >
            <FolderOpen className="w-4 h-4" />
            Pick or Create a Course Folder
          </button>
        )}

        {availableCourses.length > 0 && (
          <div className="pt-6 border-t border-slate-800 max-w-sm mx-auto text-left">
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Quick Select Course Folder:
            </span>
            <div className="space-y-1.5">
              {availableCourses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectCourse && onSelectCourse(c)}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 text-xs text-slate-200 flex items-center justify-between transition group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Folder
                      className="w-4 h-4 shrink-0"
                      style={{ color: c.color }}
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

  const filteredDocs = documents.filter((doc) => {
    const q = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.content.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q)
    );
  });

  const handleFileProcess = (file: File) => {
    setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setNewContent(text || '');
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsProcessing(true);
    const docId = `doc_${currentCourse.id}_${Date.now()}`;
    const words = newContent.trim().split(/\s+/).length;

    // Split into overlapping semantic RAG chunks with BM25 indexing
    const chunks = chunkDocumentText(docId, currentCourse.id, newTitle.trim(), newContent.trim());

    const newDoc: CourseDocument = {
      id: docId,
      courseId: currentCourse.id,
      title: newTitle.trim(),
      category: newCategory,
      content: newContent.trim(),
      contentHash: `hash_${Date.now().toString(36)}`,
      wordCount: words,
      chunks,
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await putToStore('course_documents', newDoc);
    onDocumentAdded(newDoc);
    setSelectedDoc(newDoc);
    setIsProcessing(false);
    setShowUploadModal(false);
    setNewTitle('');
    setNewContent('');
  };

  const handleDeleteCurrentDoc = (docId: string) => {
    if (confirm('Delete this document from this course folder? AI RAG and quiz generation will no longer reference it.')) {
      if (onDeleteDocument) {
        onDeleteDocument(docId);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 pb-28 space-y-5">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs px-2.5 py-0.5 rounded font-mono font-semibold flex items-center gap-1.5"
              style={{ backgroundColor: `${currentCourse.color}25`, color: currentCourse.color }}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Folder: {currentCourse.code}
            </span>
            <span className="text-xs text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
              {documents.length} {documents.length === 1 ? 'file stored' : 'files stored'}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {currentCourse.name} — Folder Files & Storage
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Files stored in this course folder are parsed by the AI to build local semantic RAG indices. The AI uses these files to answer your questions in the Tutor and dynamically construct practice questions in the Quiz tab.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/30 active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Store File in Folder</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar Document List + Main Document Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Document List Sidebar */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files in folder..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {filteredDocs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 bg-slate-900 rounded-2xl border border-dashed border-slate-800 p-5 space-y-2">
                <Folder className="w-8 h-8 mx-auto text-slate-600" />
                <p className="font-medium text-slate-300">No files in this folder yet</p>
                <p className="text-[11px] text-slate-500">
                  Upload lecture slides, notes, or syllabus texts so the AI can use them for RAG and quizzes.
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add First File
                </button>
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`cursor-pointer rounded-xl p-3 border transition ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/70 ring-1 ring-indigo-500/50 shadow-md'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                        <h4 className="text-xs font-semibold text-white line-clamp-1">
                          {doc.title}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0 border border-slate-700">
                        {doc.category.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 font-serif">
                      {doc.content.slice(0, 110)}...
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 text-indigo-300 font-mono">
                        <Layers className="w-3 h-3" />
                        {doc.chunks.length} RAG chunks
                      </span>
                      <span>•</span>
                      <span>{doc.wordCount} words</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Document Content Viewer */}
        <div className="lg:col-span-8">
          {selectedDoc ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {/* Document Header & Tab Nav */}
              <div className="px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-850">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-semibold text-white">{selectedDoc.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span className="capitalize">{selectedDoc.category.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{selectedDoc.chunks.length} Semantic Chunks</span>
                    <span>•</span>
                    <span>{selectedDoc.wordCount} Words</span>
                  </div>
                </div>

                {/* Sub-tabs: Full Text vs RAG Chunks Inspector */}
                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      onClick={() => setActiveTab('reader')}
                      className={`px-3 py-1 rounded-lg transition font-medium ${
                        activeTab === 'reader'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Full Text
                    </button>
                    <button
                      onClick={() => setActiveTab('chunks')}
                      className={`px-3 py-1 rounded-lg transition font-medium flex items-center gap-1 ${
                        activeTab === 'chunks'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>RAG Chunks ({selectedDoc.chunks.length})</span>
                    </button>
                  </div>

                  {onDeleteDocument && (
                    <button
                      onClick={() => handleDeleteCurrentDoc(selectedDoc.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Delete file from course folder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Action Banner for RAG & Quiz */}
              <div className="px-5 py-2.5 bg-indigo-950/30 border-b border-indigo-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-indigo-200 text-[11px] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  File indexed for AI Socratic tutoring & custom practice questions.
                </span>
                <div className="flex items-center gap-2">
                  {onNavigateToTab && (
                    <>
                      <button
                        onClick={() => onNavigateToTab('tutor')}
                        className="text-[11px] font-medium text-indigo-300 hover:text-white flex items-center gap-1 bg-indigo-900/50 hover:bg-indigo-800/60 px-2.5 py-1 rounded-lg border border-indigo-700/50 transition"
                      >
                        <MessageSquareQuote className="w-3 h-3" />
                        Ask AI Tutor
                      </button>
                      <button
                        onClick={() => onNavigateToTab('quiz')}
                        className="text-[11px] font-medium text-amber-300 hover:text-white flex items-center gap-1 bg-amber-950/40 hover:bg-amber-900/50 px-2.5 py-1 rounded-lg border border-amber-700/50 transition"
                      >
                        <Sparkles className="w-3 h-3" />
                        Test on this File
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-5 max-h-[60vh] overflow-y-auto">
                {activeTab === 'reader' ? (
                  <div className="space-y-4 text-xs sm:text-sm text-slate-200 font-serif leading-relaxed">
                    {selectedDoc.content.split('\n\n').map((para, pIdx) => {
                      if (para.startsWith('Section ') || para.startsWith('###')) {
                        return (
                          <h4 key={pIdx} className="font-sans font-bold text-sm text-indigo-300 pt-2">
                            {para}
                          </h4>
                        );
                      }
                      return (
                        <p key={pIdx} className="leading-relaxed">
                          {para}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  /* RAG Chunks Inspector View */
                  <div className="space-y-3.5">
                    <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-3 text-xs text-indigo-200 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-white">Local RAG Indexing Details</span>
                        <p className="text-[11px] text-indigo-300/80 mt-0.5">
                          Each chunk below is vectorized with inverted keyword indexes for fast offline BM25 cosine scoring during Socratic tutoring.
                        </p>
                      </div>
                    </div>

                    {selectedDoc.chunks.map((chunk) => (
                      <div
                        key={chunk.id}
                        className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] bg-slate-800 text-indigo-300 px-2 py-0.5 rounded border border-slate-700">
                              Chunk #{chunk.chunkIndex + 1}
                            </span>
                            <h5 className="font-semibold text-slate-200">{chunk.title}</h5>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {chunk.tokensCount} words
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 font-serif leading-relaxed bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                          &ldquo;{chunk.content}&rdquo;
                        </p>

                        {chunk.keywords && chunk.keywords.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider mr-1">
                              Keywords:
                            </span>
                            {chunk.keywords.map((kw, k) => (
                              <span
                                key={k}
                                className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700"
                              >
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-3">
              <Folder className="w-10 h-10 mx-auto text-slate-600" />
              <div>
                <h4 className="text-sm font-semibold text-white">Select or Upload a Course File</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Upload lecture notes or textbook excerpts into this course folder to examine RAG chunks and empower the AI.
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-2 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-md shadow-indigo-600/30"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload / Paste File
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Document / Notes Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl text-slate-100 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">
                  Add File to {currentCourse.code} Folder
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-3.5 mt-4">
              {/* Drag-and-drop & File Selection Box */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-xl p-4 text-center transition cursor-pointer ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-850/50 text-slate-400'
                }`}
              >
                <Upload className="w-6 h-6 mx-auto mb-1.5 text-indigo-400" />
                <p className="text-xs font-medium text-slate-200">
                  Drag and drop a file here, or click to browse
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Supports .txt, .md, .markdown, or .json
                </p>
                <input
                  type="file"
                  accept=".txt,.md,.markdown,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload-input"
                />
                <label
                  htmlFor="file-upload-input"
                  className="mt-2 inline-block px-3 py-1 bg-slate-800 hover:bg-slate-750 text-[11px] font-medium text-slate-200 rounded-lg border border-slate-750 cursor-pointer"
                >
                  Browse Files
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Document Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Chapter 03: Newton's Laws & Harmonic Oscillators"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  File Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="lecture_notes">Lecture Notes</option>
                  <option value="textbook_excerpt">Textbook Excerpt</option>
                  <option value="syllabus">Syllabus / Course Outline</option>
                  <option value="cheat_sheet">Cheat Sheet / Key Theorems</option>
                  <option value="lab_manual">Lab Guide / Problem Set</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Document Body / Text Content <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={7}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Paste lecture notes, textbook passages, or key theorem proofs here... The AI will parse this content for local Socratic RAG and dynamic question-and-answer generation."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-serif leading-relaxed"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-750 py-2 text-xs font-medium text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2 text-xs font-semibold text-white transition shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Folder className="w-3.5 h-3.5" />
                  {isProcessing ? 'Chunking & Indexing...' : 'Save File to Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
