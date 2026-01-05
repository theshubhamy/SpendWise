/**
 * FCM Service - Firebase Cloud Messaging for push notifications
 */

import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import { authService } from './auth.service';
import firestore from '@react-native-firebase/firestore';

class FCMService {
  private fcmToken: string | null = null;

  /**
   * Request notification permissions
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    } else {
      const authStatus = await messaging().requestPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    }
  }

  /**
   * Get FCM token
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      this.fcmToken = token;
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Save FCM token to user document in Firestore
   */
  async saveTokenToFirestore(): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) {
      return;
    }

    const token = await this.getToken();
    if (!token) {
      return;
    }

    try {
      await firestore()
        .collection('users')
        .doc(user.id)
        .set(
          {
            fcmToken: token,
            fcmTokenUpdatedAt: firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  /**
   * Initialize FCM
   */
  async initialize(): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return;
    }

    await this.saveTokenToFirestore();

    // Handle token refresh
    messaging().onTokenRefresh(async token => {
      this.fcmToken = token;
      await this.saveTokenToFirestore();
    });

    // Handle foreground messages
    messaging().onMessage(async remoteMessage => {
      console.log('Foreground message:', remoteMessage);
      // You can show a local notification here if needed
    });

    // Handle background/quit state messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background message:', remoteMessage);
    });
  }

  /**
   * Send notification to user (via Cloud Functions or Admin SDK)
   * Note: This is a placeholder. Actual sending should be done via Cloud Functions
   */
  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    // This should be implemented via Cloud Functions
    // For now, we'll just log it
    console.log('Would send notification to user:', userId, title, body, data);
  }

  /**
   * Subscribe to group notifications topic
   */
  async subscribeToGroup(groupId: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(`group_${groupId}`);
    } catch (error) {
      console.error('Error subscribing to group topic:', error);
    }
  }

  /**
   * Unsubscribe from group notifications topic
   */
  async unsubscribeFromGroup(groupId: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(`group_${groupId}`);
    } catch (error) {
      console.error('Error unsubscribing from group topic:', error);
    }
  }
}

export const fcmService = new FCMService();

