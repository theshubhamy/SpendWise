/**
 * Tag Selector Component - Multi-select tags
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TagChip } from './TagChip';
import { useTagStore } from '@/store/tagStore';
import { Tag } from '@/types';
import { useThemeContext } from '@/context/ThemeContext';

interface TagSelectorProps {
  selectedTagIds: string[];
  onSelectionChange: (tagIds: string[]) => void;
  label?: string;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTagIds,
  onSelectionChange,
  label,
}) => {
  const { colors } = useThemeContext();
  const { tags, fetchTags } = useTagStore();
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    // Update selected tags when tagIds change
    const selected = tags.filter((tag) => selectedTagIds.includes(tag.id));
    setSelectedTags(selected);
  }, [selectedTagIds, tags]);

  const toggleTag = (tag: Tag) => {
    const isSelected = selectedTagIds.includes(tag.id);
    if (isSelected) {
      onSelectionChange(selectedTagIds.filter((id) => id !== tag.id));
    } else {
      onSelectionChange([...selectedTagIds, tag.id]);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}

      {selectedTags.length > 0 && (
        <View style={[styles.selectedContainer, { backgroundColor: colors.borderLight }]}>
          <Text style={[styles.selectedLabel, { color: colors.textSecondary }]}>Selected:</Text>
          <View style={styles.selectedTags}>
            {selectedTags.map((tag) => (
              <TagChip
                key={tag.id}
                tag={tag}
                size="small"
                onPress={() => toggleTag(tag)}
              />
            ))}
          </View>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.tagsContainer}
      >
        {tags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);
          return (
            <TouchableOpacity
              key={tag.id}
              onPress={() => toggleTag(tag)}
              activeOpacity={0.7}
            >
              <TagChip
                tag={tag}
                size="medium"
                onPress={() => toggleTag(tag)}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectedContainer: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
  },
  selectedLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  scrollView: {
    maxHeight: 60,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

