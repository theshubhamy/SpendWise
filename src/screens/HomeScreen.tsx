/**
 * Home Screen - Main dashboard
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useExpenseStore } from '@/store';
import { format } from 'date-fns';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useThemeContext } from '@/context/ThemeContext';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { expenses, isLoading, fetchExpenses } = useExpenseStore();
  const { colors } = useThemeContext();

  const handleEdit = (expenseId: string) => {
    navigation.navigate('EditExpense', { expenseId });
  };

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.baseAmount, 0);
  const todayExpenses = expenses.filter(
    exp =>
      format(new Date(exp.date), 'yyyy-MM-dd') ===
      format(new Date(), 'yyyy-MM-dd'),
  );
  const todayTotal = todayExpenses.reduce(
    (sum, exp) => sum + exp.baseAmount,
    0,
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>SpendWise</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Expense Management
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, shadowColor: colors.shadow },
            ]}
          >
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Expenses
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              ${totalExpenses.toFixed(2)}
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, shadowColor: colors.shadow },
            ]}
          >
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Today
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              ${todayTotal.toFixed(2)}
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, shadowColor: colors.shadow },
            ]}
          >
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Count
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {expenses.length}
            </Text>
          </View>
        </View>

        {isLoading ? (
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading expenses...</Text>
        ) : expenses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No expenses yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Start tracking your expenses!
            </Text>
          </View>
        ) : (
          <View style={styles.expensesList}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Expenses</Text>
            {expenses.slice(0, 10).map(expense => (
              <TouchableOpacity
                key={expense.id}
                style={[
                  styles.expenseItem,
                  {
                    backgroundColor: colors.card,
                    shadowColor: colors.shadow,
                  },
                ]}
                onPress={() => handleEdit(expense.id)}
                activeOpacity={0.7}
              >
                <View style={styles.expenseInfo}>
                  <Text style={[styles.expenseCategory, { color: colors.text }]}>{expense.category}</Text>
                  <Text style={[styles.expenseDescription, { color: colors.textSecondary }]}>
                    {expense.description || 'No description'}
                  </Text>
                  <Text style={[styles.expenseDate, { color: colors.textTertiary }]}>
                    {format(new Date(expense.date), 'MMM dd, yyyy')}
                  </Text>
                </View>
                <Text style={[styles.expenseAmount, { color: colors.text }]}>
                  {expense.currencyCode} {expense.amount.toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.shadow,
          },
        ]}
        onPress={() => navigation.navigate('AddExpense')}
        activeOpacity={0.8}
      >
        <Text style={[styles.fabText, { color: '#ffffff' }]}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  expensesList: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
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
  expenseDate: {
    fontSize: 12,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 32,
  },
});
