/**
 * Zustand store for group management
 */

import { create } from 'zustand';
import { ExpenseGroup } from '@/types';
import * as groupService from '@/services/group.service';

interface GroupState {
  groups: ExpenseGroup[];
  isLoading: boolean;
  error: string | null;
  fetchGroups: () => Promise<void>;
  createGroup: (name: string, currencyCode: string, description?: string) => Promise<ExpenseGroup>;
  updateGroup: (id: string, updates: Partial<ExpenseGroup>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  getGroupById: (id: string) => ExpenseGroup | undefined;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  isLoading: false,
  error: null,

  fetchGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const groups = await groupService.getAllGroups();
      set({ groups, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createGroup: async (name, currencyCode, description) => {
    try {
      const newGroup = await groupService.createGroup(name, currencyCode, description);
      set((state) => ({
        groups: [...state.groups, newGroup],
      }));
      return newGroup;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateGroup: async (id, updates) => {
    try {
      const updated = await groupService.updateGroup(id, updates);
      set((state) => ({
        groups: state.groups.map((g) => (g.id === id ? updated : g)),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteGroup: async (id) => {
    try {
      await groupService.deleteGroup(id);
      set((state) => ({
        groups: state.groups.filter((g) => g.id !== id),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  getGroupById: (id) => {
    return get().groups.find((g) => g.id === id);
  },
}));

