/**
 * Expense service - handles personal expense CRUD operations (offline-first)
 * Personal expenses are stored locally in SQLite
 * Group expenses are handled by groupExpense.service.ts (Firebase)
 */

import { getDatabase } from '@/database';
import { QUERIES } from '@/database/queries';
import { Expense } from '@/types';
import { encrypt, decrypt } from '@/services/crypto.service';
import { generateUUID } from '@/utils/uuid';

/**
 * Get all personal expenses (excludes group expenses)
 */
export const getAllExpenses = async (): Promise<Expense[]> => {
  const db = getDatabase();
  // Only get personal expenses (where group_id IS NULL)
  const result = db.query(
    `SELECT * FROM expenses WHERE group_id IS NULL ORDER BY date DESC, created_at DESC`,
  );

  const expenses: Expense[] = [];
  for (let i = 0; i < (result.rows?.length || 0); i++) {
    const row = result.rows?.[i] as Record<string, unknown> | undefined;
    if (row) {
      const expense: Expense = {
        id: row.id as string,
        amount: row.amount as number,
        currencyCode: row.currency_code as string,
        category: row.category as string,
        description: row.description as string | undefined,
        notes: row.notes_encrypted
          ? await decrypt(row.notes_encrypted as string)
          : undefined,
        date: row.date as string,
        // Personal expenses don't have groupId
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
      };
      expenses.push(expense);
    }
  }

  return expenses;
};

/**
 * Get expense by ID
 */
export const getExpenseById = async (id: string): Promise<Expense | null> => {
  const db = getDatabase();
  const result = db.query(QUERIES.GET_EXPENSE_BY_ID, [id]);

  if (result.rows && result.rows.length > 0) {
    const row = result.rows[0] as Record<string, unknown>;
    return {
      id: row.id as string,
      amount: row.amount as number,
      currencyCode: row.currency_code as string,
      category: row.category as string,
      description: row.description as string | undefined,
      notes: row.notes_encrypted
        ? await decrypt(row.notes_encrypted as string)
        : undefined,
      date: row.date as string,
      groupId: row.group_id as string | undefined,
      paidByMemberId: row.paid_by_member_id as string | undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  return null;
};

/**
 * Create a new personal expense (offline-first, no groupId)
 */
export const createExpense = async (
  expense: Omit<
    Expense,
    'id' | 'createdAt' | 'updatedAt' | 'groupId' | 'paidByMemberId'
  >,
): Promise<Expense> => {
  const db = getDatabase();
  const id = generateUUID();
  const now = new Date().toISOString();

  const notesEncrypted = expense.notes ? await encrypt(expense.notes) : null;

  // Personal expenses: groupId and paidByMemberId are always null
  db.execute(QUERIES.INSERT_EXPENSE, [
    id,
    expense.amount,
    expense.currencyCode,
    expense.category,
    expense.description || null,
    notesEncrypted,
    expense.date,
    null, // groupId - always null for personal expenses
    null, // paidByMemberId - always null for personal expenses
    now,
    now,
  ]);

  return {
    ...expense,
    id,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Update an existing expense
 */
export const updateExpense = async (
  id: string,
  updates: Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<Expense> => {
  const db = getDatabase();
  const existing = await getExpenseById(id);

  if (!existing) {
    throw new Error('Expense not found');
  }

  const updated: Expense = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const notesEncrypted = updated.notes ? await encrypt(updated.notes) : null;

  // Personal expenses: groupId and paidByMemberId are always null
  db.execute(QUERIES.UPDATE_EXPENSE, [
    updated.amount,
    updated.currencyCode,
    updated.category,
    updated.description || null,
    notesEncrypted,
    updated.date,
    null, // groupId - always null for personal expenses
    null, // paidByMemberId - always null for personal expenses
    updated.updatedAt,
    id,
  ]);

  return updated;
};

/**
 * Delete an expense
 */
export const deleteExpense = async (id: string): Promise<void> => {
  const db = getDatabase();
  db.execute(QUERIES.DELETE_EXPENSE, [id]);
};

/**
 * Get expenses by date range
 */
export const getExpensesByDateRange = async (
  startDate: string,
  endDate: string,
): Promise<Expense[]> => {
  const db = getDatabase();
  const result = db.query(QUERIES.GET_EXPENSES_BY_DATE_RANGE, [
    startDate,
    endDate,
  ]);

  const expenses: Expense[] = [];
  for (let i = 0; i < (result.rows?.length || 0); i++) {
    const row = result.rows?.[i] as Record<string, unknown> | undefined;
    if (row) {
      const expense: Expense = {
        id: row.id as string,
        amount: row.amount as number,
        currencyCode: row.currency_code as string,
        category: row.category as string,
        description: row.description as string | undefined,
        notes: row.notes_encrypted
          ? await decrypt(row.notes_encrypted as string)
          : undefined,
        date: row.date as string,
        groupId: row.group_id as string | undefined,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
      };
      expenses.push(expense);
    }
  }

  return expenses;
};
