/**
 * Picker Component (using React Native Picker)
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Picker as RNPicker } from '@react-native-picker/picker';
import { useThemeContext } from '@/context/ThemeContext';

interface PickerProps {
  label?: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  items: Array<{ label: string; value: string }>;
  error?: string;
}

export const Picker: React.FC<PickerProps> = ({
  label,
  selectedValue,
  onValueChange,
  items,
  error,
}) => {
  const { colors } = useThemeContext();
  const selectedItem = items.find(item => item.value === selectedValue);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <View
        style={[
          styles.pickerContainer,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.error : colors.inputBorder,
          },
          error && styles.pickerError,
        ]}
      >
        {Platform.OS === 'ios' ? (
          <RNPicker
            selectedValue={selectedValue}
            onValueChange={onValueChange}
            style={[styles.picker, { color: colors.text }]}
          >
            {items.map(item => (
              <RNPicker.Item
                key={item.value}
                label={item.label}
                value={item.value}
              />
            ))}
          </RNPicker>
        ) : (
          <RNPicker
            selectedValue={selectedValue}
            onValueChange={onValueChange}
            style={[styles.picker, { color: colors.text }]}
            dropdownIconColor={colors.textSecondary}
          >
            {items.map(item => (
              <RNPicker.Item
                key={item.value}
                label={item.label}
                value={item.value}
              />
            ))}
          </RNPicker>
        )}
      </View>
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
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
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: Platform.OS === 'ios' ? 200 : 50,
  },
  pickerError: {
    // Error border color is handled inline
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});

