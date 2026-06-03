import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

export interface Chapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  description?: string;
  includeInRecap: boolean;
}

interface Props {
  chapters: Chapter[];
  onChange: (chapters: Chapter[]) => void;
  totalDuration: number;
  isRTL: boolean;
}

const CHAPTER_COLORS = [
  Colors.primary,
  Colors.secondary,
  Colors.success,
  Colors.warning,
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function parseTime(value: string): number {
  const parts = value.split(':');
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10) || 0;
    const s = parseInt(parts[1], 10) || 0;
    return m * 60 + s;
  }
  return parseInt(value, 10) || 0;
}

function validateChapters(chapters: Chapter[], totalDuration: number): string[] {
  const errors: string[] = [];
  chapters.forEach((ch, i) => {
    if (ch.endTime <= ch.startTime) {
      errors.push(`Chapter ${i + 1}: End time must be after start time`);
    }
    if (ch.endTime > totalDuration && totalDuration > 0) {
      errors.push(`Chapter ${i + 1}: End time exceeds video duration`);
    }
    chapters.forEach((other, j) => {
      if (i !== j && ch.startTime < other.endTime && ch.endTime > other.startTime) {
        if (i < j) errors.push(`Chapters ${i + 1} & ${j + 1}: Time overlap`);
      }
    });
  });
  return [...new Set(errors)];
}

