/**
 * Undo service - implements command pattern for undoable actions
 */

import { getDatabase } from '@/database';
import { QUERIES } from '@/database/queries';
import { UndoAction } from '@/types';
import { generateUUID } from '@/utils/uuid';
import { MAX_UNDO_HISTORY } from '@/constants';
import { createExpense, updateExpense, deleteExpense } from '@/services/expense.service';
import { Expense } from '@/types';

/**
 * Save an undo action
 */
export const saveUndoAction = async (
  type: UndoAction['type'],
  entityType: UndoAction['entityType'],
  payload: any
): Promise<void> => {
  const db = getDatabase();
  const id = generateUUID();
  const timestamp = new Date().toISOString();

  db.execute(QUERIES.INSERT_UNDO_ACTION, [
    id,
    type,
    entityType,
    JSON.stringify(payload),
    timestamp,
  ]);

  // Clean up old undo history
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7); // Keep last 7 days
  db.execute(QUERIES.CLEAR_OLD_UNDO_HISTORY, [cutoffDate.toISOString()]);
};

/**
 * Get recent undo actions
 */
export const getUndoHistory = async (limit: number = MAX_UNDO_HISTORY): Promise<UndoAction[]> => {
  const db = getDatabase();
  const result = db.query(QUERIES.GET_UNDO_HISTORY, [limit]);

  const actions: UndoAction[] = [];
  for (let i = 0; i < (result.rows?.length || 0); i++) {
    const row = result.rows?.[i];
    if (row) {
      actions.push({
        id: row.id as string,
        type: row.type as UndoAction['type'],
        entityType: row.entity_type as UndoAction['entityType'],
        payload: JSON.parse(row.payload as string),
        timestamp: row.timestamp as string,
      });
    }
  }

  return actions;
};

/**
 * Undo the last action
 */
export const undoLastAction = async (): Promise<boolean> => {
  const history = await getUndoHistory(1);

  if (history.length === 0) {
    return false;
  }

  const action = history[0];

  try {
    switch (action.entityType) {
      case 'expense':
        await undoExpenseAction(action);
        break;
      // Add other entity types as needed
      default:
        return false;
    }

    // Remove from undo history
    const db = getDatabase();
    db.execute(QUERIES.DELETE_UNDO_ACTION, [action.id]);

    return true;
  } catch (error) {
    console.error('Undo failed:', error);
    return false;
  }
};

/**
 * Undo expense-related actions
 */
const undoExpenseAction = async (action: UndoAction): Promise<void> => {
  const expense = action.payload as Expense;

  switch (action.type) {
    case 'delete':
      // Restore deleted expense
      await createExpense({
        amount: expense.amount,
        currencyCode: expense.currencyCode,
        baseAmount: expense.baseAmount,
        category: expense.category,
        description: expense.description,
        notes: expense.notes,
        date: expense.date,
        groupId: expense.groupId,
      });
      break;

    case 'edit':
      // Restore previous state
      await updateExpense(expense.id, {
        amount: expense.amount,
        currencyCode: expense.currencyCode,
        baseAmount: expense.baseAmount,
        category: expense.category,
        description: expense.description,
        notes: expense.notes,
        date: expense.date,
        groupId: expense.groupId,
      });
      break;

    case 'add':
      // Remove added expense
      await deleteExpense(expense.id);
      break;
  }
};

