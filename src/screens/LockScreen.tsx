/**
 * Lock Screen - Biometric authentication screen
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authenticate, getBiometricType, isBiometricAvailable } from '@/services/biometric.service';
import { useThemeContext } from '@/context/ThemeContext';

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

  const getBiometricIcon = (): string => {
    switch (biometricType) {
      case 'FaceID':
        return '👤';
      case 'TouchID':
        return '👆';
      case 'Biometrics':
        return '🔐';
      default:
        return '🔒';
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
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={styles.icon}>{getBiometricIcon()}</Text>
        <Text style={[styles.title, { color: colors.text }]}>SpendWise is Locked</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Use {getBiometricName()} to unlock
        </Text>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.unlockButton, { backgroundColor: colors.primary }]}
          onPress={handleAuthenticate}
          disabled={isAuthenticating}
          activeOpacity={0.7}
        >
          {isAuthenticating ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={[styles.unlockButtonText, { color: '#ffffff' }]}>
              Unlock with {getBiometricName()}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.footer, { color: colors.textTertiary }]}>
          Your data is encrypted and secure
        </Text>
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
    padding: 32,
    width: '100%',
  },
  icon: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    maxWidth: 300,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  unlockButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  unlockButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});

