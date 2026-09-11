/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Course,
  CourseDocument,
  DocumentChunk,
  EncryptedRecordEnvelope,
  SecurityAuditLog,
  AcademicGradeRecord,
  QuizQuestion,
} from '../types';
import {
  deriveKeyFromPassphrase,
  encryptAcademicRecord,
  initDeviceVaultCredentials,
} from './crypto';

const DB_NAME = 'AIStudyEncryptedDB';
const DB_VERSION = 1;

export interface DBStores {
  courses: Course;
  course_documents: CourseDocument;
  encrypted_records: EncryptedRecordEnvelope;
  audit_logs: SecurityAuditLog;
}

let dbInstance: IDBDatabase | null = null;

export async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Courses Store
      if (!db.objectStoreNames.contains('courses')) {
        const courseStore = db.createObjectStore('courses', { keyPath: 'id' });
        courseStore.createIndex('code', 'code', { unique: false });
        courseStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // 2. Course Documents Store (For RAG retrieval)
      if (!db.objectStoreNames.contains('course_documents')) {
        const docStore = db.createObjectStore('course_documents', { keyPath: 'id' });
        docStore.createIndex('courseId', 'courseId', { unique: false });
        docStore.createIndex('contentHash', 'contentHash', { unique: false });
      }

      // 3. Encrypted Academic Records Store (High Security: AES-256-GCM)
      if (!db.objectStoreNames.contains('encrypted_records')) {
        const encStore = db.createObjectStore('encrypted_records', { keyPath: 'id' });
        encStore.createIndex('courseId', 'courseId', { unique: false });
        encStore.createIndex('entityType', 'entityType', { unique: false });
        encStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 4. Security Audit Logs Store
      if (!db.objectStoreNames.contains('audit_logs')) {
        const auditStore = db.createObjectStore('audit_logs', { keyPath: 'id' });
        auditStore.createIndex('timestamp', 'timestamp', { unique: false });
        auditStore.createIndex('eventType', 'eventType', { unique: false });
      }
    };
  });
}

// ---------------------------------------------------------------------------
// Generic IndexedDB CRUD Helpers
// ---------------------------------------------------------------------------

export async function getAllFromStore<T>(storeName: keyof DBStores): Promise<T[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function getFromStore<T>(storeName: keyof DBStores, key: string): Promise<T | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve((request.result as T) || null);
    request.onerror = () => reject(request.error);
  });
}

export async function putToStore<T>(storeName: keyof DBStores, value: T): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(value);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFromStore(storeName: keyof DBStores, key: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ---------------------------------------------------------------------------
// Security Audit Logger
// ---------------------------------------------------------------------------

export async function logSecurityEvent(
  eventType: SecurityAuditLog['eventType'],
  details: string,
  status: 'SUCCESS' | 'FAILURE' | 'WARNING' = 'SUCCESS',
  entityType?: SecurityAuditLog['entityType']
): Promise<void> {
  const log: SecurityAuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    eventType,
    details,
    status,
    entityType,
  };
  await putToStore('audit_logs', log);
}

// ---------------------------------------------------------------------------
import { PHYSICS_THUMB, ECONOMICS_THUMB, HISTORY_THUMB } from './courseImages';

// ---------------------------------------------------------------------------
// Seed Data Initialization
// ---------------------------------------------------------------------------

export const SEED_COURSES: Course[] = [];

export const SEED_DOCUMENTS: CourseDocument[] = [];

export const SEED_QUIZ_QUESTIONS: QuizQuestion[] = [];

/**
 * Removes legacy demo courses (Principles of Microeconomics, Mechanics, World History, etc.)
 * so ONLY user-created folders and user-uploaded documents are shown.
 */
export async function purgeLegacyCourses(): Promise<void> {
  try {
    const legacyCourseIds = [
      'course_cs201',
      'course_bio101',
      'course_law405',
      'econ_101',
      'phys_101',
      'hist_110',
    ];
    const legacyCodes = ['CS-201', 'BIO-101', 'LAW-405', 'LAW-502', 'ECON-101', 'PHYS-101', 'HIST-110'];
    const legacyTitles = [
      'principles of microeconomics',
      'classical mechanics',
      'world civilizations',
      'introduction to mechanics',
      'legal methods',
    ];

    const allCourses = await getAllFromStore<Course>('courses');
    for (const c of allCourses) {
      const lowerName = (c.name || '').toLowerCase();
      const lowerCode = (c.code || '').toLowerCase();
      const isLegacy =
        legacyCourseIds.includes(c.id) ||
        legacyCodes.map((x) => x.toLowerCase()).includes(lowerCode) ||
        legacyTitles.some((t) => lowerName.includes(t));

      if (isLegacy) {
        await deleteFromStore('courses', c.id);
      }
    }

    const allDocs = await getAllFromStore<CourseDocument>('course_documents');
    for (const d of allDocs) {
      const lowerTitle = (d.title || '').toLowerCase();
      const isLegacyDoc =
        legacyCourseIds.includes(d.courseId) ||
        d.id === 'doc_phys_rotational' ||
        d.id === 'doc_econ_elasticity' ||
        lowerTitle.includes('angular momentum') ||
        lowerTitle.includes('price elasticity');

      if (isLegacyDoc) {
        await deleteFromStore('course_documents', d.id);
      }
    }

    const allEnc = await getAllFromStore<EncryptedRecordEnvelope>('encrypted_records');
    for (const e of allEnc) {
      if (legacyCourseIds.includes(e.courseId)) {
        await deleteFromStore('encrypted_records', e.id);
      }
    }
  } catch (err) {
    console.warn('Legacy course purge note:', err);
  }
}

/**
 * Initializes database and sets up Device Vault
 */
export async function initializeDatabase(): Promise<void> {
  await getDB();

  // Purge any residual legacy hardcoded courses (CS, Bio, Law)
  await purgeLegacyCourses();

  // Initialize Device Vault credentials if not yet set up
  try {
    const { defaultPassphrase, salt } = await initDeviceVaultCredentials();
    await deriveKeyFromPassphrase(defaultPassphrase, salt);

    await logSecurityEvent(
      'VAULT_INITIALIZED',
      'Encrypted database store initialized with AES-256-GCM & PBKDF2 key derivation.'
    );
  } catch (err) {
    console.error('Failed to initialize vault credentials:', err);
  }
}

export const initDB = initializeDatabase;
