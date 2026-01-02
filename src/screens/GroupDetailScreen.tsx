/**
 * Group Detail Screen - View group details, members, and balances
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useGroupStore } from '@/store/groupStore';
import {
  getGroupMembers,
  addMemberToGroup,
  removeMemberFromGroup,
  calculateGroupBalances,
  getSettlementSuggestions,
} from '@/services/group.service';
import { Button, ScreenHeader, Card, Input } from '@/components';
import { GroupMember } from '@/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useThemeContext } from '@/context/ThemeContext';
import Icon from '@react-native-vector-icons/ionicons';

interface GroupDetailScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  route: { params: { groupId: string } };
}

export const GroupDetailScreen: React.FC<GroupDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { colors } = useThemeContext();
  const { groupId } = route.params;
  const { getGroupById, deleteGroup, fetchGroups } = useGroupStore();
  const group = getGroupById(groupId);

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [settlements, setSettlements] = useState<
    Array<{ from: string; to: string; amount: number }>
  >([]);
  const [newMemberName, setNewMemberName] = useState('');

  const loadGroupData = useCallback(async () => {
    if (!group) return;

    const groupMembers = await getGroupMembers(groupId);
    setMembers(groupMembers);

    const groupBalances = await calculateGroupBalances(groupId);
    setBalances(groupBalances);

    const settlementSuggestions = await getSettlementSuggestions(groupId);
    setSettlements(settlementSuggestions);
  }, [groupId, group]);

  useEffect(() => {
    loadGroupData();
  }, [loadGroupData]);

  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      Alert.alert('Error', 'Please enter a member name');
      return;
    }

    try {
      const userId = `user_${Date.now()}`; // Simple user ID generation
      await addMemberToGroup(groupId, userId, newMemberName.trim());
      setNewMemberName('');
      await loadGroupData();
    } catch {
      Alert.alert('Error', 'Failed to add member');
    }
  };

  const handleRemoveMember = (member: GroupMember) => {
    Alert.alert('Remove Member', `Remove ${member.name} from this group?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeMemberFromGroup(member.id);
            await loadGroupData();
          } catch {
            Alert.alert('Error', 'Failed to remove member');
          }
        },
      },
    ]);
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group? All expenses and members will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGroup(groupId);
              await fetchGroups();
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Failed to delete group');
            }
          },
        },
      ],
    );
  };

  if (!group) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          Group not found
        </Text>
      </View>
    );
  }

  const getMemberName = (memberId: string): string => {
    return members.find(m => m.id === memberId)?.name || 'Unknown';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={group.name}
        subtitle={group.description}
        showBackButton={true}
        rightComponent={
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.primary }]}
            onPress={() =>
              navigation.navigate('SettleUp', { groupId: group.id })
            }
            activeOpacity={0.8}
          >
            <Icon name="cash" size={18} color="#ffffff" />
          </TouchableOpacity>
        }
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="elevated" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Members ({members.length})
          </Text>
          <View style={styles.addMemberContainer}>
            <Input
              label="Add Member"
              value={newMemberName}
              onChangeText={setNewMemberName}
              placeholder="Member name"
              leftIcon={
                <Icon
                  name="person-add-outline"
                  size={20}
                  color={colors.textSecondary}
                />
              }
            />
            <Button
              title="Add"
              onPress={handleAddMember}
              style={styles.addButton}
            />
          </View>
          {members.map(member => (
            <View
              key={member.id}
              style={[
                styles.memberItem,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              <View>
                <Text style={[styles.memberName, { color: colors.text }]}>
                  {member.name}
                </Text>
                {member.email && (
                  <Text
                    style={[
                      styles.memberEmail,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {member.email}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => handleRemoveMember(member)}>
                <Text style={[styles.removeButton, { color: colors.error }]}>
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </Card>

        {settlements.length > 0 && (
          <Card variant="elevated" style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Settlement Suggestions
            </Text>
            {settlements.map((settlement, index) => (
              <View
                key={index}
                style={[
                  styles.settlementItem,
                  { borderBottomColor: colors.borderLight },
                ]}
              >
                <Text style={[styles.settlementText, { color: colors.text }]}>
                  {getMemberName(settlement.from)} owes{' '}
                  {getMemberName(settlement.to)} {group.currencyCode}{' '}
                  {settlement.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </Card>
        )}

        <Card variant="elevated" style={styles.section}>
          <Button
            title="Settle Up"
            onPress={() => navigation.navigate('SettleUp', { groupId })}
            size="large"
          />
        </Card>

        <Card variant="elevated" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Balances
          </Text>
          {members.map(member => {
            const balance = balances[member.id] || 0;
            return (
              <View
                key={member.id}
                style={[
                  styles.balanceItem,
                  { borderBottomColor: colors.borderLight },
                ]}
              >
                <Text style={[styles.balanceName, { color: colors.text }]}>
                  {member.name}
                </Text>
                <Text
                  style={[
                    styles.balanceAmount,
                    { color: balance >= 0 ? colors.success : colors.error },
                  ]}
                >
                  {balance >= 0 ? '+' : ''}
                  {group.currencyCode} {balance.toFixed(2)}
                </Text>
              </View>
            );
          })}
        </Card>

        <Card variant="elevated" style={styles.section}>
          <TouchableOpacity
            style={[
              styles.deleteGroupButton,
              { backgroundColor: colors.error + '15' },
            ]}
            onPress={handleDeleteGroup}
            activeOpacity={0.7}
          >
            <Icon name="trash-outline" size={20} color={colors.error} />
            <Text style={[styles.deleteGroupText, { color: colors.error }]}>
              Delete Group
            </Text>
          </TouchableOpacity>
        </Card>
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  addMemberContainer: {
    marginBottom: 12,
    gap: 12,
  },
  addButton: {
    marginTop: 8,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  memberEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  removeButton: {
    fontSize: 14,
  },
  settlementItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settlementText: {
    fontSize: 14,
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  balanceName: {
    fontSize: 16,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    textAlign: 'center',
    padding: 40,
  },
  deleteGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteGroupText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
