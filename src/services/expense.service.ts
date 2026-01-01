/**
 * Expense service - handles expense CRUD operations
 */

import { getDatabase } from '@/database';
import { QUERIES } from '@/database/queries';
import { Expense } from '@/types';
import { encrypt, decrypt } from '@/services/crypto.service';
import { generateUUID } from '@/utils/uuid';
import { convertToBase } from '@/services/currency.service';

/**
 * Get all expenses
 */
export const getAllExpenses = async (): Promise<Expense[]> => {
  const db = getDatabase();
  const result = db.query(QUERIES.GET_ALL_EXPENSES);

  const expenses: Expense[] = [];
  for (let i = 0; i < (result.rows?.length || 0); i++) {
    const row = result.rows?.[i];
    if (row) {
      const expense: Expense = {
        id: row.id as string,
        amount: row.amount as number,
        currencyCode: row.currency_code as string,
        baseAmount: row.base_amount as number,
        category: row.category as string,
        description: row.description as string | undefined,
        notes: row.notes_encrypted ? await decrypt(row.notes_encrypted as string) : undefined,
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

/**
 * Get expense by ID
 */
export const getExpenseById = async (id: string): Promise<Expense | null> => {
  const db = getDatabase();
  const result = db.query(QUERIES.GET_EXPENSE_BY_ID, [id]);

  if (result.rows && result.rows.length > 0) {
    const row = result.rows[0];
    return {
      id: row.id as string,
      amount: row.amount as number,
      currencyCode: row.currency_code as string,
      baseAmount: row.base_amount as number,
      category: row.category as string,
      description: row.description as string | undefined,
      notes: row.notes_encrypted ? await decrypt(row.notes_encrypted as string) : undefined,
      date: row.date as string,
      groupId: row.group_id as string | undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  return null;
};

/**
 * Create a new expense
 */
export const createExpense = async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'baseAmount'> & { baseAmount?: number }): Promise<Expense> => {
  const db = getDatabase();
  const id = generateUUID();
  const now = new Date().toISOString();

  // Calculate base amount if not provided
  const baseAmount = expense.baseAmount !== undefined
    ? expense.baseAmount
    : await convertToBase(expense.amount, expense.currencyCode);

  const notesEncrypted = expense.notes ? await encrypt(expense.notes) : null;

  db.execute(QUERIES.INSERT_EXPENSE, [
    id,
    expense.amount,
    expense.currencyCode,
    baseAmount,
    expense.category,
    expense.description || null,
    notesEncrypted,
    expense.date,
    expense.groupId || null,
    now,
    now,
  ]);

  return {
    ...expense,
    baseAmount,
    id,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Update an existing expense
 */
export const updateExpense = async (id: string, updates: Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'baseAmount'>> & { baseAmount?: number }): Promise<Expense> => {
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

  // Recalculate base amount if amount or currency changed
  if (updates.amount !== undefined || updates.currencyCode !== undefined) {
    updated.baseAmount = await convertToBase(updated.amount, updated.currencyCode);
  } else if (updates.baseAmount !== undefined) {
    updated.baseAmount = updates.baseAmount;
  }

  const notesEncrypted = updated.notes ? await encrypt(updated.notes) : null;

  db.execute(QUERIES.UPDATE_EXPENSE, [
    updated.amount,
    updated.currencyCode,
    updated.baseAmount,
    updated.category,
    updated.description || null,
    notesEncrypted,
    updated.date,
    updated.groupId || null,
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
export const getExpensesByDateRange = async (startDate: string, endDate: string): Promise<Expense[]> => {
  const db = getDatabase();
  const result = db.query(QUERIES.GET_EXPENSES_BY_DATE_RANGE, [startDate, endDate]);

  const expenses: Expense[] = [];
  for (let i = 0; i < (result.rows?.length || 0); i++) {
    const row = result.rows?.[i];
    if (row) {
      const expense: Expense = {
        id: row.id as string,
        amount: row.amount as number,
        currencyCode: row.currency_code as string,
        baseAmount: row.base_amount as number,
        category: row.category as string,
        description: row.description as string | undefined,
        notes: row.notes_encrypted ? await decrypt(row.notes_encrypted as string) : undefined,
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

