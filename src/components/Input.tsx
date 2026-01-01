/**
 * Text Input Component
 */

import React from 'react';
import { TextInput, TextInputProps, StyleSheet, Text, View } from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  style,
  ...props
}) => {
  const { colors } = useThemeContext();

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.error : colors.inputBorder,
            color: colors.text,
          },
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.placeholder}
        {...props}
      />
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
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

