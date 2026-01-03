/**
 * Recurring expense service
 */

import { getDatabase } from '@/database';
import { QUERIES } from '@/database/queries';
import { RecurringExpense, Expense } from '@/types';
import { generateUUID } from '@/utils/uuid';
import { addDays, addWeeks, addMonths, isBefore, parseISO } from 'date-fns';
import { createExpense } from '@/services/expense.service';

/**
 * Get all recurring expenses
 */
export const getAllRecurringExpenses = async (): Promise<RecurringExpense[]> => {
  const db = getDatabase();
  const result = db.query(QUERIES.GET_ALL_RECURRING);

  const recurring: RecurringExpense[] = [];
  for (let i = 0; i < (result.rows?.length || 0); i++) {
    const row = result.rows?.[i];
    if (row) {
      recurring.push({
        id: row.id as string,
        amount: row.amount as number,
        currencyCode: row.currency_code as string,
        category: row.category as string,
        description: row.description as string | undefined,
        interval: row.interval as RecurringExpense['interval'],
        intervalValue: row.interval_value as number,
        startDate: row.start_date as string,
        endDate: row.end_date as string | undefined,
        lastGenerated: row.last_generated as string | undefined,
        groupId: row.group_id as string | undefined,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
      });
    }
  }

  return recurring;
};

/**
 * Get recurring expense by ID
 */
export const getRecurringById = async (id: string): Promise<RecurringExpense | null> => {
  const db = getDatabase();
  const result = db.query(QUERIES.GET_RECURRING_BY_ID, [id]);

  if (result.rows && result.rows.length > 0) {
    const row = result.rows[0];
    return {
      id: row.id as string,
      amount: row.amount as number,
      currencyCode: row.currency_code as string,
      category: row.category as string,
      description: row.description as string | undefined,
      interval: row.interval as RecurringExpense['interval'],
      intervalValue: row.interval_value as number,
      startDate: row.start_date as string,
      endDate: row.end_date as string | undefined,
      lastGenerated: row.last_generated as string | undefined,
      groupId: row.group_id as string | undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  return null;
};

/**
 * Create a new recurring expense
 */
export const createRecurringExpense = async (
  recurring: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'lastGenerated'>,
): Promise<RecurringExpense> => {
  const db = getDatabase();
  const id = generateUUID();
  const now = new Date().toISOString();

  db.execute(QUERIES.INSERT_RECURRING, [
    id,
    recurring.amount,
    recurring.currencyCode,
    recurring.category,
    recurring.description || null,
    recurring.interval,
    recurring.intervalValue,
    recurring.startDate,
    recurring.endDate || null,
    null, // lastGenerated
    recurring.groupId || null,
    now,
    now,
  ]);

  return {
    ...recurring,
    id,
    createdAt: now,
    updatedAt: now,
    lastGenerated: undefined,
  };
};

/**
 * Update a recurring expense
 */
export const updateRecurringExpense = async (
  id: string,
  updates: Partial<Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<RecurringExpense> => {
  const db = getDatabase();
  const existing = await getRecurringById(id);

  if (!existing) {
    throw new Error('Recurring expense not found');
  }

  const updated: RecurringExpense = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  db.execute(QUERIES.UPDATE_RECURRING, [
    updated.amount,
    updated.currencyCode,
    updated.category,
    updated.description || null,
    updated.interval,
    updated.intervalValue,
    updated.startDate,
    updated.endDate || null,
    updated.lastGenerated || null,
    updated.groupId || null,
    updated.updatedAt,
    id,
  ]);

  return updated;
};

/**
 * Delete a recurring expense
 */
export const deleteRecurringExpense = async (id: string): Promise<void> => {
  const db = getDatabase();
  db.execute(QUERIES.DELETE_RECURRING, [id]);
};

/**
 * Generate expenses from recurring patterns
 * Called on app launch and resume
 */
export const generateRecurringExpenses = async (): Promise<Expense[]> => {
  const recurring = await getAllRecurringExpenses();
  const generated: Expense[] = [];
  const now = new Date();

  for (const pattern of recurring) {
    const startDate = parseISO(pattern.startDate);
    const endDate = pattern.endDate ? parseISO(pattern.endDate) : null;

    // Skip if pattern has ended
    if (endDate && isBefore(endDate, now)) {
      continue;
    }

    const lastGenerated = pattern.lastGenerated ? parseISO(pattern.lastGenerated) : startDate;
    let currentDate = getNextDate(lastGenerated, pattern.interval, pattern.intervalValue);

    // Generate all missed occurrences
    while (isBefore(currentDate, now) || currentDate.toDateString() === now.toDateString()) {
      if (endDate && isBefore(endDate, currentDate)) {
        break;
      }

      const expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> = {
        amount: pattern.amount,
        currencyCode: pattern.currencyCode,
        category: pattern.category,
        description: pattern.description,
        date: currentDate.toISOString().split('T')[0],
        groupId: pattern.groupId,
      };

      await createExpense(expense);
      generated.push(expense as Expense);

      // Update last generated date
      const db = getDatabase();
      db.execute(QUERIES.UPDATE_RECURRING, [
        pattern.amount,
        pattern.currencyCode,
        pattern.category,
        pattern.description || null,
        pattern.interval,
        pattern.intervalValue,
        pattern.startDate,
        pattern.endDate || null,
        currentDate.toISOString(),
        pattern.groupId || null,
        new Date().toISOString(),
        pattern.id,
      ]);

      currentDate = getNextDate(currentDate, pattern.interval, pattern.intervalValue);
    }
  }

  return generated;
};

/**
 * Calculate next occurrence date based on interval
 */
const getNextDate = (date: Date, interval: RecurringExpense['interval'], value: number): Date => {
  switch (interval) {
    case 'daily':
      return addDays(date, value);
    case 'weekly':
      return addWeeks(date, value);
    case 'monthly':
      return addMonths(date, value);
    case 'custom':
      // For custom, assume days
      return addDays(date, value);
    default:
      return addDays(date, 1);
  }
};
