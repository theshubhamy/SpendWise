/**
 * Reports Screen - Analytics and insights
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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

export const ReportsScreen: React.FC = () => {
  const { expenses } = useExpenseStore();
  const { colors } = useThemeContext();
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [tagAnalysis, setTagAnalysis] = useState<TagAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Reports & Analytics</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Spent</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>${totalExpenses.toFixed(2)}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Expenses</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{expenses.length}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Daily</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>${avgDaily.toFixed(2)}</Text>
        </View>
      </View>

      {monthlyTrends.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Trends (Last 6 Months)</Text>
          {monthlyTrends.map((trend) => (
            <View key={trend.month} style={[styles.trendItem, { borderBottomColor: colors.borderLight }]}>
              <View style={styles.trendInfo}>
                <Text style={[styles.trendMonth, { color: colors.text }]}>{trend.month}</Text>
                <Text style={[styles.trendCount, { color: colors.textSecondary }]}>{trend.count} expenses</Text>
              </View>
              <Text style={[styles.trendAmount, { color: colors.text }]}>${trend.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      {categoryAnalysis.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Category Breakdown</Text>
          {categoryAnalysis.slice(0, 10).map((item) => (
            <View key={item.category} style={[styles.categoryItem, { borderBottomColor: colors.borderLight }]}>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, { color: colors.text }]}>{item.category}</Text>
                <View style={[styles.percentageBar, { backgroundColor: colors.borderLight }]}>
                  <View
                    style={[
                      styles.percentageFill,
                      { width: `${item.percentage}%`, backgroundColor: colors.primary },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.categoryRight}>
                <Text style={[styles.categoryAmount, { color: colors.text }]}>${item.total.toFixed(2)}</Text>
                <Text style={[styles.categoryPercentage, { color: colors.textSecondary }]}>
                  {item.percentage.toFixed(1)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {tagAnalysis.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tag-Based Analysis</Text>
          {tagAnalysis.map((tag) => (
            <View key={tag.tagId} style={[styles.tagItem, { borderBottomColor: colors.borderLight }]}>
              <View style={[styles.tagColor, { backgroundColor: tag.color }]} />
              <View style={styles.tagInfo}>
                <Text style={[styles.tagName, { color: colors.text }]}>{tag.tagName}</Text>
                <Text style={[styles.tagCount, { color: colors.textSecondary }]}>{tag.count} expenses</Text>
              </View>
              <Text style={[styles.tagAmount, { color: colors.text }]}>${tag.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      {highestExpenses.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Highest Expenses</Text>
          {highestExpenses.map((expense) => (
            <View key={expense.id} style={[styles.expenseItem, { borderBottomColor: colors.borderLight }]}>
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
                ${expense.baseAmount.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {expenses.length === 0 && (
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No expenses to analyze yet</Text>
        </View>
      )}
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
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
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
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
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
  expenseDescription: {
    fontSize: 14,
    marginTop: 2,
    marginBottom: 4,
  },
});

