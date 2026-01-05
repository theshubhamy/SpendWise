/**
 * Group expense service - handles expense groups and splitting
 * Groups are stored in Firebase Firestore for real-time collaboration
 */

import firestore from '@react-native-firebase/firestore';
import { getDatabase } from '@/database';
import { QUERIES } from '@/database/queries';
import { ExpenseGroup, GroupMember, ExpenseSplit, Payment } from '@/types';
import { generateUUID } from '@/utils/uuid';
import { authService } from './auth.service';

/**
 * Get all expense groups from Firebase
 * Returns groups where the current user is a member
 */
export const getAllGroups = async (): Promise<ExpenseGroup[]> => {
  const user = authService.getCurrentUser();
  if (!user) {
    return [];
  }

  // Get all groups where user is a member
  // Query without orderBy to avoid composite index requirement
  const groupsSnapshot = await firestore()
    .collection('groups')
    .where('memberIds', 'array-contains', user.id)
    .get();

  const groups: ExpenseGroup[] = [];
  groupsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    groups.push({
      id: doc.id,
      name: data.name,
      description: data.description,
      currencyCode: data.currencyCode,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  });

  // Sort by createdAt in memory (descending)
  return groups.sort((a, b) => {
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });
};

/**
 * Get group by ID from Firebase
 */
export const getGroupById = async (id: string): Promise<ExpenseGroup | null> => {
  try {
    const doc = await firestore().collection('groups').doc(id).get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return {
      id: doc.id,
      name: data?.name,
      description: data?.description,
      currencyCode: data?.currencyCode,
      createdAt: data?.createdAt,
      updatedAt: data?.updatedAt,
    };
  } catch (error) {
    console.error('Error getting group:', error);
    return null;
  }
};

/**
 * Create a new expense group in Firebase
 * Also adds the creator as a member
 */
export const createGroup = async (
  name: string,
  currencyCode: string,
  description?: string,
): Promise<ExpenseGroup> => {
  const user = authService.getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const id = generateUUID();
  const now = new Date().toISOString();

  // Create group document in Firebase
  const groupData = {
    name,
    description: description || null,
    currencyCode,
    createdAt: now,
    updatedAt: now,
    createdBy: user.id,
    memberIds: [user.id], // Track member IDs for querying
    syncedAt: firestore.FieldValue.serverTimestamp(),
  };

  await firestore().collection('groups').doc(id).set(groupData);

  // Add creator as a member
  const memberId = generateUUID();
  const memberData = {
    id: memberId,
    groupId: id,
    userId: user.id,
    name: user.name || 'Unknown',
    email: user.email || null,
    createdAt: now,
  };

  await firestore()
    .collection('groups')
    .doc(id)
    .collection('members')
    .doc(memberId)
    .set(memberData);

  return {
    id,
    name,
    description,
    currencyCode,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Update a group in Firebase
 */
export const updateGroup = async (
  id: string,
  updates: { name?: string; description?: string; currencyCode?: string },
): Promise<ExpenseGroup> => {
  const existing = await getGroupById(id);

  if (!existing) {
    throw new Error('Group not found');
  }

  const updated: ExpenseGroup = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await firestore()
    .collection('groups')
    .doc(id)
    .update({
      ...updates,
      updatedAt: updated.updatedAt,
      syncedAt: firestore.FieldValue.serverTimestamp(),
    });

  return updated;
};

/**
 * Delete a group from Firebase
 * Also deletes all members and expenses (cascade)
 */
export const deleteGroup = async (id: string): Promise<void> => {
  const batch = firestore().batch();
  const groupRef = firestore().collection('groups').doc(id);

  // Delete all members
  const membersSnapshot = await groupRef.collection('members').get();
  membersSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  // Delete all expenses
  const expensesSnapshot = await groupRef.collection('expenses').get();
  expensesSnapshot.docs.forEach(doc => {
    // Delete expense splits
    doc.ref.collection('splits').get().then(splitsSnapshot => {
      splitsSnapshot.docs.forEach(splitDoc => {
        batch.delete(splitDoc.ref);
      });
    });
    batch.delete(doc.ref);
  });

  // Delete the group
  batch.delete(groupRef);

  await batch.commit();
};

/**
 * Get members of a group from Firebase
 */
export const getGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
  const snapshot = await firestore()
    .collection('groups')
    .doc(groupId)
    .collection('members')
    .orderBy('createdAt', 'asc')
    .get();

  const members: GroupMember[] = [];
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    members.push({
      id: data.id || doc.id,
      groupId: data.groupId || groupId,
      userId: data.userId,
      name: data.name,
      email: data.email,
      createdAt: data.createdAt,
    });
  });

  return members;
};

/**
 * Add member to group in Firebase
 */
