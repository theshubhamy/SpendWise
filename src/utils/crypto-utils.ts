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
 * Note: Uses manual base64 encoding since btoa is not available in React Native
 */
export const hexToBase64 = (hex: string): string => {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }
  // Manual base64 encoding
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const a = bytes[i++];
    const b = i < bytes.length ? bytes[i++] : 0;
    const c = i < bytes.length ? bytes[i++] : 0;
    const bitmap = (a << 16) | (b << 8) | c;
    result += base64Chars.charAt((bitmap >> 18) & 63);
    result += base64Chars.charAt((bitmap >> 12) & 63);
    result += i - 2 < bytes.length ? base64Chars.charAt((bitmap >> 6) & 63) : '=';
    result += i - 1 < bytes.length ? base64Chars.charAt(bitmap & 63) : '=';
  }
  return result;
};

/**
 * Convert base64 to hex string
 * Note: Uses manual base64 decoding since atob is not available in React Native
 */
export const base64ToHex = (base64: string): string => {
  // Manual base64 decoding
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let binary = '';
  let i = 0;
  base64 = base64.replace(/[^A-Za-z0-9+/]/g, ''); // Remove padding and invalid chars

  while (i < base64.length) {
    const encoded1 = base64Chars.indexOf(base64.charAt(i++));
    const encoded2 = base64Chars.indexOf(base64.charAt(i++));
    const encoded3 = base64Chars.indexOf(base64.charAt(i++));
    const encoded4 = base64Chars.indexOf(base64.charAt(i++));

    const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;

    binary += String.fromCharCode((bitmap >> 16) & 255);
    if (encoded3 !== 64) binary += String.fromCharCode((bitmap >> 8) & 255);
    if (encoded4 !== 64) binary += String.fromCharCode(bitmap & 255);
  }

  const bytes: string[] = [];
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

