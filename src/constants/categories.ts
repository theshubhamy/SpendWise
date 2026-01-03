/**
 * Expense Categories Constants
 * Centralized category definitions used throughout the app
 */

/**
 * All supported expense categories
 */
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

/**
 * Category type
 */
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/**
 * Get category display name
 */
export const getCategoryDisplayName = (category: string): string => {
  return category;
};

/**
 * Check if category is valid
 */
export const isValidCategory = (category: string): boolean => {
  return EXPENSE_CATEGORIES.includes(category as ExpenseCategory);
};

