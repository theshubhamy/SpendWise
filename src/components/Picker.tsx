/**
 * Picker Component - Modern redesigned picker
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Picker as RNPicker } from '@react-native-picker/picker';
import { useThemeContext } from '@/context/ThemeContext';
import Icon from '@react-native-vector-icons/ionicons';

interface PickerProps {
  label?: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  items: Array<{ label: string; value: string }>;
  error?: string;
  placeholder?: string;
}

export const Picker: React.FC<PickerProps> = ({
  label,
  selectedValue,
  onValueChange,
  items,
  error,
  placeholder = 'Select an option',
}) => {
  const { colors } = useThemeContext();
  const [isFocused, setIsFocused] = useState(false);
  const [showIOSPicker, setShowIOSPicker] = useState(false);
  const [tempValue, setTempValue] = useState(selectedValue);
  const selectedItem = items.find(item => item.value === selectedValue);

  // Sync tempValue with selectedValue when it changes externally
  useEffect(() => {
    setTempValue(selectedValue);
  }, [selectedValue]);

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.inputBorder;

  const handleIOSValueChange = (value: string) => {
    setTempValue(value);
  };

  const handleIOSConfirm = () => {
    onValueChange(tempValue);
    setShowIOSPicker(false);
    setIsFocused(false);
  };

  const handleIOSCancel = () => {
    setTempValue(selectedValue);
    setShowIOSPicker(false);
    setIsFocused(false);
  };

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        {label && (
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        )}
        <TouchableOpacity
          onPress={() => {
            setTempValue(selectedValue);
            setShowIOSPicker(true);
            setIsFocused(true);
          }}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.pickerContainer,
              isFocused ? styles.pickerContainerFocused : styles.pickerContainerUnfocused,
              {
                backgroundColor: colors.inputBackground,
                borderColor,
              },
              error && styles.pickerError,
            ]}
          >
            <View style={styles.pickerContent}>
              <Text
                style={[
                  styles.pickerText,
                  {
                    color: selectedItem ? colors.text : colors.placeholder,
                  },
                ]}
              >
                {selectedItem ? selectedItem.label : placeholder}
              </Text>
              <Icon
                name="chevron-down"
                size={20}
                color={colors.textSecondary}
              />
            </View>
          </View>
        </TouchableOpacity>
        {error && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        )}

        <Modal
          visible={showIOSPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={handleIOSCancel}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalContent, { backgroundColor: colors.surface }]}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleIOSCancel}>
                  <Text style={[styles.modalButton, { color: colors.primary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {label || 'Select'}
                </Text>
                <TouchableOpacity onPress={handleIOSConfirm}>
                  <Text style={[styles.modalButton, { color: colors.primary }]}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
              <RNPicker
                selectedValue={tempValue}
                onValueChange={handleIOSValueChange}
                style={[styles.iosPicker, { color: colors.text }]}
              >
                {items.map(item => (
                  <RNPicker.Item
                    key={item.value}
                    label={item.label}
                    value={item.value}
                    color={colors.text}
                  />
                ))}
              </RNPicker>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Android implementation
  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      <View
        style={[
          styles.pickerContainer,
          {
            backgroundColor: colors.inputBackground,
            borderColor,
          },
          error && styles.pickerError,
        ]}
      >
        <RNPicker
          selectedValue={selectedValue}
          onValueChange={value => {
            if (value !== null && value !== undefined) {
              onValueChange(value);
            }
          }}
          style={[styles.picker, { color: colors.text }]}
          dropdownIconColor={colors.textSecondary}
          mode="dropdown"
        >
          {items.map(item => (
            <RNPicker.Item
              key={item.value}
              label={item.label}
              value={item.value}
              color={colors.text}
            />
          ))}
        </RNPicker>
      </View>
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  pickerContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 52,
  },
  pickerContainerFocused: {
    borderWidth: 2,
  },
  pickerContainerUnfocused: {
    borderWidth: 1.5,
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  pickerText: {
    fontSize: 16,
    flex: 1,
  },
  picker: {
    height: 52,
    width: '100%',
  },
  pickerError: {
    // Error styling handled inline
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  iosPicker: {
    height: 200,
  },
});
