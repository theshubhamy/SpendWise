/**
 * Recurring Expenses Screen - Manage recurring expenses
 */

import React, { useEffect } from 'react';
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
import { useRecurringStore } from '@/store/recurringStore';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { format } from 'date-fns';
import { RECURRING_INTERVALS } from '@/constants';
import { useThemeContext } from '@/context/ThemeContext';

type RecurringScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const RecurringExpensesScreen: React.FC = () => {
  const { colors } = useThemeContext();
  const navigation = useNavigation<RecurringScreenNavigationProp>();
  const { recurring, isLoading, fetchRecurring, deleteRecurring } = useRecurringStore();

  useEffect(() => {
    fetchRecurring();
  }, [fetchRecurring]);

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Recurring Expense',
      'Are you sure you want to delete this recurring expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecurring(id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete recurring expense');
            }
          },
        },
      ],
    );
  };

  const getIntervalText = (interval: string, value: number): string => {
    switch (interval) {
      case 'daily':
        return value === 1 ? 'Daily' : `Every ${value} days`;
      case 'weekly':
        return value === 1 ? 'Weekly' : `Every ${value} weeks`;
      case 'monthly':
        return value === 1 ? 'Monthly' : `Every ${value} months`;
      case 'custom':
        return `Every ${value} days`;
      default:
        return interval;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Recurring Expenses</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('CreateRecurring')}
        >
          <Text style={[styles.addButtonText, { color: '#ffffff' }]}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
        </View>
      ) : recurring.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No recurring expenses</Text>
          <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
            Create recurring expenses for rent, subscriptions, and more
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {recurring.map((item) => (
            <View
              key={item.id}
              style={[
                styles.item,
                {
                  backgroundColor: colors.card,
                  shadowColor: colors.shadow,
                },
              ]}
            >
              <View style={styles.itemInfo}>
                <Text style={[styles.itemCategory, { color: colors.text }]}>{item.category}</Text>
                <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                  {item.description || 'No description'}
                </Text>
                <Text style={[styles.itemInterval, { color: colors.primary }]}>
                  {getIntervalText(item.interval, item.intervalValue)}
                </Text>
                <Text style={[styles.itemDate, { color: colors.textTertiary }]}>
                  Started {format(new Date(item.startDate), 'MMM dd, yyyy')}
                </Text>
              </View>
              <View style={styles.itemRight}>
                <Text style={[styles.itemAmount, { color: colors.text }]}>
                  {item.currencyCode} {item.amount.toFixed(2)}
                </Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item.id)}
                >
                  <Text style={[styles.deleteButtonText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>
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
  item: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemCategory: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  itemInterval: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  itemDate: {
    fontSize: 12,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 12,
  },
});

