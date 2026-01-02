/**
 * Lock Screen - Modern redesigned biometric authentication screen
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  authenticate,
  getBiometricType,
  isBiometricAvailable,
} from '@/services/biometric.service';
import { useThemeContext } from '@/context/ThemeContext';
import Icon from '@react-native-vector-icons/ionicons';
import { Card, Button } from '@/components';

interface LockScreenProps {
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const { colors } = useThemeContext();
  const insets = useSafeAreaInsets();
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBiometricType = async () => {
      const type = await getBiometricType();
      setBiometricType(type);
    };
    loadBiometricType();
  }, []);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setError(null);

    try {
      const available = await isBiometricAvailable();
      if (!available) {
        setError('Biometric authentication not available');
        setIsAuthenticating(false);
        return;
      }

      const success = await authenticate('Unlock SpendWise');
      if (success) {
        onUnlock();
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      setError('Authentication error. Please try again.');
      console.error('Authentication error:', err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const getBiometricIcon = (): 'person' | 'finger-print' | 'lock-closed' => {
    switch (biometricType) {
      case 'FaceID':
        return 'person';
      case 'TouchID':
        return 'finger-print';
      case 'Biometrics':
        return 'lock-closed';
      default:
        return 'lock-closed';
    }
  };

  const getBiometricName = (): string => {
    switch (biometricType) {
      case 'FaceID':
        return 'Face ID';
      case 'TouchID':
        return 'Touch ID';
      case 'Biometrics':
        return 'Biometric';
      default:
        return 'Biometric';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        <Card variant="elevated" style={styles.iconContainer}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.primary + '15' },
            ]}
          >
            <Icon name={getBiometricIcon()} size={64} color={colors.primary} />
          </View>
        </Card>

        <Text style={[styles.title, { color: colors.text }]}>
          SpendWise is Locked
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Use {getBiometricName()} to unlock your app
        </Text>

        {error && (
          <Card variant="outlined" style={styles.errorContainer}>
            <Icon name="alert-circle" size={20} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
          </Card>
        )}

        <Button
          title={
            isAuthenticating
              ? 'Authenticating...'
              : `Unlock with ${getBiometricName()}`
          }
          onPress={handleAuthenticate}
          loading={isAuthenticating}
          disabled={isAuthenticating}
          style={styles.unlockButton}
          size="large"
          leftIcon={
            !isAuthenticating ? (
              <Icon name={getBiometricIcon()} size={24} color="#ffffff" />
            ) : undefined
          }
        />

        <View style={styles.footer}>
          <Icon name="shield-checkmark" size={16} color={colors.textTertiary} />
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            Your data is encrypted and secure
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  iconContainer: {
    marginBottom: 32,
    padding: 0,
    overflow: 'visible',
    borderRadius: 10,
  },
  iconCircle: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 24,
    width: '100%',
    maxWidth: 340,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  unlockButton: {
    width: '100%',
    maxWidth: 340,
    marginBottom: 32,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
