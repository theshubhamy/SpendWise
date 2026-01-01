/**
 * Date Picker Component
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
  const { colors } = useThemeContext();
  const [showPicker, setShowPicker] = useState(false);
  const date = value ? new Date(value) : new Date();

  const handleDateChange = (event: any, selectedDate?: Date) => {
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
  };

  const displayValue = value ? format(new Date(value), 'MMM dd, yyyy') : '';

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.inputBackground,
              borderColor: error ? colors.error : colors.inputBorder,
            },
            error && styles.inputError,
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={displayValue}
            placeholder="Select date"
            placeholderTextColor={colors.placeholder}
            editable={false}
          />
        </View>
      </TouchableOpacity>
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputError: {
    // Error border color is handled inline
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});

