/**
 * Recurring Expense Constants
 * Centralized recurring interval definitions
 */

/**
 * Recurring interval types
 */
export const RECURRING_INTERVALS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
} as const;

/**
 * Recurring interval type
 */
export type RecurringInterval =
  (typeof RECURRING_INTERVALS)[keyof typeof RECURRING_INTERVALS];

/**
 * Recurring interval display labels
 */
export const RECURRING_INTERVAL_LABELS: Record<RecurringInterval, string> = {
  [RECURRING_INTERVALS.DAILY]: 'Daily',
  [RECURRING_INTERVALS.WEEKLY]: 'Weekly',
  [RECURRING_INTERVALS.MONTHLY]: 'Monthly',
  [RECURRING_INTERVALS.CUSTOM]: 'Custom (Days)',
};

/**
 * Get interval display label
 */
export const getIntervalLabel = (interval: RecurringInterval): string => {
  return RECURRING_INTERVAL_LABELS[interval] || interval;
};

/**
 * Check if interval is valid
 */
export const isValidInterval = (interval: string): boolean => {
  return Object.values(RECURRING_INTERVALS).includes(
    interval as RecurringInterval,
  );
};

