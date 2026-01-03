/**
 * Settle Up Screen - Record payments to settle debts in a group
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader, Button, Input, DatePicker, Card } from '@/components';
import {
  getGroupMembers,
  calculateGroupBalances,
  getSettlementSuggestions,
  recordPayment,
  getPaymentsByGroup,
  deletePayment,
} from '@/services/group.service';
import { useGroupStore } from '@/store/groupStore';
import { GroupMember, Payment } from '@/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useThemeContext } from '@/context/ThemeContext';
import { getBaseCurrency } from '@/services/settings.service';
import Icon from '@react-native-vector-icons/ionicons';

interface SettleUpScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SettleUp'>;
  route: { params: { groupId: string } };
}

export const SettleUpScreen: React.FC<SettleUpScreenProps> = ({
  navigation,
  route,
}) => {
  const { colors } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { groupId } = route.params;
  const { getGroupById } = useGroupStore();
  const group = getGroupById(groupId);

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [settlements, setSettlements] = useState<
    Array<{ from: string; to: string; amount: number }>
  >([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fromMemberId, setFromMemberId] = useState<string | null>(null);
  const [toMemberId, setToMemberId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [currencyCode, setCurrencyCode] = useState(getBaseCurrency());

  const loadGroupData = useCallback(async () => {
    if (!group) return;

    const groupMembers = await getGroupMembers(groupId);
    setMembers(groupMembers);

    const groupBalances = await calculateGroupBalances(groupId);
    setBalances(groupBalances);

    const settlementSuggestions = await getSettlementSuggestions(groupId);
    setSettlements(settlementSuggestions);

    const groupPayments = await getPaymentsByGroup(groupId);
    setPayments(groupPayments);

    setCurrencyCode(group.currencyCode || getBaseCurrency());
  }, [groupId, group]);

  useEffect(() => {
    loadGroupData();
  }, [loadGroupData]);

  const getMemberName = (memberId: string): string => {
    return members.find(m => m.id === memberId)?.name || 'Unknown';
  };

  const handleRecordPayment = async () => {
    if (!fromMemberId || !toMemberId) {
      Alert.alert('Error', 'Please select both payer and payee');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (fromMemberId === toMemberId) {
      Alert.alert('Error', 'Payer and payee cannot be the same person');
      return;
    }

    setLoading(true);
    try {
      await recordPayment(
        groupId,
        fromMemberId,
        toMemberId,
        parseFloat(amount),
        currencyCode,
        date,
        notes || undefined,
      );
      setAmount('');
      setNotes('');
      setFromMemberId(null);
      setToMemberId(null);
      await loadGroupData();
      Alert.alert('Success', 'Payment recorded successfully');
    } catch (error) {
      console.error('Error recording payment:', error);
      Alert.alert('Error', 'Failed to record payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseSuggestion = (suggestion: { from: string; to: string; amount: number }) => {
    setFromMemberId(suggestion.from);
    setToMemberId(suggestion.to);
    setAmount(suggestion.amount.toFixed(2));
  };

  const handleDeletePayment = (payment: Payment) => {
    Alert.alert(
      'Delete Payment',
      `Delete payment of ${payment.amount} ${payment.currencyCode} from ${getMemberName(payment.fromMemberId)} to ${getMemberName(payment.toMemberId)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePayment(payment.id);
              await loadGroupData();
            } catch {
              Alert.alert('Error', 'Failed to delete payment');
            }
          },
        },
      ],
    );
  };

  if (!group) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader
          title="Settle Up"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Group not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Settle Up"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Balances Section */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Current Balances
          </Text>
          {members.map(member => {
            const balance = balances[member.id] || 0;
            return (
              <View key={member.id} style={styles.balanceRow}>
                <Text style={[styles.memberName, { color: colors.text }]}>
                  {member.name}
                </Text>
                <Text
                  style={[
                    styles.balanceAmount,
                    {
                      color: balance >= 0 ? (colors.success || colors.primary) : colors.error,
                    },
                  ]}
                >
                  {balance >= 0 ? '+' : ''}
                  {currencyCode} {Math.abs(balance).toFixed(2)}
                </Text>
              </View>
            );
          })}
        </Card>

        {/* Settlement Suggestions */}
        {settlements.length > 0 && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Settlement Suggestions
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Tap to use a suggestion
            </Text>
            {settlements.map((settlement, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.suggestionItem,
                  { backgroundColor: colors.inputBackground },
                ]}
                onPress={() => handleUseSuggestion(settlement)}
                activeOpacity={0.7}
              >
                <View style={styles.suggestionContent}>
                  <Text style={[styles.suggestionText, { color: colors.text }]}>
                    {getMemberName(settlement.from)} → {getMemberName(settlement.to)}
                  </Text>
                  <Text
                    style={[
                      styles.suggestionAmount,
                      { color: colors.primary },
                    ]}
                  >
                    {currencyCode} {settlement.amount.toFixed(2)}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Record Payment Form */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Record Payment
          </Text>

          <View style={styles.pickerContainer}>
            <Text style={[styles.label, { color: colors.text }]}>From (Payer)</Text>
            <View
              style={[
                styles.pickerButton,
                { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
              ]}
            >
              <Text style={[styles.pickerText, { color: fromMemberId ? colors.text : colors.textSecondary }]}>
                {fromMemberId ? getMemberName(fromMemberId) : 'Select payer'}
              </Text>
              <Icon name="chevron-down" size={20} color={colors.textSecondary} />
            </View>
            {members.map(member => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.memberOption,
                  {
                    backgroundColor:
                      fromMemberId === member.id
                        ? colors.primary + '20'
                        : colors.inputBackground,
                  },
                ]}
                onPress={() => setFromMemberId(member.id)}
              >
                <Icon
                  name={fromMemberId === member.id ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={fromMemberId === member.id ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.memberOptionText, { color: colors.text }]}>
                  {member.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.pickerContainer}>
            <Text style={[styles.label, { color: colors.text }]}>To (Payee)</Text>
            <View
              style={[
                styles.pickerButton,
                { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
              ]}
            >
              <Text style={[styles.pickerText, { color: toMemberId ? colors.text : colors.textSecondary }]}>
                {toMemberId ? getMemberName(toMemberId) : 'Select payee'}
              </Text>
              <Icon name="chevron-down" size={20} color={colors.textSecondary} />
            </View>
            {members.map(member => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.memberOption,
                  {
                    backgroundColor:
                      toMemberId === member.id
                        ? colors.primary + '20'
                        : colors.inputBackground,
                  },
                ]}
                onPress={() => setToMemberId(member.id)}
              >
                <Icon
                  name={toMemberId === member.id ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={toMemberId === member.id ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.memberOptionText, { color: colors.text }]}>
                  {member.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label={`Amount (${currencyCode})`}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            leftIcon={<Icon name="cash-outline" size={20} color={colors.textSecondary} />}
          />

          <DatePicker
            label="Date"
            value={date}
            onValueChange={setDate}
          />

          <Input
            label="Notes (Optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Payment notes..."
            multiline
            numberOfLines={3}
            leftIcon={<Icon name="create-outline" size={20} color={colors.textSecondary} />}
          />

          <Button
            title="Record Payment"
            onPress={handleRecordPayment}
            loading={loading}
            style={styles.submitButton}
            size="large"
            leftIcon={<Icon name="checkmark-circle" size={20} color="#ffffff" />}
          />
        </Card>

        {/* Payment History */}
        {payments.length > 0 && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Payment History
            </Text>
            {payments.map(payment => (
              <View
                key={payment.id}
                style={[
                  styles.paymentItem,
                  { borderBottomColor: colors.borderLight },
                ]}
              >
                <View style={styles.paymentContent}>
                  <Text style={[styles.paymentText, { color: colors.text }]}>
                    {getMemberName(payment.fromMemberId)} paid{' '}
                    {getMemberName(payment.toMemberId)}
                  </Text>
                  <Text style={[styles.paymentAmount, { color: colors.primary }]}>
                    {payment.currencyCode} {payment.amount.toFixed(2)}
                  </Text>
                  <Text style={[styles.paymentDate, { color: colors.textSecondary }]}>
                    {new Date(payment.date).toLocaleDateString()}
                  </Text>
                  {payment.notes && (
                    <Text style={[styles.paymentNotes, { color: colors.textSecondary }]}>
                      {payment.notes}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleDeletePayment(payment)}
                  style={styles.deleteButton}
                >
                  <Icon name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 14,
    marginBottom: 4,
  },
  suggestionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  pickerText: {
    fontSize: 16,
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
    gap: 12,
  },
  memberOptionText: {
    fontSize: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  paymentContent: {
    flex: 1,
  },
  paymentText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  paymentNotes: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

