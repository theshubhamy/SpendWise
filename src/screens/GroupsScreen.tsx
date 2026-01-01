/**
 * Groups Screen - Manage expense groups
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGroupStore } from '@/store/groupStore';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { format } from 'date-fns';
import { useThemeContext } from '@/context/ThemeContext';

type GroupsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const GroupsScreen: React.FC = () => {
  const { colors } = useThemeContext();
  const navigation = useNavigation<GroupsScreenNavigationProp>();
  const { groups, isLoading, fetchGroups } = useGroupStore();

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Expense Groups</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('CreateGroup')}
        >
          <Text style={[styles.addButtonText, { color: '#ffffff' }]}>+ New Group</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading groups...</Text>
        </View>
      ) : groups.length === 0 ? (
        <ScrollView style={styles.content}>
          <View style={styles.centerContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No groups yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              Create a group to split expenses with others
            </Text>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('CreateGroup')}
            >
              <Text style={[styles.createButtonText, { color: '#ffffff' }]}>Create Your First Group</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.list}>
          {groups.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={[
                styles.groupItem,
                {
                  backgroundColor: colors.card,
                  shadowColor: colors.shadow,
                },
              ]}
              onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
              activeOpacity={0.7}
            >
              <View style={styles.groupInfo}>
                <Text style={[styles.groupName, { color: colors.text }]}>{group.name}</Text>
                {group.description && (
                  <Text style={[styles.groupDescription, { color: colors.textSecondary }]}>{group.description}</Text>
                )}
                <Text style={[styles.groupDate, { color: colors.textTertiary }]}>
                  Created {format(new Date(group.createdAt), 'MMM dd, yyyy')}
                </Text>
              </View>
              <Text style={[styles.groupCurrency, { color: colors.primary }]}>{group.currencyCode}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
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
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    padding: 40,
  },
  list: {
    flex: 1,
    padding: 16,
  },
  groupItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  groupDate: {
    fontSize: 12,
  },
  groupCurrency: {
    fontSize: 16,
    fontWeight: '600',
  },
});

