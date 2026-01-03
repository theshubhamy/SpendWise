/**
 * Profile Screen - User profile and settings
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import {
  getBiometricEnabled,
  setBiometricEnabled,
  getAutoLockTimeout,
  setAutoLockTimeout,
  getBaseCurrency,
  setBaseCurrency,
} from '@/services/settings.service';
import { isBiometricAvailable } from '@/services/biometric.service';
import { useThemeContext } from '@/context/ThemeContext';
import { authService } from '@/services/auth.service';
import Icon from '@react-native-vector-icons/ionicons';
import { CurrencyPicker } from '@/components/CurrencyPicker';
import { Image } from 'react-native';
import { getCurrencyDisplayName, CURRENCIES } from '@/constants/currencies';

type ProfileScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { colors, mode, setMode } = useThemeContext();
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [autoLockTimeout, setAutoLockTimeoutState] = useState(5);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [baseCurrency, setBaseCurrencyState] = useState('INR');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [user, setUser] = useState(authService.getCurrentUser());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Load settings
    setBiometricEnabledState(getBiometricEnabled());
    setAutoLockTimeoutState(getAutoLockTimeout());
    setBaseCurrencyState(getBaseCurrency());

    // Check biometric availability
    isBiometricAvailable().then(setBiometricAvailable);

    // Load user data
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      // Check if biometrics is available before enabling
      const available = await isBiometricAvailable();
      if (!available) {
        Alert.alert(
          'Biometrics Not Available',
          'Biometric authentication is not available on this device. Please enable it in your device settings.',
        );
        return;
      }
    }

    setBiometricEnabled(value);
    setBiometricEnabledState(value);
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await authService.signOut();
            // Navigation will be handled by App.tsx auth state
          } catch (error) {
            Alert.alert(
              'Error',
              error instanceof Error ? error.message : 'Failed to sign out',
            );
          }
        },
      },
    ]);
  };

  const handleSync = async () => {
    if (!user) {
      Alert.alert('Not Signed In', 'Please sign in to sync your data.');
      return;
    }

    setSyncing(true);
    try {
      // Import sync service dynamically to avoid circular dependencies
      const { syncService } = await import('@/services/sync.service');
      await syncService.syncAll();
      Alert.alert('Success', 'Your data has been synced successfully.');
    } catch (error) {
      Alert.alert(
        'Sync Error',
        error instanceof Error ? error.message : 'Failed to sync data',
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View
        style={[
          styles.profileHeader,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.avatarContainer,
            { backgroundColor: colors.primary + '20' },
          ]}
        >
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
          ) : (
            <Icon name="person" size={48} color={colors.primary} />
          )}
        </View>
        <Text style={[styles.profileName, { color: colors.text }]}>
          {user?.name || 'User'}
        </Text>
        <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
          {user?.email || 'Not signed in'}
        </Text>
        {!user && (
          <TouchableOpacity
            style={[styles.signInButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              // Navigate to auth screen or trigger sign in
              // This will be handled by App.tsx auth state
            }}
          >
            <Text style={styles.signInButtonText}>Sign In with Google</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Appearance
        </Text>

        <TouchableOpacity
          style={[
            styles.settingItem,
            { borderBottomColor: colors.borderLight },
          ]}
          onPress={() => {
            Alert.alert('Theme', 'Select theme mode', [
              { text: 'Light', onPress: () => setMode('light') },
              { text: 'Dark', onPress: () => setMode('dark') },
              { text: 'System', onPress: () => setMode('system') },
              { text: 'Cancel', style: 'cancel' },
            ]);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <View
              style={[
                styles.settingIconContainer,
                { backgroundColor: colors.primary + '15' },
              ]}
            >
              <Icon name="color-palette" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Theme
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {mode === 'system'
                  ? 'System Default'
                  : mode === 'dark'
                  ? 'Dark'
                  : 'Light'}
              </Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Security
        </Text>

        <View
          style={[
            styles.settingItem,
            { borderBottomColor: colors.borderLight },
          ]}
        >
          <View style={styles.settingLeft}>
            <View
              style={[
                styles.settingIconContainer,
                { backgroundColor: colors.secondary + '15' },
              ]}
            >
              <Icon name="lock-closed" size={20} color={colors.secondary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Biometric Lock
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Use fingerprint or Face ID to secure the app
              </Text>
            </View>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={handleBiometricToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            disabled={!biometricAvailable}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.settingItem,
            { borderBottomColor: colors.borderLight },
          ]}
          onPress={() => {
            Alert.alert('Auto Lock Timeout', 'Select auto lock timeout', [
              {
                text: '1 min',
                onPress: () => {
                  setAutoLockTimeout(1);
                  setAutoLockTimeoutState(1);
                },
              },
              {
                text: '5 min',
                onPress: () => {
                  setAutoLockTimeout(5);
                  setAutoLockTimeoutState(5);
                },
              },
              {
                text: '10 min',
                onPress: () => {
                  setAutoLockTimeout(10);
                  setAutoLockTimeoutState(10);
                },
              },
              {
                text: '30 min',
                onPress: () => {
                  setAutoLockTimeout(30);
                  setAutoLockTimeoutState(30);
                },
              },
              { text: 'Cancel', style: 'cancel' },
            ]);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <View
              style={[
                styles.settingIconContainer,
                { backgroundColor: colors.accent + '15' },
              ]}
            >
              <Icon name="time-outline" size={20} color={colors.accent} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Auto Lock
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Lock app after {autoLockTimeout} minute
                {autoLockTimeout !== 1 ? 's' : ''} of inactivity
              </Text>
            </View>
          </View>
          <View style={styles.settingRight}>
            <Text
              style={[styles.settingValue, { color: colors.textSecondary }]}
            >
              {autoLockTimeout} min
            </Text>
            <Icon
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Notifications
        </Text>

        <View
          style={[
            styles.settingItem,
            { borderBottomColor: colors.borderLight },
          ]}
        >
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Enable Notifications
            </Text>
            <Text
              style={[
                styles.settingDescription,
                { color: colors.textSecondary },
              ]}
            >
              Receive reminders for bills and recurring expenses
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Organization
        </Text>

        <TouchableOpacity
          style={[
            styles.settingItem,
            { borderBottomColor: colors.borderLight },
          ]}
          onPress={() => navigation.navigate('RecurringExpenses')}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <View
              style={[
                styles.settingIconContainer,
                { backgroundColor: colors.success + '15' },
              ]}
            >
              <Icon name="repeat" size={20} color={colors.success} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Recurring Expenses
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Manage recurring expenses and subscriptions
              </Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.settingItem,
            { borderBottomColor: colors.borderLight },
          ]}
          onPress={() => navigation.navigate('Reminders')}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <View
              style={[
                styles.settingIconContainer,
                { backgroundColor: colors.warning + '15' },
              ]}
            >
              <Icon name="notifications" size={20} color={colors.warning} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Reminders
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Manage expense reminders and notifications
              </Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Currency
        </Text>

        <TouchableOpacity
          style={[
            styles.settingItem,
            { borderBottomColor: colors.borderLight },
          ]}
          onPress={() => setShowCurrencyPicker(true)}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <View
              style={[
                styles.settingIconContainer,
                { backgroundColor: colors.info + '15' },
              ]}
            >
              <Icon name="cash" size={20} color={colors.info} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Currency
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {getCurrencyDisplayName(baseCurrency)}
              </Text>
            </View>
          </View>
          <View style={styles.settingRight}>
            <Text
              style={[styles.settingValue, { color: colors.textSecondary }]}
            >
              {baseCurrency}
            </Text>
            <Icon
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Currency Picker Modal */}
      <CurrencyPicker
        visible={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        onSelect={currency => {
          setBaseCurrency(currency.code);
          setBaseCurrencyState(currency.code);
        }}
        selectedCurrency={baseCurrency}
        currencies={CURRENCIES}
      />

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Sync & Backup
        </Text>

        {user && (
          <TouchableOpacity
            style={[
              styles.settingItem,
              { borderBottomColor: colors.borderLight },
            ]}
            onPress={handleSync}
            disabled={syncing}
          >
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.settingIconContainer,
                  { backgroundColor: colors.info + '15' },
                ]}
              >
                <Icon name="cloud-upload" size={20} color={colors.info} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Sync to Firebase
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {syncing
                    ? 'Syncing your data...'
                    : 'Backup your expenses to the cloud'}
                </Text>
              </View>
            </View>
            {syncing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Icon
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.settingItem,
            { borderBottomColor: colors.borderLight },
          ]}
        >
          <View style={styles.settingLeft}>
            <View
              style={[
                styles.settingIconContainer,
                { backgroundColor: colors.success + '15' },
              ]}
            >
              <Icon name="download" size={20} color={colors.success} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Export Data
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Export your expenses as CSV or JSON
              </Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {user && (
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Account
          </Text>

          <TouchableOpacity
            style={[
              styles.settingItem,
              { borderBottomColor: colors.borderLight },
            ]}
            onPress={handleLogout}
          >
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.settingIconContainer,
                  { backgroundColor: colors.error + '15' },
                ]}
              >
                <Icon name="log-out" size={20} color={colors.error} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.error }]}>
                  Sign Out
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Sign out of your account
                </Text>
              </View>
            </View>
            <Icon
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          About
        </Text>

        <View
          style={[
            styles.settingItem,
            { borderBottomColor: colors.borderLight },
          ]}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Version
          </Text>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
            0.0.1
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    paddingTop: 40,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  profileName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  profileEmail: {
    fontSize: 16,
    fontWeight: '400',
  },
  section: {
    paddingVertical: 8,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  signInButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
