/**
 * Group expense service - handles expense groups and splitting
 */

import { getDatabase } from '@/database';
import { QUERIES } from '@/database/queries';
import { ExpenseGroup, GroupMember, ExpenseSplit } from '@/types';
import { generateUUID } from '@/utils/uuid';

/**
 * Get all expense groups
 */
export const getAllGroups = async (): Promise<ExpenseGroup[]> => {
  const db = getDatabase();
  const result = db.query(QUERIES.GET_ALL_GROUPS);

  const groups: ExpenseGroup[] = [];
  for (let i = 0; i < (result.rows?.length || 0); i++) {
    const row = result.rows?.[i];
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

  return groups;
};

/**
 * Get group by ID
 */
export const getGroupById = async (id: string): Promise<ExpenseGroup | null> => {
  const db = getDatabase();
  const result = db.query(QUERIES.GET_GROUP_BY_ID, [id]);

  if (result.rows && result.rows.length > 0) {
    const row = result.rows[0];
    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string | undefined,
      currencyCode: row.currency_code as string,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  return null;
};

/**
 * Create a new expense group
 */
export const createGroup = async (
  name: string,
  currencyCode: string,
  description?: string,
): Promise<ExpenseGroup> => {
  const db = getDatabase();
  const id = generateUUID();
  const now = new Date().toISOString();

  db.execute(QUERIES.INSERT_GROUP, [id, name, description || null, currencyCode, now, now]);

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
 * Update a group
 */
export const updateGroup = async (
  id: string,
  updates: { name?: string; description?: string; currencyCode?: string },
): Promise<ExpenseGroup> => {
  const db = getDatabase();
  const existing = await getGroupById(id);

  if (!existing) {
    throw new Error('Group not found');
  }

  const updated: ExpenseGroup = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  db.execute(QUERIES.UPDATE_GROUP, [
    updated.name,
    updated.description || null,
    updated.currencyCode,
    updated.updatedAt,
    id,
  ]);

  return updated;
};

/**
 * Delete a group
 */
export const deleteGroup = async (id: string): Promise<void> => {
  const db = getDatabase();
  db.execute(QUERIES.DELETE_GROUP, [id]);
};

/**
 * Get members of a group
 */
export const getGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
  const db = getDatabase();
  const result = db.query(QUERIES.GET_MEMBERS_BY_GROUP, [groupId]);

  const members: GroupMember[] = [];
  for (let i = 0; i < (result.rows?.length || 0); i++) {
    const row = result.rows?.[i];
    if (row) {
      members.push({
        id: row.id as string,
        groupId: row.group_id as string,
        userId: row.user_id as string,
        name: row.name as string,
        email: row.email as string | undefined,
        createdAt: row.created_at as string,
      });
    }
  }

  return members;
};

/**
 * Add member to group
 */
export const addMemberToGroup = async (
  groupId: string,
  userId: string,
  name: string,
  email?: string,
): Promise<GroupMember> => {
  const db = getDatabase();
  const id = generateUUID();
  const now = new Date().toISOString();

  db.execute(QUERIES.INSERT_MEMBER, [id, groupId, userId, name, email || null, now]);

  return {
    id,
    groupId,
    userId,
    name,
    email,
    createdAt: now,
  };
};

/**
 * Remove member from group
 */
export const removeMemberFromGroup = async (memberId: string): Promise<void> => {
  const db = getDatabase();
  db.execute(QUERIES.DELETE_MEMBER, [memberId]);
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
 * Calculate balances for group members
 */
export const calculateGroupBalances = async (groupId: string): Promise<Record<string, number>> => {
  const db = getDatabase();
  const members = await getGroupMembers(groupId);
  const balances: Record<string, number> = {};

  // Initialize balances
  members.forEach((member) => {
    balances[member.id] = 0;
  });

  // Get all expenses for the group
  const expenses = db.query(QUERIES.GET_EXPENSES_BY_GROUP, [groupId]);

  // Calculate balances from splits
  for (let i = 0; i < (expenses.rows?.length || 0); i++) {
    const expense = expenses.rows?.[i];
    if (expense) {
      const splits = await getExpenseSplits(expense.id as string);
      splits.forEach((split) => {
        balances[split.memberId] = (balances[split.memberId] || 0) + split.amount;
      });
    }
  }

  return balances;
};

/**
 * Get settlement suggestions (who owes whom)
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
    if (balance > 0) {
      creditors.push({ memberId: member.id, amount: balance });
    } else if (balance < 0) {
      debtors.push({ memberId: member.id, amount: Math.abs(balance) });
    }
  });

  // Generate settlement suggestions
  const suggestions: Array<{ from: string; to: string; amount: number }> = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];

    const settlementAmount = Math.min(creditor.amount, debtor.amount);
    suggestions.push({
      from: debtor.memberId,
      to: creditor.memberId,
      amount: settlementAmount,
    });

    creditor.amount -= settlementAmount;
    debtor.amount -= settlementAmount;

    if (creditor.amount === 0) creditorIndex++;
    if (debtor.amount === 0) debtorIndex++;
  }

  return suggestions;
};

