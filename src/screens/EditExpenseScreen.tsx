/**
 * Edit Expense Screen - Modal for editing existing expenses
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Input,
  Button,
  Picker,
  DatePicker,
  ScreenHeader,
} from '@/components';
import { DEFAULT_SETTINGS } from '@/constants';
import { EXPENSE_CATEGORIES } from '@/constants/categories';
import { CURRENCIES, getCurrencyDisplayName } from '@/constants/currencies';
import { useExpenseStore } from '@/store';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useThemeContext } from '@/context/ThemeContext';
import Icon from '@react-native-vector-icons/ionicons';

interface EditExpenseScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditExpense'>;
  route: { params: { expenseId: string } };
}

export const EditExpenseScreen: React.FC<EditExpenseScreenProps> = ({
  navigation,
  route,
}) => {
  const { colors } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { getExpenseById, updateExpense, deleteExpense, fetchExpenses } =
    useExpenseStore();
  const { expenseId } = route.params;

  const expense = getExpenseById(expenseId);

  const [amount, setAmount] = useState('');
  const [currencyCode, setCurrencyCode] = useState(
    DEFAULT_SETTINGS.BASE_CURRENCY,
  );
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadExpenseData = async () => {
      if (expense) {
        setAmount(expense.amount.toString());
        setCurrencyCode(expense.currencyCode);
        setCategory(expense.category);
        setDescription(expense.description || '');
        setDate(expense.date);

      }
    };
    loadExpenseData();
  }, [expense]);

  if (!expense) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader
          title="Edit Expense"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            Expense not found
          </Text>
        </View>
      </View>
    );
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!category) {
      newErrors.category = 'Please select a category';
    }

    if (!date) {
      newErrors.date = 'Please select a date';
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
      const amountNum = parseFloat(amount);

      await updateExpense(expenseId, {
        amount: amountNum,
        currencyCode,
        category,
        description: description || undefined,
        date,
      });

      navigation.goBack();
    } catch (error) {
      console.error('Error updating expense:', error);
      setErrors({ submit: 'Failed to update expense. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense? This action cannot be undone.',
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
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting expense:', error);
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

  const currencyOptions = CURRENCIES.map(currency => ({
    label: getCurrencyDisplayName(currency.code),
    value: currency.code,
  }));

  const categoryOptions = EXPENSE_CATEGORIES.map(cat => ({
    label: cat,
    value: cat,
  }));

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScreenHeader
        title="Edit Expense"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            onPress={handleDelete}
            style={[
              styles.deleteButtonContainer,
              { backgroundColor: colors.error + '15' },
            ]}
            activeOpacity={0.7}
          >
            <Icon name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formSection}>
          <Input
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            error={errors.amount}
            leftIcon={
              <Icon
                name="cash-outline"
                size={20}
                color={colors.textSecondary}
              />
            }
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
            placeholder="What did you spend on?"
            leftIcon={
              <Icon
                name="document-text-outline"
                size={20}
                color={colors.textSecondary}
              />
            }
          />

          <DatePicker
            label="Date"
            value={date}
            onValueChange={setDate}
            error={errors.date}
          />

          {errors.submit && (
            <View
              style={[
                styles.errorContainer,
                { backgroundColor: colors.error + '15' },
              ]}
            >
              <Icon name="alert-circle" size={20} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.submit}
              </Text>
            </View>
          )}

          <Button
            title="Save Changes"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
            size="large"
            leftIcon={
              <Icon name="checkmark-circle" size={20} color="#ffffff" />
            }
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  deleteButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,
  },
  formSection: {
    paddingHorizontal: 20,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
});
