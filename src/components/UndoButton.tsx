/**
 * Undo Button Component - Modern redesigned snackbar-style notification
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useExpenseStore } from '@/store';
import { useThemeContext } from '@/context/ThemeContext';
import Icon from '@react-native-vector-icons/ionicons';

interface UndoButtonProps {
  message?: string;
  onUndo?: () => Promise<boolean>;
  autoHideDuration?: number;
}

export const UndoButton: React.FC<UndoButtonProps> = ({
  message = 'Action completed',
  onUndo,
  autoHideDuration = 5000,
}) => {
  const { colors } = useThemeContext();
  const { undoLastAction } = useExpenseStore();
  const [visible, setVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(100));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after duration
      const timer = setTimeout(() => {
        hideUndo();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim, autoHideDuration]);


  const hideUndo = () => {
    setVisible(false);
  };

  const handleUndo = async () => {
    const success = onUndo ? await onUndo() : await undoLastAction();
    if (success) {
      hideUndo();
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          backgroundColor: colors.surface,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <View style={styles.content}>
        <Icon name="checkmark-circle" size={20} color={colors.success} />
        <Text style={[styles.message, { color: colors.text }]}>
          {message}
        </Text>
      </View>
      <TouchableOpacity
        onPress={handleUndo}
        style={styles.undoButton}
        activeOpacity={0.7}
      >
        <Text style={[styles.undoText, { color: colors.primary }]}>UNDO</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  undoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 12,
  },
  undoText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

