/**
 * Home Screen - Modern redesigned main dashboard
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useExpenseStore } from '@/store';
import { useGroupStore } from '@/store/groupStore';
import { format } from 'date-fns';
import {
  RootStackParamList,
  MainTabParamList,
} from '@/navigation/AppNavigator';
import { useThemeContext } from '@/context/ThemeContext';
import { Card } from '@/components';
import Icon from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBaseCurrency } from '@/services/settings.service';
import { getCurrencySymbol } from '@/services/currency.service';
import { useFocusEffect } from '@react-navigation/native';
import {
  getGroupMembers,
  calculateGroupBalances,
} from '@/services/group.service';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { expenses, isLoading, fetchExpenses } = useExpenseStore();
  const { groups, fetchGroups } = useGroupStore();
  const { colors } = useThemeContext();
  const insets = useSafeAreaInsets();
  const [currencySymbol, setCurrencySymbol] = React.useState('₹');
  const [youOwe, setYouOwe] = useState(0);
  const [youAreOwed, setYouAreOwed] = useState(0);
  const [loadingBalances, setLoadingBalances] = useState(false);

  const handleEdit = (expenseId: string) => {
    navigation.navigate('EditExpense', { expenseId });
  };

  useFocusEffect(
    React.useCallback(() => {
      const currency = getBaseCurrency();
      setCurrencySymbol(getCurrencySymbol(currency));
      fetchGroups();
    }, [fetchGroups]),
  );

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Calculate total balances across all groups
  // Assumes the first member in each group is the current user
  useEffect(() => {
    const calculateTotalBalances = async () => {
      if (groups.length === 0) {
        setYouOwe(0);
        setYouAreOwed(0);
        return;
      }

      setLoadingBalances(true);
      try {
        let totalOwed = 0; // Negative balances (you owe)
        let totalOwedToYou = 0; // Positive balances (you're owed)

        for (const group of groups) {
          const members = await getGroupMembers(group.id);
          if (members.length === 0) continue;

          // Calculate balances for the group
          const balances = await calculateGroupBalances(group.id);

          // Use the first member as the current user
          const currentUserMemberId = members[0].id;
          const userBalance = balances[currentUserMemberId] || 0;

          if (userBalance < 0) {
            // Negative balance means you owe money
            totalOwed += Math.abs(userBalance);
          } else if (userBalance > 0) {
            // Positive balance means you're owed money
            totalOwedToYou += userBalance;
          }
        }

        setYouOwe(totalOwed);
        setYouAreOwed(totalOwedToYou);
      } catch (error) {
        console.error('Error calculating balances:', error);
      } finally {
        setLoadingBalances(false);
      }
    };

    calculateTotalBalances();
  }, [groups]);

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
  const thisMonthExpenses = expenses.filter(
    exp =>
      format(new Date(exp.date), 'yyyy-MM') === format(new Date(), 'yyyy-MM'),
  );
  const monthTotal = thisMonthExpenses.reduce(
    (sum, exp) => sum + exp.baseAmount,
    0,
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              paddingTop: insets.top + 16,
            },
          ]}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {new Date().getHours() < 12
                  ? 'Good Morning'
                  : new Date().getHours() < 18
                  ? 'Good Afternoon'
                  : 'Good Evening'}
              </Text>
              <Text style={[styles.title, { color: colors.text }]}>
                SpendWise
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              style={[
                styles.profileButton,
                { backgroundColor: colors.primary + '15' },
              ]}
              activeOpacity={0.7}
            >
              <Icon name="person" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards - Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScrollContent}
          style={styles.statsScrollView}
        >
          <Card variant="elevated" style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: colors.primary + '15' },
              ]}
            >
              <Icon name="wallet" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Expenses
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {currencySymbol}
              {totalExpenses.toFixed(2)}
            </Text>
          </Card>

          <Card variant="elevated" style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: colors.success + '15' },
              ]}
            >
              <Icon name="today" size={20} color={colors.success} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Today
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {currencySymbol}
              {todayTotal.toFixed(2)}
            </Text>
          </Card>

          <Card variant="elevated" style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: colors.secondary + '15' },
              ]}
            >
              <Icon name="calendar" size={20} color={colors.secondary} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              This Month
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {currencySymbol}
              {monthTotal.toFixed(2)}
            </Text>
          </Card>

          <Card variant="elevated" style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: colors.error + '15' },
              ]}
            >
              <Icon name="arrow-down" size={20} color={colors.error} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              You Owe
            </Text>
            {loadingBalances ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Text style={[styles.statValue, { color: colors.error }]}>
                {currencySymbol}
                {youOwe.toFixed(2)}
              </Text>
            )}
          </Card>

          <Card variant="elevated" style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: (colors.success || colors.primary) + '15' },
              ]}
            >
              <Icon
                name="arrow-up"
                size={20}
                color={colors.success || colors.primary}
              />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              You're Owed
            </Text>
            {loadingBalances ? (
              <ActivityIndicator
                size="small"
                color={colors.success || colors.primary}
              />
            ) : (
              <Text
                style={[
                  styles.statValue,
                  { color: colors.success || colors.primary },
                ]}
              >
                {currencySymbol}
                {youAreOwed.toFixed(2)}
              </Text>
            )}
          </Card>
        </ScrollView>

        {/* Recent Expenses */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading expenses...
            </Text>
          </View>
        ) : expenses.length === 0 ? (
          <Card variant="elevated" style={styles.emptyCard}>
            <Icon
              name="receipt-outline"
              size={64}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No expenses yet
            </Text>
            <Text
              style={[styles.emptySubtext, { color: colors.textSecondary }]}
            >
              Start tracking your expenses to see them here!
            </Text>
            <TouchableOpacity
              style={[
                styles.addFirstButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => navigation.navigate('AddExpense')}
            >
              <Icon name="add" size={20} color="#ffffff" />
              <Text style={styles.addFirstButtonText}>
                Add Your First Expense
              </Text>
            </TouchableOpacity>
          </Card>
        ) : (
          <View style={styles.expensesList}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Recent Expenses
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>
                  See All
                </Text>
              </TouchableOpacity>
            </View>
            {expenses.slice(0, 5).map(expense => (
              <Card
                key={expense.id}
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
                    <Icon name="receipt" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.expenseInfo}>
                    <Text
                      style={[styles.expenseCategory, { color: colors.text }]}
                    >
                      {expense.category}
                    </Text>
                    <Text
                      style={[
                        styles.expenseDescription,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {expense.description || 'No description'}
                    </Text>
                    <Text
                      style={[
                        styles.expenseDate,
                        { color: colors.textTertiary },
                      ]}
                    >
                      {format(new Date(expense.date), 'MMM dd, yyyy')}
                    </Text>
                  </View>
                  <View style={styles.expenseAmountContainer}>
                    <Text
                      style={[styles.expenseAmount, { color: colors.text }]}
                    >
                      {expense.currencyCode} {expense.amount.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            bottom: insets.bottom + 20,
          },
        ]}
        onPress={() => navigation.navigate('AddExpense')}
        activeOpacity={0.85}
      >
        <Icon name="add" size={28} color="#ffffff" />
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
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
    opacity: 0.7,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsScrollView: {
    paddingVertical: 24,
  },
  statsScrollContent: {
    paddingHorizontal: 20,
    paddingRight: 20,
    gap: 12,
  },
  statCard: {
    width: 140,
    padding: 16,
    alignItems: 'flex-start',
    marginRight: 0,
    minHeight: 140,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
  },
  emptyCard: {
    marginHorizontal: 20,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
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
  expensesList: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    fontWeight: '500',
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
});
