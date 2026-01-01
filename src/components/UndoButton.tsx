/**
 * Undo Button Component - Shows undo option with snackbar-style notification
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useExpenseStore } from '@/store';
import { useThemeContext } from '@/context/ThemeContext';

export const UndoButton: React.FC = () => {
  const { colors } = useThemeContext();
  const { undoLastAction } = useExpenseStore();
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        hideUndo();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  const showUndo = () => {
    setVisible(true);
  };

  const hideUndo = () => {
    setVisible(false);
  };

  const handleUndo = async () => {
    const success = await undoLastAction();
    if (success) {
      hideUndo();
    }
  };

  // Expose showUndo method (would need context or event system in real app)
  // For now, we'll use a simple approach

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          backgroundColor: colors.surface,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <Text style={[styles.message, { color: colors.text }]}>Action completed</Text>
      <TouchableOpacity onPress={handleUndo} style={styles.undoButton}>
        <Text style={[styles.undoText, { color: colors.primary }]}>UNDO</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  message: {
    fontSize: 14,
  },
  undoButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  undoText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

