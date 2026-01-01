/**
 * Application constants
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

// Storage Keys (MMKV)
export const STORAGE_KEYS = {
  SETTINGS: 'app_settings',
  ENCRYPTION_KEY: 'encryption_key_encrypted',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  AUTO_LOCK_TIMEOUT: 'auto_lock_timeout',
  LAST_ACTIVE_TIME: 'last_active_time',
  BASE_CURRENCY: 'base_currency',
  EXCHANGE_RATES: 'exchange_rates',
  THEME: 'theme',
} as const;

// Default Settings
export const DEFAULT_SETTINGS = {
  BASE_CURRENCY: 'USD',
  BIOMETRIC_ENABLED: false,
  AUTO_LOCK_TIMEOUT: 5, // 5 minutes
  THEME: 'system' as const,
};

// Expense Categories
export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Healthcare',
  'Education',
  'Travel',
  'Personal Care',
  'Subscriptions',
  'Rent',
  'EMI',
  'Other',
] as const;

// Recurring Intervals
export const RECURRING_INTERVALS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
} as const;

// Reminder Types
export const REMINDER_TYPES = {
  BILL_DUE: 'bill_due',
  SUBSCRIPTION: 'subscription',
  RECURRING_EXPENSE: 'recurring_expense',
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  DATE_ONLY: 'yyyy-MM-dd',
} as const;

// Tag Colors (predefined palette)
export const TAG_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
  '#F8B739', // Orange
  '#52BE80', // Green
] as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;

// Undo History
export const MAX_UNDO_HISTORY = 50;

