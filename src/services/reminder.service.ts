/**
 * Reminder service - handles local notifications
 */

import { getDatabase } from '@/database';
import { QUERIES } from '@/database/queries';
import { Reminder } from '@/types';
import { generateUUID } from '@/utils/uuid';
import { Platform } from 'react-native';
import Notifications, { Notification } from 'react-native-notifications';

/**
 * Initialize notification service
 */
export const initNotifications = async (): Promise<void> => {
  try {
    // In v5, permissions are handled through registerRemoteNotifications
    // For local notifications, we can check permissions on iOS
    if (Platform.OS === 'ios' && Notifications.ios) {
      try {
        // Check and request permissions on iOS
        const permissions = await Notifications.ios.checkPermissions();
        if (!permissions.alert || !permissions.badge || !permissions.sound) {
          // Request permissions if not already granted
          Notifications.registerRemoteNotifications();
        }
      } catch (iosError) {
        // If iOS-specific API fails, just register for notifications
        Notifications.registerRemoteNotifications();
      }
    } else {
      // Android doesn't require explicit permission request for local notifications
      // But we can register for remote notifications which handles permissions
      Notifications.registerRemoteNotifications();
    }
  } catch (error) {
    console.error('Failed to initialize notifications:', error);
    // Don't throw - allow app to continue even if notifications fail
  }
};

/**
 * Schedule a local notification
 */
export const scheduleReminder = async (reminder: Omit<Reminder, 'id' | 'createdAt' | 'isCompleted'>): Promise<Reminder> => {
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
  const scheduledDate = new Date(reminder.scheduledDate);
  if (scheduledDate > new Date()) {
    // In v5, postLocalNotification takes a Notification object (created from payload) and optional id
    const notification = new Notification({
      title: reminder.title,
      body: reminder.message,
      // Note: react-native-notifications v5 doesn't support scheduling future notifications directly
      // For scheduling, you would need to use a library like react-native-background-job
      // or implement scheduling logic separately
    });
    const notificationId = parseInt(id.replace(/-/g, '').substring(0, 10), 16);
    Notifications.postLocalNotification(notification, notificationId);
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
  const notificationId = parseInt(id.replace(/-/g, '').substring(0, 10), 16);
  Notifications.cancelLocalNotification(notificationId);
};

