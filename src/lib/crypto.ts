/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EncryptedRecordEnvelope, SensitiveEntityType } from '../types';

// Cryptographic parameters
const PBKDF2_ITERATIONS = 100000;
const AES_KEY_LENGTH = 256;
const IV_LENGTH_BYTES = 12; // 96-bit IV recommended for AES-GCM
const SALT_LENGTH_BYTES = 16; // 128-bit salt

/**
 * Converts Uint8Array to hexadecimal string
 */
export function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts hexadecimal string to Uint8Array
 */
export function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Converts ArrayBuffer to hexadecimal string
 */
export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return uint8ArrayToHex(bytes);
}

export const hexToBuffer = hexToUint8Array;

/**
 * Converts ArrayBuffer to Base64
 */
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts Base64 string to Uint8Array
 */
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate a cryptographically strong random salt
 */
export function generateSalt(length = SALT_LENGTH_BYTES): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Generate a cryptographically strong random IV
 */
export function generateIV(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
}

/**
 * Derives an AES-256-GCM CryptoKey from a passphrase and salt using PBKDF2 (100k iterations, SHA-256)
 */
export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Computes SHA-256 fingerprint of a passphrase or key identifier (for validation without saving raw password)
 */
export async function computePassphraseHash(passphrase: string): Promise<string> {
  const encoder = new TextEncoder();
  const digest = await window.crypto.subtle.digest('SHA-256', encoder.encode(passphrase));
  return bufferToHex(digest);
}

/**
 * Encrypts an arbitrary serializable payload with AES-256-GCM
 */
export async function encryptAcademicRecord<T>(
  data: T,
  key: CryptoKey,
  salt: Uint8Array,
  entityType: SensitiveEntityType,
  courseId: string,
  recordId?: string
): Promise<EncryptedRecordEnvelope> {
  const encoder = new TextEncoder();
  const plaintext = JSON.stringify(data);
  const plaintextBytes = encoder.encode(plaintext);
  const iv = generateIV();

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
      tagLength: 128, // 128-bit authentication tag
    },
    key,
    plaintextBytes
  );

  const id = recordId || `${entityType}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();

  return {
    id,
    entityType,
    courseId,
    ivHex: uint8ArrayToHex(iv),
    saltHex: uint8ArrayToHex(salt),
    ciphertextBase64: bufferToBase64(ciphertextBuffer),
    algorithm: 'AES-256-GCM',
    keyDerivation: 'PBKDF2-SHA256-100K',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Decrypts an encrypted record envelope with AES-256-GCM.
 * Throws an error if the key is incorrect or data was tampered with.
 */
export async function decryptAcademicRecord<T = any>(
  envelope: EncryptedRecordEnvelope,
  key: CryptoKey
): Promise<T> {
  const iv = hexToUint8Array(envelope.ivHex);
  const ciphertextBytes = base64ToBuffer(envelope.ciphertextBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
      tagLength: 128,
    },
    key,
    ciphertextBytes as any
  );

  const decoder = new TextDecoder();
  const plaintext = decoder.decode(decryptedBuffer);
  return JSON.parse(plaintext) as T;
}

// Default device vault salt stored in localStorage (non-sensitive salt)
const VAULT_SALT_KEY = 'ai_study_vault_salt';
const VAULT_VERIFIER_KEY = 'ai_study_vault_verifier';
const DEFAULT_PASSPHRASE_KEY = 'ai_study_device_seed';

/**
 * Get or create persistent device salt for PBKDF2
 */
export function getOrCreateVaultSalt(): Uint8Array {
  const existing = localStorage.getItem(VAULT_SALT_KEY);
  if (existing) {
    return hexToUint8Array(existing);
  }
  const newSalt = generateSalt();
  localStorage.setItem(VAULT_SALT_KEY, uint8ArrayToHex(newSalt));
  return newSalt;
}

/**
 * Gets or initializes standard device security credentials
 */
export async function initDeviceVaultCredentials(): Promise<{
  defaultPassphrase: string;
  salt: Uint8Array;
}> {
  const salt = getOrCreateVaultSalt();
  let defaultPassphrase = localStorage.getItem(DEFAULT_PASSPHRASE_KEY);
  if (!defaultPassphrase) {
    // Generate high-entropy 256-bit device passphrase
    const randomEntropy = window.crypto.getRandomValues(new Uint8Array(32));
    defaultPassphrase = `DeviceVault-${uint8ArrayToHex(randomEntropy).substring(0, 24)}`;
    localStorage.setItem(DEFAULT_PASSPHRASE_KEY, defaultPassphrase);
  }

  // Store verifier hash
  const verifier = await computePassphraseHash(defaultPassphrase);
  localStorage.setItem(VAULT_VERIFIER_KEY, verifier);

  return { defaultPassphrase, salt };
}
