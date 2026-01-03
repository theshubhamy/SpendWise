/**
 * Analytics service - generates reports and insights
 */

import { Expense } from '@/types';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  parseISO,
  isWithinInterval,
} from 'date-fns';

export interface MonthlyTrend {
  month: string;
  total: number;
  count: number;
}

export interface CategoryAnalysis {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

/**
 * Get monthly spending trends
 */
export const getMonthlyTrends = async (
  expenses: Expense[],
  months: number = 6,
): Promise<MonthlyTrend[]> => {
  const trends: MonthlyTrend[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(monthStart);
    const monthKey = format(monthStart, 'MMM yyyy');

    const monthExpenses = expenses.filter(exp => {
      const expDate = parseISO(exp.date);
      return isWithinInterval(expDate, { start: monthStart, end: monthEnd });
    });

    const total = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    trends.push({
      month: monthKey,
      total,
      count: monthExpenses.length,
    });
  }

  return trends;
};

/**
 * Get category analysis
 */
export const getCategoryAnalysis = (
  expenses: Expense[],
): CategoryAnalysis[] => {
  const categoryMap: Record<string, { total: number; count: number }> = {};
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  expenses.forEach(exp => {
    if (!categoryMap[exp.category]) {
      categoryMap[exp.category] = { total: 0, count: 0 };
    }
    categoryMap[exp.category].total += exp.amount;
    categoryMap[exp.category].count += 1;
  });

  return Object.entries(categoryMap)
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      percentage: totalSpent > 0 ? (data.total / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
};

/**
 * Get highest expenses
 */
export const getHighestExpenses = (
  expenses: Expense[],
  limit: number = 5,
): Expense[] => {
  return [...expenses].sort((a, b) => b.amount - a.amount).slice(0, limit);
};

/**
 * Get spending by date range
 */
export const getSpendingByDateRange = (
  expenses: Expense[],
  startDate: Date,
  endDate: Date,
): number => {
  return expenses
    .filter(exp => {
      const expDate = parseISO(exp.date);
      return isWithinInterval(expDate, { start: startDate, end: endDate });
    })
    .reduce((sum, exp) => sum + exp.amount, 0);
};

/**
 * Get average daily spending
 */
export const getAverageDailySpending = (expenses: Expense[]): number => {
  if (expenses.length === 0) return 0;

  const dates = expenses.map(exp => parseISO(exp.date));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  const daysDiff = Math.max(
    1,
    Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)),
  );

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  return total / daysDiff;
};
