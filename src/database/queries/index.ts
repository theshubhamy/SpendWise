/**
 * Common database queries
 */

import { TABLES } from '@/database/schema';

export const QUERIES = {
  // Expenses
  GET_ALL_EXPENSES: `SELECT * FROM ${TABLES.EXPENSES} ORDER BY date DESC, created_at DESC`,
  GET_EXPENSES_BY_DATE_RANGE: `SELECT * FROM ${TABLES.EXPENSES} WHERE date BETWEEN ? AND ? ORDER BY date DESC`,
  GET_EXPENSES_BY_CATEGORY: `SELECT * FROM ${TABLES.EXPENSES} WHERE category = ? ORDER BY date DESC`,
  GET_EXPENSES_BY_GROUP: `SELECT * FROM ${TABLES.EXPENSES} WHERE group_id = ? ORDER BY date DESC`,
  GET_EXPENSE_BY_ID: `SELECT * FROM ${TABLES.EXPENSES} WHERE id = ?`,
  INSERT_EXPENSE: `INSERT INTO ${TABLES.EXPENSES} (id, amount, currency_code, category, description, notes_encrypted, date, group_id, paid_by_member_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  UPDATE_EXPENSE: `UPDATE ${TABLES.EXPENSES} SET amount = ?, currency_code = ?, category = ?, description = ?, notes_encrypted = ?, date = ?, group_id = ?, paid_by_member_id = ?, updated_at = ? WHERE id = ?`,
  DELETE_EXPENSE: `DELETE FROM ${TABLES.EXPENSES} WHERE id = ?`,

  // Groups
  GET_ALL_GROUPS: `SELECT * FROM ${TABLES.EXPENSE_GROUPS} ORDER BY created_at DESC`,
  GET_GROUP_BY_ID: `SELECT * FROM ${TABLES.EXPENSE_GROUPS} WHERE id = ?`,
  INSERT_GROUP: `INSERT INTO ${TABLES.EXPENSE_GROUPS} (id, name, description, currency_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
  UPDATE_GROUP: `UPDATE ${TABLES.EXPENSE_GROUPS} SET name = ?, description = ?, currency_code = ?, updated_at = ? WHERE id = ?`,
  DELETE_GROUP: `DELETE FROM ${TABLES.EXPENSE_GROUPS} WHERE id = ?`,

  // Group Members
  GET_MEMBERS_BY_GROUP: `SELECT * FROM ${TABLES.GROUP_MEMBERS} WHERE group_id = ? ORDER BY created_at ASC`,
  GET_MEMBER_BY_ID: `SELECT * FROM ${TABLES.GROUP_MEMBERS} WHERE id = ?`,
  INSERT_MEMBER: `INSERT INTO ${TABLES.GROUP_MEMBERS} (id, group_id, user_id, name, email, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
  DELETE_MEMBER: `DELETE FROM ${TABLES.GROUP_MEMBERS} WHERE id = ?`,

  // Expense Splits
  GET_SPLITS_BY_EXPENSE: `SELECT * FROM ${TABLES.EXPENSE_SPLITS} WHERE expense_id = ?`,
  GET_SPLITS_BY_MEMBER: `SELECT * FROM ${TABLES.EXPENSE_SPLITS} WHERE member_id = ?`,
  INSERT_SPLIT: `INSERT INTO ${TABLES.EXPENSE_SPLITS} (id, expense_id, member_id, amount, percentage, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
  DELETE_SPLITS_BY_EXPENSE: `DELETE FROM ${TABLES.EXPENSE_SPLITS} WHERE expense_id = ?`,

  // Payments
  GET_PAYMENTS_BY_GROUP: `SELECT * FROM ${TABLES.PAYMENTS} WHERE group_id = ? ORDER BY date DESC, created_at DESC`,
  GET_PAYMENT_BY_ID: `SELECT * FROM ${TABLES.PAYMENTS} WHERE id = ?`,
  INSERT_PAYMENT: `INSERT INTO ${TABLES.PAYMENTS} (id, group_id, from_member_id, to_member_id, amount, currency_code, date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  DELETE_PAYMENT: `DELETE FROM ${TABLES.PAYMENTS} WHERE id = ?`,

  // Recurring Expenses
  GET_ALL_RECURRING: `SELECT * FROM ${TABLES.RECURRING_EXPENSES} ORDER BY start_date ASC`,
  GET_RECURRING_BY_ID: `SELECT * FROM ${TABLES.RECURRING_EXPENSES} WHERE id = ?`,
  INSERT_RECURRING: `INSERT INTO ${TABLES.RECURRING_EXPENSES} (id, amount, currency_code, category, description, interval, interval_value, start_date, end_date, last_generated, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  UPDATE_RECURRING: `UPDATE ${TABLES.RECURRING_EXPENSES} SET amount = ?, currency_code = ?, category = ?, description = ?, interval = ?, interval_value = ?, start_date = ?, end_date = ?, last_generated = ?, group_id = ?, updated_at = ? WHERE id = ?`,
  DELETE_RECURRING: `DELETE FROM ${TABLES.RECURRING_EXPENSES} WHERE id = ?`,

  // Reminders
  GET_ALL_REMINDERS: `SELECT * FROM ${TABLES.REMINDERS} WHERE is_completed = 0 ORDER BY scheduled_date ASC`,
  GET_REMINDER_BY_ID: `SELECT * FROM ${TABLES.REMINDERS} WHERE id = ?`,
  INSERT_REMINDER: `INSERT INTO ${TABLES.REMINDERS} (id, type, title, message, scheduled_date, expense_id, recurring_expense_id, is_completed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  UPDATE_REMINDER: `UPDATE ${TABLES.REMINDERS} SET is_completed = ? WHERE id = ?`,
  DELETE_REMINDER: `DELETE FROM ${TABLES.REMINDERS} WHERE id = ?`,

  // Currencies
  GET_ALL_CURRENCIES: `SELECT * FROM ${TABLES.CURRENCIES} ORDER BY is_base DESC, code ASC`,
  GET_CURRENCY_BY_CODE: `SELECT * FROM ${TABLES.CURRENCIES} WHERE code = ?`,
  GET_BASE_CURRENCY: `SELECT * FROM ${TABLES.CURRENCIES} WHERE is_base = 1 LIMIT 1`,
  INSERT_CURRENCY: `INSERT INTO ${TABLES.CURRENCIES} (code, name, symbol, is_base) VALUES (?, ?, ?, ?)`,
  UPDATE_CURRENCY: `UPDATE ${TABLES.CURRENCIES} SET name = ?, symbol = ?, is_base = ? WHERE code = ?`,

  // Undo History
  GET_UNDO_HISTORY: `SELECT * FROM ${TABLES.UNDO_HISTORY} ORDER BY timestamp DESC LIMIT ?`,
  INSERT_UNDO_ACTION: `INSERT INTO ${TABLES.UNDO_HISTORY} (id, type, entity_type, payload, timestamp) VALUES (?, ?, ?, ?, ?)`,
  DELETE_UNDO_ACTION: `DELETE FROM ${TABLES.UNDO_HISTORY} WHERE id = ?`,
  CLEAR_OLD_UNDO_HISTORY: `DELETE FROM ${TABLES.UNDO_HISTORY} WHERE timestamp < ?`,
};
