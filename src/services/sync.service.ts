/**
 * Firebase Sync Service
 * Handles syncing local data to Firebase Firestore when user wants to sync
 */

import firestore from '@react-native-firebase/firestore';
import { authService } from './auth.service';
import { getDatabase } from '@/database';
import { QUERIES } from '@/database/queries';
import { Expense, ExpenseGroup, RecurringExpense } from '@/types';
import { Storage } from '@/utils/storage';
import { STORAGE_KEYS } from '@/constants';

class SyncService {
  private getUserId(): string | null {
    const user = authService.getCurrentUser();
    return user?.id || null;
  }

  /**
   * Get last sync timestamp
   */
  private getLastSyncedAt(): string | null {
    return Storage.getString(STORAGE_KEYS.LAST_SYNCED_AT) || null;
  }

  /**
   * Set last sync timestamp
   */
  private setLastSyncedAt(timestamp: string): void {
    Storage.setString(STORAGE_KEYS.LAST_SYNCED_AT, timestamp);
  }

  /**
   * Get user's Firestore collection reference
   */
  private getUserCollection(collectionName: string) {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return firestore().collection('users').doc(userId).collection(collectionName);
  }

  /**
   * Sync all expenses to Firestore
   */
  async syncExpenses(): Promise<void> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const db = getDatabase();
    const result = db.query(QUERIES.GET_ALL_EXPENSES);

    const expenses: Expense[] = [];
    for (let i = 0; i < (result.rows?.length || 0); i++) {
      const row = result.rows?.[i] as Record<string, unknown> | undefined;
      if (row) {
        expenses.push({
          id: row.id as string,
          amount: row.amount as number,
          currencyCode: row.currency_code as string,
          category: row.category as string,
          description: row.description as string | undefined,
          notes: (row.notes_encrypted as string | undefined) || undefined, // Notes are encrypted in DB
          date: row.date as string,
          groupId: row.group_id as string | undefined,
          paidByMemberId: row.paid_by_member_id as string | undefined,
          createdAt: row.created_at as string,
          updatedAt: row.updated_at as string,
        });
      }
    }

    // Batch write to Firestore
    const batch = firestore().batch();
    const expensesRef = this.getUserCollection('expenses');

    expenses.forEach(expense => {
      const docRef = expensesRef.doc(expense.id);
      batch.set(docRef, {
        ...expense,
        syncedAt: firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    });

    await batch.commit();
    console.log(`Synced ${expenses.length} expenses to Firestore`);
  }

  /**
   * Sync expense groups to Firestore
   */
  async syncGroups(): Promise<void> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const db = getDatabase();
    const result = db.query(QUERIES.GET_ALL_GROUPS);

    const groups: ExpenseGroup[] = [];
    for (let i = 0; i < (result.rows?.length || 0); i++) {
      const row = result.rows?.[i] as Record<string, unknown> | undefined;
      if (row) {
        groups.push({
          id: row.id as string,
          name: row.name as string,
          description: row.description as string | undefined,
          currencyCode: row.currency_code as string,
          createdAt: row.created_at as string,
          updatedAt: row.updated_at as string,
        });
      }
    }

    // Batch write to Firestore
    const batch = firestore().batch();
    const groupsRef = this.getUserCollection('groups');

    groups.forEach(group => {
      const docRef = groupsRef.doc(group.id);
      batch.set(docRef, {
        ...group,
        syncedAt: firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    });

    await batch.commit();
    console.log(`Synced ${groups.length} groups to Firestore`);
  }

  /**
   * Sync recurring expenses to Firestore
   */
  async syncRecurringExpenses(): Promise<void> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const db = getDatabase();
    const result = db.query(QUERIES.GET_ALL_RECURRING);

    const recurringExpenses: RecurringExpense[] = [];
    for (let i = 0; i < (result.rows?.length || 0); i++) {
      const row = result.rows?.[i] as Record<string, unknown> | undefined;
      if (row) {
        recurringExpenses.push({
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

    // Batch write to Firestore
    const batch = firestore().batch();
    const recurringRef = this.getUserCollection('recurringExpenses');

    recurringExpenses.forEach(expense => {
      const docRef = recurringRef.doc(expense.id);
      batch.set(docRef, {
        ...expense,
        syncedAt: firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    });

    await batch.commit();
    console.log(`Synced ${recurringExpenses.length} recurring expenses to Firestore`);
  }

  /**
   * Sync all data to Firebase
   */
  async syncAll(): Promise<void> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated. Please sign in to sync.');
    }

    try {
      // Update sync status
      Storage.setString(STORAGE_KEYS.LAST_SYNC_STATUS, 'syncing');

      // Sync all data types
      await Promise.all([
        this.syncExpenses(),
        this.syncGroups(),
        this.syncRecurringExpenses(),
      ]);

      // Update last sync timestamp
      const now = new Date().toISOString();
      this.setLastSyncedAt(now);
      Storage.setString(STORAGE_KEYS.LAST_SYNC_STATUS, 'success');
      Storage.delete(STORAGE_KEYS.LAST_SYNC_ERROR);

      console.log('All data synced successfully to Firestore');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Storage.setString(STORAGE_KEYS.LAST_SYNC_STATUS, 'error');
      Storage.setString(STORAGE_KEYS.LAST_SYNC_ERROR, errorMessage);
      console.error('Sync error:', error);
      throw error;
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    lastSyncedAt: string | null;
    status: 'idle' | 'syncing' | 'success' | 'error';
    error: string | null;
  } {
    return {
      lastSyncedAt: this.getLastSyncedAt(),
      status: (Storage.getString(STORAGE_KEYS.LAST_SYNC_STATUS) ||
        'idle') as 'idle' | 'syncing' | 'success' | 'error',
      error: Storage.getString(STORAGE_KEYS.LAST_SYNC_ERROR) || null,
    };
  }
}

export const syncService = new SyncService();

