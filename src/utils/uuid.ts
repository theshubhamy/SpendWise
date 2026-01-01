/**
 * UUID generation utility
 * React Native compatible UUID v4 generator
 */

export const generateUUID = (): string => {
  // Simple UUID v4 generator for React Native
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r % 4) + 8;
    return v.toString(16);
  });
};
