/**
 * Create Recurring Expense Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input, Button, Picker, DatePicker, ScreenHeader } from '@/components';
import { EXPENSE_CATEGORIES, DEFAULT_SETTINGS, RECURRING_INTERVALS } from '@/constants';
import { useRecurringStore } from '@/store/recurringStore';
import { RecurringExpense } from '@/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useThemeContext } from '@/context/ThemeContext';

interface CreateRecurringScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

export const CreateRecurringScreen: React.FC<CreateRecurringScreenProps> = ({
  navigation,
}) => {
  const { colors } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { createRecurring } = useRecurringStore();

  const [amount, setAmount] = useState('');
  const [currencyCode, setCurrencyCode] = useState(DEFAULT_SETTINGS.BASE_CURRENCY);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [interval, setInterval] = useState<RecurringExpense['interval']>('monthly');
  const [intervalValue, setIntervalValue] = useState('1');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currencyOptions = [
    { label: 'USD - US Dollar', value: 'USD' },
    { label: 'EUR - Euro', value: 'EUR' },
    { label: 'GBP - British Pound', value: 'GBP' },
    { label: 'INR - Indian Rupee', value: 'INR' },
  ];

  const categoryOptions = EXPENSE_CATEGORIES.map(cat => ({
    label: cat,
    value: cat,
  }));

  const intervalOptions = [
    { label: 'Daily', value: RECURRING_INTERVALS.DAILY },
    { label: 'Weekly', value: RECURRING_INTERVALS.WEEKLY },
    { label: 'Monthly', value: RECURRING_INTERVALS.MONTHLY },
    { label: 'Custom (Days)', value: RECURRING_INTERVALS.CUSTOM },
  ];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!category) {
      newErrors.category = 'Please select a category';
    }

    if (!startDate) {
      newErrors.startDate = 'Please select a start date';
    }

    if (intervalValue && parseInt(intervalValue) <= 0) {
      newErrors.intervalValue = 'Interval value must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await createRecurring({
        amount: parseFloat(amount),
        currencyCode,
        category,
        description: description.trim() || undefined,
        interval,
        intervalValue: parseInt(intervalValue) || 1,
        startDate,
        endDate: endDate || undefined,
      });

      navigation.goBack();
    } catch (error) {
      console.error('Error creating recurring expense:', error);
      setErrors({ submit: 'Failed to create recurring expense. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader
        title="Create Recurring Expense"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={errors.amount}
        />

        <Picker
          label="Currency"
          selectedValue={currencyCode}
          onValueChange={setCurrencyCode}
          items={currencyOptions}
        />

        <Picker
          label="Category"
          selectedValue={category}
          onValueChange={setCategory}
          items={categoryOptions}
          error={errors.category}
        />

        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="e.g., Netflix Subscription"
        />

        <Picker
          label="Interval"
          selectedValue={interval}
          onValueChange={(value) => setInterval(value as RecurringExpense['interval'])}
          items={intervalOptions}
        />

        <Input
          label="Interval Value"
          value={intervalValue}
          onChangeText={setIntervalValue}
          placeholder="1"
          keyboardType="number-pad"
          error={errors.intervalValue}
        />

        <DatePicker
          label="Start Date"
          value={startDate}
          onValueChange={setStartDate}
          error={errors.startDate}
        />

        <DatePicker
          label="End Date (Optional)"
          value={endDate}
          onValueChange={setEndDate}
        />

        {errors.submit && (
          <Text style={[styles.errorText, { color: colors.error }]}>{errors.submit}</Text>
        )}

        <Button
          title="Create Recurring Expense"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
});

