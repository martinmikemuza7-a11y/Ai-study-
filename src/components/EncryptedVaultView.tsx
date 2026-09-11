/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Database,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  AlertTriangle,
  History,
  FileCheck,
  Check,
  Copy,
  Layers,
} from 'lucide-react';
import {
  EncryptedRecordEnvelope,
  SecurityAuditLog,
  VaultState,
  Course,
} from '../types';
import {
  decryptAcademicRecord,
  encryptAcademicRecord,
  deriveKeyFromPassphrase,
} from '../lib/crypto';
import { getAllFromStore, logSecurityEvent, putToStore } from '../lib/db';

interface EncryptedVaultViewProps {
  vaultState: VaultState;
  cryptoKey: CryptoKey | null;
  vaultSalt: Uint8Array;
  currentCourse: Course | null;
  onUnlockVault: (passphrase: string) => Promise<boolean>;
  onLockVault: () => void;
  onChangePassphrase: (newPassphrase: string) => Promise<void>;
}

export const EncryptedVaultView: React.FC<EncryptedVaultViewProps> = ({
  vaultState,
  cryptoKey,
  vaultSalt,
  currentCourse,
  onUnlockVault,
  onLockVault,
  onChangePassphrase,
}) => {
  const [encryptedRecords, setEncryptedRecords] = useState<EncryptedRecordEnvelope[]>([]);
  const [decryptedCache, setDecryptedCache] = useState<Record<string, any>>({});
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'records' | 'schema' | 'audit'>('records');

  // Unlock / Change Passphrase states
  const [passphraseInput, setPassphraseInput] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [showNewPassModal, setShowNewPassModal] = useState(false);
  const [newPassInput, setNewPassInput] = useState('');

  // New Record State
  const [showAddModal, setShowAddModal] = useState(false);
  const [recordTitle, setRecordTitle] = useState('');
  const [recordGrade, setRecordGrade] = useState('A');
  const [recordPercentage, setRecordPercentage] = useState(94);
  const [recordNotes, setRecordNotes] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadVaultData = async () => {
    try {
      const records = await getAllFromStore<EncryptedRecordEnvelope>('encrypted_records');
      setEncryptedRecords(records);

      const logs = await getAllFromStore<SecurityAuditLog>('audit_logs');
      setAuditLogs(logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

      // If unlocked, decrypt records for preview
      if (cryptoKey && records.length > 0) {
        const decryptedMap: Record<string, any> = {};
        for (const record of records) {
          try {
            const data = await decryptAcademicRecord(record, cryptoKey);
            decryptedMap[record.id] = data;
          } catch (e) {
            console.warn(`Could not decrypt record ${record.id}:`, e);
          }
        }
        setDecryptedCache(decryptedMap);
      } else {
        setDecryptedCache({});
      }
    } catch (err) {
      console.error('Error loading vault data:', err);
    }
  };

  useEffect(() => {
    loadVaultData();
  }, [cryptoKey, vaultState.isUnlocked]);

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError('');
    if (!passphraseInput.trim()) return;

    const success = await onUnlockVault(passphraseInput.trim());
    if (!success) {
      setUnlockError('Invalid vault passphrase or key derivation mismatch.');
    } else {
      setPassphraseInput('');
    }
  };

  const handleAddAcademicRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cryptoKey || !recordTitle.trim()) return;

    setIsEncrypting(true);
    try {
      const payload = {
        title: recordTitle.trim(),
        assessmentType: 'exam',
        gradeLetter: recordGrade,
        percentageScore: Number(recordPercentage),
        instructorFeedback: recordNotes.trim(),
        encryptedNotes: recordNotes.trim(),
        timestamp: new Date().toISOString(),
      };

      const envelope = await encryptAcademicRecord(
        payload,
        cryptoKey,
        vaultSalt,
        'academic_grade',
        currentCourse ? currentCourse.id : 'general_vault'
      );

      await putToStore('encrypted_records', envelope);
      await logSecurityEvent(
        'RECORD_ENCRYPTED',
        `Academic grade record encrypted for ${recordTitle}`,
        'SUCCESS',
        'academic_grade'
      );

      setShowAddModal(false);
      setRecordTitle('');
      setRecordNotes('');
      await loadVaultData();
    } catch (err) {
      console.error('Failed to create encrypted record:', err);
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleCopyCiphertext = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 pb-24">
      {/* Vault Master Banner */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 sm:p-6 shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${
                vaultState.isUnlocked
                  ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-indigo-500/20'
                  : 'bg-gradient-to-br from-rose-500 to-rose-700 shadow-rose-500/20'
              }`}
            >
              {vaultState.isUnlocked ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Encrypted Academic Vault
                </h2>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    vaultState.isUnlocked
                      ? 'bg-indigo-950/60 text-indigo-300 border-indigo-700/60'
                      : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                  }`}
                >
                  {vaultState.isUnlocked ? 'DECRYPTED IN MEMORY' : 'ZERO-KNOWLEDGE LOCKED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Zero-knowledge client-side encryption via Web Crypto API (AES-256-GCM + PBKDF2 100k iterations).
              </p>
            </div>
          </div>

          {/* Master Lock / Unlock Action */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {vaultState.isUnlocked ? (
              <button
                onClick={onLockVault}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-md shadow-rose-600/20 active:scale-95"
              >
                <Lock className="w-4 h-4" />
                <span>Lock Vault (Zero Key)</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <form onSubmit={handleUnlockSubmit} className="flex items-center gap-2">
                  <input
                    type="password"
                    value={passphraseInput}
                    onChange={(e) => setPassphraseInput(e.target.value)}
                    placeholder="Enter vault passphrase..."
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition active:scale-95"
                  >
                    Unlock
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {unlockError && (
          <div className="mt-3 bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs p-2.5 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{unlockError}</span>
          </div>
        )}
      </div>

      {/* Vault Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-750 pb-3 mb-5">
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
          <button
            onClick={() => setActiveSubTab('records')}
            className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
              activeSubTab === 'records'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Encrypted Records ({encryptedRecords.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('schema')}
            className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
              activeSubTab === 'schema'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Database Schema</span>
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
              activeSubTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Security Audit Log ({auditLogs.length})</span>
          </button>
        </div>

        {activeSubTab === 'records' && vaultState.isUnlocked && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Encrypted Record</span>
          </button>
        )}
      </div>

      {/* Tab 1: Encrypted Records Inspector */}
      {activeSubTab === 'records' && (
        <div className="space-y-4">
          {encryptedRecords.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-slate-800/40 rounded-2xl border border-slate-700 p-6">
              <ShieldCheck className="w-8 h-8 mx-auto text-slate-500 mb-2" />
              <p className="text-sm font-medium">No encrypted academic records created yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Complete adaptive quizzes or add grade records to encrypt sensitive data with AES-256.
              </p>
            </div>
          ) : (
            encryptedRecords.map((envelope) => {
              const decrypted = decryptedCache[envelope.id];
              return (
                <div
                  key={envelope.id}
                  className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 sm:p-5 space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center text-indigo-300 shrink-0">
                        {vaultState.isUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-white">
                            {envelope.id}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-700">
                            {envelope.entityType}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Encrypted on {new Date(envelope.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-[11px] font-mono text-slate-400">
                      <div>Algorithm: <span className="text-indigo-400">{envelope.algorithm}</span></div>
                      <div>KDF: <span className="text-slate-300">{envelope.keyDerivation}</span></div>
                    </div>
                  </div>

                  {/* Decrypted Plaintext Card (If Unlocked) */}
                  {vaultState.isUnlocked && decrypted ? (
                    <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-emerald-400 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          Decrypted Plaintext Record
                        </span>
                        {decrypted.gradeLetter && (
                          <span className="text-xs font-bold px-2 py-0.5 bg-emerald-900/60 rounded border border-emerald-700">
                            Grade: {decrypted.gradeLetter} ({decrypted.percentageScore}%)
                          </span>
                        )}
                      </div>

                      {decrypted.title && (
                        <div className="font-semibold text-white text-sm">{decrypted.title}</div>
                      )}

                      {decrypted.questionText && (
                        <div className="text-slate-200">
                          <strong>Question:</strong> {decrypted.questionText}
                        </div>
                      )}

                      {decrypted.encryptedNotes && (
                        <div className="text-slate-300 font-serif bg-slate-900/40 p-2 rounded border border-slate-800">
                          "{decrypted.encryptedNotes}"
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Locked View */
                    <div className="bg-slate-900/60 border border-slate-750 rounded-xl p-3 text-xs text-slate-400 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Plaintext is zeroed and locked. Unlock the vault to decrypt in memory.</span>
                    </div>
                  )}

                  {/* Raw AES-256-GCM Envelope Metadata */}
                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-750 font-mono text-[10px] space-y-1.5 text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">96-bit Random IV:</span>
                      <span className="text-indigo-300">{envelope.ivHex}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">128-bit Salt:</span>
                      <span className="text-slate-300 truncate max-w-[280px]">{envelope.saltHex}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                      <span className="text-slate-500">Ciphertext Payload:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 truncate max-w-[200px] sm:max-w-[340px]">
                          {envelope.ciphertextBase64}
                        </span>
                        <button
                          onClick={() => handleCopyCiphertext(envelope.ciphertextBase64, envelope.id)}
                          className="hover:text-white transition"
                          title="Copy ciphertext"
                        >
                          {copiedId === envelope.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Database Schema Inspector */}
      {activeSubTab === 'schema' && (
        <div className="space-y-4">
          <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-2xl p-4 text-xs text-indigo-200">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              IndexedDB Security Architecture & Schema Definition
            </h3>
            <p className="mt-1 text-indigo-300/80 leading-relaxed">
              The database schema strictly segregates non-sensitive course metadata from sensitive academic student records. Student evaluations and notes are stored exclusively in the zero-knowledge <code>encrypted_records</code> store.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Store 1: encrypted_records */}
            <div className="bg-slate-800/80 border border-indigo-500/50 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-300">
                  Store: encrypted_records
                </span>
                <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                  AES-256-GCM
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Encrypted envelopes for student grades, academic notes, and quiz histories.
              </p>
              <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-slate-300 space-y-1">
                <div>• <strong>id</strong>: string (Primary Key)</div>
                <div>• <strong>entityType</strong>: 'grade_record' | 'quiz_attempt'</div>
                <div>• <strong>courseId</strong>: string (Indexed)</div>
                <div>• <strong>ivHex</strong>: string (96-bit random IV)</div>
                <div>• <strong>saltHex</strong>: string (128-bit PBKDF2 salt)</div>
                <div>• <strong>ciphertextBase64</strong>: string (AES-GCM output)</div>
                <div>• <strong>algorithm</strong>: "AES-256-GCM"</div>
                <div>• <strong>keyDerivation</strong>: "PBKDF2-100k-SHA256"</div>
              </div>
            </div>

            {/* Store 2: courses */}
            <div className="bg-slate-800/80 border border-slate-750 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-200">
                  Store: courses
                </span>
                <span className="text-[10px] font-semibold bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                  Metadata
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Course catalog, syllabi, topic structures, and Bayesian mastery levels.
              </p>
              <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-slate-300 space-y-1">
                <div>• <strong>id</strong>: string (Primary Key)</div>
                <div>• <strong>code</strong>: string (e.g. CS-201)</div>
                <div>• <strong>name</strong>: string</div>
                <div>• <strong>instructor</strong>: string</div>
                <div>• <strong>term</strong>: string</div>
                <div>• <strong>topics</strong>: Array&lt;CourseTopic&gt;</div>
              </div>
            </div>

            {/* Store 3: course_documents */}
            <div className="bg-slate-800/80 border border-slate-750 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-200">
                  Store: course_documents
                </span>
                <span className="text-[10px] font-semibold bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                  RAG Chunks
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Chunked text passages and inverted indices for offline BM25 retrieval.
              </p>
              <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-slate-300 space-y-1">
                <div>• <strong>id</strong>: string (Primary Key)</div>
                <div>• <strong>courseId</strong>: string (Indexed)</div>
                <div>• <strong>title</strong>: string</div>
                <div>• <strong>category</strong>: 'lecture_notes' | 'textbook'</div>
                <div>• <strong>chunks</strong>: Array&lt;DocumentChunk&gt;</div>
                <div>• <strong>wordCount</strong>: number</div>
              </div>
            </div>

            {/* Store 4: audit_logs */}
            <div className="bg-slate-800/80 border border-slate-750 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-200">
                  Store: audit_logs
                </span>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  Security Log
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Tamper-evident audit trail capturing cryptographic operations.
              </p>
              <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-slate-300 space-y-1">
                <div>• <strong>id</strong>: string (Primary Key)</div>
                <div>• <strong>eventType</strong>: 'RECORD_ENCRYPTED' | 'VAULT_UNLOCKED'</div>
                <div>• <strong>description</strong>: string</div>
                <div>• <strong>status</strong>: 'SUCCESS' | 'FAILURE'</div>
                <div>• <strong>timestamp</strong>: string (ISO)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Security Audit Log Feed */}
      {activeSubTab === 'audit' && (
        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-200">
                      {log.eventType}
                    </span>
                    <span className="text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 px-1.5 py-0.2 rounded font-mono">
                      {log.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">{log.description}</p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add New Encrypted Academic Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl text-slate-100 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">
                  Encrypt New Academic Record
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAcademicRecord} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Assessment / Record Title
                </label>
                <input
                  type="text"
                  required
                  value={recordTitle}
                  onChange={(e) => setRecordTitle(e.target.value)}
                  placeholder="e.g., Midterm Exam Evaluation"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Letter Grade
                  </label>
                  <select
                    value={recordGrade}
                    onChange={(e) => setRecordGrade(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="A+">A+ (98%)</option>
                    <option value="A">A (94%)</option>
                    <option value="A-">A- (90%)</option>
                    <option value="B+">B+ (87%)</option>
                    <option value="B">B (83%)</option>
                    <option value="Pass">Pass</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Score Percentage (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={recordPercentage}
                    onChange={(e) => setRecordPercentage(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Sensitive Professor Notes / Feedback
                </label>
                <textarea
                  rows={3}
                  value={recordNotes}
                  onChange={(e) => setRecordNotes(e.target.value)}
                  placeholder="Exemplary algorithmic proof on AVL rebalancing. Minor edge-case omission in node deletion."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-serif leading-relaxed"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-750 py-2 text-xs font-medium text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEncrypting}
                  className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2 text-xs font-semibold text-white transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isEncrypting ? 'Encrypting with AES-256...' : 'Encrypt & Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
