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
import { Input, Button, Picker, DatePicker, TagSelector } from '@/components';
import { EXPENSE_CATEGORIES, DEFAULT_SETTINGS } from '@/constants';
import { useExpenseStore } from '@/store';
import { getTagsForExpense, setTagsForExpense } from '@/services/tag.service';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useThemeContext } from '@/context/ThemeContext';

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
  const [currencyCode, setCurrencyCode] = useState(DEFAULT_SETTINGS.BASE_CURRENCY);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadExpenseData = async () => {
      if (expense) {
        setAmount(expense.amount.toString());
        setCurrencyCode(expense.currencyCode);
        setCategory(expense.category);
        setDescription(expense.description || '');
        setNotes(expense.notes || '');
        setDate(expense.date);

        // Load tags for expense
        const tags = await getTagsForExpense(expense.id);
        setSelectedTagIds(tags.map((tag) => tag.id));
      }
    };
    loadExpenseData();
  }, [expense]);

  if (!expense) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top,
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.cancelButton, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Expense</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>Expense not found</Text>
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
      // baseAmount will be recalculated automatically if amount or currency changes

      await updateExpense(expenseId, {
        amount: amountNum,
        currencyCode,
        category,
        description: description || undefined,
        notes: notes || undefined,
        date,
      });

      // Update tags
      await setTagsForExpense(expenseId, selectedTagIds);

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
              Alert.alert('Error', 'Failed to delete expense. Please try again.');
            }
          },
        },
      ],
    );
  };

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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelButton, { color: colors.primary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Expense</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={[styles.deleteButton, { color: colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>

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
          placeholder="What did you spend on?"
        />

        <DatePicker
          label="Date"
          value={date}
          onValueChange={setDate}
          error={errors.date}
        />

        <TagSelector
          label="Tags (Optional)"
          selectedTagIds={selectedTagIds}
          onSelectionChange={setSelectedTagIds}
        />

        <Input
          label="Notes (Optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional notes..."
          multiline
          numberOfLines={4}
          style={styles.notesInput}
        />

        {errors.submit && (
          <Text style={[styles.errorText, { color: colors.error }]}>{errors.submit}</Text>
        )}

        <Button
          title="Save Changes"
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  cancelButton: {
    fontSize: 16,
  },
  deleteButton: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
});

