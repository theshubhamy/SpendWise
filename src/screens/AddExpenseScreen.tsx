/**
 * Add Expense Screen - Modern redesigned modal for adding new expenses
 */

import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Input,
  Button,
  Picker,
  DatePicker,
  TagSelector,
  ScreenHeader,
} from '@/components';
import { EXPENSE_CATEGORIES } from '@/constants';
import { useExpenseStore } from '@/store';
import { useGroupStore } from '@/store/groupStore';
import { setTagsForExpense } from '@/services/tag.service';
import * as expenseService from '@/services/expense.service';
import {
  splitExpenseEqually,
  splitExpenseByPercentage,
  splitExpenseByAmount,
  getGroupMembers,
} from '@/services/group.service';
import { useThemeContext } from '@/context/ThemeContext';
import { SplitType, GroupMember } from '@/types';
import { getBaseCurrency } from '@/services/settings.service';
import Icon from '@react-native-vector-icons/ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/AppNavigator';

interface AddExpenseScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddExpense'>;
  route: RouteProp<RootStackParamList, 'AddExpense'>;
}

export const AddExpenseScreen: React.FC<AddExpenseScreenProps> = ({
  navigation,
}) => {
  const { colors } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { addExpense } = useExpenseStore();
  const { groups, fetchGroups } = useGroupStore();

  const [amount, setAmount] = useState('');
  const [currencyCode, setCurrencyCode] = useState(getBaseCurrency()); // Use default currency from settings
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [paidByMemberId, setPaidByMemberId] = useState<string | null>(null);
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [percentageSplits, setPercentageSplits] = useState<Record<string, number>>({});
  const [customAmountSplits, setCustomAmountSplits] = useState<Record<string, number>>({});
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Refresh currency and groups when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      setCurrencyCode(getBaseCurrency());
      fetchGroups();
    }, [fetchGroups]),
  );

  // Load group members when group is selected
  React.useEffect(() => {
    const loadGroupMembers = async () => {
      if (selectedGroupId) {
        try {
          const members = await getGroupMembers(selectedGroupId);
          setGroupMembers(members);
          // Set first member as default payer if not set
          if (!paidByMemberId && members.length > 0) {
            setPaidByMemberId(members[0].id);
          }
          // Select all members by default for equal split
          if (selectedMemberIds.length === 0 && members.length > 0) {
            setSelectedMemberIds(members.map(m => m.id));
          }
        } catch (error) {
          console.error('Error loading group members:', error);
        }
      } else {
        setGroupMembers([]);
        setPaidByMemberId(null);
        setSelectedMemberIds([]);
        setPercentageSplits({});
        setCustomAmountSplits({});
      }
    };
    loadGroupMembers();
  }, [selectedGroupId]);

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
      // baseAmount will be calculated automatically by the service

      // Validate split configuration if group is selected
      if (selectedGroupId) {
        if (!paidByMemberId) {
          setErrors({ split: 'Please select who paid for this expense' });
          setLoading(false);
          return;
        }
        if (selectedMemberIds.length === 0) {
          setErrors({ split: 'Please select at least one member to split with' });
          setLoading(false);
          return;
        }

        // Validate percentage splits
        if (splitType === 'percentage') {
          const totalPercentage = selectedMemberIds.reduce(
            (sum, id) => sum + (percentageSplits[id] || 0),
            0,
          );
          if (Math.abs(totalPercentage - 100) > 0.01) {
            setErrors({ split: `Total percentage must equal 100% (currently ${totalPercentage.toFixed(2)}%)` });
            setLoading(false);
            return;
          }
        }

        // Validate custom amount splits
        if (splitType === 'custom') {
          const totalAmount = selectedMemberIds.reduce(
            (sum, id) => sum + (customAmountSplits[id] || 0),
            0,
          );
          if (Math.abs(totalAmount - newExpense.baseAmount) > 0.01) {
            setErrors({ split: `Total amount must equal expense amount (${newExpense.baseAmount.toFixed(2)})` });
            setLoading(false);
            return;
          }
        }
      }

      // Create expense directly to get the ID (always personal, but can be split with group)
      const newExpense = await expenseService.createExpense({
        amount: amountNum,
        currencyCode,
        category,
        description: description || undefined,
        date,
        groupId: selectedGroupId || undefined, // Link to group if selected
        paidByMemberId: paidByMemberId || undefined,
      });

      // Add to store
      await addExpense({
        amount: amountNum,
        currencyCode,
        category,
        description: description || undefined,
        date,
        groupId: selectedGroupId || undefined,
        paidByMemberId: paidByMemberId || undefined,
      });

      // Split the expense based on selected split type
      if (selectedGroupId && selectedMemberIds.length > 0) {
        if (splitType === 'equal') {
          await splitExpenseEqually(
            newExpense.id,
            selectedMemberIds,
            newExpense.baseAmount,
          );
        } else if (splitType === 'percentage') {
          await splitExpenseByPercentage(
            newExpense.id,
            selectedMemberIds.map(id => ({
              memberId: id,
              percentage: percentageSplits[id] || 0,
            })),
            newExpense.baseAmount,
          );
        } else if (splitType === 'custom') {
          await splitExpenseByAmount(
            newExpense.id,
            selectedMemberIds.map(id => ({
              memberId: id,
              amount: customAmountSplits[id] || 0,
            })),
          );
        }
      }

      // Add tags to expense
      if (selectedTagIds.length > 0) {
        await setTagsForExpense(newExpense.id, selectedTagIds);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error adding expense:', error);
      setErrors({ submit: 'Failed to add expense. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = EXPENSE_CATEGORIES.map(cat => ({
    label: cat,
    value: cat,
  }));

  const groupOptions = [
    { label: 'Personal (No Split)', value: '' },
    ...groups.map(group => ({
      label: group.name,
      value: group.id,
    })),
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScreenHeader
        title="Add Expense"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
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
            label={`Amount (${currencyCode})`}
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
          label="Category"
          selectedValue={category}
            onValueChange={value => setCategory(value as typeof category)}
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

        <TagSelector
          label="Tags (Optional)"
          selectedTagIds={selectedTagIds}
          onSelectionChange={setSelectedTagIds}
        />

          <Picker
            label="Split with Group (Optional)"
            selectedValue={selectedGroupId || ''}
            onValueChange={value => {
              setSelectedGroupId(value || null);
              setErrors({}); // Clear errors when group changes
            }}
            items={groupOptions}
            placeholder="Keep as personal expense"
          />

          {selectedGroupId && groupMembers.length > 0 && (
            <>
              <Picker
                label="Paid By"
                selectedValue={paidByMemberId || ''}
                onValueChange={value => setPaidByMemberId(value || null)}
                items={groupMembers.map(member => ({
                  label: member.name,
                  value: member.id,
                }))}
                error={errors.split}
              />

              <Picker
                label="Split Type"
                selectedValue={splitType}
                onValueChange={value => {
                  setSplitType(value as SplitType);
                  // Reset splits when type changes
                  setPercentageSplits({});
                  setCustomAmountSplits({});
                }}
                items={[
                  { label: 'Equal', value: 'equal' },
                  { label: 'Percentage', value: 'percentage' },
                  { label: 'Custom Amount', value: 'custom' },
                ]}
              />

              <View style={styles.memberSelectionContainer}>
                <Text style={[styles.memberSelectionLabel, { color: colors.text }]}>
                  Select Members to Split With
                </Text>
                {groupMembers.map(member => (
                  <View key={member.id} style={styles.memberRow}>
                    <TouchableOpacity
                      style={styles.memberCheckbox}
                      onPress={() => {
                        if (selectedMemberIds.includes(member.id)) {
                          setSelectedMemberIds(selectedMemberIds.filter(id => id !== member.id));
                          // Remove from splits
                          const newPercentageSplits = { ...percentageSplits };
                          delete newPercentageSplits[member.id];
                          setPercentageSplits(newPercentageSplits);
                          const newCustomAmountSplits = { ...customAmountSplits };
                          delete newCustomAmountSplits[member.id];
                          setCustomAmountSplits(newCustomAmountSplits);
                        } else {
                          setSelectedMemberIds([...selectedMemberIds, member.id]);
                          // Initialize with default values
                          if (splitType === 'percentage') {
                            const totalSelected = selectedMemberIds.length + 1;
                            const perMember = 100 / totalSelected;
                            // Redistribute percentages
                            const newPercentageSplits: Record<string, number> = {};
                            [...selectedMemberIds, member.id].forEach(id => {
                              newPercentageSplits[id] = perMember;
                            });
                            setPercentageSplits(newPercentageSplits);
                          } else if (splitType === 'custom') {
                            const totalAmount = parseFloat(amount) || 0;
                            const totalSelected = selectedMemberIds.length + 1;
                            const perMember = totalAmount / totalSelected;
                            // Redistribute amounts
                            const newCustomAmountSplits: Record<string, number> = {};
                            [...selectedMemberIds, member.id].forEach(id => {
                              newCustomAmountSplits[id] = perMember;
                            });
                            setCustomAmountSplits(newCustomAmountSplits);
                          }
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Icon
                        name={selectedMemberIds.includes(member.id) ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={selectedMemberIds.includes(member.id) ? colors.primary : colors.textSecondary}
                      />
                      <Text style={[styles.memberName, { color: colors.text }]}>
                        {member.name}
                      </Text>
                    </TouchableOpacity>
                    {selectedMemberIds.includes(member.id) && splitType === 'percentage' && (
                      <Input
                        value={percentageSplits[member.id]?.toFixed(2) || '0'}
                        onChangeText={text => {
                          const value = parseFloat(text) || 0;
                          setPercentageSplits({
                            ...percentageSplits,
                            [member.id]: Math.max(0, Math.min(100, value)), // Clamp between 0-100
                          });
                        }}
                        placeholder="0"
                        keyboardType="decimal-pad"
                        style={styles.percentageInput}
                        rightIcon={<Text style={{ color: colors.textSecondary, fontSize: 14 }}>%</Text>}
                      />
                    )}
                    {selectedMemberIds.includes(member.id) && splitType === 'custom' && (
                      <Input
                        value={customAmountSplits[member.id]?.toFixed(2) || '0.00'}
                        onChangeText={text => {
                          const value = parseFloat(text) || 0;
                          setCustomAmountSplits({
                            ...customAmountSplits,
                            [member.id]: Math.max(0, value), // No negative amounts
                          });
                        }}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        style={styles.amountInput}
                        rightIcon={<Text style={{ color: colors.textSecondary, fontSize: 14 }}>{currencyCode}</Text>}
                      />
                    )}
                  </View>
                ))}
                {splitType === 'percentage' && selectedMemberIds.length > 0 && (
                  <View style={styles.totalContainer}>
                    <Text
                      style={[
                        styles.totalLabel,
                        {
                          color:
                            Math.abs(
                              selectedMemberIds.reduce((sum, id) => sum + (percentageSplits[id] || 0), 0) - 100,
                            ) < 0.01
                              ? (colors.success || colors.primary)
                              : colors.error,
                        },
                      ]}
                    >
                      Total: {selectedMemberIds.reduce((sum, id) => sum + (percentageSplits[id] || 0), 0).toFixed(2)}%
                      {Math.abs(selectedMemberIds.reduce((sum, id) => sum + (percentageSplits[id] || 0), 0) - 100) >
                        0.01 && ' (Must equal 100%)'}
                    </Text>
                  </View>
                )}
                {splitType === 'custom' && selectedMemberIds.length > 0 && amount && (
                  <View style={styles.totalContainer}>
                    <Text
                      style={[
                        styles.totalLabel,
                        {
                          color:
                            Math.abs(
                              selectedMemberIds.reduce((sum, id) => sum + (customAmountSplits[id] || 0), 0) -
                                parseFloat(amount),
                            ) < 0.01
                              ? (colors.success || colors.primary)
                              : colors.error,
                        },
                      ]}
                    >
                      Total: {selectedMemberIds.reduce((sum, id) => sum + (customAmountSplits[id] || 0), 0).toFixed(2)}{' '}
                      {currencyCode}
                      {Math.abs(
                        selectedMemberIds.reduce((sum, id) => sum + (customAmountSplits[id] || 0), 0) -
                          parseFloat(amount),
                      ) > 0.01 && ` (Must equal ${parseFloat(amount).toFixed(2)} ${currencyCode})`}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

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
          title="Add Expense"
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
  memberSelectionContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  memberSelectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
  },
  memberCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  percentageInput: {
    width: 100,
    marginLeft: 12,
  },
  amountInput: {
    width: 120,
    marginLeft: 12,
  },
  totalContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
});
