/**
 * Zustand store for recurring expenses
 */

import { create } from 'zustand';
import { RecurringExpense } from '@/types';
import * as recurringService from '@/services/recurring.service';

interface RecurringState {
  recurring: RecurringExpense[];
  isLoading: boolean;
  error: string | null;
  fetchRecurring: () => Promise<void>;
  createRecurring: (recurring: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'lastGenerated'>) => Promise<RecurringExpense>;
  updateRecurring: (id: string, updates: Partial<RecurringExpense>) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  getRecurringById: (id: string) => RecurringExpense | undefined;
}

export const useRecurringStore = create<RecurringState>((set, get) => ({
  recurring: [],
  isLoading: false,
  error: null,

  fetchRecurring: async () => {
    set({ isLoading: true, error: null });
    try {
      const recurring = await recurringService.getAllRecurringExpenses();
      set({ recurring, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createRecurring: async (recurring) => {
    try {
      const newRecurring = await recurringService.createRecurringExpense(recurring);
      set((state) => ({
        recurring: [...state.recurring, newRecurring],
      }));
      return newRecurring;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateRecurring: async (id, updates) => {
    try {
      const updated = await recurringService.updateRecurringExpense(id, updates);
      set((state) => ({
        recurring: state.recurring.map((r) => (r.id === id ? updated : r)),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteRecurring: async (id) => {
    try {
      await recurringService.deleteRecurringExpense(id);
      set((state) => ({
        recurring: state.recurring.filter((r) => r.id !== id),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  getRecurringById: (id) => {
    return get().recurring.find((r) => r.id === id);
  },
}));

