/**
 * Zustand store for tag management
 */

import { create } from 'zustand';
import { Tag } from '@/types';
import * as tagService from '@/services/tag.service';

interface TagState {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  fetchTags: () => Promise<void>;
  createTag: (name: string, color?: string) => Promise<Tag>;
  updateTag: (id: string, updates: { name?: string; color?: string }) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  getTagById: (id: string) => Tag | undefined;
}

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],
  isLoading: false,
  error: null,

  fetchTags: async () => {
    set({ isLoading: true, error: null });
    try {
      const tags = await tagService.getAllTags();
      set({ tags, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createTag: async (name, color) => {
    try {
      const newTag = await tagService.createTag(name, color);
      set((state) => ({
        tags: [...state.tags, newTag],
      }));
      return newTag;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateTag: async (id, updates) => {
    try {
      const updated = await tagService.updateTag(id, updates);
      set((state) => ({
        tags: state.tags.map((t) => (t.id === id ? updated : t)),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteTag: async (id) => {
    try {
      await tagService.deleteTag(id);
      set((state) => ({
        tags: state.tags.filter((t) => t.id !== id),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  getTagById: (id) => {
    return get().tags.find((t) => t.id === id);
  },
}));

