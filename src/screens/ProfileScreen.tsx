/**
 * Profile Screen - User profile and settings
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import {
  getBiometricEnabled,
  setBiometricEnabled,
  getAutoLockTimeout,
  setAutoLockTimeout,
} from '@/services/settings.service';
import { isBiometricAvailable } from '@/services/biometric.service';
import { useThemeContext } from '@/context/ThemeContext';
import { ThemeMode } from '@/theme';
import Icon from '@react-native-vector-icons/ionicons';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { colors, mode, setMode } = useThemeContext();
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [autoLockTimeout, setAutoLockTimeoutState] = useState(5);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    // Load settings
    setBiometricEnabledState(getBiometricEnabled());
    setAutoLockTimeoutState(getAutoLockTimeout());

    // Check biometric availability
    isBiometricAvailable().then(setBiometricAvailable);
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Header */}
      <View style={[styles.profileHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.avatarContainer, { backgroundColor: colors.primary + '20' }]}>
          <Icon name="person" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.profileName, { color: colors.text }]}>User</Text>
        <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>user@example.com</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            Alert.alert(
              'Theme',
              'Select theme mode',
              [
                { text: 'Light', onPress: () => setMode('light') },
                { text: 'Dark', onPress: () => setMode('dark') },
                { text: 'System', onPress: () => setMode('system') },
                { text: 'Cancel', style: 'cancel' },
              ],
            );
          }}
        >
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Theme</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              {mode === 'system' ? 'System Default' : mode === 'dark' ? 'Dark' : 'Light'}
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Security</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Biometric Lock</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Use fingerprint or Face ID to secure the app
            </Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={handleBiometricToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            disabled={!biometricAvailable}
          />
        </View>

        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: colors.borderLight }]}
          onPress={() => {
            Alert.alert(
              'Auto Lock Timeout',
              'Select auto lock timeout',
              [
                { text: '1 min', onPress: () => { setAutoLockTimeout(1); setAutoLockTimeoutState(1); } },
                { text: '5 min', onPress: () => { setAutoLockTimeout(5); setAutoLockTimeoutState(5); } },
                { text: '10 min', onPress: () => { setAutoLockTimeout(10); setAutoLockTimeoutState(10); } },
                { text: '30 min', onPress: () => { setAutoLockTimeout(30); setAutoLockTimeoutState(30); } },
                { text: 'Cancel', style: 'cancel' },
              ],
            );
          }}
        >
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Auto Lock</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Lock app after {autoLockTimeout} minute{autoLockTimeout !== 1 ? 's' : ''} of inactivity
            </Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{autoLockTimeout} min</Text>
            <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notifications</Text>

        <View style={[styles.settingItem, { borderBottomColor: colors.borderLight }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Enable Notifications</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
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
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Organization</Text>

        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: colors.borderLight }]}
          onPress={() => navigation.navigate('Tags')}
        >
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Manage Tags</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Create and organize expense tags</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: colors.borderLight }]}
          onPress={() => navigation.navigate('RecurringExpenses')}
        >
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Recurring Expenses</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Manage recurring expenses and subscriptions</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: colors.borderLight }]}
          onPress={() => navigation.navigate('Reminders')}
        >
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Reminders</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Manage expense reminders and notifications</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Currency</Text>

        <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.borderLight }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Base Currency</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>USD - US Dollar</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Data</Text>

        <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Export Data</Text>
          <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Backup & Restore</Text>
          <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>About</Text>

        <View style={[styles.settingItem, { borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Version</Text>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>0.0.1</Text>
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
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
  },
  section: {
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 16,
  },
});