export const addMemberToGroup = async (
  groupId: string,
  userId: string,
  name: string,
  email?: string,
): Promise<GroupMember> => {
  const id = generateUUID();
  const now = new Date().toISOString();

  const memberData = {
    id,
    groupId,
    userId,
    name,
    email: email || null,
    createdAt: now,
  };

  // Add member document
  await firestore()
    .collection('groups')
    .doc(groupId)
    .collection('members')
    .doc(id)
    .set(memberData);

  // Update group's memberIds array
  const groupRef = firestore().collection('groups').doc(groupId);
  await groupRef.update({
    memberIds: firestore.FieldValue.arrayUnion(userId),
    updatedAt: now,
    syncedAt: firestore.FieldValue.serverTimestamp(),
  });

  return memberData;
};

/**
 * Remove member from group in Firebase
 */
export const removeMemberFromGroup = async (
  groupId: string,
  memberId: string,
): Promise<void> => {
  // Get member to find userId
  const memberDoc = await firestore()
    .collection('groups')
    .doc(groupId)
    .collection('members')
    .doc(memberId)
    .get();

  if (!memberDoc.exists) {
    throw new Error('Member not found');
  }

  const userId = memberDoc.data()?.userId;

  // Delete member document
  await firestore()
    .collection('groups')
    .doc(groupId)
    .collection('members')
    .doc(memberId)
    .delete();

  // Update group's memberIds array
  if (userId) {
    await firestore()
      .collection('groups')
      .doc(groupId)
      .update({
        memberIds: firestore.FieldValue.arrayRemove(userId),
        updatedAt: new Date().toISOString(),
        syncedAt: firestore.FieldValue.serverTimestamp(),
      });
  }
};

/**
 * Get expense splits for an expense
 */
export const getExpenseSplits = async (expenseId: string): Promise<ExpenseSplit[]> => {
  const db = getDatabase();
  const result = db.query(QUERIES.GET_SPLITS_BY_EXPENSE, [expenseId]);

  const splits: ExpenseSplit[] = [];
  for (let i = 0; i < (result.rows?.length || 0); i++) {
    const row = result.rows?.[i];
    if (row) {
      splits.push({
        id: row.id as string,
        expenseId: row.expense_id as string,
        memberId: row.member_id as string,
        amount: row.amount as number,
        percentage: row.percentage as number | undefined,
        createdAt: row.created_at as string,
      });
    }
  }

  return splits;
};

/**
 * Split expense equally among members
 */
export const splitExpenseEqually = async (
  expenseId: string,
  memberIds: string[],
  totalAmount: number,
): Promise<void> => {
  const db = getDatabase();
  const amountPerMember = totalAmount / memberIds.length;

  // Remove existing splits
  db.execute(QUERIES.DELETE_SPLITS_BY_EXPENSE, [expenseId]);

  // Create new splits
  for (const memberId of memberIds) {
    const id = generateUUID();
    const now = new Date().toISOString();
    db.execute(QUERIES.INSERT_SPLIT, [
      id,
      expenseId,
      memberId,
      amountPerMember,
      null, // percentage
      now,
    ]);
  }
};

/**
 * Split expense by percentage
 */
export const splitExpenseByPercentage = async (
  expenseId: string,
  splits: Array<{ memberId: string; percentage: number }>,
  totalAmount: number,
): Promise<void> => {
  const db = getDatabase();

  // Remove existing splits
  db.execute(QUERIES.DELETE_SPLITS_BY_EXPENSE, [expenseId]);

  // Create new splits
  for (const split of splits) {
    const id = generateUUID();
    const now = new Date().toISOString();
    const amount = (totalAmount * split.percentage) / 100;
    db.execute(QUERIES.INSERT_SPLIT, [
      id,
      expenseId,
      split.memberId,
      amount,
      split.percentage,
      now,
    ]);
  }
};

/**
 * Split expense by custom amounts
 */
export const splitExpenseByAmount = async (
  expenseId: string,
  splits: Array<{ memberId: string; amount: number }>,
): Promise<void> => {
  const db = getDatabase();

  // Remove existing splits
  db.execute(QUERIES.DELETE_SPLITS_BY_EXPENSE, [expenseId]);

  // Create new splits
  for (const split of splits) {
    const id = generateUUID();
    const now = new Date().toISOString();
    const percentage = null; // Not applicable for custom amounts
    db.execute(QUERIES.INSERT_SPLIT, [
      id,
      expenseId,
      split.memberId,
      split.amount,
      percentage,
      now,
    ]);
  }
};

/**
 * Calculate balances for group members (Splitwise-style)
 * Balance = What you paid - What you owe
 * Positive balance = You're owed money
 * Negative balance = You owe money
 * Updated to work with Firebase group expenses
 */
