/**
 * Authentication Service using Firebase
 * Handles Google Sign-In via Firebase Authentication
 */

import {
  FirebaseAuthTypes,
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { Storage } from '@/utils/storage';
import { STORAGE_KEYS } from '@/constants';

// Suppress modular API deprecation warnings temporarily
// These warnings are forward-compatibility notices for future versions
// React Native Firebase v23 still uses the namespaced API as the primary pattern
if (typeof globalThis !== 'undefined') {
  (globalThis as any).RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
}

export interface User {
  id: string;
  email?: string;
  name?: string;
  photoURL?: string;
  createdAt: string;
}

class AuthService {
  private currentUser: User | null = null;
  private authStateListeners: Set<() => void> = new Set();

  /**
   * Initialize authentication service
   */
  async initialize(): Promise<void> {
    // Configure Google Sign-In
    // Using the Web Client ID from Firebase (google-services.json)
    // This is the OAuth client with client_type 3 (Web client)
    GoogleSignin.configure({
      webClientId:
        '140756642274-j59lu0cjhjnur65ncd2kmuthem9lchgl.apps.googleusercontent.com', // Firebase Web Client ID
      offlineAccess: true,
    });

    // Listen for auth state changes
    // Using getAuth() pattern for modular API compatibility
    const authInstance = getAuth();
    authInstance.onAuthStateChanged(
      async (firebaseUser: FirebaseAuthTypes.User | null) => {
        if (firebaseUser) {
          await this.loadUserFromFirebaseUser(firebaseUser);
        } else {
          this.currentUser = null;
          Storage.delete(STORAGE_KEYS.USER_ID);
          Storage.delete(STORAGE_KEYS.USER_EMAIL);
          Storage.delete(STORAGE_KEYS.ACCESS_TOKEN);
          Storage.delete(STORAGE_KEYS.REFRESH_TOKEN);
        }
        // Notify all listeners of auth state change
        this.notifyAuthStateChange();
      },
    );

    // Check for existing session
    const firebaseUser = authInstance.currentUser;
    if (firebaseUser) {
      await this.loadUserFromFirebaseUser(firebaseUser);
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<User> {
    try {
      // Check if Google Play Services are available (Android)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      }

      // Get the user's ID token
      const signInResult = await GoogleSignin.signIn();

      // Check if sign-in was successful
      if (signInResult.type !== 'success') {
        throw new Error('Google sign-in was cancelled');
      }

      const idToken = signInResult.data.idToken;
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // Create a Google credential with the token
      // Using GoogleAuthProvider from modular API
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      // Using modular API: signInWithCredential(auth, credential)
      const authInstance = getAuth();
      const userCredential = await signInWithCredential(
        authInstance,
        googleCredential,
      );

      if (!userCredential.user) {
        throw new Error('Failed to sign in with Google');
      }

      await this.loadUserFromFirebaseUser(userCredential.user);
      // Notify listeners of auth state change
      this.notifyAuthStateChange();
      return this.currentUser!;
    } catch (error: any) {
      console.error('Google sign-in error:', error);

      // Handle DEVELOPER_ERROR - SHA-1 fingerprint not registered
      if (error.code === 'auth/developer-error') {
        throw new Error(
          'SHA-1 fingerprint not registered. Please register the SHA-1 fingerprint in the Firebase console.',
        );
      }
      if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error(
          'An account already exists with a different sign-in method',
        );
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error('Invalid credential. Please try again.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection.');
      }

      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      // Sign out from Google
      try {
        await GoogleSignin.signOut();
      } catch (error) {
        // Ignore if not signed in
        console.log('Google sign out:', error);
      }

      // Sign out from Firebase
      // Using getAuth() pattern for modular API compatibility
      const authInstance = getAuth();
      await authInstance.signOut();

      this.currentUser = null;
      Storage.delete(STORAGE_KEYS.USER_ID);
      Storage.delete(STORAGE_KEYS.USER_EMAIL);
      Storage.delete(STORAGE_KEYS.ACCESS_TOKEN);
      Storage.delete(STORAGE_KEYS.REFRESH_TOKEN);
      // Notify listeners of auth state change
      this.notifyAuthStateChange();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    // Using getAuth() pattern for modular API compatibility
    const authInstance = getAuth();
    return this.currentUser !== null && authInstance.currentUser !== null;
  }

  /**
   * Get Firebase auth token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      // Using getAuth() pattern for modular API compatibility
      const authInstance = getAuth();
      const user = authInstance.currentUser;
      if (user) {
        // Use getIdToken() with explicit forceRefresh parameter
        const token = await user.getIdToken(false);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: () => void): () => void {
    this.authStateListeners.add(callback);
    // Return unsubscribe function
    return () => {
      this.authStateListeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of auth state change
   */
  private notifyAuthStateChange(): void {
    this.authStateListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  /**
   * Load user from Firebase user object
   */
  private async loadUserFromFirebaseUser(
    firebaseUser: FirebaseAuthTypes.User,
  ): Promise<void> {
    // Use getIdToken() with explicit forceRefresh parameter to avoid deprecation warning
    const token = await firebaseUser.getIdToken(false);

    this.currentUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email || undefined,
      name: firebaseUser.displayName || undefined,
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
    };

    // Store user info
    Storage.setString(STORAGE_KEYS.USER_ID, firebaseUser.uid);
    if (firebaseUser.email) {
      Storage.setString(STORAGE_KEYS.USER_EMAIL, firebaseUser.email);
    }
    if (token) {
      Storage.setString(STORAGE_KEYS.ACCESS_TOKEN, token);
    }
  }
}

export const authService = new AuthService();
