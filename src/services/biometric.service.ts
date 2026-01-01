/**
 * Biometric authentication service
 */

import ReactNativeBiometrics from 'react-native-biometrics';
import {
  getBiometricEnabled,
  getAutoLockTimeout,
  setLastActiveTime,
  getLastActiveTime,
} from '@/services/settings.service';
import { lockEncryptionKey } from '@/services/crypto.service';

const rnBiometrics = new ReactNativeBiometrics({
  allowDeviceCredentials: true,
});

let isLocked = false;

/**
 * Check if biometrics is available on device
 */
export const isBiometricAvailable = async (): Promise<boolean> => {
  try {
    const { available } = await rnBiometrics.isSensorAvailable();
    return available;
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return false;
  }
};

/**
 * Get biometric type (FaceID, TouchID, Fingerprint, etc.)
 */
export const getBiometricType = async (): Promise<string | null> => {
  try {
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    return available ? biometryType || null : null;
  } catch (error) {
    console.error('Error getting biometric type:', error);
    return null;
  }
};

/**
 * Authenticate using biometrics
 */
export const authenticate = async (
  promptMessage: string = 'Authenticate to access SpendWise',
): Promise<boolean> => {
  try {
    const { success } = await rnBiometrics.simplePrompt({
      promptMessage,
      cancelButtonText: 'Cancel',
    });

    if (success) {
      isLocked = false;
      setLastActiveTime(Date.now());
      return true;
    }

    return false;
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return false;
  }
};

/**
 * Check if app should be locked
 */
export const shouldLockApp = (): boolean => {
  const biometricEnabled = getBiometricEnabled();
  if (!biometricEnabled) {
    return false;
  }

  const lastActiveTime = getLastActiveTime();
  if (!lastActiveTime) {
    return true; // Lock if never set
  }

  const autoLockTimeout = getAutoLockTimeout();
  const timeoutMs = autoLockTimeout * 60 * 1000; // Convert minutes to milliseconds
  const timeSinceLastActive = Date.now() - lastActiveTime;

  return timeSinceLastActive >= timeoutMs;
};

/**
 * Lock the app
 */
export const lockApp = (): void => {
  isLocked = true;
  lockEncryptionKey();
  // Clear any sensitive data from memory
};

/**
 * Unlock the app
 */
export const unlockApp = async (): Promise<boolean> => {
  if (!isLocked) {
    return true;
  }

  const biometricEnabled = getBiometricEnabled();
  if (!biometricEnabled) {
    isLocked = false;
    setLastActiveTime(Date.now());
    return true;
  }

  const available = await isBiometricAvailable();
  if (!available) {
    // Fallback: allow unlock if biometrics not available
    isLocked = false;
    setLastActiveTime(Date.now());
    return true;
  }

  const success = await authenticate('Unlock SpendWise');
  if (success) {
    isLocked = false;
    setLastActiveTime(Date.now());
  }

  return success;
};

/**
 * Check if app is currently locked
 */
export const isAppLocked = (): boolean => {
  return isLocked;
};

/**
 * Initialize biometric service
 */
export const initBiometric = async (): Promise<void> => {
  const biometricEnabled = getBiometricEnabled();
  if (biometricEnabled) {
    const available = await isBiometricAvailable();
    if (!available) {
      console.warn('Biometrics enabled but not available on device');
    }
  }
};
