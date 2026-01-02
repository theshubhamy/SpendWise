/**
 * Reports Screen - Analytics and insights
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useExpenseStore } from '@/store';
import { useThemeContext } from '@/context/ThemeContext';
import {
  getMonthlyTrends,
  getTagAnalysis,
  getCategoryAnalysis,
  getHighestExpenses,
  getAverageDailySpending,
  MonthlyTrend,
  TagAnalysis,
} from '@/services/analytics.service';
import { format } from 'date-fns';
import { ScreenHeader, Card } from '@/components';
import { getBaseCurrency } from '@/services/settings.service';
import { getCurrencySymbol } from '@/services/currency.service';
import Icon from '@react-native-vector-icons/ionicons';

export const ReportsScreen: React.FC = () => {
  const { expenses } = useExpenseStore();
  const { colors } = useThemeContext();
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [tagAnalysis, setTagAnalysis] = useState<TagAnalysis[]>([]);
  const [_loading, setLoading] = useState(true);
  const currencySymbol = getCurrencySymbol(getBaseCurrency());

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const trends = await getMonthlyTrends(expenses, 6);
        setMonthlyTrends(trends);

        const tags = await getTagAnalysis(expenses);
        setTagAnalysis(tags);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (expenses.length > 0) {
      loadAnalytics();
    }
  }, [expenses]);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.baseAmount, 0);
  const categoryAnalysis = getCategoryAnalysis(expenses);
  const highestExpenses = getHighestExpenses(expenses, 5);
  const avgDaily = getAverageDailySpending(expenses);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Reports & Analytics" showBackButton={true} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

      <View style={styles.statsContainer}>
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
            Total Spent
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {currencySymbol}{totalExpenses.toFixed(2)}
          </Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: colors.success + '15' },
            ]}
          >
            <Icon name="calendar" size={20} color={colors.success} />
          </View>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Avg Daily
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {currencySymbol}{avgDaily.toFixed(2)}
          </Text>
        </Card>
      </View>

      {monthlyTrends.length > 0 && (
        <Card variant="elevated" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="trending-up" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Monthly Trends
            </Text>
          </View>
          <Text
            style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
          >
            Last 6 Months
          </Text>
          {monthlyTrends.map(trend => (
            <View
              key={trend.month}
              style={[
                styles.trendItem,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              <View style={styles.trendInfo}>
                <Text style={[styles.trendMonth, { color: colors.text }]}>
                  {trend.month}
                </Text>
                <Text
                  style={[styles.trendCount, { color: colors.textSecondary }]}
                >
                  {trend.count} expenses
                </Text>
              </View>
              <Text style={[styles.trendAmount, { color: colors.text }]}>
                {currencySymbol}{trend.total.toFixed(2)}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {categoryAnalysis.length > 0 && (
        <Card variant="elevated" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="pie-chart" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Category Breakdown
            </Text>
          </View>
          {categoryAnalysis.slice(0, 10).map(item => (
            <View
              key={item.category}
              style={[
                styles.categoryItem,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, { color: colors.text }]}>
                  {item.category}
                </Text>
                <View
                  style={[
                    styles.percentageBar,
                    { backgroundColor: colors.borderLight },
                  ]}
                >
                  <View
                    style={[
                      styles.percentageFill,
                      {
                        width: `${item.percentage}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.categoryRight}>
                <Text style={[styles.categoryAmount, { color: colors.text }]}>
                  {currencySymbol}{item.total.toFixed(2)}
                </Text>
                <Text
                  style={[
                    styles.categoryPercentage,
                    { color: colors.textSecondary },
                  ]}
                >
                  {item.percentage.toFixed(1)}%
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {tagAnalysis.length > 0 && (
        <Card variant="elevated" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="pricetag" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Tag-Based Analysis
            </Text>
          </View>
          {tagAnalysis.map(tag => (
            <View
              key={tag.tagId}
              style={[
                styles.tagItem,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              <View style={[styles.tagColor, { backgroundColor: tag.color }]} />
              <View style={styles.tagInfo}>
                <Text style={[styles.tagName, { color: colors.text }]}>
                  {tag.tagName}
                </Text>
                <Text
                  style={[styles.tagCount, { color: colors.textSecondary }]}
                >
                  {tag.count} expenses
                </Text>
              </View>
              <Text style={[styles.tagAmount, { color: colors.text }]}>
                {currencySymbol}{tag.total.toFixed(2)}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {highestExpenses.length > 0 && (
        <Card variant="elevated" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="arrow-up-circle" size={24} color={colors.error} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Highest Expenses
            </Text>
          </View>
          {highestExpenses.map(expense => (
            <View
              key={expense.id}
              style={[
                styles.expenseItem,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              <View style={styles.expenseInfo}>
                <Text style={[styles.expenseCategory, { color: colors.text }]}>
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
                  style={[styles.expenseDate, { color: colors.textTertiary }]}
                >
                  {format(new Date(expense.date), 'MMM dd, yyyy')}
                </Text>
              </View>
              <Text style={[styles.expenseAmount, { color: colors.text }]}>
                {currencySymbol}{expense.baseAmount.toFixed(2)}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {expenses.length === 0 && (
        <Card variant="elevated" style={styles.emptyCard}>
          <Icon
            name="bar-chart-outline"
            size={64}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No expenses to analyze yet
          </Text>
          <Text
            style={[styles.emptySubtext, { color: colors.textSecondary }]}
          >
            Start adding expenses to see detailed analytics and insights
          </Text>
        </Card>
      )}
      </ScrollView>
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
    padding: 20,
    paddingBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
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
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 16,
    opacity: 0.7,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoryName: {
    fontSize: 16,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCard: {
    marginBottom: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  trendInfo: {
    flex: 1,
  },
  trendMonth: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  trendCount: {
    fontSize: 12,
  },
  trendAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryInfo: {
    flex: 1,
  },
  percentageBar: {
    height: 4,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  percentageFill: {
    height: '100%',
  },
  categoryRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  categoryPercentage: {
    fontSize: 12,
    marginTop: 2,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tagColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  tagInfo: {
    flex: 1,
  },
  tagName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  tagCount: {
    fontSize: 12,
  },
  tagAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
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
    marginTop: 2,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});

