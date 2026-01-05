/**
 * Group Expense Service - Firebase-based service for group expenses
 * Group expenses are stored in Firebase Firestore for real-time collaboration
 */

import firestore from '@react-native-firebase/firestore';
import { authService } from './auth.service';
import { Expense, ExpenseSplit } from '@/types';
import { generateUUID } from '@/utils/uuid';

class GroupExpenseService {
  private getUserId(): string {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user.id;
  }

  /**
   * Get group expenses collection reference
   */
  private getGroupExpensesRef(groupId: string) {
    return firestore()
      .collection('groups')
      .doc(groupId)
      .collection('expenses');
  }

  /**
   * Get group expense splits collection reference
   */
  private getExpenseSplitsRef(groupId: string, expenseId: string) {
    return this.getGroupExpensesRef(groupId)
      .doc(expenseId)
      .collection('splits');
  }

  /**
   * Create a group expense in Firebase
   */
  async createGroupExpense(
    groupId: string,
    expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Expense> {
    const userId = this.getUserId();
    const id = generateUUID();
    const now = new Date().toISOString();

    const expenseData: Expense = {
      ...expense,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await this.getGroupExpensesRef(groupId).doc(id).set({
      ...expenseData,
      createdBy: userId,
      syncedAt: firestore.FieldValue.serverTimestamp(),
    });

    return expenseData;
  }

  /**
   * Get all expenses for a group
   */
  async getGroupExpenses(groupId: string): Promise<Expense[]> {
    // Order by date only to avoid composite index requirement
    // We'll sort by createdAt in memory if needed
    const snapshot = await this.getGroupExpensesRef(groupId)
      .orderBy('date', 'desc')
      .get();

    const expenses = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        amount: data.amount,
        currencyCode: data.currencyCode,
        category: data.category,
        description: data.description,
        notes: data.notes,
        date: data.date,
        groupId: data.groupId,
        paidByMemberId: data.paidByMemberId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as Expense;
    });

    // Sort by date (desc) then createdAt (desc) in memory
    return expenses.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }

  /**
   * Update a group expense
   */
  async updateGroupExpense(
    groupId: string,
    expenseId: string,
    updates: Partial<Omit<Expense, 'id' | 'createdAt'>>,
  ): Promise<void> {
    await this.getGroupExpensesRef(groupId)
      .doc(expenseId)
      .update({
        ...updates,
        updatedAt: new Date().toISOString(),
        syncedAt: firestore.FieldValue.serverTimestamp(),
      });
  }

  /**
   * Delete a group expense
   */
  async deleteGroupExpense(groupId: string, expenseId: string): Promise<void> {
    // Delete all splits first
    const splitsSnapshot = await this.getExpenseSplitsRef(
      groupId,
      expenseId,
    ).get();
    const batch = firestore().batch();
    splitsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Delete the expense
    await this.getGroupExpensesRef(groupId).doc(expenseId).delete();
  }

  /**
   * Create expense splits
   */
  async createExpenseSplits(
    groupId: string,
    expenseId: string,
    splits: Array<{ memberId: string; amount: number; percentage?: number }>,
  ): Promise<void> {
    const batch = firestore().batch();
    const splitsRef = this.getExpenseSplitsRef(groupId, expenseId);

    splits.forEach(split => {
      const splitId = generateUUID();
      const splitRef = splitsRef.doc(splitId);
      batch.set(splitRef, {
        id: splitId,
        expenseId,
        memberId: split.memberId,
        amount: split.amount,
        percentage: split.percentage || null,
        createdAt: new Date().toISOString(),
      });
    });

    await batch.commit();
  }

  /**
   * Get expense splits
   */
  async getExpenseSplits(
    groupId: string,
    expenseId: string,
  ): Promise<ExpenseSplit[]> {
    const snapshot = await this.getExpenseSplitsRef(
      groupId,
      expenseId,
    ).get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        expenseId: data.expenseId,
        memberId: data.memberId,
        amount: data.amount,
        percentage: data.percentage,
        createdAt: data.createdAt,
      } as ExpenseSplit;
    });
  }

  /**
   * Subscribe to group expenses changes (real-time)
   */
  subscribeToGroupExpenses(
    groupId: string,
    callback: (expenses: Expense[]) => void,
  ): () => void {
    return this.getGroupExpensesRef(groupId)
      .orderBy('date', 'desc')
      .onSnapshot(snapshot => {
        const expenses = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            amount: data.amount,
            currencyCode: data.currencyCode,
            category: data.category,
            description: data.description,
            notes: data.notes,
            date: data.date,
            groupId: data.groupId,
            paidByMemberId: data.paidByMemberId,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Expense;
        });

        // Sort by date (desc) then createdAt (desc) in memory
        const sortedExpenses = expenses.sort((a, b) => {
          const dateCompare = b.date.localeCompare(a.date);
          if (dateCompare !== 0) return dateCompare;
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        });

        callback(sortedExpenses);
      });
  }
}

export const groupExpenseService = new GroupExpenseService();

