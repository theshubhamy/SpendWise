/**
 * Authentication Screen - Google Sign-In with Firebase
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '@/context/ThemeContext';
import { authService } from '@/services/auth.service';
import { Button } from '@/components';
import Icon from '@react-native-vector-icons/ionicons';

export const AuthScreen: React.FC = () => {
  const { colors } = useThemeContext();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await authService.signInWithGoogle();
      // Navigation will be handled by App.tsx
    } catch (error) {
      Alert.alert(
        'Login Failed',
        error instanceof Error
          ? error.message
          : 'Failed to sign in with Google',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Logo/Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.logoContainer,
              { backgroundColor: colors.primary + '15' },
            ]}
          >
            <Icon name="wallet" size={64} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>SpendWise</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Track expenses, split bills, and manage your finances
          </Text>
        </View>

        {/* Login Card */}
        <Button
          title="Continue with Google"
          onPress={handleGoogleLogin}
          loading={loading}
          disabled={loading}
          style={styles.googleButton}
          leftIcon={<Icon name="logo-google" size={20} color="#ffffff" />}
        />

        <Text style={[styles.infoText, { color: colors.textTertiary }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  loginCard: {
    padding: 24,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  googleButton: {
    marginBottom: 16,
    width: '80%',
    alignSelf: 'center',
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
});
