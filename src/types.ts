/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NavigationTab = 'home' | 'study' | 'vault' | 'courses' | 'tutor' | 'docs' | 'quiz' | 'analytics';

export type StudyMethod = 'multiple_choice' | 'short_answer' | 'true_false' | 'explain';

export interface StudyCalendarEvent {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  courseColor: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  studyMethod: StudyMethod;
  targetQuestions: number;
  completed?: boolean;
  completedAt?: string;
  score?: number;
}

export interface StudyQuestionItem {
  id: string;
  courseId: string;
  topicId?: string;
  topicName?: string;
  method: StudyMethod;
  question: string;
  options?: string[]; // for multiple_choice & true_false
  correctOptionIndex?: number;
  correctAnswer: string; // AI generated question and its answer first
  explanation: string; // Explanation of why the answer is correct
  keyPoints?: string[];
  sourceTitle?: string;
  difficulty?: AdaptiveDifficulty;
}

export type AdaptiveDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'mastery';

export interface CourseTopic {
  id: string;
  name: string;
  description: string;
  masteryPercentage: number; // 0-100
  questionsAnswered: number;
  lastStudiedAt: string;
}

export interface Folder {
  id: string;
  name: string; // User-defined custom folder name
  color: string;
  iconName?: string;
  imageUrl?: string;
  topics?: CourseTopic[];
  createdAt: string;
  updatedAt: string;
  // Optional backwards compatibility
  code?: string;
  instructor?: string;
  term?: string;
}

export type Course = Folder;

export interface GeneratedQAItem {
  id: string;
  question: string;
  type: 'multiple_choice' | 'short_answer' | 'true_false' | 'explain';
  options?: string[];
  correctOptionIndex?: number;
  correctAnswer: string;
  explanation: string;
  documentExcerpt?: string;
  sourceTitle?: string;
  sourceType?: 'document' | 'web';
  webSources?: { uri: string; title: string }[];
  userAnswer?: string;
  userSelectedOptionIndex?: number;
  isRevealed?: boolean;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  courseId: string;
  chunkIndex: number;
  title: string;
  content: string;
  tokensCount: number;
  keywords: string[];
}

export interface CourseDocument {
  id: string;
  courseId: string;
  title: string;
  category: 'lecture_notes' | 'textbook_excerpt' | 'syllabus' | 'cheat_sheet' | 'lab_manual';
  content: string;
  contentHash: string;
  wordCount: number;
  chunks: DocumentChunk[];
  uploadedAt: string;
  updatedAt: string;
}

export type SensitiveEntityType = 
  | 'academic_grade' 
  | 'topic_mastery' 
  | 'quiz_attempt' 
  | 'tutor_history' 
  | 'study_journal' 
  | 'student_profile';

export interface EncryptedRecordEnvelope {
  id: string;
  entityType: SensitiveEntityType;
  courseId: string;
  ivHex: string;
  saltHex: string;
  ciphertextBase64: string;
  algorithm: 'AES-256-GCM';
  keyDerivation: 'PBKDF2-SHA256-100K';
  createdAt: string;
  updatedAt: string;
}

export interface AcademicGradeRecord {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  currentGrade: string; // e.g., "A-", "92.4%"
  gpaCredits: number;
  letterScale: string;
  assessmentScores: {
    assessmentName: string;
    score: number;
    maxScore: number;
    weightPercent: number;
    date: string;
  }[];
  privateNotes: string;
}

export interface QuizQuestion {
  id: string;
  courseId: string;
  topicId: string;
  topicName: string;
  difficulty: AdaptiveDifficulty;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  citedDocumentChunkId?: string;
  citedDocumentTitle?: string;
  citedPassageExcerpt?: string;
}

export interface QuizAttemptRecord {
  id: string;
  courseId: string;
  topicId: string;
  questionId: string;
  questionText: string;
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
  difficulty: AdaptiveDifficulty;
  timestamp: string;
  weakConceptIdentified?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isOfflineLocal?: boolean;
  groundedChunks?: {
    chunkId: string;
    documentTitle: string;
    score: number;
    snippet: string;
  }[];
  suggestedPrompts?: string[];
}

export interface TutorHistoryRecord {
  id: string;
  courseId: string;
  topicId?: string;
  sessionTitle: string;
  messages: ChatMessage[];
  lastMessageAt: string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  eventType: 
    | 'VAULT_INITIALIZED' 
    | 'PASSPHRASE_AUTHENTICATED' 
    | 'RECORD_ENCRYPTED' 
    | 'RECORD_DECRYPTED' 
    | 'VAULT_LOCKED' 
    | 'VAULT_UNLOCKED' 
    | 'VAULT_PASSPHRASE_CHANGED'
    | 'ENCRYPTED_BACKUP_EXPORTED' 
    | 'KEY_DERIVATION_SUCCESS';
  details: string;
  entityType?: SensitiveEntityType;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
}

export interface VaultState {
  isUnlocked: boolean;
  hasKey?: boolean;
  masterKeyHash?: string;
  totalEncryptedRecords?: number;
  cipherAlgorithm?: string;
  keyDerivationDetails?: string;
  keyDerivationAlgorithm?: string;
  hasCustomPassphrase?: boolean;
  lastUnlockedAt?: string;
  unlockedAt?: string;
}

export interface RAGSearchResult {
  chunk: DocumentChunk;
  score: number; // 0 to 1
  matchedKeywords: string[];
}
