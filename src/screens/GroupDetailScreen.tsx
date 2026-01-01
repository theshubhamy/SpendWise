/**
 * Group Detail Screen - View group details, members, and balances
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useGroupStore } from '@/store/groupStore';
import {
  getGroupMembers,
  addMemberToGroup,
  removeMemberFromGroup,
  calculateGroupBalances,
  getSettlementSuggestions,
} from '@/services/group.service';
import { GroupMember } from '@/types';
import { format } from 'date-fns';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useThemeContext } from '@/context/ThemeContext';

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
  const [settlements, setSettlements] = useState<Array<{ from: string; to: string; amount: number }>>([]);
  const [newMemberName, setNewMemberName] = useState('');

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = async () => {
    if (!group) return;

    const groupMembers = await getGroupMembers(groupId);
    setMembers(groupMembers);

    const groupBalances = await calculateGroupBalances(groupId);
    setBalances(groupBalances);

    const settlementSuggestions = await getSettlementSuggestions(groupId);
    setSettlements(settlementSuggestions);
  };

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
    } catch (error) {
      Alert.alert('Error', 'Failed to add member');
    }
  };

  const handleRemoveMember = (member: GroupMember) => {
    Alert.alert(
      'Remove Member',
      `Remove ${member.name} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMemberFromGroup(member.id);
              await loadGroupData();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ],
    );
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
            } catch (error) {
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
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Group not found</Text>
      </View>
    );
  }

  const getMemberName = (memberId: string): string => {
    return members.find((m) => m.id === memberId)?.name || 'Unknown';
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{group.name}</Text>
          {group.description && (
            <Text style={[styles.description, { color: colors.textSecondary }]}>{group.description}</Text>
          )}
        </View>
        <TouchableOpacity onPress={handleDeleteGroup}>
          <Text style={[styles.deleteButton, { color: colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Members ({members.length})</Text>
        <View style={styles.addMemberContainer}>
          <TextInput
            style={[
              styles.memberInput,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.text,
              },
            ]}
            value={newMemberName}
            onChangeText={setNewMemberName}
            placeholder="Member name"
            placeholderTextColor={colors.placeholder}
          />
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddMember}
          >
            <Text style={[styles.addButtonText, { color: '#ffffff' }]}>Add</Text>
          </TouchableOpacity>
        </View>
        {members.map((member) => (
          <View key={member.id} style={[styles.memberItem, { borderBottomColor: colors.borderLight }]}>
            <View>
              <Text style={[styles.memberName, { color: colors.text }]}>{member.name}</Text>
              {member.email && (
                <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>{member.email}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => handleRemoveMember(member)}>
              <Text style={[styles.removeButton, { color: colors.error }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {settlements.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Settlement Suggestions</Text>
          {settlements.map((settlement, index) => (
            <View key={index} style={[styles.settlementItem, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.settlementText, { color: colors.text }]}>
                {getMemberName(settlement.from)} owes {getMemberName(settlement.to)}{' '}
                {group.currencyCode} {settlement.amount.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Balances</Text>
        {members.map((member) => {
          const balance = balances[member.id] || 0;
          return (
            <View key={member.id} style={[styles.balanceItem, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.balanceName, { color: colors.text }]}>{member.name}</Text>
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
      </View>
    </ScrollView>
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
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    marginTop: 4,
  },
  deleteButton: {
    fontSize: 16,
  },
  section: {
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  addMemberContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  memberInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
});

