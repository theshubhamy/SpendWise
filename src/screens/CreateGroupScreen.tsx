/**
 * Create Group Screen - Create new expense group
 */

import React, { useState } from 'react';
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
import { Input, Button, Picker } from '@/components';
import { DEFAULT_SETTINGS } from '@/constants';
import { useGroupStore } from '@/store/groupStore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useThemeContext } from '@/context/ThemeContext';

interface CreateGroupScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

export const CreateGroupScreen: React.FC<CreateGroupScreenProps> = ({
  navigation,
}) => {
  const { colors } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { createGroup } = useGroupStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currencyCode, setCurrencyCode] = useState(DEFAULT_SETTINGS.BASE_CURRENCY);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currencyOptions = [
    { label: 'USD - US Dollar', value: 'USD' },
    { label: 'EUR - Euro', value: 'EUR' },
    { label: 'GBP - British Pound', value: 'GBP' },
    { label: 'INR - Indian Rupee', value: 'INR' },
  ];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Please enter a group name';
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
      await createGroup(name.trim(), currencyCode, description.trim() || undefined);
      navigation.goBack();
    } catch (error) {
      console.error('Error creating group:', error);
      setErrors({ submit: 'Failed to create group. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create Group</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Group Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g., Roommates, Trip to Paris"
          error={errors.name}
        />

        <Input
          label="Description (Optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Add a description..."
          multiline
          numberOfLines={3}
        />

        <Picker
          label="Currency"
          selectedValue={currencyCode}
          onValueChange={setCurrencyCode}
          items={currencyOptions}
        />

        {errors.submit && (
          <Text style={[styles.errorText, { color: colors.error }]}>{errors.submit}</Text>
        )}

        <Button
          title="Create Group"
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
  submitButton: {
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
});

