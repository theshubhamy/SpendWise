/**
 * Application Constants
 * Core app configuration and settings
 */

export const APP_NAME = 'SpendWise';

// Database
export const DB_NAME = 'spendwise.db';
export const DB_VERSION = 1;

// Encryption
export const ENCRYPTION_ALGORITHM = 'AES-256-GCM';
export const KEY_SIZE = 256;
export const IV_SIZE = 12; // 96 bits for GCM
export const TAG_SIZE = 16; // 128 bits for authentication tag

// Biometric
export const BIOMETRIC_KEY_ALIAS = 'spendwise_biometric_key';
export const ENCRYPTION_KEY_ALIAS = 'spendwise_encryption_key';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;

// Undo History
export const MAX_UNDO_HISTORY = 50;

