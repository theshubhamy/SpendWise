/**
 * Reminders Screen - Manage reminders
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import {
  getPendingReminders,
  scheduleReminder,
  completeReminder,
} from '@/services/reminder.service';
import { Reminder } from '@/types';
import { format } from 'date-fns';
import { Input, Button, DatePicker } from '@/components';
import { useThemeContext } from '@/context/ThemeContext';

type RemindersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const RemindersScreen: React.FC = () => {
  const { colors } = useThemeContext();
  const navigation = useNavigation<RemindersScreenNavigationProp>();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split('T')[0],
  );

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const pending = await getPendingReminders();
      setReminders(pending);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    try {
      await scheduleReminder({
        type: 'expense',
        title: title.trim(),
        message: message.trim() || undefined,
        scheduledDate: scheduledDate,
      });
      setTitle('');
      setMessage('');
      setScheduledDate(new Date().toISOString().split('T')[0]);
      setShowAddForm(false);
      await loadReminders();
    } catch (error) {
      Alert.alert('Error', 'Failed to create reminder');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeReminder(id);
      await loadReminders();
    } catch (error) {
      Alert.alert('Error', 'Failed to complete reminder');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Reminders</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Text style={[styles.addButtonText, { color: '#ffffff' }]}>
            {showAddForm ? 'Cancel' : '+ Add'}
          </Text>
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <View style={[styles.formContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Reminder title"
          />
          <Input
            label="Message (Optional)"
            value={message}
            onChangeText={setMessage}
            placeholder="Reminder message"
            multiline
            numberOfLines={3}
          />
          <DatePicker
            label="Scheduled Date"
            value={scheduledDate}
            onValueChange={setScheduledDate}
          />
          <Button
            title="Create Reminder"
            onPress={handleAddReminder}
            style={styles.submitButton}
          />
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading reminders...</Text>
        </View>
      ) : reminders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No reminders</Text>
          <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
            Create reminders to stay on top of your expenses
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {reminders.map((reminder) => (
            <View
              key={reminder.id}
              style={[
                styles.reminderItem,
                {
                  backgroundColor: colors.card,
                  shadowColor: colors.shadow,
                },
              ]}
            >
              <View style={styles.reminderInfo}>
                <Text style={[styles.reminderTitle, { color: colors.text }]}>{reminder.title}</Text>
                {reminder.message && (
                  <Text style={[styles.reminderMessage, { color: colors.textSecondary }]}>{reminder.message}</Text>
                )}
                <Text style={[styles.reminderDate, { color: colors.textTertiary }]}>
                  {format(new Date(reminder.scheduledDate), 'MMM dd, yyyy HH:mm')}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.completeButton, { backgroundColor: colors.success }]}
                onPress={() => handleComplete(reminder.id)}
              >
                <Text style={[styles.completeButtonText, { color: '#ffffff' }]}>Done</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  submitButton: {
    marginTop: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  reminderItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reminderMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  reminderDate: {
    fontSize: 12,
  },
  completeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

