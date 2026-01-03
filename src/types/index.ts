/**
 * Core type definitions for SpendWise
 */

export interface Expense {
  id: string;
  amount: number;
  currencyCode: string;
  category: string;
  description?: string;
  notes?: string; // Encrypted
  date: string; // ISO date string
  groupId?: string;
  paidByMemberId?: string; // Who paid for this expense (for group expenses)
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseGroup {
  id: string;
  name: string;
  description?: string;
  currencyCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  name: string;
  email?: string;
  createdAt: string;
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  memberId: string;
  amount: number;
  percentage?: number;
  createdAt: string;
}

export interface RecurringExpense {
  id: string;
  amount: number;
  currencyCode: string;
  category: string;
  description?: string;
  interval: RecurringInterval;
  intervalValue: number; // e.g., 1 for "every 1 month"
  startDate: string;
  endDate?: string;
  lastGenerated?: string;
  groupId?: string;
  createdAt: string;
  updatedAt: string;
}

export type RecurringInterval = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  message: string;
  scheduledDate: string;
  expenseId?: string;
  recurringExpenseId?: string;
  isCompleted: boolean;
  createdAt: string;
}

export type ReminderType = 'bill_due' | 'subscription' | 'recurring_expense';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  isBase: boolean;
}

export interface UndoAction {
  id: string;
  type: 'delete' | 'edit' | 'add';
  entityType: 'expense' | 'group' | 'recurring';
  payload: unknown; // Previous state (serialized as JSON)
  timestamp: string;
}

export interface AppSettings {
  baseCurrency: string;
  biometricEnabled: boolean;
  autoLockTimeout: number; // in minutes
  theme: 'light' | 'dark' | 'system';
}

export interface Payment {
  id: string;
  groupId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  currencyCode: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export type SplitType = 'equal' | 'percentage' | 'custom';
