/**
 * Settings Screen - App settings and preferences
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
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

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
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
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
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
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
            {mode === 'system' ? 'System' : mode === 'dark' ? 'Dark' : 'Light'} ›
          </Text>
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
            // TODO: Open timeout picker
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
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{autoLockTimeout} min</Text>
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
          <Text style={[styles.settingLabel, { color: colors.text }]}>Manage Tags</Text>
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Create and organize expense tags</Text>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: colors.borderLight }]}
          onPress={() => navigation.navigate('RecurringExpenses')}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>Recurring Expenses</Text>
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Manage recurring expenses and subscriptions</Text>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: colors.borderLight }]}
          onPress={() => navigation.navigate('Reminders')}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>Reminders</Text>
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Manage expense reminders and notifications</Text>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Currency</Text>

        <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.borderLight }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Base Currency</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>USD - US Dollar</Text>
          </View>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Data</Text>

        <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Export Data</Text>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Backup & Restore</Text>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>›</Text>
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
  settingValue: {
    fontSize: 16,
    marginLeft: 16,
  },
});

