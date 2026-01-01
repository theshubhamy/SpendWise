/**
 * Screen Template - Base template for app screens
 * Provides consistent layout, header, and styling
 */

import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ViewStyle,
} from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenTemplateProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  scrollable?: boolean;
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
  showStatusBar?: boolean;
  statusBarStyle?: 'light-content' | 'dark-content';
  backgroundColor?: string;
}

export const ScreenTemplate: React.FC<ScreenTemplateProps> = ({
  children,
  header,
  footer,
  scrollable = true,
  contentContainerStyle,
  style,
  showStatusBar = true,
  statusBarStyle,
  backgroundColor,
}) => {
  const { colors, isDark } = useThemeContext();
  const insets = useSafeAreaInsets();

  const bgColor = backgroundColor || colors.background;
  const statusBar = statusBarStyle || (isDark ? 'light-content' : 'dark-content');

  const content = scrollable ? (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: bgColor }]}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: insets.bottom },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, { backgroundColor: bgColor }, style]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bgColor }]}
      edges={['top', 'left', 'right']}
    >
      {showStatusBar && (
        <StatusBar
          barStyle={statusBar}
          backgroundColor={bgColor}
          translucent={false}
        />
      )}
      {header && (
        <View
          style={[
            styles.header,
            { backgroundColor: colors.surface, borderBottomColor: colors.border },
          ]}
        >
          {header}
        </View>
      )}
      {content}
      {footer && (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          {footer}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});

