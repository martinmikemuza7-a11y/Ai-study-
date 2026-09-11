/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Volume2,
  VolumeX,
  FileText,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Cpu,
  Globe,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { Course, CourseDocument, ChatMessage, DocumentChunk } from '../types';
import { generateOfflineTutorResponse } from '../lib/localTutor';
import { searchLocalCourseRAG } from '../lib/rag';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface TutorViewProps {
  currentCourse: Course | null;
  courseDocuments: CourseDocument[];
  onPickCourse?: () => void;
  availableCourses?: Course[];
  onSelectCourse?: (course: Course) => void;
}

export const TutorView: React.FC<TutorViewProps> = ({
  currentCourse,
  courseDocuments,
  onPickCourse,
  availableCourses = [],
  onSelectCourse,
}) => {
  const isOnline = useOnlineStatus();
  const [preferOfflineAI, setPreferOfflineAI] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeSpeechMsgId, setActiveSpeechMsgId] = useState<string | null>(null);
  const [selectedCitationChunk, setSelectedCitationChunk] = useState<DocumentChunk | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message scoped to current course
  useEffect(() => {
    if (!currentCourse) {
      setMessages([]);
      return;
    }

    const welcomeMsg: ChatMessage = {
      id: `msg_welcome_${currentCourse.id}`,
      role: 'assistant',
      content: `Hello! I am your course tutor for **${currentCourse.code}: ${currentCourse.name}**.

I am grounded in your syllabus, lecture notes, and textbook excerpts. I can help you:
- Break down challenging theoretical proofs and complex concepts
- Guide you step-by-step using the **Socratic method**
- Test your recall with adaptive questions citing your course material

What topic would you like to explore today?`,
      timestamp: new Date().toISOString(),
      isOfflineLocal: !isOnline || preferOfflineAI,
      suggestedPrompts: currentCourse.topics.slice(0, 3).map((t) => `Explain ${t.name}`),
    };
    setMessages([welcomeMsg]);
  }, [currentCourse?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!currentCourse) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-5 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center text-indigo-400 mx-auto shadow-inner">
          <BookOpen className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">No Course Selected for Tutoring</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1.5">
            The Socratic tutor requires an active course to ground all citations, analogies, and follow-up prompts in your real lecture syllabus.
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

  // Handle Speech Synthesis
  const handleToggleSpeech = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (activeSpeechMsgId === msgId) {
      window.speechSynthesis.cancel();
      setActiveSpeechMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown characters for smooth speech
    const cleanText = text
      .replace(/[*#>`_~-]/g, ' ')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.onend = () => setActiveSpeechMsgId(null);
    utterance.onerror = () => setActiveSpeechMsgId(null);

    setActiveSpeechMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputValue).trim();
    if (!prompt || isTyping) return;

    setInputValue('');

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    const useOffline = !isOnline || preferOfflineAI;

    if (!useOffline) {
      // Try Cloud Gemini 3.8 Flash via server endpoint
      try {
        // Pre-fetch relevant course chunks for server RAG context
        const localMatches = searchLocalCourseRAG(prompt, courseDocuments, 3);
        const ragContext = localMatches.map((m) => ({
          title: m.chunk.title,
          content: m.chunk.content,
        }));

        const res = await fetch('/api/tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            courseCode: currentCourse.code,
            courseName: currentCourse.name,
            courseTopics: currentCourse.topics.map((t) => t.name),
            ragContext,
          }),
        });

        const data = await res.json();

        if (res.ok && data.content) {
          const assistantMsg: ChatMessage = {
            id: `msg_asst_${Date.now()}`,
            role: 'assistant',
            content: data.content,
            timestamp: new Date().toISOString(),
            isOfflineLocal: false,
            groundedChunks: localMatches.map((m) => ({
              chunkId: m.chunk.id,
              documentTitle: m.chunk.title,
              score: m.score,
              snippet: m.chunk.content.substring(0, 140) + '...',
            })),
            suggestedPrompts: [
              'Give me a follow-up challenge question',
              'Show me the formal mathematical definition',
              'Explain with an intuitive real-world analogy',
            ],
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setIsTyping(false);
          return;
        }
      } catch (err) {
        console.warn('Server Gemini call failed or offline, falling back to local Socratic engine:', err);
      }
    }

    // Local Socratic Engine Execution (Runs 100% in browser from IndexedDB RAG cache)
    setTimeout(() => {
      const localResult = generateOfflineTutorResponse(
        prompt,
        currentCourse,
        courseDocuments,
        messages
      );

      const assistantMsg: ChatMessage = {
        id: `msg_asst_${Date.now()}`,
        role: 'assistant',
        content: localResult.content,
        timestamp: new Date().toISOString(),
        isOfflineLocal: true,
        groundedChunks: localResult.groundedChunks,
        suggestedPrompts: localResult.suggestedPrompts,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 450);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto">
      {/* Course & Engine Mode Sub-header */}
      <div className="bg-slate-800/60 border-b border-slate-750 px-4 py-2 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 truncate">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: currentCourse.color }}
          />
          <span className="font-semibold text-slate-200 truncate">
            {currentCourse.code}: {currentCourse.name}
          </span>
          <span className="text-slate-400 hidden sm:inline">
            ({courseDocuments.reduce((acc, d) => acc + d.chunks.length, 0)} indexed RAG chunks)
          </span>
        </div>

        {/* Engine Toggle Pill */}
        <div className="flex items-center gap-1.5 shrink-0 bg-slate-900/80 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setPreferOfflineAI(false)}
            disabled={!isOnline}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center gap-1 ${
              !preferOfflineAI && isOnline
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 disabled:opacity-40'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span className="hidden sm:inline">Gemini Cloud</span>
          </button>
          <button
            onClick={() => setPreferOfflineAI(true)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center gap-1 ${
              preferOfflineAI || !isOnline
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3 h-3" />
            <span>Local AI</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[92%] sm:max-w-[85%] ${
                isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-white ${
                  isAssistant
                    ? msg.isOfflineLocal
                      ? 'bg-amber-600 text-amber-100'
                      : 'bg-indigo-600 text-indigo-100'
                    : 'bg-slate-700 text-slate-200'
                }`}
              >
                {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-2 flex-1">
                <div
                  className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed border ${
                    isAssistant
                      ? 'bg-slate-800/80 border-slate-700 text-slate-100 shadow-sm'
                      : 'bg-indigo-600 border-indigo-500 text-white'
                  }`}
                >
                  {/* Markdown formatted content */}
                  <div className="prose prose-invert prose-xs max-w-none space-y-2">
                    {msg.content.split('\n').map((paragraph, idx) => {
                      if (!paragraph.trim()) return <div key={idx} className="h-1.5" />;

                      // Markdown headings
                      if (paragraph.startsWith('### ')) {
                        return (
                          <h4 key={idx} className="text-xs sm:text-sm font-bold text-indigo-300 mt-2">
                            {paragraph.replace('### ', '')}
                          </h4>
                        );
                      }
                      if (paragraph.startsWith('#### ')) {
                        return (
                          <h5 key={idx} className="text-xs font-semibold text-slate-300 mt-1.5">
                            {paragraph.replace('#### ', '')}
                          </h5>
                        );
                      }
                      // Blockquote
                      if (paragraph.startsWith('> ')) {
                        return (
                          <blockquote
                            key={idx}
                            className="border-l-2 border-indigo-400 pl-2.5 py-1 my-1.5 text-xs text-indigo-200/90 bg-indigo-950/20 rounded-r"
                          >
                            {paragraph.replace('> ', '')}
                          </blockquote>
                        );
                      }
                      // Bullet points
                      if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                        return (
                          <li key={idx} className="list-disc list-inside ml-1 text-slate-200 text-xs">
                            {paragraph.substring(2)}
                          </li>
                        );
                      }

                      return (
                        <p key={idx} className="text-slate-200 text-xs leading-normal">
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>

                  {/* Grounded Citations Drawer Trigger */}
                  {msg.groundedChunks && msg.groundedChunks.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="w-3 h-3 text-indigo-400" />
                        RAG Grounded:
                      </span>
                      {msg.groundedChunks.map((chunk, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            // Find full chunk in documents
                            for (const doc of courseDocuments) {
                              const found = doc.chunks.find((c) => c.id === chunk.chunkId);
                              if (found) {
                                setSelectedCitationChunk(found);
                                return;
                              }
                            }
                          }}
                          className="text-[10px] bg-slate-900/90 hover:bg-slate-700/80 border border-slate-700 text-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1 transition"
                        >
                          <span>{chunk.documentTitle.slice(0, 24)}...</span>
                          <span className="text-[9px] text-emerald-400 font-mono">
                            {Math.round(chunk.score * 100)}%
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Assistant Message Footer: Engine mode badge + Audio reader */}
                  {isAssistant && (
                    <div className="mt-2.5 pt-2 border-t border-slate-750 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        {msg.isOfflineLocal ? (
                          <span className="text-amber-400 flex items-center gap-1">
                            <Cpu className="w-2.5 h-2.5" /> Local Socratic Engine
                          </span>
                        ) : (
                          <span className="text-indigo-400 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Gemini 3.8 Flash (Cloud)
                          </span>
                        )}
                      </span>

                      <button
                        onClick={() => handleToggleSpeech(msg.id, msg.content)}
                        className="hover:text-slate-200 transition flex items-center gap-1 text-[11px]"
                        title={activeSpeechMsgId === msg.id ? 'Stop reading' : 'Read aloud'}
                      >
                        {activeSpeechMsgId === msg.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                            <span className="text-rose-400">Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Socratic Suggested Follow-ups */}
                {isAssistant && msg.suggestedPrompts && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggestedPrompts.map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSendMessage(prompt)}
                        className="text-[11px] text-slate-300 bg-slate-800 hover:bg-slate-750 hover:text-white border border-slate-700 rounded-lg px-2.5 py-1 transition active:scale-95 text-left"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-3 max-w-[80%] mr-auto">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-3 flex items-center gap-1.5 text-xs text-slate-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Retrieving course chunks & formulating Socratic guidance...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form & Quick Action Buttons */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
        {/* Quick Socratic Prompt Starter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => handleSendMessage('Explain the core concept using an intuitive real-world analogy')}
            className="shrink-0 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-full text-[11px] transition"
          >
            💡 Intuitive Analogy
          </button>
          <button
            onClick={() => handleSendMessage('Break this down step-by-step using the Socratic method')}
            className="shrink-0 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-full text-[11px] transition"
          >
            🧭 Socratic Breakdown
          </button>
          <button
            onClick={() => handleSendMessage('Test my understanding with an adaptive quiz question')}
            className="shrink-0 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-full text-[11px] transition"
          >
            🧠 Quiz Me
          </button>
          <button
            onClick={() => handleSendMessage('Quote the exact passage from our course notes')}
            className="shrink-0 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-full text-[11px] transition"
          >
            📑 Show Course Citation
          </button>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ask about ${currentCourse.code} lecture notes or theory...`}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white p-2.5 rounded-xl transition shadow-md shadow-indigo-600/20 active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Selected Citation Chunk Modal */}
      {selectedCitationChunk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl text-slate-100 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white truncate">
                  {selectedCitationChunk.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCitationChunk(null)}
                className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 leading-relaxed text-slate-200 font-serif">
                "{selectedCitationChunk.content}"
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Tokens: {selectedCitationChunk.tokensCount}</span>
                <span>Chunk ID: {selectedCitationChunk.id}</span>
              </div>

              {selectedCitationChunk.keywords && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {selectedCitationChunk.keywords.map((kw, k) => (
                    <span
                      key={k}
                      className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
