/**
 * Storage utility using MMKV
 */

import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV();

export const Storage = {
  getString: (key: string): string | undefined => {
    return storage.getString(key);
  },

  setString: (key: string, value: string): void => {
    storage.set(key, value);
  },

  getNumber: (key: string): number | undefined => {
    return storage.getNumber(key);
  },

  setNumber: (key: string, value: number): void => {
    storage.set(key, value);
  },

  getBoolean: (key: string): boolean | undefined => {
    return storage.getBoolean(key);
  },

  setBoolean: (key: string, value: boolean): void => {
    storage.set(key, value);
  },

  delete: (key: string): boolean => {
    return storage.remove(key);
  },

  clearAll: (): void => {
    storage.clearAll();
  },

  getAllKeys: (): string[] => {
    return storage.getAllKeys();
  },
};
