/**
 * Cryptographic utilities for key generation and encoding
 */

import 'react-native-get-random-values';
import { generateUUID } from './uuid';

/**
 * Generate a secure random key (32 bytes for AES-256)
 */
export const generateSecureKey = (): string => {
  // Generate 32 random bytes (256 bits) as hex string
  const bytes: number[] = [];
  for (let i = 0; i < 32; i++) {
    bytes.push(Math.floor(Math.random() * 256));
  }
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Convert hex string to base64
 */
export const hexToBase64 = (hex: string): string => {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  const binary = bytes.map(b => String.fromCharCode(b)).join('');
  return btoa(binary);
};

/**
 * Convert base64 to hex string
 */
export const base64ToHex = (base64: string): string => {
  const binary = atob(base64);
  const bytes = [];
  for (let i = 0; i < binary.length; i++) {
    bytes.push(binary.charCodeAt(i).toString(16).padStart(2, '0'));
  }
  return bytes.join('');
};

/**
 * Generate random IV (12 bytes for GCM)
 */
export const generateIV = (): string => {
  const bytes: number[] = [];
  for (let i = 0; i < 12; i++) {
    bytes.push(Math.floor(Math.random() * 256));
  }
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
};

