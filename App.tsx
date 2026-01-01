import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StatusBar,
  ActivityIndicator,
  View,
  StyleSheet,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from '@/navigation/AppNavigator';
import { LockScreen } from '@/screens/LockScreen';
import { ThemeProvider, useThemeContext } from '@/context/ThemeContext';
import { initDatabase } from '@/database';
import { initEncryptionKey } from '@/services/crypto.service';
import { initNotifications } from '@/services/reminder.service';
import { generateRecurringExpenses } from '@/services/recurring.service';
import {
  initBiometric,
  shouldLockApp,
  lockApp,
  unlockApp,
  isAppLocked,
} from '@/services/biometric.service';
import { setLastActiveTime } from '@/services/settings.service';

function AppContent() {
  const { colors, isDark } = useThemeContext();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize database
        await initDatabase();

        // Initialize encryption
        await initEncryptionKey();

        // Initialize biometrics
        await initBiometric();

        // Initialize notifications
        await initNotifications();

        // Generate recurring expenses
        await generateRecurringExpenses();

        // Check if app should be locked
        if (shouldLockApp()) {
          lockApp();
          setIsLocked(true);
        } else {
          setLastActiveTime(Date.now());
        }

        setIsInitialized(true);
      } catch (err) {
        console.error('App initialization error:', err);
        setError((err as Error).message);
        setIsInitialized(true); // Still show app even if some init fails
      }
    };

    initializeApp();
  }, []);

  const handleAppBackground = useCallback(() => {
    // Lock app when going to background
    lockApp();
    setIsLocked(true);
  }, []);

  const handleAppResume = useCallback(async () => {
    // Check if app should be locked
    if (shouldLockApp() || isAppLocked()) {
      setIsLocked(true);
    } else {
      setLastActiveTime(Date.now());
    }
  }, []);

  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        handleAppResume();
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App has gone to the background
        handleAppBackground();
      }

      appState.current = nextAppState;
    },
    [handleAppResume, handleAppBackground],
  );

  useEffect(() => {
    // Handle app state changes (background/foreground)
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  const handleUnlock = async () => {
    const success = await unlockApp();
    if (success) {
      setIsLocked(false);
      setLastActiveTime(Date.now());
    }
  };

  if (!isInitialized) {
    return (
      <SafeAreaProvider>
        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  if (error) {
    console.warn('App initialization warning:', error);
  }

  // Show lock screen if app is locked
  if (isLocked) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <LockScreen onUnlock={handleUnlock} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