export const calculateGroupBalances = async (groupId: string): Promise<Record<string, number>> => {
  const { groupExpenseService } = await import('./groupExpense.service');
  const members = await getGroupMembers(groupId);
  const balances: Record<string, number> = {};

  // Initialize balances
  members.forEach((member) => {
    balances[member.id] = 0;
  });

  // Get all expenses for the group from Firebase
  const expenses = await groupExpenseService.getGroupExpenses(groupId);

  // Calculate balances: paid amount - owed amount
  for (const expense of expenses) {
    const paidByMemberId = expense.paidByMemberId;
    const expenseAmount = expense.amount;

    // Add to paid balance (whoever paid gets credit)
    if (paidByMemberId && balances[paidByMemberId] !== undefined) {
      balances[paidByMemberId] = (balances[paidByMemberId] || 0) + expenseAmount;
    }

    // Subtract from owed balance (what each person owes)
    const splits = await groupExpenseService.getExpenseSplits(groupId, expense.id);
    splits.forEach((split) => {
      balances[split.memberId] = (balances[split.memberId] || 0) - split.amount;
    });
  }

  // Subtract payments (settle up transactions) - still from local DB
  const payments = await getPaymentsByGroup(groupId);
  payments.forEach((payment) => {
    // Payment reduces the debt: from pays to
    balances[payment.fromMemberId] = (balances[payment.fromMemberId] || 0) - payment.amount;
    balances[payment.toMemberId] = (balances[payment.toMemberId] || 0) + payment.amount;
  });

  return balances;
};

/**
 * Get settlement suggestions (who owes whom)
 * Improved algorithm: Sort by amount to minimize number of transactions
 */
export const getSettlementSuggestions = async (
  groupId: string,
): Promise<Array<{ from: string; to: string; amount: number }>> => {
  const balances = await calculateGroupBalances(groupId);
  const members = await getGroupMembers(groupId);

  // Find who paid more (creditors) and who paid less (debtors)
  const creditors: Array<{ memberId: string; amount: number }> = [];
  const debtors: Array<{ memberId: string; amount: number }> = [];

  members.forEach((member) => {
    const balance = balances[member.id] || 0;
    if (balance > 0.01) {
      // Only include if balance is significant (more than 1 cent)
      creditors.push({ memberId: member.id, amount: balance });
    } else if (balance < -0.01) {
      // Only include if balance is significant (more than 1 cent)
      debtors.push({ memberId: member.id, amount: Math.abs(balance) });
    }
  });

  // Sort by amount (largest first) to minimize number of transactions
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Generate settlement suggestions using greedy algorithm
  const suggestions: Array<{ from: string; to: string; amount: number }> = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];

    // Skip if amounts are too small (rounding errors)
    if (creditor.amount < 0.01 || debtor.amount < 0.01) {
      break;
    }

    const settlementAmount = Math.min(creditor.amount, debtor.amount);
    suggestions.push({
      from: debtor.memberId,
      to: creditor.memberId,
      amount: Math.round(settlementAmount * 100) / 100, // Round to 2 decimal places
    });

    creditor.amount -= settlementAmount;
    debtor.amount -= settlementAmount;

    // Remove fully settled parties
    if (creditor.amount < 0.01) creditorIndex++;
    if (debtor.amount < 0.01) debtorIndex++;
  }

  return suggestions;
};

/**
 * Get payments for a group
 */
export const getPaymentsByGroup = async (groupId: string): Promise<Payment[]> => {
  const db = getDatabase();
  const result = db.query(QUERIES.GET_PAYMENTS_BY_GROUP, [groupId]);

  const payments: Payment[] = [];
  for (let i = 0; i < (result.rows?.length || 0); i++) {
    const row = result.rows?.[i];
    if (row) {
      payments.push({
        id: row.id as string,
        groupId: row.group_id as string,
        fromMemberId: row.from_member_id as string,
        toMemberId: row.to_member_id as string,
        amount: row.amount as number,
        currencyCode: row.currency_code as string,
        date: row.date as string,
        notes: row.notes as string | undefined,
        createdAt: row.created_at as string,
      });
    }
  }

  return payments;
};

/**
 * Record a payment (settle up)
 */
export const recordPayment = async (
  groupId: string,
  fromMemberId: string,
  toMemberId: string,
  amount: number,
  currencyCode: string,
  date: string,
  notes?: string,
): Promise<Payment> => {
  const db = getDatabase();
  const id = generateUUID();
  const now = new Date().toISOString();

  db.execute(QUERIES.INSERT_PAYMENT, [
    id,
    groupId,
    fromMemberId,
    toMemberId,
    amount,
    currencyCode,
    date,
    notes || null,
    now,
  ]);

  return {
    id,
    groupId,
    fromMemberId,
    toMemberId,
    amount,
    currencyCode,
    date,
    notes,
    createdAt: now,
  };
};

/**
 * Delete a payment
 */
export const deletePayment = async (paymentId: string): Promise<void> => {
  const db = getDatabase();
  db.execute(QUERIES.DELETE_PAYMENT, [paymentId]);
};

