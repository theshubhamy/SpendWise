/**
 * Reminder Constants
 * Centralized reminder type definitions
 */

/**
 * Reminder types
 */
export const REMINDER_TYPES = {
  BILL_DUE: 'bill_due',
  SUBSCRIPTION: 'subscription',
  RECURRING_EXPENSE: 'recurring_expense',
} as const;

/**
 * Reminder type
 */
export type ReminderType =
  (typeof REMINDER_TYPES)[keyof typeof REMINDER_TYPES];

/**
 * Reminder type display labels
 */
export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  [REMINDER_TYPES.BILL_DUE]: 'Bill Due',
  [REMINDER_TYPES.SUBSCRIPTION]: 'Subscription',
  [REMINDER_TYPES.RECURRING_EXPENSE]: 'Recurring Expense',
};

/**
 * Get reminder type display label
 */
export const getReminderTypeLabel = (type: ReminderType): string => {
  return REMINDER_TYPE_LABELS[type] || type;
};

/**
 * Check if reminder type is valid
 */
export const isValidReminderType = (type: string): boolean => {
  return Object.values(REMINDER_TYPES).includes(type as ReminderType);
};

