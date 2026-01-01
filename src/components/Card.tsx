/**
 * Card Component - Themed card container
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
  padding = 16,
}) => {
  const { colors } = useThemeContext();

  const variantStyles = {
    default: {
      backgroundColor: colors.card,
      borderWidth: 0,
    },
    elevated: {
      backgroundColor: colors.card,
      borderWidth: 0,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    outlined: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
  };

  const cardStyle = [
    styles.card,
    variantStyles[variant],
    { padding },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginVertical: 8,
  },
});

