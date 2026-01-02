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
import {
  splitExpenseEqually,
  splitExpenseByPercentage,
  splitExpenseByAmount,
  getGroupMembers,
} from '@/services/group.service';
import { useThemeContext } from '@/context/ThemeContext';
import { getBaseCurrency } from '@/services/settings.service';
import { GroupMember, SplitType } from '@/types';
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
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [paidByMemberId, setPaidByMemberId] = useState<string | null>(null);
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [percentageSplits, setPercentageSplits] = useState<
    Record<string, number>
  >({});
  const [customAmountSplits, setCustomAmountSplits] = useState<
    Record<string, string>
  >({});
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
        const members = await getGroupMembers(selectedGroupId);
        setGroupMembers(members);
        // Default to first member as payer, and select all members for split
        if (members.length > 0) {
          setPaidByMemberId(members[0].id);
          setSelectedMemberIds(members.map(m => m.id));
        } else {
          // Reset if group has no members
          setPaidByMemberId(null);
          setSelectedMemberIds([]);
          setPercentageSplits({});
          setCustomAmountSplits({});
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

    // Validate split configuration if group is selected
    if (selectedGroupId) {
      if (!paidByMemberId) {
        newErrors.paidBy = 'Please select who paid for this expense';
      }

      if (selectedMemberIds.length === 0) {
        newErrors.split = 'Please select at least one member to split with';
      }

      if (splitType === 'percentage') {
        const totalPercentage = selectedMemberIds.reduce(
          (sum, memberId) => sum + (percentageSplits[memberId] || 0),
          0,
        );
        if (Math.abs(totalPercentage - 100) > 0.01) {
          newErrors.split = `Total percentage must equal 100% (currently ${totalPercentage.toFixed(
            2,
          )}%)`;
        }
      }

      if (splitType === 'custom') {
        const totalAmount = selectedMemberIds.reduce(
          (sum, memberId) =>
            sum + parseFloat(customAmountSplits[memberId] || '0'),
          0,
        );
        const expenseAmount = parseFloat(amount) || 0;
        if (Math.abs(totalAmount - expenseAmount) > 0.01) {
          newErrors.split = `Total split amount must equal expense amount (${expenseAmount.toFixed(
            2,
          )})`;
        }
      }
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

      // Add expense to store (this creates it in the database)
      const newExpense = await addExpense({
        amount: amountNum,
        currencyCode,
        category,
        description: description || undefined,
        date,
        groupId: selectedGroupId || undefined,
        paidByMemberId: paidByMemberId || undefined, // Who paid for this expense
      });

      // If group is selected, split the expense based on split type
      if (selectedGroupId && selectedMemberIds.length > 0 && newExpense) {
        if (splitType === 'equal') {
          await splitExpenseEqually(
            newExpense.id,
            selectedMemberIds,
            newExpense.baseAmount,
          );
        } else if (splitType === 'percentage') {
          const splits = selectedMemberIds.map(memberId => ({
            memberId,
            percentage: percentageSplits[memberId] || 0,
          }));
          await splitExpenseByPercentage(
            newExpense.id,
            splits,
            newExpense.baseAmount,
          );
        } else if (splitType === 'custom') {
          // Convert custom amounts from original currency to base currency
          // Calculate conversion ratio: baseAmount / originalAmount
          const conversionRatio = newExpense.baseAmount / amountNum;
          const splits = selectedMemberIds.map(memberId => {
            const originalAmount = parseFloat(
              customAmountSplits[memberId] || '0',
            );
            const baseAmount = originalAmount * conversionRatio;
            return {
              memberId,
              amount: baseAmount,
            };
          });
          await splitExpenseByAmount(newExpense.id, splits);
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
            onValueChange={value => setSelectedGroupId(value || null)}
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
                error={errors.paidBy}
              />

              <Picker
                label="Split Type"
                selectedValue={splitType}
                onValueChange={value => setSplitType(value as SplitType)}
                items={[
                  { label: 'Equal', value: 'equal' },
                  { label: 'Percentage', value: 'percentage' },
                  { label: 'Custom Amount', value: 'custom' },
                ]}
              />

              <View style={styles.splitSection}>
                <Text style={[styles.splitLabel, { color: colors.text }]}>
                  Split With
                </Text>
                <View style={styles.memberList}>
                  {groupMembers.map(member => (
                    <View key={member.id} style={styles.memberItem}>
                      <View style={styles.memberCheckbox}>
                        <TouchableOpacity
                          onPress={() => {
                            if (selectedMemberIds.includes(member.id)) {
                              setSelectedMemberIds(
                                selectedMemberIds.filter(
                                  id => id !== member.id,
                                ),
                              );
                              // Remove from percentage/custom splits
                              const newPercentage = { ...percentageSplits };
                              delete newPercentage[member.id];
                              setPercentageSplits(newPercentage);
                              const newCustom = { ...customAmountSplits };
                              delete newCustom[member.id];
                              setCustomAmountSplits(newCustom);
                            } else {
                              // Calculate existing totals BEFORE adding the member
                              // to ensure we don't include the new member's old value
                              let remainingPercent = 0;
                              let remainingAmount = 0;

                              if (splitType === 'percentage') {
                                // Calculate total already assigned to existing members only
                                const existingTotal = selectedMemberIds.reduce(
                                  (sum, id) =>
                                    sum + (percentageSplits[id] || 0),
                                  0,
                                );
                                // Distribute remaining percentage to new member
                                remainingPercent = 100 - existingTotal;
                              } else if (splitType === 'custom') {
                                // Calculate total already assigned to existing members only
                                const existingTotal = selectedMemberIds.reduce(
                                  (sum, id) =>
                                    sum +
                                    parseFloat(customAmountSplits[id] || '0'),
                                  0,
                                );
                                // Distribute remaining amount to new member
                                const expenseAmount = parseFloat(amount) || 0;
                                remainingAmount = expenseAmount - existingTotal;
                              }

                              // Add member to selection
                              setSelectedMemberIds([
                                ...selectedMemberIds,
                                member.id,
                              ]);

                              // Set the split value for the new member
                              if (splitType === 'percentage') {
                                setPercentageSplits({
                                  ...percentageSplits,
                                  [member.id]: Math.max(0, remainingPercent),
                                });
                              } else if (splitType === 'custom') {
                                setCustomAmountSplits({
                                  ...customAmountSplits,
                                  [member.id]: Math.max(
                                    0,
                                    remainingAmount,
                                  ).toFixed(2),
                                });
                              }
                            }
                          }}
                        >
                          <Icon
                            name={
                              selectedMemberIds.includes(member.id)
                                ? 'checkbox'
                                : 'square-outline'
                            }
                            size={24}
                            color={
                              selectedMemberIds.includes(member.id)
                                ? colors.primary
                                : colors.textSecondary
                            }
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            if (selectedMemberIds.includes(member.id)) {
                              setSelectedMemberIds(
                                selectedMemberIds.filter(
                                  id => id !== member.id,
                                ),
                              );
                              // Remove from percentage/custom splits
                              const newPercentage = { ...percentageSplits };
                              delete newPercentage[member.id];
                              setPercentageSplits(newPercentage);
                              const newCustom = { ...customAmountSplits };
                              delete newCustom[member.id];
                              setCustomAmountSplits(newCustom);
                            } else {
                              // Calculate existing totals BEFORE adding the member
                              // to ensure we don't include the new member's old value
                              let remainingPercent = 0;
                              let remainingAmount = 0;

                              if (splitType === 'percentage') {
                                // Calculate total already assigned to existing members only
                                const existingTotal = selectedMemberIds.reduce(
                                  (sum, id) =>
                                    sum + (percentageSplits[id] || 0),
                                  0,
                                );
                                // Distribute remaining percentage to new member
                                remainingPercent = 100 - existingTotal;
                              } else if (splitType === 'custom') {
                                // Calculate total already assigned to existing members only
                                const existingTotal = selectedMemberIds.reduce(
                                  (sum, id) =>
                                    sum +
                                    parseFloat(customAmountSplits[id] || '0'),
                                  0,
                                );
                                // Distribute remaining amount to new member
                                const expenseAmount = parseFloat(amount) || 0;
                                remainingAmount = expenseAmount - existingTotal;
                              }

                              // Add member to selection
                              setSelectedMemberIds([
                                ...selectedMemberIds,
                                member.id,
                              ]);

                              // Set the split value for the new member
                              if (splitType === 'percentage') {
                                setPercentageSplits({
                                  ...percentageSplits,
                                  [member.id]: Math.max(0, remainingPercent),
                                });
                              } else if (splitType === 'custom') {
                                setCustomAmountSplits({
                                  ...customAmountSplits,
                                  [member.id]: Math.max(
                                    0,
                                    remainingAmount,
                                  ).toFixed(2),
                                });
                              }
                            }
                          }}
                        >
                          <Text
                            style={[
                              styles.memberName,
                              {
                                color: selectedMemberIds.includes(member.id)
                                  ? colors.text
                                  : colors.textSecondary,
                              },
                            ]}
                          >
                            {member.name}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {selectedMemberIds.includes(member.id) &&
                        splitType === 'percentage' && (
                          <Input
                            value={
                              percentageSplits[member.id]?.toString() || ''
                            }
                            onChangeText={text => {
                              const num = parseFloat(text) || 0;
                              setPercentageSplits({
                                ...percentageSplits,
                                [member.id]: num,
                              });
                            }}
                            placeholder="0"
                            keyboardType="decimal-pad"
                            style={styles.splitInput}
                            rightIcon={
                              <Text
                                style={[
                                  styles.percentSymbol,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                %
                              </Text>
                            }
                          />
                        )}

                      {selectedMemberIds.includes(member.id) &&
                        splitType === 'custom' && (
                          <Input
                            value={customAmountSplits[member.id] || ''}
                            onChangeText={text => {
                              setCustomAmountSplits({
                                ...customAmountSplits,
                                [member.id]: text,
                              });
                            }}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                            style={styles.splitInput}
                            leftIcon={
                              <Text
                                style={[
                                  styles.currencySymbol,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                {currencyCode}
                              </Text>
                            }
                          />
                        )}
                    </View>
                  ))}
                </View>

                {splitType === 'equal' && selectedMemberIds.length > 0 && (
                  <View style={styles.splitPreview}>
                    <Text
                      style={[
                        styles.splitPreviewText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Each person pays:{' '}
                      {(
                        (parseFloat(amount) || 0) / selectedMemberIds.length
                      ).toFixed(2)}{' '}
                      {currencyCode}
                    </Text>
                  </View>
                )}

                {splitType === 'percentage' && (
                  <View style={styles.splitPreview}>
                    <Text
                      style={[
                        styles.splitPreviewText,
                        {
                          color:
                            Math.abs(
                              selectedMemberIds.reduce(
                                (sum, id) => sum + (percentageSplits[id] || 0),
                                0,
                              ) - 100,
                            ) < 0.01
                              ? colors.success
                              : colors.error,
                        },
                      ]}
                    >
                      Total:{' '}
                      {selectedMemberIds
                        .reduce(
                          (sum, id) => sum + (percentageSplits[id] || 0),
                          0,
                        )
                        .toFixed(2)}
                      % (must equal 100%)
                    </Text>
                  </View>
                )}

                {splitType === 'custom' && (
                  <View style={styles.splitPreview}>
                    <Text
                      style={[
                        styles.splitPreviewText,
                        {
                          color:
                            Math.abs(
                              selectedMemberIds.reduce(
                                (sum, id) =>
                                  sum +
                                  parseFloat(customAmountSplits[id] || '0'),
                                0,
                              ) - (parseFloat(amount) || 0),
                            ) < 0.01
                              ? colors.success
                              : colors.error,
                        },
                      ]}
                    >
                      Total:{' '}
                      {selectedMemberIds
                        .reduce(
                          (sum, id) =>
                            sum + parseFloat(customAmountSplits[id] || '0'),
                          0,
                        )
                        .toFixed(2)}{' '}
                      {currencyCode} (must equal {parseFloat(amount) || 0}{' '}
                      {currencyCode})
                    </Text>
                  </View>
                )}

                {errors.split && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.split}
                  </Text>
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
  splitSection: {
    marginTop: 8,
  },
  splitLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  memberList: {
    gap: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  memberCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  splitInput: {
    width: 120,
  },
  percentSymbol: {
    fontSize: 14,
    fontWeight: '500',
    paddingRight: 8,
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '500',
    paddingLeft: 8,
  },
  splitPreview: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  splitPreviewText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
