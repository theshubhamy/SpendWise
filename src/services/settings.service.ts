/**
 * Settings service using MMKV
 */

import { Storage } from '@/utils/storage';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '@/constants';
import { AppSettings } from '@/types';

/**
 * Get app settings
 */
export const getSettings = (): AppSettings => {
  return {
    baseCurrency: Storage.getString(STORAGE_KEYS.BASE_CURRENCY) || DEFAULT_SETTINGS.BASE_CURRENCY,
    biometricEnabled: Storage.getBoolean(STORAGE_KEYS.BIOMETRIC_ENABLED) ?? DEFAULT_SETTINGS.BIOMETRIC_ENABLED,
    autoLockTimeout: Storage.getNumber(STORAGE_KEYS.AUTO_LOCK_TIMEOUT) ?? DEFAULT_SETTINGS.AUTO_LOCK_TIMEOUT,
    theme: (Storage.getString(STORAGE_KEYS.THEME) as AppSettings['theme']) || DEFAULT_SETTINGS.THEME,
  };
};

/**
 * Update app settings
 */
export const updateSettings = (updates: Partial<AppSettings>): void => {
  if (updates.baseCurrency !== undefined) {
    Storage.setString(STORAGE_KEYS.BASE_CURRENCY, updates.baseCurrency);
  }
  if (updates.biometricEnabled !== undefined) {
    Storage.setBoolean(STORAGE_KEYS.BIOMETRIC_ENABLED, updates.biometricEnabled);
  }
  if (updates.autoLockTimeout !== undefined) {
    Storage.setNumber(STORAGE_KEYS.AUTO_LOCK_TIMEOUT, updates.autoLockTimeout);
  }
  if (updates.theme !== undefined) {
    Storage.setString(STORAGE_KEYS.THEME, updates.theme);
  }
};

/**
 * Get base currency
 */
export const getBaseCurrency = (): string => {
  return Storage.getString(STORAGE_KEYS.BASE_CURRENCY) || DEFAULT_SETTINGS.BASE_CURRENCY;
};

/**
 * Set base currency
 */
export const setBaseCurrency = (currency: string): void => {
  Storage.setString(STORAGE_KEYS.BASE_CURRENCY, currency);
};

/**
 * Get biometric enabled status
 */
export const getBiometricEnabled = (): boolean => {
  return Storage.getBoolean(STORAGE_KEYS.BIOMETRIC_ENABLED) ?? DEFAULT_SETTINGS.BIOMETRIC_ENABLED;
};

/**
 * Set biometric enabled status
 */
export const setBiometricEnabled = (enabled: boolean): void => {
  Storage.setBoolean(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled);
};

/**
 * Get auto lock timeout
 */
export const getAutoLockTimeout = (): number => {
  return Storage.getNumber(STORAGE_KEYS.AUTO_LOCK_TIMEOUT) ?? DEFAULT_SETTINGS.AUTO_LOCK_TIMEOUT;
};

/**
 * Set auto lock timeout
 */
export const setAutoLockTimeout = (timeout: number): void => {
  Storage.setNumber(STORAGE_KEYS.AUTO_LOCK_TIMEOUT, timeout);
};

/**
 * Get last active time
 */
export const getLastActiveTime = (): number | undefined => {
  return Storage.getNumber(STORAGE_KEYS.LAST_ACTIVE_TIME);
};

/**
 * Set last active time
 */
export const setLastActiveTime = (timestamp: number): void => {
  Storage.setNumber(STORAGE_KEYS.LAST_ACTIVE_TIME, timestamp);
};

