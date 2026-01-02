/**
 * Expenses Screen - Modern redesigned list of all expenses
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useExpenseStore } from '@/store';
import { useGroupStore } from '@/store/groupStore';
import { getTagsForExpense } from '@/services/tag.service';
import { TagChip, Card, ScreenHeader } from '@/components';
import { format } from 'date-fns';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { undoLastAction } from '@/services/undo.service';
import { useThemeContext } from '@/context/ThemeContext';
import { Tag } from '@/types';
import Icon from '@react-native-vector-icons/ionicons';
import { UndoButton } from '@/components/UndoButton';

type ExpensesScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

export const ExpensesScreen: React.FC = () => {
  const navigation = useNavigation<ExpensesScreenNavigationProp>();
  const { expenses, isLoading, fetchExpenses, deleteExpense } =
    useExpenseStore();
  const { groups } = useGroupStore();
  const { colors } = useThemeContext();
  const [expenseTags, setExpenseTags] = useState<Record<string, Tag[]>>({});
  const [showUndo, setShowUndo] = useState(false);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filter, setFilter] = useState<'all' | 'personal' | 'group'>('all');

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
              undoTimeoutRef.current = setTimeout(
                () => setShowUndo(false),
                5000,
              );
            } catch {
              Alert.alert(
                'Error',
                'Failed to delete expense. Please try again.',
              );
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    // Load groups to show group names for split expenses
    const { fetchGroups } = useGroupStore.getState();
    fetchGroups();
  }, []);

  const handleUndo = async () => {
    const success = await undoLastAction();
    if (success) {
      setShowUndo(false);
      await fetchExpenses();
      return true;
    }
    return false;
  };

  // Filter expenses based on selected filter
  const filteredExpenses = expenses.filter(expense => {
    if (filter === 'personal') {
      return !expense.groupId; // Personal expenses have no groupId
    } else if (filter === 'group') {
      return !!expense.groupId; // Group expenses have a groupId
    }
    return true; // 'all' shows everything
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={filter === 'all' ? 'All Expenses' : filter === 'personal' ? 'Personal Expenses' : 'Group Expenses'}
        showBackButton={true}
        rightComponent={
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('AddExpense')}
            activeOpacity={0.8}
          >
            <Icon name="add" size={20} color="#ffffff" />
          </TouchableOpacity>
        }
      />

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'all' && { backgroundColor: colors.primary + '20' },
          ]}
          onPress={() => setFilter('all')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterText,
              {
                color: filter === 'all' ? colors.primary : colors.textSecondary,
                fontWeight: filter === 'all' ? '600' : '500',
              },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'personal' && { backgroundColor: colors.primary + '20' },
          ]}
          onPress={() => setFilter('personal')}
          activeOpacity={0.7}
        >
          <Icon
            name={filter === 'personal' ? 'person' : 'person-outline'}
            size={16}
            color={filter === 'personal' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.filterText,
              {
                color: filter === 'personal' ? colors.primary : colors.textSecondary,
                fontWeight: filter === 'personal' ? '600' : '500',
              },
            ]}
          >
            Personal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'group' && { backgroundColor: colors.primary + '20' },
          ]}
          onPress={() => setFilter('group')}
          activeOpacity={0.7}
        >
          <Icon
            name={filter === 'group' ? 'people' : 'people-outline'}
            size={16}
            color={filter === 'group' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.filterText,
              {
                color: filter === 'group' ? colors.primary : colors.textSecondary,
                fontWeight: filter === 'group' ? '600' : '500',
              },
            ]}
          >
            Group
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading expenses...
          </Text>
        </View>
      ) : filteredExpenses.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon
            name={
              filter === 'personal'
                ? 'person-outline'
                : filter === 'group'
                  ? 'people-outline'
                  : 'receipt-outline'
            }
            size={80}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            {filter === 'personal'
              ? 'No personal expenses yet'
              : filter === 'group'
                ? 'No group expenses yet'
                : 'No expenses yet'}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {filter === 'personal'
              ? 'Personal expenses are not split with any group'
              : filter === 'group'
                ? 'Group expenses are split with group members'
                : 'Start tracking your expenses!'}
          </Text>
          <TouchableOpacity
            style={[styles.addFirstButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('AddExpense')}
          >
            <Icon name="add" size={20} color="#ffffff" />
            <Text style={styles.addFirstButtonText}>Add Expense</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredExpenses}
          keyExtractor={item => item.id}
          renderItem={({ item: expense }) => (
            <Card
              variant="elevated"
              onPress={() => handleEdit(expense.id)}
              style={styles.expenseCard}
            >
              <View style={styles.expenseContent}>
                <View
                  style={[
                    styles.expenseIconContainer,
                    { backgroundColor: colors.primary + '15' },
                  ]}
                >
                  <Icon name="receipt" size={22} color={colors.primary} />
                </View>
                <View style={styles.expenseInfo}>
                  <View style={styles.categoryRow}>
                    <Text
                      style={[styles.expenseCategory, { color: colors.text }]}
                    >
                      {expense.category}
                    </Text>
                    {expense.groupId && (
                      <View
                        style={[
                          styles.splitBadge,
                          { backgroundColor: colors.secondary + '20' },
                        ]}
                      >
                        <Icon
                          name="people"
                          size={12}
                          color={colors.secondary}
                        />
                        <Text
                          style={[
                            styles.splitBadgeText,
                            { color: colors.secondary },
                          ]}
                        >
                          {groups.find(g => g.id === expense.groupId)?.name ||
                            'Split'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.expenseDescription,
                      { color: colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {expense.description || 'No description'}
                  </Text>
                  {expenseTags[expense.id] &&
                    expenseTags[expense.id].length > 0 && (
                      <View style={styles.tagsContainer}>
                        {expenseTags[expense.id].map(tag => (
                          <TagChip key={tag.id} tag={tag} size="small" />
                        ))}
                      </View>
                    )}
                  <Text
                    style={[styles.expenseDate, { color: colors.textTertiary }]}
                  >
                    {format(new Date(expense.date), 'MMM dd, yyyy')}
                  </Text>
                </View>
                <View style={styles.expenseRight}>
                  <Text style={[styles.expenseAmount, { color: colors.text }]}>
                    {expense.currencyCode} {expense.amount.toFixed(2)}
                  </Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={e => {
                      e.stopPropagation();
                      handleDelete(expense.id);
                    }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Icon name="trash-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
        />
      )}

      {showUndo && (
        <UndoButton
          message="Expense deleted"
          onUndo={handleUndo}
          autoHideDuration={5000}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 15,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    marginBottom: 24,
    textAlign: 'center',
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addFirstButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  expenseCard: {
    marginBottom: 12,
    padding: 16,
  },
  expenseContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: '600',
  },
  splitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  splitBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expenseDescription: {
    fontSize: 14,
    marginBottom: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  expenseDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  deleteButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
  },
});
