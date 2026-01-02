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
import { ScreenHeader, Card } from '@/components';
import Icon from '@react-native-vector-icons/ionicons';

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
      <ScreenHeader
        title="Expense Groups"
        showBackButton={true}
        rightComponent={
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('CreateGroup')}
            activeOpacity={0.8}
          >
            <Icon name="add" size={20} color="#ffffff" />
          </TouchableOpacity>
        }
      />

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
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {groups.map((group) => (
            <Card
              key={group.id}
              variant="elevated"
              onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
              style={styles.groupCard}
            >
              <View style={styles.groupContent}>
                <View style={styles.groupInfo}>
                  <Text style={[styles.groupName, { color: colors.text }]}>{group.name}</Text>
                  {group.description && (
                    <Text style={[styles.groupDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                      {group.description}
                    </Text>
                  )}
                  <Text style={[styles.groupDate, { color: colors.textTertiary }]}>
                    Created {format(new Date(group.createdAt), 'MMM dd, yyyy')}
                  </Text>
                </View>
                <View style={[styles.currencyBadge, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.groupCurrency, { color: colors.primary }]}>{group.currencyCode}</Text>
                </View>
              </View>
            </Card>
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 20,
  },
  groupCard: {
    marginBottom: 12,
    padding: 16,
  },
  groupContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
    marginRight: 12,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.7,
  },
  groupDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  currencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  groupCurrency: {
    fontSize: 14,
    fontWeight: '600',
  },
});

