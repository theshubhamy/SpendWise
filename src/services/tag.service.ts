/**
 * Tag service - handles tag CRUD operations
 */

import { getDatabase } from '@/database';
import { QUERIES } from '@/database/queries';
import { Tag } from '@/types';
import { generateUUID } from '@/utils/uuid';
import { TAG_COLORS } from '@/constants';

/**
 * Get all tags
 */
export const getAllTags = async (): Promise<Tag[]> => {
  const db = getDatabase();
  const result = db.query(QUERIES.GET_ALL_TAGS);

  const tags: Tag[] = [];
  for (let i = 0; i < (result.rows?.length || 0); i++) {
    const row = result.rows?.[i];
    if (row) {
      tags.push({
        id: row.id as string,
        name: row.name as string,
        color: row.color as string,
        createdAt: row.created_at as string,
      });
    }
  }

  return tags;
};

/**
 * Get tag by ID
 */
export const getTagById = async (id: string): Promise<Tag | null> => {
  const db = getDatabase();
  const result = db.query(QUERIES.GET_TAG_BY_ID, [id]);

  if (result.rows && result.rows.length > 0) {
    const row = result.rows[0];
    return {
      id: row.id as string,
      name: row.name as string,
      color: row.color as string,
      createdAt: row.created_at as string,
    };
  }

  return null;
};

/**
 * Create a new tag
 */
export const createTag = async (name: string, color?: string): Promise<Tag> => {
  const db = getDatabase();
  const id = generateUUID();
  const now = new Date().toISOString();

  // Use provided color or pick a random one from palette
  const tagColor =
    color || TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];

  db.execute(QUERIES.INSERT_TAG, [id, name, tagColor, now]);

  return {
    id,
    name,
    color: tagColor,
    createdAt: now,
  };
};

/**
 * Update a tag
 */
export const updateTag = async (
  id: string,
  updates: { name?: string; color?: string },
): Promise<Tag> => {
  const db = getDatabase();
  const existing = await getTagById(id);

  if (!existing) {
    throw new Error('Tag not found');
  }

  const updated: Tag = {
    ...existing,
    ...updates,
  };

  // Note: Tag update requires DELETE and INSERT since name is UNIQUE
  // For simplicity, we'll delete and recreate
  db.execute(QUERIES.DELETE_TAG, [id]);
  db.execute(QUERIES.INSERT_TAG, [
    id,
    updated.name,
    updated.color,
    existing.createdAt,
  ]);

  return updated;
};

/**
 * Delete a tag
 */
export const deleteTag = async (id: string): Promise<void> => {
  const db = getDatabase();
  db.execute(QUERIES.DELETE_TAG, [id]);
};

/**
 * Get tags for an expense
 */
export const getTagsForExpense = async (expenseId: string): Promise<Tag[]> => {
  const db = getDatabase();
  const result = db.query(QUERIES.GET_TAGS_BY_EXPENSE, [expenseId]);

  const tags: Tag[] = [];
  for (let i = 0; i < (result.rows?.length || 0); i++) {
    const row = result.rows?.[i];
    if (row) {
      tags.push({
        id: row.id as string,
        name: row.name as string,
        color: row.color as string,
        createdAt: row.created_at as string,
      });
    }
  }

  return tags;
};

/**
 * Add tag to expense
 */
export const addTagToExpense = async (
  expenseId: string,
  tagId: string,
): Promise<void> => {
  const db = getDatabase();
  try {
    db.execute(QUERIES.INSERT_EXPENSE_TAG, [expenseId, tagId]);
  } catch (error) {
    // Ignore duplicate tag errors
    console.warn('Tag already added to expense:', error);
  }
};

/**
 * Remove tag from expense
 */
export const removeTagFromExpense = async (
  expenseId: string,
  tagId: string,
): Promise<void> => {
  const db = getDatabase();
  db.execute(QUERIES.DELETE_EXPENSE_TAG, [expenseId, tagId]);
};

/**
 * Set tags for expense (replaces all existing tags)
 */
export const setTagsForExpense = async (
  expenseId: string,
  tagIds: string[],
): Promise<void> => {
  const db = getDatabase();

  // Remove all existing tags
  db.execute(QUERIES.DELETE_EXPENSE_TAGS_BY_EXPENSE, [expenseId]);

  // Add new tags
  for (const tagId of tagIds) {
    try {
      db.execute(QUERIES.INSERT_EXPENSE_TAG, [expenseId, tagId]);
    } catch (error) {
      console.warn('Error adding tag to expense:', error);
    }
  }
};
