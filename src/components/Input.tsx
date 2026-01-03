/**
 * Text Input Component - Modern redesigned input with focus states
 */

import React, { useState } from 'react';
import { TextInput, TextInputProps, StyleSheet, Text, View } from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  style,
  ...props
}) => {
  const { colors } = useThemeContext();
  const [isFocused, setIsFocused] = useState(false);

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
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            styles.inputFlex,
            {
              color: colors.text,
            },
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            style,
          ]}
          placeholderTextColor={colors.placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            { color: error ? colors.error : colors.textSecondary },
          ]}
        >
          {error || helperText}
        </Text>
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
  inputContainerFocused: {
    borderWidth: 2,
  },
  inputContainerUnfocused: {
    borderWidth: 1.5,
  },
  input: {
    fontSize: 16,
    paddingVertical: 14,
  },
  inputFlex: {
    flex: 1,
  },
  inputWithLeftIcon: {
    marginLeft: 12,
  },
  inputWithRightIcon: {
    marginRight: 12,
  },
  inputError: {
    // Error styling handled inline
  },
  leftIcon: {
    marginRight: 0,
  },
  rightIcon: {
    marginLeft: 0,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
});

