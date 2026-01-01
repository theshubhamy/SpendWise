/**
 * Screen Header Component - Standardized header for screens
 */

import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';
import Icon from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  rightComponent?: ReactNode;
  onBackPress?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  rightComponent,
  onBackPress,
  style,
  titleStyle,
}) => {
  const { colors } = useThemeContext();
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.header, { backgroundColor: colors.surface }, style]}>
      <View style={styles.leftSection}>
        {showBackButton && (
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text
            style={[styles.title, { color: colors.text }, titleStyle]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.subtitle, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightComponent && (
        <View style={styles.rightSection}>{rightComponent}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  rightSection: {
    marginLeft: 16,
  },
});

