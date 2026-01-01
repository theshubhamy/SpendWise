/**
 * Tag Chip Component - Display tag with color
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Tag } from '@/types';
import { useThemeContext } from '@/context/ThemeContext';

interface TagChipProps {
  tag: Tag;
  onPress?: () => void;
  onRemove?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const TagChip: React.FC<TagChipProps> = ({
  tag,
  onPress,
  onRemove,
  size = 'medium',
}) => {
  const { colors } = useThemeContext();
  const sizeStyles = {
    small: { padding: 4, fontSize: 10, height: 20 },
    medium: { padding: 6, fontSize: 12, height: 28 },
    large: { padding: 8, fontSize: 14, height: 32 },
  };

  const style = sizeStyles[size];

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: tag.color + '20', borderColor: tag.color },
        { paddingHorizontal: style.padding, height: style.height },
        onPress && styles.pressable,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.colorDot, { backgroundColor: tag.color }]} />
      <Text style={[styles.text, { fontSize: style.fontSize, color: tag.color }]}>
        {tag.name}
      </Text>
      {onRemove && (
        <TouchableOpacity
          onPress={onRemove}
          style={styles.removeButton}
          hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
        >
          <Text style={[styles.removeText, { fontSize: style.fontSize, color: colors.textSecondary }]}>×</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  pressable: {
    // Additional styles for pressable tags
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  text: {
    fontWeight: '500',
  },
  removeButton: {
    marginLeft: 4,
    paddingHorizontal: 2,
  },
  removeText: {
    fontWeight: 'bold',
  },
});

