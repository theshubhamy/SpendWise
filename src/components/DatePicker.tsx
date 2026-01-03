/**
 * Date Picker Component - Modern redesigned date picker
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useThemeContext } from '@/context/ThemeContext';
import Icon from '@react-native-vector-icons/ionicons';

interface DatePickerProps {
  label?: string;
  value: string; // ISO date string (YYYY-MM-DD)
  onValueChange: (value: string) => void;
  error?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onValueChange,
  error,
  maximumDate,
  minimumDate,
}) => {
  const { colors, isDark } = useThemeContext();
  const [showPicker, setShowPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const date = value ? new Date(value) : new Date();

  const handleDateChange = (
    event: { type: string; nativeEvent: { timestamp: number } },
    selectedDate?: Date,
  ) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      onValueChange(dateString);

      if (Platform.OS === 'ios') {
        setShowPicker(false);
      }
    }
    setIsFocused(false);
  };

  const displayValue = value ? format(new Date(value), 'MMM dd, yyyy') : '';

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.inputBorder;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      <TouchableOpacity
        onPress={() => {
          setShowPicker(true);
          setIsFocused(true);
        }}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.inputContainer,
            isFocused ? styles.inputContainerFocused : styles.inputContainerUnfocused,
            {
              backgroundColor: colors.inputBackground,
              borderColor,
            },
            error && styles.inputError,
          ]}
        >
          <Icon
            name="calendar-outline"
            size={20}
            color={colors.textSecondary}
            style={styles.icon}
          />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={displayValue}
            placeholder="Select date"
            placeholderTextColor={colors.placeholder}
            editable={false}
          />
          <Icon
            name="chevron-down"
            size={20}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          themeVariant={isDark ? 'dark' : 'light'}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  inputError: {
    // Error styling handled inline
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
});

