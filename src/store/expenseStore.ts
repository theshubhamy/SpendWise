/**
 * Zustand store for expense management
 */

import { create } from 'zustand';
import { Expense } from '@/types';
import * as expenseService from '@/services/expense.service';
import { saveUndoAction, undoLastAction as undoService } from '@/services/undo.service';

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  fetchExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'baseAmount'>) => Promise<Expense>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getExpenseById: (id: string) => Expense | undefined;
  undoLastAction: () => Promise<boolean>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  isLoading: false,
  error: null,

  fetchExpenses: async () => {
    set({ isLoading: true, error: null });
    try {
      const expenses = await expenseService.getAllExpenses();
      set({ expenses, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addExpense: async (expense) => {
    try {
      const newExpense = await expenseService.createExpense(expense);
      set((state) => ({
        expenses: [newExpense, ...state.expenses],
      }));
      // Save undo action
      await saveUndoAction('add', 'expense', newExpense);
      return newExpense;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateExpense: async (id, updates) => {
    try {
      const existing = get().expenses.find((e) => e.id === id);
      if (existing) {
        // Save previous state for undo
        await saveUndoAction('edit', 'expense', existing);
      }
      const updated = await expenseService.updateExpense(id, updates);
      set((state) => ({
        expenses: state.expenses.map((e) => (e.id === id ? updated : e)),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteExpense: async (id) => {
    try {
      const existing = get().expenses.find((e) => e.id === id);
      if (existing) {
        // Save for undo before deleting
        await saveUndoAction('delete', 'expense', existing);
      }
      await expenseService.deleteExpense(id);
      set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  getExpenseById: (id) => {
    return get().expenses.find((e) => e.id === id);
  },

  undoLastAction: async () => {
    try {
      const success = await undoService();
      if (success) {
        // Refresh expenses after undo
        await get().fetchExpenses();
      }
      return success;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },
}));

// Memoized selectors for performance
export const selectExpenses = (state: ExpenseState) => state.expenses;
export const selectExpenseById = (id: string) => (state: ExpenseState) =>
  state.expenses.find((e) => e.id === id);
export const selectTotalExpenses = (state: ExpenseState) =>
  state.expenses.reduce((sum, exp) => sum + exp.baseAmount, 0);
export const selectExpensesByCategory = (category: string) => (state: ExpenseState) =>
  state.expenses.filter((e) => e.category === category);