export default function VideoChaptersEditor({ chapters, onChange, totalDuration, isRTL }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const errors = validateChapters(chapters, totalDuration);

  const addChapter = () => {
    const lastEnd = chapters.length > 0 ? chapters[chapters.length - 1].endTime : 0;
    const newChapter: Chapter = {
      id: `ch_${Date.now()}`,
      title: isRTL ? `פרק ${chapters.length + 1}` : `Chapter ${chapters.length + 1}`,
      startTime: lastEnd,
      endTime: Math.min(lastEnd + 60, totalDuration || lastEnd + 60),
      includeInRecap: true,
    };
    const updated = [...chapters, newChapter];
    onChange(updated);
    setExpandedId(newChapter.id);
  };

  const removeChapter = (id: string) => {
    onChange(chapters.filter((c) => c.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const updateChapter = (id: string, patch: Partial<Chapter>) => {
    onChange(chapters.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const moveChapter = (id: string, direction: 'up' | 'down') => {
    const idx = chapters.findIndex((c) => c.id === id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === chapters.length - 1) return;
    const newList = [...chapters];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newList[idx], newList[swapIdx]] = [newList[swapIdx], newList[idx]];
    onChange(newList);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="format-list-numbered" size={20} color={Colors.primary} />
        <Text style={[styles.headerText, isRTL && styles.rtlText]}>
          {isRTL ? 'עורך פרקים' : 'Chapters Editor'}
        </Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{chapters.length}</Text>
        </View>
      </View>

      {/* Timeline Bar */}
      {totalDuration > 0 && chapters.length > 0 && (
        <View style={styles.timelineContainer}>
          <Text style={[styles.timelineLabel, isRTL && styles.rtlText]}>
            {isRTL ? 'ציר זמן' : 'Timeline'}
          </Text>
          <View style={styles.timelineBar}>
            {chapters.map((ch, i) => {
              const left = (ch.startTime / totalDuration) * 100;
              const width = ((ch.endTime - ch.startTime) / totalDuration) * 100;
              const color = CHAPTER_COLORS[i % CHAPTER_COLORS.length];
              return (
                <View
                  key={ch.id}
                  style={[
                    styles.timelineSegment,
                    {
                      left: `${left}%` as any,
                      width: `${Math.max(width, 1)}%` as any,
                      backgroundColor: ch.includeInRecap ? color : Colors.textMuted,
                      opacity: ch.includeInRecap ? 1 : 0.4,
                    },
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.timelineLabelsRow}>
            <Text style={styles.timelineTime}>0:00</Text>
            <Text style={styles.timelineTime}>{formatTime(totalDuration)}</Text>
          </View>
        </View>
      )}

      {/* Validation errors */}
      {errors.length > 0 && (
        <View style={styles.errorBox}>
          {errors.map((err, i) => (
            <View key={i} style={styles.errorRow}>
              <MaterialIcons name="warning" size={14} color={Colors.error} />
              <Text style={styles.errorText}>{err}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Chapter List */}
      {chapters.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="queue" size={40} color={Colors.textMuted} />
          <Text style={[styles.emptyText, isRTL && styles.rtlText]}>
            {isRTL ? 'אין פרקים. הוסף פרק להתחלה.' : 'No chapters yet. Add one to get started.'}
          </Text>
        </View>
      ) : (
        <View style={styles.chapterList}>
          {chapters.map((ch, index) => {
            const color = CHAPTER_COLORS[index % CHAPTER_COLORS.length];
            const isExpanded = expandedId === ch.id;
            return (
              <View key={ch.id} style={[styles.chapterCard, { borderLeftColor: color }]}>
                {/* Chapter Header Row */}
                <Pressable
                  style={styles.chapterHeaderRow}
                  onPress={() => setExpandedId(isExpanded ? null : ch.id)}
                >
                  <View style={[styles.chapterColorDot, { backgroundColor: color }]} />
                  <View style={styles.chapterInfo}>
                    <Text style={[styles.chapterTitle, isRTL && styles.rtlText]} numberOfLines={1}>
                      {ch.title || (isRTL ? `פרק ${index + 1}` : `Chapter ${index + 1}`)}
                    </Text>
                    <Text style={styles.chapterTimes}>
                      {formatTime(ch.startTime)} → {formatTime(ch.endTime)}
                    </Text>
                  </View>

                  {/* Include Toggle */}
                  <Pressable
                    style={[styles.toggleButton, ch.includeInRecap && styles.toggleButtonActive]}
                    onPress={() => updateChapter(ch.id, { includeInRecap: !ch.includeInRecap })}
                  >
                    <MaterialIcons
                      name={ch.includeInRecap ? 'check-circle' : 'radio-button-unchecked'}
                      size={18}
                      color={ch.includeInRecap ? Colors.success : Colors.textMuted}
                    />
                  </Pressable>

                  <MaterialIcons
                    name={isExpanded ? 'expand-less' : 'expand-more'}
                    size={20}
                    color={Colors.textSecondary}
                  />
                </Pressable>

                {/* Expanded Edit Form */}
                {isExpanded && (
                  <View style={styles.chapterForm}>
                    {/* Title */}
                    <View style={styles.formField}>
                      <Text style={[styles.formLabel, isRTL && styles.rtlText]}>
                        {isRTL ? 'כותרת' : 'Title'}
                      </Text>
                      <TextInput
                        style={[styles.formInput, isRTL && styles.rtlInput]}
                        value={ch.title}
                        onChangeText={(v) => updateChapter(ch.id, { title: v })}
                        placeholder={isRTL ? 'שם הפרק...' : 'Chapter name...'}
                        placeholderTextColor={Colors.textMuted}
                        textAlign={isRTL ? 'right' : 'left'}
                      />
                    </View>

                    {/* Times Row */}
                    <View style={styles.timesRow}>
                      <View style={[styles.formField, { flex: 1 }]}>
                        <Text style={[styles.formLabel, isRTL && styles.rtlText]}>
                          {isRTL ? 'התחלה (MM:SS)' : 'Start (MM:SS)'}
                        </Text>
                        <TextInput
                          style={[styles.formInput, styles.timeInputField]}
                          value={formatTime(ch.startTime)}
                          onChangeText={(v) => updateChapter(ch.id, { startTime: parseTime(v) })}
                          placeholder="00:00"
                          placeholderTextColor={Colors.textMuted}
                          keyboardType="numeric"
                          textAlign="center"
                        />
                      </View>
                      <MaterialIcons name="arrow-forward" size={20} color={Colors.textMuted} style={styles.arrowIcon} />
                      <View style={[styles.formField, { flex: 1 }]}>
                        <Text style={[styles.formLabel, isRTL && styles.rtlText]}>
                          {isRTL ? 'סיום (MM:SS)' : 'End (MM:SS)'}
                        </Text>
                        <TextInput
                          style={[styles.formInput, styles.timeInputField]}
                          value={formatTime(ch.endTime)}
                          onChangeText={(v) => updateChapter(ch.id, { endTime: parseTime(v) })}
                          placeholder="00:00"
                          placeholderTextColor={Colors.textMuted}
                          keyboardType="numeric"
                          textAlign="center"
                        />
                      </View>
                    </View>

                    {/* Description */}
                    <View style={styles.formField}>
                      <Text style={[styles.formLabel, isRTL && styles.rtlText]}>
                        {isRTL ? 'תיאור (אופציונלי)' : 'Description (optional)'}
                      </Text>
                      <TextInput
                        style={[styles.formInput, styles.descInput, isRTL && styles.rtlInput]}
                        value={ch.description || ''}
                        onChangeText={(v) => updateChapter(ch.id, { description: v })}
                        placeholder={isRTL ? 'תאר את הפרק...' : 'Describe this chapter...'}
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        numberOfLines={2}
                        textAlign={isRTL ? 'right' : 'left'}
                        textAlignVertical="top"
                      />
                    </View>

                    {/* Include in Recap Toggle */}
                    <View style={styles.includeRow}>
                      <Text style={[styles.formLabel, { marginBottom: 0 }, isRTL && styles.rtlText]}>
                        {isRTL ? 'כלול בסיכום' : 'Include in Recap'}
                      </Text>
                      <Pressable
                        style={[styles.includeToggle, ch.includeInRecap && styles.includeToggleActive]}
                        onPress={() => updateChapter(ch.id, { includeInRecap: !ch.includeInRecap })}
                      >
                        <View style={[styles.toggleThumb, ch.includeInRecap && styles.toggleThumbActive]} />
                      </Pressable>
                    </View>

                    {/* Reorder + Delete Actions */}
                    <View style={styles.chapterActions}>
                      <Pressable
                        style={styles.actionBtn}
                        onPress={() => moveChapter(ch.id, 'up')}
                        disabled={index === 0}
                      >
                        <MaterialIcons
                          name="keyboard-arrow-up"
                          size={20}
                          color={index === 0 ? Colors.textMuted : Colors.primary}
                        />
                      </Pressable>
                      <Pressable
                        style={styles.actionBtn}
                        onPress={() => moveChapter(ch.id, 'down')}
                        disabled={index === chapters.length - 1}
                      >
                        <MaterialIcons
                          name="keyboard-arrow-down"
                          size={20}
                          color={index === chapters.length - 1 ? Colors.textMuted : Colors.primary}
                        />
                      </Pressable>
                      <Pressable
                        style={[styles.actionBtn, styles.deleteBtn]}
                        onPress={() => removeChapter(ch.id)}
                      >
                        <MaterialIcons name="delete-outline" size={20} color={Colors.error} />
                        <Text style={styles.deleteBtnText}>
                          {isRTL ? 'מחק' : 'Delete'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Add Chapter Button */}
      <Pressable
        style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.8 }]}
        onPress={addChapter}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.addButtonGradient}
        >
          <MaterialIcons name="add" size={20} color="#FFF" />
          <Text style={styles.addButtonText}>
            {isRTL ? 'הוסף פרק' : 'Add Chapter'}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerText: {
    flex: 1,
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  rtlText: {
    textAlign: 'right',
  },
  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  countText: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: '#000',
  },
  timelineContainer: {
    gap: Spacing.xs,
  },
  timelineLabel: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
  timelineBar: {
    height: 20,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  timelineSegment: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    borderRadius: 2,
  },
  timelineLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineTime: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.caption,
    color: Colors.error,
  },
  emptyState: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  chapterList: {
    gap: Spacing.sm,
  },
  chapterCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chapterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  chapterColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chapterInfo: {
    flex: 1,
    gap: 2,
  },
  chapterTitle: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  chapterTimes: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
  },
  toggleButton: {
    padding: Spacing.xs,
  },
  toggleButtonActive: {},
  chapterForm: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  formField: {
    gap: Spacing.xs,
  },
  formLabel: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
    marginBottom: 2,
  },
  formInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    fontSize: Typography.body,
    color: Colors.text,
  },
  rtlInput: {
    textAlign: 'right',
  },
  timeInputField: {
    textAlign: 'center',
    fontVariant: ['tabular-nums'] as any,
    fontWeight: Typography.semibold,
    letterSpacing: 1,
  },
  timesRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  arrowIcon: {
    marginBottom: Spacing.sm,
  },
  descInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  includeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  includeToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  includeToggleActive: {
    backgroundColor: 'rgba(0, 255, 127, 0.2)',
    borderColor: Colors.success,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.textMuted,
  },
  toggleThumbActive: {
    backgroundColor: Colors.success,
    alignSelf: 'flex-end',
  },
  chapterActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
  },
  deleteBtn: {
    marginLeft: 'auto',
    borderWidth: 1,
    borderColor: 'rgba(255, 51, 102, 0.3)',
  },
  deleteBtnText: {
    fontSize: Typography.caption,
    color: Colors.error,
    fontWeight: Typography.medium,
  },
  addButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  addButtonText: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: '#FFF',
  },
});
