/**
 * Expenses Screen - List all expenses
 */

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useExpenseStore } from '@/store';
import { getTagsForExpense } from '@/services/tag.service';
import { TagChip } from '@/components';
import { format } from 'date-fns';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { undoLastAction } from '@/services/undo.service';
import { useThemeContext } from '@/context/ThemeContext';
import { Tag } from '@/types';

type ExpensesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ExpensesScreen: React.FC = () => {
  const navigation = useNavigation<ExpensesScreenNavigationProp>();
  const { expenses, isLoading, fetchExpenses, deleteExpense } = useExpenseStore();
  const { colors } = useThemeContext();
  const [expenseTags, setExpenseTags] = useState<Record<string, Tag[]>>({});
  const [showUndo, setShowUndo] = useState(false);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load tags for all expenses
    const loadTags = async () => {
      const tagsMap: Record<string, Tag[]> = {};
      for (const expense of expenses) {
        const tags = await getTagsForExpense(expense.id);
        tagsMap[expense.id] = tags;
      }
      setExpenseTags(tagsMap);
    };
    if (expenses.length > 0) {
      loadTags();
    }
  }, [expenses]);

  const handleEdit = (expenseId: string) => {
    navigation.navigate('EditExpense', { expenseId });
  };

  const handleDelete = (expenseId: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(expenseId);
              await fetchExpenses();
              // Show undo option
              setShowUndo(true);
              if (undoTimeoutRef.current) {
                clearTimeout(undoTimeoutRef.current);
              }
              undoTimeoutRef.current = setTimeout(() => setShowUndo(false), 5000);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete expense. Please try again.');
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>All Expenses</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AddExpense')}
        >
          <Text style={[styles.addButtonText, { color: '#ffffff' }]}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading expenses...</Text>
        </View>
      ) : expenses.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>No expenses yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Start tracking your expenses!</Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={({ item: expense }) => (
            <TouchableOpacity
              style={[styles.expenseItem, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
              onPress={() => handleEdit(expense.id)}
              activeOpacity={0.7}
            >
              <View style={styles.expenseInfo}>
                <Text style={[styles.expenseCategory, { color: colors.text }]}>{expense.category}</Text>
                <Text style={[styles.expenseDescription, { color: colors.textSecondary }]}>
                  {expense.description || 'No description'}
                </Text>
                {expenseTags[expense.id] && expenseTags[expense.id].length > 0 && (
                  <View style={styles.tagsContainer}>
                    {expenseTags[expense.id].map((tag) => (
                      <TagChip key={tag.id} tag={tag} size="small" />
                    ))}
                  </View>
                )}
                <Text style={[styles.expenseDate, { color: colors.textTertiary }]}>
                  {format(new Date(expense.date), 'MMM dd, yyyy')}
                </Text>
              </View>
              <View style={styles.expenseRight}>
                <Text style={[styles.expenseAmount, { color: colors.text }]}>
                  {expense.currencyCode} {expense.amount.toFixed(2)}
                </Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(expense.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
        />
      )}

      {showUndo && (
        <View
          style={[
            styles.undoContainer,
            {
              backgroundColor: colors.card,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Text style={[styles.undoMessage, { color: colors.text }]}>Expense deleted</Text>
          <TouchableOpacity
            onPress={async () => {
              const success = await undoLastAction();
              if (success) {
                setShowUndo(false);
                await fetchExpenses();
              }
            }}
            style={styles.undoButton}
          >
            <Text style={[styles.undoText, { color: colors.primary }]}>UNDO</Text>
          </TouchableOpacity>
        </View>
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
  },
  emptySubtext: {
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  expenseItem: {
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
  expenseInfo: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  expenseDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
  },
  expenseRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  undoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  undoMessage: {
    fontSize: 14,
  },
  undoButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  undoText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

