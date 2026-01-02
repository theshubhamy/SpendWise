/**
 * Main app navigation
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '@/screens/HomeScreen';
import { ExpensesScreen } from '@/screens/ExpensesScreen';
import { GroupsScreen } from '@/screens/GroupsScreen';
import { ReportsScreen } from '@/screens/ReportsScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { AddExpenseScreen } from '@/screens/AddExpenseScreen';
import { EditExpenseScreen } from '@/screens/EditExpenseScreen';
import { TagsScreen } from '@/screens/TagsScreen';
import { CreateGroupScreen } from '@/screens/CreateGroupScreen';
import { GroupDetailScreen } from '@/screens/GroupDetailScreen';
import { RecurringExpensesScreen } from '@/screens/RecurringExpensesScreen';
import { CreateRecurringScreen } from '@/screens/CreateRecurringScreen';
import { RemindersScreen } from '@/screens/RemindersScreen';
import { SettleUpScreen } from '@/screens/SettleUpScreen';
import Icon from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '@/context/ThemeContext';

// Root Stack Navigator Types
export type RootStackParamList = {
  MainTabs: undefined;
  AddExpense: undefined;
  EditExpense: { expenseId: string };
  Tags: undefined;
  CreateGroup: undefined;
  GroupDetail: { groupId: string };
  CreateRecurring: undefined;
  RecurringExpenses: undefined;
  Reminders: undefined;
  SettleUp: { groupId: string };
};

// Bottom Tab Navigator Types
export type MainTabParamList = {
  Home: undefined;
  Expenses: undefined;
  Groups: undefined;
  Reports: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Icon functions defined outside component to avoid re-creation on each render
// React Navigation passes { focused, color, size } to tabBarIcon
const HomeIcon = ({
  focused,
  color,
  size,
}: {
  focused: boolean;
  color: string;
  size: number;
}) => (
  <Icon name={focused ? 'home' : 'home-outline'} size={size} color={color} />
);
const ExpensesIcon = ({
  focused,
  color,
  size,
}: {
  focused: boolean;
  color: string;
  size: number;
}) => (
  <Icon name={focused ? 'card' : 'card-outline'} size={size} color={color} />
);
const GroupsIcon = ({
  focused,
  color,
  size,
}: {
  focused: boolean;
  color: string;
  size: number;
}) => (
  <Icon
    name={focused ? 'people' : 'people-outline'}
    size={size}
    color={color}
  />
);
const ReportsIcon = ({
  focused,
  color,
  size,
}: {
  focused: boolean;
  color: string;
  size: number;
}) => (
  <Icon
    name={focused ? 'bar-chart' : 'bar-chart-outline'}
    size={size}
    color={color}
  />
);
const ProfileIcon = ({
  focused,
  color,
  size,
}: {
  focused: boolean;
  color: string;
  size: number;
}) => (
  <Icon
    name={focused ? 'person' : 'person-outline'}
    size={size}
    color={color}
  />
);

/**
 * Bottom Tab Navigator
 */
const MainTabNavigator: React.FC = () => {
  const { colors } = useThemeContext();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          paddingBottom: Math.max(insets.bottom, 4),
          paddingTop: 4,
          height: 60 + Math.max(insets.bottom, 4),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: HomeIcon,
        }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{
          tabBarLabel: 'Expenses',
          tabBarIcon: ExpensesIcon,
        }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{
          tabBarLabel: 'Groups',
          tabBarIcon: GroupsIcon,
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ReportsIcon,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ProfileIcon,
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * Root Navigator - Combines Stack and Tabs
 */
export const AppNavigator: React.FC = () => {
  const { colors } = useThemeContext();
  const insets = useSafeAreaInsets();
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          presentation: 'card',
          contentStyle: {
            backgroundColor: colors.background,
            paddingTop: insets.top,
          },
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen
          name="AddExpense"
          component={AddExpenseScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
            contentStyle: {
              paddingBottom: insets.bottom,
            },
          }}
        />
        <Stack.Screen
          name="EditExpense"
          component={EditExpenseScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
            contentStyle: {
              paddingBottom: insets.bottom,
            },
          }}
        />
        <Stack.Screen
          name="Tags"
          component={TagsScreen}
          options={{
            presentation: 'card',
            headerShown: false,
            contentStyle: {
              paddingBottom: insets.bottom,
            },
          }}
        />
        <Stack.Screen
          name="CreateGroup"
          component={CreateGroupScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
            contentStyle: {
              paddingBottom: insets.bottom,
            },
          }}
        />
        <Stack.Screen
          name="GroupDetail"
          component={GroupDetailScreen}
          options={{
            presentation: 'card',
            headerShown: false,
            contentStyle: {
              paddingBottom: insets.bottom,
            },
          }}
        />
        <Stack.Screen
          name="CreateRecurring"
          component={CreateRecurringScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
            contentStyle: {
              paddingBottom: insets.bottom,
            },
          }}
        />
        <Stack.Screen
          name="RecurringExpenses"
          component={RecurringExpensesScreen}
          options={{
            presentation: 'card',
            headerShown: false,
            contentStyle: {
              paddingBottom: insets.bottom,
            },
          }}
        />
        <Stack.Screen
          name="Reminders"
          component={RemindersScreen}
          options={{
            presentation: 'card',
            headerShown: false,
            contentStyle: {
              paddingBottom: insets.bottom,
            },
          }}
        />
        <Stack.Screen
          name="SettleUp"
          component={SettleUpScreen}
          options={{
            presentation: 'card',
            headerShown: false,
            contentStyle: {
              paddingBottom: insets.bottom,
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
