/**
 * Date Format Constants
 * Centralized date format definitions
 */

/**
 * Date format patterns
 */
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  DATE_ONLY: 'yyyy-MM-dd',
} as const;

/**
 * Date format type
 */
export type DateFormat = (typeof DATE_FORMATS)[keyof typeof DATE_FORMATS];

