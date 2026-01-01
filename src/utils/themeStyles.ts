/**
 * Theme style helpers - Create themed styles easily
 */

import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ThemeColors } from '@/theme';

/**
 * Create a themed style sheet
 */
export const createThemedStyleSheet = <T extends Record<string, ViewStyle | TextStyle>>(
  styles: (colors: ThemeColors) => T,
) => {
  return (colors: ThemeColors) => StyleSheet.create(styles(colors));
};

