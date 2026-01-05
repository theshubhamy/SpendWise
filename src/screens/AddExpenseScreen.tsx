/**
 * Add Expense Screen - Modern, simplified design for adding expenses
 * Personal expenses: Offline-first (SQLite)
 * Group expenses: Firebase (real-time)
 */

import React, { useState, useCallback } from 'react';
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
  ScreenHeader,
  Card,
} from '@/components';
import { EXPENSE_CATEGORIES } from '@/constants/categories';
import { CURRENCIES, getCurrencyDisplayName } from '@/constants/currencies';
import { useExpenseStore } from '@/store';
import { useGroupStore } from '@/store/groupStore';
import * as expenseService from '@/services/expense.service';
import { groupExpenseService } from '@/services/groupExpense.service';
import { getGroupMembers } from '@/services/group.service';
import { useThemeContext } from '@/context/ThemeContext';
import { SplitType, GroupMember } from '@/types';
import { getBaseCurrency } from '@/services/settings.service';
import Icon from '@react-native-vector-icons/ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';

interface AddExpenseScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddExpense'>;
}

export const AddExpenseScreen: React.FC<AddExpenseScreenProps> = ({
  navigation,
}) => {
  const { colors } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { addExpense } = useExpenseStore();
  const { groups, fetchGroups } = useGroupStore();

  const [amount, setAmount] = useState('');
  const [currencyCode, setCurrencyCode] = useState(getBaseCurrency());
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [paidByMemberId, setPaidByMemberId] = useState<string | null>(null);
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [percentageSplits, setPercentageSplits] = useState<
    Record<string, number>
  >({});
  const [customAmountSplits, setCustomAmountSplits] = useState<
    Record<string, number>
  >({});
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Refresh currency and groups when screen is focused
  useFocusEffect(
    useCallback(() => {
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
          setPaidByMemberId(prev => {
            if (!prev && members.length > 0) {
              return members[0].id;
            }
            return prev;
          });
          // Select all members by default for equal split
          setSelectedMemberIds(prev => {
            if (prev.length === 0 && members.length > 0) {
              return members.map(m => m.id);
            }
            return prev;
          });
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

    // Group expense validations
    if (selectedGroupId) {
      if (!paidByMemberId) {
        newErrors.paidBy = 'Please select who paid';
      }
      if (selectedMemberIds.length === 0) {
        newErrors.members = 'Please select at least one member';
      }
      if (splitType === 'percentage') {
        const total = selectedMemberIds.reduce(
          (sum, id) => sum + (percentageSplits[id] || 0),
          0,
        );
        if (Math.abs(total - 100) > 0.01) {
          newErrors.split = `Total must equal 100% (currently ${total.toFixed(2)}%)`;
        }
      }
      if (splitType === 'custom') {
        const total = selectedMemberIds.reduce(
          (sum, id) => sum + (customAmountSplits[id] || 0),
          0,
        );
        if (Math.abs(total - parseFloat(amount)) > 0.01) {
          newErrors.split = `Total must equal ${parseFloat(amount).toFixed(2)}`;
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
      const expenseData = {
        amount: amountNum,
        currencyCode,
        category,
        description: description || undefined,
        date,
      };

      if (selectedGroupId) {
        // Group expense: Store in Firebase
        const newExpense = await groupExpenseService.createGroupExpense(
          selectedGroupId,
          {
            ...expenseData,
            groupId: selectedGroupId,
            paidByMemberId: paidByMemberId!,
          },
        );

        // Create splits
        if (splitType === 'equal') {
          const amountPerMember = amountNum / selectedMemberIds.length;
          await groupExpenseService.createExpenseSplits(
            selectedGroupId,
            newExpense.id,
            selectedMemberIds.map(id => ({
              memberId: id,
              amount: amountPerMember,
            })),
          );
        } else if (splitType === 'percentage') {
          await groupExpenseService.createExpenseSplits(
            selectedGroupId,
            newExpense.id,
            selectedMemberIds.map(id => ({
              memberId: id,
              amount: (amountNum * (percentageSplits[id] || 0)) / 100,
              percentage: percentageSplits[id] || 0,
            })),
          );
        } else if (splitType === 'custom') {
          await groupExpenseService.createExpenseSplits(
            selectedGroupId,
            newExpense.id,
            selectedMemberIds.map(id => ({
              memberId: id,
              amount: customAmountSplits[id] || 0,
            })),
          );
        }
      } else {
        // Personal expense: Store locally (offline-first)
        await expenseService.createExpense(expenseData);
        await addExpense(expenseData);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error adding expense:', error);
      setErrors({
        submit: 'Failed to add expense. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = EXPENSE_CATEGORIES.map(cat => ({
    label: cat,
    value: cat,
  }));

  const currencyOptions = CURRENCIES.map(currency => ({
    label: getCurrencyDisplayName(currency.code),
    value: currency.code,
  }));

  const toggleExpenseType = (isGroup: boolean) => {
    if (isGroup && groups.length === 0) {
      setErrors({ submit: 'No groups available. Create a group first.' });
      return;
    }
    setSelectedGroupId(isGroup ? (selectedGroupId || groups[0]?.id || null) : null);
    setErrors({});
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      }
      return [...prev, memberId];
    });
  };

  const isPersonalExpense = !selectedGroupId;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
        {/* Expense Type Toggle */}
        <Card variant="elevated" style={styles.typeCard}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Expense Type
          </Text>
          <View style={styles.typeToggleContainer}>
            <TouchableOpacity
              style={[
                styles.typeToggle,
                isPersonalExpense && [
                  styles.typeToggleActive,
                  { backgroundColor: colors.primary },
                ],
                !isPersonalExpense && [
                  styles.typeToggleInactive,
                  { borderColor: colors.border },
                ],
              ]}
              onPress={() => toggleExpenseType(false)}
            >
              <Icon
                name="person-outline"
                size={20}
                color={isPersonalExpense ? '#ffffff' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.typeToggleText,
                  {
                    color: isPersonalExpense
                      ? '#ffffff'
                      : colors.textSecondary,
                  },
                ]}
              >
                Personal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeToggle,
                !isPersonalExpense && [
                  styles.typeToggleActive,
                  { backgroundColor: colors.primary },
                ],
                isPersonalExpense && [
                  styles.typeToggleInactive,
                  { borderColor: colors.border },
                ],
              ]}
              onPress={() => toggleExpenseType(true)}
            >
              <Icon
                name="people-outline"
                size={20}
                color={!isPersonalExpense ? '#ffffff' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.typeToggleText,
                  {
                    color: !isPersonalExpense
                      ? '#ffffff'
                      : colors.textSecondary,
                  },
                ]}
              >
                Group
              </Text>
            </TouchableOpacity>
          </View>

          {!isPersonalExpense && (
            <View style={styles.groupSelector}>
              <Picker
                label="Select Group"
                selectedValue={selectedGroupId || ''}
                onValueChange={value => {
                  setSelectedGroupId(value || null);
                  setErrors({});
                }}
                items={groups.map(group => ({
                  label: group.name,
                  value: group.id,
                }))}
              />
            </View>
          )}
        </Card>

        {/* Basic Expense Details */}
        <Card variant="elevated" style={styles.detailsCard}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Expense Details
          </Text>

          <View style={styles.amountRow}>
            <View style={styles.amountInput}>
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
            </View>
            <View style={styles.currencyInput}>
              <Picker
                label="Currency"
                selectedValue={currencyCode}
                onValueChange={setCurrencyCode}
                items={currencyOptions}
              />
            </View>
          </View>

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
        </Card>

        {/* Group Expense Details */}
        {selectedGroupId && groupMembers.length > 0 && (
          <Card variant="elevated" style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <Icon name="people" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Group Details
              </Text>
            </View>

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

            <View style={styles.splitTypeContainer}>
              <Text style={[styles.splitTypeLabel, { color: colors.text }]}>
                Split Type
              </Text>
              <View style={styles.splitTypeButtons}>
                {(['equal', 'percentage', 'custom'] as SplitType[]).map(
                  type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.splitTypeButton,
                        splitType === type && [
                          styles.splitTypeButtonActive,
                          { backgroundColor: colors.primary },
                        ],
                        splitType !== type && [
                          styles.splitTypeButtonInactive,
                          { borderColor: colors.border },
                        ],
                      ]}
                      onPress={() => {
                        setSplitType(type);
                        setPercentageSplits({});
                        setCustomAmountSplits({});
                      }}
                    >
                      <Text
                        style={[
                          styles.splitTypeButtonText,
                          {
                            color:
                              splitType === type
                                ? '#ffffff'
                                : colors.textSecondary,
                          },
                        ]}
                      >
                        {type === 'equal'
                          ? 'Equal'
                          : type === 'percentage'
                          ? 'Percentage'
                          : 'Custom'}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>
            </View>

            <View style={styles.membersContainer}>
              <Text style={[styles.membersLabel, { color: colors.text }]}>
                Select Members
              </Text>
              {groupMembers.map(member => {
                const isSelected = selectedMemberIds.includes(member.id);
                return (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.memberItem,
                      {
                        backgroundColor: isSelected
                          ? colors.primary + '15'
                          : colors.inputBackground,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                    onPress={() => toggleMemberSelection(member.id)}
                  >
                    <View style={styles.memberInfo}>
                      <Icon
                        name={isSelected ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={isSelected ? colors.primary : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.memberName,
                          {
                            color: isSelected
                              ? colors.primary
                              : colors.text,
                          },
                        ]}
                      >
                        {member.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {errors.members && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.members}
                </Text>
              )}
            </View>

            {splitType === 'percentage' && (
              <View style={styles.splitsContainer}>
                <Text
                  style={[styles.splitsLabel, { color: colors.textSecondary }]}
                >
                  Enter percentages (must total 100%)
                </Text>
                {groupMembers
                  .filter(m => selectedMemberIds.includes(m.id))
                  .map(member => (
                    <Input
                      key={member.id}
                      label={member.name}
                      value={
                        percentageSplits[member.id]?.toFixed(2) || '0'
                      }
                      onChangeText={text => {
                        const value = parseFloat(text) || 0;
                        setPercentageSplits({
                          ...percentageSplits,
                          [member.id]: Math.max(0, Math.min(100, value)),
                        });
                      }}
                      keyboardType="decimal-pad"
                      rightIcon={
                        <Text style={{ color: colors.textSecondary }}>%</Text>
                      }
                    />
                  ))}
                {errors.split && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.split}
                  </Text>
                )}
              </View>
            )}

            {splitType === 'custom' && (
              <View style={styles.splitsContainer}>
                <Text
                  style={[styles.splitsLabel, { color: colors.textSecondary }]}
                >
                  Enter amounts (must total{' '}
                  {parseFloat(amount).toFixed(2) || '0.00'})
                </Text>
                {groupMembers
                  .filter(m => selectedMemberIds.includes(m.id))
                  .map(member => (
                    <Input
                      key={member.id}
                      label={member.name}
                      value={
                        customAmountSplits[member.id]?.toFixed(2) || '0.00'
                      }
                      onChangeText={text => {
                        const value = parseFloat(text) || 0;
                        setCustomAmountSplits({
                          ...customAmountSplits,
                          [member.id]: Math.max(0, value),
                        });
                      }}
                      keyboardType="decimal-pad"
                      rightIcon={
                        <Text style={{ color: colors.textSecondary }}>
                          {currencyCode}
                        </Text>
                      }
                    />
                  ))}
                {errors.split && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.split}
                  </Text>
                )}
              </View>
            )}
          </Card>
        )}

        {errors.submit && (
          <Card variant="outlined" style={styles.errorCard}>
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={20} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.submit}
              </Text>
            </View>
          </Card>
        )}

        <Button
          title={isPersonalExpense ? 'Add Expense' : 'Add Group Expense'}
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
          size="large"
          leftIcon={
            <Icon
              name={isPersonalExpense ? 'add-circle-outline' : 'people-outline'}
              size={20}
              color="#ffffff"
            />
          }
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
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  typeCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  typeToggleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  typeToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  typeToggleActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typeToggleInactive: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  typeToggleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  groupSelector: {
    marginTop: 8,
  },
  detailsCard: {
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  amountInput: {
    flex: 2,
  },
  currencyInput: {
    flex: 1,
  },
  groupCard: {
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  splitTypeContainer: {
    marginBottom: 20,
  },
  splitTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  splitTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  splitTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitTypeButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  splitTypeButtonInactive: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  splitTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  membersContainer: {
    marginBottom: 20,
  },
  membersLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1.5,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '500',
  },
  splitsContainer: {
    marginTop: 8,
  },
  splitsLabel: {
    fontSize: 13,
    marginBottom: 12,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 20,
  },
  errorCard: {
    marginBottom: 16,
    borderColor: undefined, // Will be set inline
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
    lineHeight: 20,
  },
});
