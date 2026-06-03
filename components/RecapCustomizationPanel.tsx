/**
 * RAG Customization Panel — lets users control what Gemini focuses on
 * Integrated into the Create Recap wizard (Step 2 / Advanced Settings)
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  RAGCustomization,
  GENRE_THEME_PRESETS,
  DEFAULT_CUSTOMIZATION,
  getGenrePreset,
  TONE_DESCRIPTIONS,
  DETAIL_LEVEL_DESCRIPTIONS,
} from '@/services/rag-customization';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

interface Props {
  genre: string;
  customization: RAGCustomization;
  onChange: (updated: RAGCustomization) => void;
  isRTL?: boolean;
}

// ─── Chip component ────────────────────────────────────────────────────────────

function Chip({
  label,
  active,
  onPress,
  color = Colors.primary,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        chipStyles.chip,
        active && { backgroundColor: `${color}20`, borderColor: color },
        pressed && { opacity: 0.75 },
      ]}
      onPress={onPress}
    >
      <Text style={[chipStyles.label, active && { color, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
  },
});

// ─── Tag Input component ───────────────────────────────────────────────────────

function TagInput({
  label,
  placeholder,
  tags,
  onAdd,
  onRemove,
  color = Colors.primary,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  color?: string;
}) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAdd(trimmed);
    }
    setInput('');
  };

  return (
    <View style={tagStyles.container}>
      <Text style={tagStyles.label}>{label}</Text>
      <View style={tagStyles.inputRow}>
        <TextInput
          style={tagStyles.input}
          value={input}
          onChangeText={setInput}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable
          style={({ pressed }) => [tagStyles.addBtn, pressed && { opacity: 0.75 }]}
          onPress={handleAdd}
        >
          <MaterialIcons name="add" size={20} color="#FFF" />
        </Pressable>
      </View>
      {tags.length > 0 && (
        <View style={tagStyles.tagsRow}>
          {tags.map((tag, i) => (
            <Pressable
              key={`${tag}-${i}`}
              style={[tagStyles.tag, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}
              onPress={() => onRemove(i)}
            >
              <Text style={[tagStyles.tagText, { color }]}>{tag}</Text>
              <MaterialIcons name="close" size={12} color={color} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const tagStyles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: {
    fontSize: Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.bodySmall,
    color: Colors.text,
  },
  addBtn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  tagText: {
    fontSize: Typography.caption,
    fontWeight: '500',
  },
});

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: keyof typeof MaterialIcons.glyphMap; title: string }) {
  return (
    <View style={sectionStyles.header}>
      <MaterialIcons name={icon} size={16} color={Colors.primary} />
      <Text style={sectionStyles.title}>{title}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.bodySmall,
    fontWeight: '700',
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function RecapCustomizationPanel({ genre, customization, onChange, isRTL = false }: Props) {
  const preset = GENRE_THEME_PRESETS[genre] || GENRE_THEME_PRESETS['general'];

  const update = useCallback(
    (partial: Partial<RAGCustomization>) => onChange({ ...customization, ...partial }),
    [customization, onChange]
  );

  const addKeyword = (kw: string) => update({ keywords: [...customization.keywords, kw] });
  const removeKeyword = (i: number) => update({ keywords: customization.keywords.filter((_, idx) => idx !== i) });

  const addTheme = (th: string) => update({ themes: [...customization.themes, th] });
  const removeTheme = (i: number) => update({ themes: customization.themes.filter((_, idx) => idx !== i) });

  const addExclude = (ex: string) => update({ excludeTopics: [...customization.excludeTopics, ex] });
  const removeExclude = (i: number) => update({ excludeTopics: customization.excludeTopics.filter((_, idx) => idx !== i) });

  const topics = customization.topicsToExplore ?? [];
  const addTopic = (t: string) => update({ topicsToExplore: [...topics, t] });
  const removeTopic = (i: number) => update({ topicsToExplore: topics.filter((_, idx) => idx !== i) });

  const applyPreset = () => {
    const p = getGenrePreset(genre);
    onChange(p);
  };

  const tones = ['dramatic', 'neutral', 'humorous', 'suspenseful', 'informative', 'emotional'] as const;
  const toneLabels: Record<string, string> = {
    dramatic: '🎭 Dramatic',
    neutral: '⚖️ Neutral',
    humorous: '😄 Humorous',
    suspenseful: '😰 Suspenseful',
    informative: '📚 Informative',
    emotional: '💙 Emotional',
  };

  const activeTones = customization.tonePreferences ?? (customization.tonePreference ? [customization.tonePreference] : ['dramatic']);

  const toggleTone = (tone: typeof tones[number]) => {
    const current = activeTones as string[];
    const next = current.includes(tone)
      ? current.filter((t) => t !== tone)
      : [...current, tone];
    // Always keep at least one tone selected
    update({ tonePreferences: (next.length > 0 ? next : [tone]) as typeof activeTones });
  };

  const details: RAGCustomization['detailLevel'][] = ['brief', 'standard', 'detailed', 'comprehensive'];
  const detailLabels: Record<string, string> = {
    brief: '⚡ Brief',
    standard: '📋 Standard',
    detailed: '🔍 Detailed',
    comprehensive: '📖 Comprehensive',
  };

  const pacing: RAGCustomization['pacingStyle'][] = ['fast', 'medium', 'slow'];
  const pacingLabels: Record<string, string> = {
    fast: '⚡ Fast',
    medium: '🎯 Medium',
    slow: '🐢 Slow',
  };

  const languages: RAGCustomization['outputLanguage'][] = ['english', 'hebrew', 'spanish', 'french', 'german', 'arabic'];
  const langLabels: Record<string, string> = {
    english: '🇺🇸 English',
    hebrew: '🇮🇱 Hebrew',
    spanish: '🇪🇸 Spanish',
    french: '🇫🇷 French',
    german: '🇩🇪 German',
    arabic: '🇸🇦 Arabic',
  };

  const audiences = ['general', 'fans', 'newcomers', 'critics'] as const;
  const audienceLabels: Record<string, string> = {
    general: '👥 General',
    fans: '⭐ Fans',
    newcomers: '🆕 Newcomers',
    critics: '🎓 Critics',
  };

  const activeAudiences = customization.targetAudiences ?? (customization.targetAudience ? [customization.targetAudience] : ['general']);

  const toggleAudience = (audience: typeof audiences[number]) => {
    const current = activeAudiences as string[];
    const next = current.includes(audience)
      ? current.filter((a) => a !== audience)
      : [...current, audience];
    update({ targetAudiences: (next.length > 0 ? next : [audience]) as typeof activeAudiences });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={['rgba(0,212,255,0.1)', 'rgba(178,75,243,0.05)']}
        style={styles.headerBanner}
      >
        <View style={styles.headerRow}>
          <MaterialIcons name="auto-awesome" size={20} color={Colors.primary} />
          <Text style={styles.headerTitle}>
            {isRTL ? 'התאמה אישית עם AI' : 'AI RAG Customization'}
          </Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {isRTL
            ? 'שלט על מה ש-Gemini מתמקד בו בסיכום שלך'
            : "Control what Gemini focuses on in your recap"}
        </Text>
        <Pressable style={({ pressed }) => [styles.presetBtn, pressed && { opacity: 0.8 }]} onPress={applyPreset}>
          <MaterialIcons name="auto-fix-high" size={14} color={Colors.primary} />
          <Text style={styles.presetText}>
            {isRTL ? `טען פריסט לז'אנר: ${genre}` : `Load ${genre} genre preset`}
          </Text>
        </Pressable>
      </LinearGradient>

      {/* Tone — multi-select */}
      <View style={styles.sectionTitleRow}>
        <SectionHeader icon="record-voice-over" title={isRTL ? 'סגנון נרטיב' : 'Narration Tone'} />
        {activeTones.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{activeTones.length}</Text>
          </View>
        )}
      </View>
      <Text style={styles.multiHint}>
        {isRTL ? 'בחר טון אחד או יותר' : 'Select one or more tones'}
      </Text>
      <View style={styles.chipsWrap}>
        {tones.map((tone) => (
          <Chip
            key={tone}
            label={toneLabels[tone]}
            active={(activeTones as string[]).includes(tone)}
            color={Colors.primary}
            onPress={() => toggleTone(tone)}
          />
        ))}
      </View>
      {activeTones.length > 0 && (
        <Text style={styles.hintText}>
          {(activeTones as string[]).map((t) => TONE_DESCRIPTIONS[t as keyof typeof TONE_DESCRIPTIONS]).join(' · ')}
        </Text>
      )}

      {/* Detail Level */}
      <SectionHeader icon="layers" title={isRTL ? 'רמת פירוט' : 'Detail Level'} />
      <View style={styles.chipsWrap}>
        {details.map((d) => (
          <Chip
            key={d}
            label={detailLabels[d]}
            active={customization.detailLevel === d}
            color={Colors.secondary}
            onPress={() => update({ detailLevel: d })}
          />
        ))}
      </View>
      {customization.detailLevel && (
        <Text style={styles.hintText}>{DETAIL_LEVEL_DESCRIPTIONS[customization.detailLevel]}</Text>
      )}

      {/* Pacing */}
      <SectionHeader icon="speed" title={isRTL ? 'קצב' : 'Pacing Style'} />
      <View style={styles.chipsWrap}>
        {pacing.map((p) => (
          <Chip
            key={p}
            label={pacingLabels[p]}
            active={customization.pacingStyle === p}
            color={Colors.warning}
            onPress={() => update({ pacingStyle: p })}
          />
        ))}
      </View>

      {/* Target Audience — multi-select */}
      <View style={styles.sectionTitleRow}>
        <SectionHeader icon="people" title={isRTL ? 'קהל יעד' : 'Target Audience'} />
        {activeAudiences.length > 0 && (
          <View style={[styles.countBadge, { backgroundColor: `${Colors.success}20`, borderColor: `${Colors.success}50` }]}>
            <Text style={[styles.countBadgeText, { color: Colors.success }]}>{activeAudiences.length}</Text>
          </View>
        )}
      </View>
      <Text style={styles.multiHint}>
        {isRTL ? 'בחר קהל אחד או יותר' : 'Select one or more audiences'}
      </Text>
      <View style={styles.chipsWrap}>
        {audiences.map((a) => (
          <Chip
            key={a}
            label={audienceLabels[a]}
            active={(activeAudiences as string[]).includes(a)}
            color={Colors.success}
            onPress={() => toggleAudience(a)}
          />
        ))}
      </View>

      {/* Output Language */}
      <SectionHeader icon="language" title={isRTL ? 'שפת הסיכום' : 'Recap Language'} />
      <View style={styles.chipsWrap}>
        {languages.map((lang) => (
          <Chip
            key={lang}
            label={langLabels[lang]}
            active={customization.outputLanguage === lang}
            color={Colors.primary}
            onPress={() => update({ outputLanguage: lang })}
          />
        ))}
      </View>

      {/* Keywords */}
      <SectionHeader icon="label" title={isRTL ? 'מילות מפתח לדגש' : 'Focus Keywords'} />
      {/* Genre preset suggestions */}
      {preset.keywords.length > 0 && (
        <View style={styles.suggestions}>
          <Text style={styles.suggestLabel}>{isRTL ? 'הצעות לז׳אנר:' : 'Genre suggestions:'}</Text>
          <View style={styles.chipsWrap}>
            {preset.keywords.map((kw) => (
              <Pressable
                key={kw}
                style={({ pressed }) => [
                  styles.suggestionChip,
                  customization.keywords.includes(kw) && styles.suggestionChipActive,
                  pressed && { opacity: 0.75 },
                ]}
                onPress={() => {
                  if (customization.keywords.includes(kw)) {
                    removeKeyword(customization.keywords.indexOf(kw));
                  } else {
                    addKeyword(kw);
                  }
                }}
              >
                <Text style={[
                  styles.suggestionText,
                  customization.keywords.includes(kw) && styles.suggestionTextActive,
                ]}>
                  + {kw}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
      <TagInput
        label=""
        placeholder={isRTL ? 'הוסף מילת מפתח...' : 'Add keyword (e.g. "time travel")'}
        tags={customization.keywords}
        onAdd={addKeyword}
        onRemove={removeKeyword}
        color={Colors.primary}
      />

      {/* Themes */}
      <SectionHeader icon="movie-filter" title={isRTL ? 'נושאים לחקירה' : 'Thematic Focus'} />
      {preset.themes.length > 0 && (
        <View style={styles.suggestions}>
          <Text style={styles.suggestLabel}>{isRTL ? 'נושאים מוצעים:' : 'Suggested themes:'}</Text>
          <View style={styles.chipsWrap}>
            {preset.themes.map((th) => (
              <Pressable
                key={th}
                style={({ pressed }) => [
                  styles.suggestionChip,
                  { borderColor: `${Colors.secondary}60` },
                  customization.themes.includes(th) && {
                    backgroundColor: `${Colors.secondary}20`,
                    borderColor: Colors.secondary,
                  },
                  pressed && { opacity: 0.75 },
                ]}
                onPress={() => {
                  if (customization.themes.includes(th)) {
                    removeTheme(customization.themes.indexOf(th));
                  } else {
                    addTheme(th);
                  }
                }}
              >
                <Text style={[
                  styles.suggestionText,
                  customization.themes.includes(th) && { color: Colors.secondary, fontWeight: '600' },
                ]}>
                  + {th}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
      <TagInput
        label=""
        placeholder={isRTL ? 'הוסף נושא...' : 'Add theme (e.g. "redemption")'}
        tags={customization.themes}
        onAdd={addTheme}
        onRemove={removeTheme}
        color={Colors.secondary}
      />

      {/* Topics to Explore (new) */}
      <SectionHeader icon="travel-explore" title={isRTL ? 'נושאים לחקירה' : 'Topics to Research'} />
      <TagInput
        label=""
        placeholder={isRTL ? 'הוסף נושא לחקירה...' : "Add topic (e.g. 'character development')"}
        tags={topics}
        onAdd={addTopic}
        onRemove={removeTopic}
        color={Colors.warning}
      />

      {/* Exclude Topics */}
      <SectionHeader icon="block" title={isRTL ? 'נושאים להחרגה' : 'Exclude Topics'} />
      <TagInput
        label=""
        placeholder={isRTL ? 'הוסף נושא להחרגה...' : 'Add topic to exclude...'}
        tags={customization.excludeTopics}
        onAdd={addExclude}
        onRemove={removeExclude}
        color={Colors.error}
      />

      {/* Spoiler Warning Toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <MaterialIcons name="warning" size={16} color={Colors.warning} />
          <Text style={styles.toggleLabel}>
            {isRTL ? 'הוסף אזהרת ספויילרים' : 'Include Spoiler Warning'}
          </Text>
        </View>
        <Switch
          value={customization.includeSpoilerWarning}
          onValueChange={(v) => update({ includeSpoilerWarning: v })}
          trackColor={{ false: Colors.border, true: `${Colors.warning}60` }}
          thumbColor={customization.includeSpoilerWarning ? Colors.warning : Colors.textMuted}
        />
      </View>

      {/* Reset button */}
      <Pressable
        style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.75 }]}
        onPress={() => onChange({
          ...DEFAULT_CUSTOMIZATION,
          tonePreferences: ['dramatic'],
          targetAudiences: ['general'],
          topicsToExplore: [],
        })}
      >
        <MaterialIcons name="refresh" size={16} color={Colors.textMuted} />
        <Text style={styles.resetText}>{isRTL ? 'איפוס הכל' : 'Reset to defaults'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: Spacing.xxl },

  headerBanner: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
    gap: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.body,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: `${Colors.primary}15`,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  presetText: {
    fontSize: Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },

  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: `${Colors.primary}20`,
    borderWidth: 1,
    borderColor: `${Colors.primary}50`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    lineHeight: 14,
  },

  multiHint: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    fontStyle: 'italic',
  },

  hintText: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    fontStyle: 'italic',
    lineHeight: 16,
  },

  suggestions: { marginBottom: Spacing.sm },
  suggestLabel: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  suggestionChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
    backgroundColor: `${Colors.primary}08`,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  suggestionChipActive: {
    backgroundColor: `${Colors.primary}20`,
    borderColor: Colors.primary,
  },
  suggestionText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  suggestionTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.sm,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  toggleLabel: {
    fontSize: Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text,
  },

  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    borderStyle: 'dashed',
  },
  resetText: {
    fontSize: Typography.bodySmall,
    color: Colors.textMuted,
  },
});
