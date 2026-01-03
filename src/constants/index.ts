/**
 * Application constants
 * Central export file for all constants
 */

// Re-export app constants
export * from './app';

// Re-export category constants
export * from './categories';

// Re-export recurring constants
export * from './recurring';

// Re-export reminder constants
export * from './reminders';


// Re-export date format constants
export * from './dates';

// Storage Keys (MMKV)
export const STORAGE_KEYS = {
  SETTINGS: 'app_settings',
  ENCRYPTION_KEY: 'encryption_key_encrypted',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  AUTO_LOCK_TIMEOUT: 'auto_lock_timeout',
  LAST_ACTIVE_TIME: 'last_active_time',
  BASE_CURRENCY: 'base_currency',
  THEME: 'theme',
  // Auth & User
  USER_ID: 'user_id',
  USER_EMAIL: 'user_email',
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  // Sync
  LAST_SYNCED_AT: 'last_synced_at',
  LAST_SYNC_STATUS: 'last_sync_status',
  LAST_SYNC_ERROR: 'last_sync_error',
  SYNC_FREQUENCY: 'sync_frequency',
  AUTO_SYNC_ENABLED: 'auto_sync_enabled',
} as const;

// Default Settings
export const DEFAULT_SETTINGS = {
  BASE_CURRENCY: 'INR',
  BIOMETRIC_ENABLED: true,
  AUTO_LOCK_TIMEOUT: 5, // 5 minutes
  THEME: 'system' as const,
};
