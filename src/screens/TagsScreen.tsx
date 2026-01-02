/**
 * Tags Screen - Manage tags
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useTagStore } from '@/store/tagStore';
import { TagChip, ScreenHeader, Card, Input, Button } from '@/components';
import { TAG_COLORS } from '@/constants';
import { Tag } from '@/types';
import { useThemeContext } from '@/context/ThemeContext';
import Icon from '@react-native-vector-icons/ionicons';

export const TagsScreen: React.FC = () => {
  const { colors } = useThemeContext();
  const { tags, isLoading, fetchTags, createTag, deleteTag } = useTagStore();
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(TAG_COLORS[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      Alert.alert('Error', 'Please enter a tag name');
      return;
    }

    try {
      await createTag(newTagName.trim(), selectedColor);
      setNewTagName('');
      setSelectedColor(TAG_COLORS[0]);
    } catch {
      Alert.alert('Error', 'Failed to create tag. It may already exist.');
    }
  };

  const handleDeleteTag = (tag: Tag) => {
    Alert.alert(
      'Delete Tag',
      `Are you sure you want to delete "${tag.name}"? This will remove it from all expenses.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTag(tag.id);
            } catch {
              Alert.alert('Error', 'Failed to delete tag');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Tags"
        subtitle="Organize expenses with tags"
        showBackButton={true}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="elevated" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Create New Tag
        </Text>
        <View style={styles.createTagContainer}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.text,
              },
            ]}
            value={newTagName}
            onChangeText={setNewTagName}
            placeholder="Tag name"
            placeholderTextColor={colors.placeholder}
          />
          <TouchableOpacity
            style={[
              styles.colorButton,
              { backgroundColor: selectedColor, borderColor: colors.border },
            ]}
            onPress={() => setShowColorPicker(!showColorPicker)}
          />
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={handleCreateTag}
          >
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </View>

        </Card>

        <Card variant="elevated" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          All Tags ({tags.length})
        </Text>
        {isLoading ? (
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading tags...
          </Text>
        ) : tags.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            No tags yet. Create your first tag!
          </Text>
        ) : (
          <View style={styles.tagsContainer}>
            {tags.map(tag => (
              <View
                key={tag.id}
                style={[
                  styles.tagRow,
                  { borderBottomColor: colors.borderLight },
                ]}
              >
                <TagChip tag={tag} size="large" />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteTag(tag)}
                >
                  <Text
                    style={[styles.deleteButtonText, { color: colors.error }]}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
  },
  createButton: {
    marginTop: 8,
  },
  colorPicker: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
  },
  colorPickerTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderWidth: 3,
  },
  tagsContainer: {
    marginTop: 8,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 14,
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
  },
});
