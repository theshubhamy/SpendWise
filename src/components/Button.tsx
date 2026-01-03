/**
 * Button Component - Modern redesigned button with enhanced variants
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
  leftIcon,
  rightIcon,
}) => {
  const { colors } = useThemeContext();
  const isDisabled = disabled || loading;

  const sizeStyles = {
    small: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      minHeight: 36,
      fontSize: 14,
    },
    medium: {
      paddingVertical: 14,
      paddingHorizontal: 24,
      minHeight: 48,
      fontSize: 16,
    },
    large: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      minHeight: 56,
      fontSize: 18,
    },
  };

  const currentSize = sizeStyles[size];

  const variantStyles = {
    primary: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    secondary: {
      backgroundColor: colors.secondary,
      shadowColor: colors.secondary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: colors.error,
      shadowColor: colors.error,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
  };

  const textStyles = {
    primaryText: {
      color: '#ffffff',
    },
    secondaryText: {
      color: '#ffffff',
    },
    outlineText: {
      color: colors.primary,
    },
    ghostText: {
      color: colors.primary,
    },
    dangerText: {
      color: '#ffffff',
    },
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        currentSize,
        variantStyles[variant],
        isDisabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#ffffff'}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text
            style={[
              styles.text,
              { fontSize: currentSize.fontSize },
              textStyles[`${variant}Text`],
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});

