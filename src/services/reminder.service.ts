/**
 * Reminder service - handles local notifications
 */

import { getDatabase } from '@/database';
import { QUERIES } from '@/database/queries';
import { Reminder } from '@/types';
import { generateUUID } from '@/utils/uuid';
import Notifications from 'react-native-notifications';

/**
 * Initialize notification service
 * Note: In react-native-notifications v5, permissions are typically requested
 * when needed. For local notifications, minimal initialization is required.
 */
export const initNotifications = async (): Promise<void> => {
  try {
    // In v5, local notifications work without explicit registration
    // Permissions will be requested automatically when posting notifications
    // No initialization needed for basic local notifications
    console.log('Notifications initialized');
  } catch (error) {
    console.error('Failed to initialize notifications:', error);
    // Don't throw - allow app to continue even if notifications fail
  }
};

/**
 * Schedule a local notification
 */
export const scheduleReminder = async (
  reminder: Omit<Reminder, 'id' | 'createdAt' | 'isCompleted'>,
): Promise<Reminder> => {
  const db = getDatabase();
  const id = generateUUID();
  const now = new Date().toISOString();

  // Save to database
  db.execute(QUERIES.INSERT_REMINDER, [
    id,
    reminder.type,
    reminder.title,
    reminder.message,
    reminder.scheduledDate,
    reminder.expenseId || null,
    reminder.recurringExpenseId || null,
    0, // isCompleted
    now,
  ]);

  // Schedule local notification
  // Note: react-native-notifications v5 doesn't support scheduling future notifications directly
  // We can only post notifications that are due now or in the past
  const scheduledDate = new Date(reminder.scheduledDate);
  const currentTime = new Date();

  // Only post notification if scheduled time has passed or is very close (within 1 minute)
  // This prevents immediate posting of future-dated reminders
  const timeDiff = scheduledDate.getTime() - currentTime.getTime();
  if (timeDiff <= 60000) {
    // Scheduled time has passed or is within 1 minute - post notification
    try {
      const notificationId = parseInt(
        id.replace(/-/g, '').substring(0, 10),
        16,
      );
      // Use the v5 API - postLocalNotification with payload
      if (typeof (Notifications as any).postLocalNotification === 'function') {
        (Notifications as any).postLocalNotification(
          {
            title: reminder.title,
            body: reminder.message,
          },
          notificationId,
        );
      } else {
        console.warn('postLocalNotification method not available');
      }
    } catch (notificationError) {
      console.warn('Failed to schedule notification:', notificationError);
      // Continue even if notification scheduling fails
    }
  } else {
    // Future notification - would need background job scheduler for proper implementation
    // For now, the reminder is saved to the database and can be checked periodically
    console.log(
      `Reminder scheduled for future (${scheduledDate.toISOString()}). ` +
        'Notification will be posted when due. Background job scheduler required for automatic delivery.',
    );
  }

  return {
    ...reminder,
    id,
    createdAt: now,
    isCompleted: false,
  };
};

/**
 * Get all pending reminders
 */
export const getPendingReminders = async (): Promise<Reminder[]> => {
  const db = getDatabase();
  const result = db.query(QUERIES.GET_ALL_REMINDERS);

  const reminders: Reminder[] = [];
  for (let i = 0; i < (result.rows?.length || 0); i++) {
    const row = result.rows?.[i];
    if (row) {
      reminders.push({
        id: row.id as string,
        type: row.type as Reminder['type'],
        title: row.title as string,
        message: row.message as string,
        scheduledDate: row.scheduled_date as string,
        expenseId: row.expense_id as string | undefined,
        recurringExpenseId: row.recurring_expense_id as string | undefined,
        isCompleted: (row.is_completed as number) === 1,
        createdAt: row.created_at as string,
      });
    }
  }

  return reminders;
};

/**
 * Mark reminder as completed
 */
export const completeReminder = async (id: string): Promise<void> => {
  const db = getDatabase();
  db.execute(QUERIES.UPDATE_REMINDER, [1, id]); // isCompleted = 1

  // Cancel notification
  // In v5, cancelLocalNotification takes a notificationId (number)
  // We need to convert the UUID to the same number format used when scheduling
  try {
    const notificationId = parseInt(id.replace(/-/g, '').substring(0, 10), 16);
    if (typeof (Notifications as any).cancelLocalNotification === 'function') {
      (Notifications as any).cancelLocalNotification(notificationId);
    } else {
      console.warn('cancelLocalNotification method not available');
    }
  } catch (error) {
    console.warn('Failed to cancel notification:', error);
  }
};
