/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Course, CourseDocument, NavigationTab, VaultState, StudyCalendarEvent } from './types';
import {
  initDB,
  getAllFromStore,
  putToStore,
  deleteFromStore,
  logSecurityEvent,
  purgeLegacyCourses,
  SEED_COURSES,
  SEED_DOCUMENTS,
} from './lib/db';
import {
  deriveKeyFromPassphrase,
  generateSalt,
  hexToUint8Array,
  uint8ArrayToHex,
} from './lib/crypto';
import { getCalendarEvents } from './lib/calendarStorage';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { CourseModal } from './components/CourseModal';
import { HomeDashboardView } from './components/HomeDashboardView';
import { StudyTabView } from './components/StudyTabView';
import { EncryptedVaultView } from './components/EncryptedVaultView';
import { LandingPage } from './components/landing/LandingPage';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useSyncStatus } from './hooks/useSyncStatus';
import { enqueueMutation } from './lib/syncEngine';
import { ShieldCheck, WifiOff, RefreshCw } from 'lucide-react';

const DEFAULT_PASSPHRASE = 'academic-vault-2026';
const SALT_STORAGE_KEY = 'aistudy_vault_salt_hex';

export default function App() {
  const isOnline = useOnlineStatus();
  const { status: syncStatus } = useSyncStatus();
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [documents, setDocuments] = useState<CourseDocument[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<StudyCalendarEvent[]>([]);
  const [studyLaunchEvent, setStudyLaunchEvent] = useState<StudyCalendarEvent | null>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [viewMode, setViewMode] = useState<'landing' | 'app'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'app' || params.get('app') === 'true') {
        return 'app';
      }
    }
    return 'landing';
  });

  // Vault Cryptographic State
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [vaultSalt, setVaultSalt] = useState<Uint8Array>(new Uint8Array(16));
  const [vaultState, setVaultState] = useState<VaultState>({
    isUnlocked: false,
    keyDerivationAlgorithm: 'PBKDF2-100k-SHA256',
    cipherAlgorithm: 'AES-256-GCM',
    hasCustomPassphrase: false,
  });

  // 1. Initialize IndexedDB & Cryptographic Key Derivation on App Load
  useEffect(() => {
    const bootstrapApp = async () => {
      try {
        await initDB();

        // Retrieve or generate device salt for PBKDF2
        let saltHex = localStorage.getItem(SALT_STORAGE_KEY);
        let salt: Uint8Array;
        if (!saltHex) {
          salt = generateSalt(16);
          saltHex = uint8ArrayToHex(salt);
          localStorage.setItem(SALT_STORAGE_KEY, saltHex);
        } else {
          salt = hexToUint8Array(saltHex);
        }
        setVaultSalt(salt);

        // Derive initial key with default passphrase for immediate seamless usability
        try {
          const derivedKey = await deriveKeyFromPassphrase(DEFAULT_PASSPHRASE, salt);
          setCryptoKey(derivedKey);
          setVaultState({
            isUnlocked: true,
            keyDerivationAlgorithm: 'PBKDF2-100k-SHA256',
            cipherAlgorithm: 'AES-256-GCM',
            hasCustomPassphrase: false,
            unlockedAt: new Date().toISOString(),
          });
          await logSecurityEvent('VAULT_UNLOCKED', 'Vault unlocked during session initialization', 'SUCCESS');
        } catch (cryptoErr) {
          console.error('Failed to derive initial crypto key:', cryptoErr);
        }

        // Purge any legacy courses (Principles of Microeconomics, Mechanics, etc.)
        await purgeLegacyCourses();

        // Fetch stored courses (only what user created/uploaded)
        const storedCourses = await getAllFromStore<Course>('courses');
        setCourses(storedCourses);
        if (storedCourses.length > 0) {
          setCurrentCourse(storedCourses[0]);
        } else {
          setCurrentCourse(null);
        }

        // Fetch documents (only what user uploaded)
        const storedDocs = await getAllFromStore<CourseDocument>('course_documents');
        setDocuments(storedDocs);

        // Load calendar events
        const events = getCalendarEvents();
        setCalendarEvents(events);

        setActiveTab('home');
      } catch (err) {
        console.error('Failed to initialize applet database:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    bootstrapApp();
  }, []);

  // Filter course-scoped documents
  const currentCourseDocs = documents.filter(
    (d) => currentCourse && d.courseId === currentCourse.id
  );

  // Vault Management Handlers
  const handleUnlockVault = async (passphrase: string): Promise<boolean> => {
    try {
      const derivedKey = await deriveKeyFromPassphrase(passphrase, vaultSalt);
      setCryptoKey(derivedKey);
      setVaultState((prev) => ({
        ...prev,
        isUnlocked: true,
        unlockedAt: new Date().toISOString(),
      }));
      await logSecurityEvent('VAULT_UNLOCKED', 'Vault unlocked by user with passphrase', 'SUCCESS');
      return true;
    } catch (err) {
      console.error('Vault unlock error:', err);
      await logSecurityEvent('VAULT_UNLOCKED', 'Vault unlock failed (incorrect passphrase)', 'FAILURE');
      return false;
    }
  };

  const handleLockVault = async () => {
    setCryptoKey(null);
    setVaultState((prev) => ({
      ...prev,
      isUnlocked: false,
      unlockedAt: undefined,
    }));
    await logSecurityEvent('VAULT_LOCKED', 'Vault locked and in-memory AES keys zeroed', 'SUCCESS');
  };

  const handleChangePassphrase = async (newPassphrase: string) => {
    const newSalt = generateSalt(16);
    const newSaltHex = uint8ArrayToHex(newSalt);
    localStorage.setItem(SALT_STORAGE_KEY, newSaltHex);
    setVaultSalt(newSalt);

    const derivedKey = await deriveKeyFromPassphrase(newPassphrase, newSalt);
    setCryptoKey(derivedKey);
    setVaultState((prev) => ({
      ...prev,
      isUnlocked: true,
      hasCustomPassphrase: true,
      unlockedAt: new Date().toISOString(),
    }));
    await logSecurityEvent('VAULT_PASSPHRASE_CHANGED', 'User updated vault master passphrase', 'SUCCESS');
  };

  // Course Management Handlers
  const handleSelectCourse = (course: Course | null) => {
    setCurrentCourse(course);
  };

  const handleDeselectCourse = () => {
    setCurrentCourse(null);
  };

  const handleAddCourse = async (newCourse: Course) => {
    await putToStore('courses', newCourse);
    await enqueueMutation('course', 'create', newCourse.id, newCourse);
    setCourses((prev) => [...prev, newCourse]);
    setCurrentCourse(newCourse);
  };

  const handleUpdateCourse = async (updatedCourse: Course) => {
    await putToStore('courses', updatedCourse);
    await enqueueMutation('course', 'update', updatedCourse.id, updatedCourse);
    setCourses((prev) => prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c)));
    if (currentCourse?.id === updatedCourse.id) {
      setCurrentCourse(updatedCourse);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    await deleteFromStore('courses', courseId);
    await enqueueMutation('course', 'delete', courseId, { id: courseId });
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    if (currentCourse?.id === courseId) {
      setCurrentCourse(null);
    }
  };

  const handleDocumentAdded = async (newDoc: CourseDocument) => {
    await enqueueMutation('document', 'create', newDoc.id, newDoc);
    setDocuments((prev) => [...prev, newDoc]);
  };

  const handleDeleteDocument = async (docId: string) => {
    await deleteFromStore('course_documents', docId);
    await enqueueMutation('document', 'delete', docId, { id: docId });
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleNavigateToStudy = (course?: Course, event?: StudyCalendarEvent) => {
    if (course) setCurrentCourse(course);
    setStudyLaunchEvent(event || null);
    setActiveTab('study');
  };

  if (viewMode === 'landing') {
    return <LandingPage onLaunchWebApp={() => setViewMode('app')} />;
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex items-center justify-center p-4 transition-colors">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-600/30">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Initializing AI Study Platform</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Mounting IndexedDB schema & initializing AES-256 cryptographic vault...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white antialiased transition-colors relative overflow-x-hidden">
      {/* Dynamic Ambient Background Color Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-pink-500/15 blur-3xl opacity-75 dark:opacity-35" />
        <div className="absolute top-1/3 -left-36 w-96 h-96 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-500/15 to-indigo-500/15 blur-3xl opacity-75 dark:opacity-30" />
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 rounded-full bg-gradient-to-tl from-emerald-500/15 via-teal-500/15 to-amber-500/10 blur-3xl opacity-60 dark:opacity-25" />
      </div>

      {/* Offline & Cloud Sync Status Bar Notice */}
      {!isOnline && (
        <div className="bg-amber-50 dark:bg-amber-950/90 border-b border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-4 py-1.5 text-xs text-center flex items-center justify-center gap-2 font-medium">
          <WifiOff className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 animate-pulse" />
          <span>Offline Study Mode: Course notes, flashcards & local RAG are accessible offline. Cloud AI synthesis will resume when online.</span>
        </div>
      )}
      {isOnline && syncStatus === 'syncing' && (
        <div className="bg-indigo-50 dark:bg-indigo-950/90 border-b border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 px-4 py-1.5 text-xs text-center flex items-center justify-center gap-2 font-medium">
          <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
          <span>Syncing offline study progress with cloud...</span>
        </div>
      )}

      {/* Main App Header */}
      <Header
        currentCourse={currentCourse}
        courses={courses}
        vaultState={vaultState}
        onSelectCourse={handleSelectCourse}
        onDeselectCourse={handleDeselectCourse}
        onNavigateToCourses={() => setActiveTab('home')}
        onNavigateToLanding={() => setViewMode('landing')}
        onOpenCourseModal={() => setIsCourseModalOpen(true)}
        onToggleVaultLock={() => {
          if (vaultState.isUnlocked) {
            handleLockVault();
          } else {
            setActiveTab('vault');
          }
        }}
        onOpenVaultTab={() => setActiveTab('vault')}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 overflow-x-hidden">
        {activeTab === 'home' && (
          <HomeDashboardView
            courses={courses}
            currentCourse={currentCourse}
            documents={documents}
            calendarEvents={calendarEvents}
            onSelectCourse={handleSelectCourse}
            onAddCourse={handleAddCourse}
            onDeleteCourse={handleDeleteCourse}
            onDocumentAdded={handleDocumentAdded}
            onDeleteDocument={handleDeleteDocument}
            onNavigateToStudy={handleNavigateToStudy}
          />
        )}

        {activeTab === 'study' && (
          <StudyTabView
            courses={courses}
            currentCourse={currentCourse}
            documents={documents}
            initialEvent={studyLaunchEvent}
            onSelectCourse={handleSelectCourse}
          />
        )}

        {activeTab === 'vault' && (
          <EncryptedVaultView
            vaultState={vaultState}
            cryptoKey={cryptoKey}
            vaultSalt={vaultSalt}
            currentCourse={currentCourse}
            onUnlockVault={handleUnlockVault}
            onLockVault={handleLockVault}
            onChangePassphrase={handleChangePassphrase}
          />
        )}
      </main>

      {/* Course Selection & Enrollment Modal */}
      <CourseModal
        isOpen={isCourseModalOpen}
        courses={courses}
        documents={documents}
        currentCourse={currentCourse}
        onSelectCourse={handleSelectCourse}
        onAddCourse={handleAddCourse}
        onClose={() => setIsCourseModalOpen(false)}
      />

      {/* Mobile-first Touch Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        vaultLocked={!vaultState.isUnlocked}
      />
    </div>
  );
}
