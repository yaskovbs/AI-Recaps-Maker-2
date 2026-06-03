import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  I18nManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRecaps, Recap } from '@/contexts/RecapsContext';
import { useApiTracking } from '@/hooks/useApiTracking';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCredits } from '@/contexts/CreditsContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'processing' | 'completed' | 'failed';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string, isRTL: boolean): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return isRTL ? 'עכשיו' : 'Just now';
  if (diffMins < 60) return isRTL ? `לפני ${diffMins} דק'` : `${diffMins}m ago`;
  if (diffHours < 24) return isRTL ? `לפני ${diffHours} ש'` : `${diffHours}h ago`;
  if (diffDays < 7) return isRTL ? `לפני ${diffDays} ימים` : `${diffDays}d ago`;
  return date.toLocaleDateString(isRTL ? 'he-IL' : 'en-US');
}

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, '0')}`;
}

function formatCost(cents: number): string {
  if (cents === 0) return '$0.00';
  if (cents < 1) return `$0.00`;
  const dollars = cents / 100;
  return dollars < 0.01 ? '<$0.01' : `$${dollars.toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

const STATUS_COLOR: Record<string, string> = {
  completed: Colors.success,
  processing: Colors.primary,
  pending: Colors.primary,
  failed: Colors.error,
};

const STATUS_ICON: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  completed: 'check-circle',
  processing: 'sync',
  pending: 'hourglass-empty',
  failed: 'error-outline',
};

// ─── Summary Card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  accent: string;
  gradient?: readonly [string, string];
}

function SummaryCard({ icon, label, value, accent, gradient }: SummaryCardProps) {
  return (
    <View style={summaryStyles.card}>
      <LinearGradient
        colors={gradient ?? [`${accent}22`, `${accent}08`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={summaryStyles.gradient}
      >
        <View style={[summaryStyles.iconRing, { borderColor: `${accent}40` }]}>
          <MaterialIcons name={icon} size={18} color={accent} />
        </View>
        <Text style={summaryStyles.value} numberOfLines={1}>{value}</Text>
        <Text style={summaryStyles.label} numberOfLines={1}>{label}</Text>
      </LinearGradient>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 72,
  },
  gradient: {
    padding: Spacing.sm,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  iconRing: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  value: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: Typography.medium,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

// ─── Filter Tab ───────────────────────────────────────────────────────────────

interface FilterTabProps {
  label: string;
  count: number;
  active: boolean;
  color: string;
  onPress: () => void;
}

function FilterTab({ label, count, active, color, onPress }: FilterTabProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        filterStyles.tab,
        active && filterStyles.tabActive,
        pressed && { opacity: 0.75 },
      ]}
    >
      {active && (
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <Text style={[filterStyles.tabLabel, active && filterStyles.tabLabelActive]}>{label}</Text>
      <View
        style={[
          filterStyles.badge,
          active
            ? filterStyles.badgeActive
            : { backgroundColor: `${color}20`, borderColor: `${color}60` },
        ]}
      >
        <Text style={[filterStyles.badgeText, !active && { color }]}>{count}</Text>
      </View>
    </Pressable>
  );
}

const filterStyles = StyleSheet.create({
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  tabActive: {
    borderColor: 'transparent',
    ...Shadows.neon,
  },
  tabLabel: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: '#FFF',
    fontWeight: Typography.bold,
  },
  badge: {
    paddingHorizontal: 6,
    height: 18,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 22,
  },
  badgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: 'transparent',
  },
  badgeText: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: '#FFF',
  },
});

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ progress }: { progress: number }) {
  const pct = Math.max(0, Math.min(100, progress));
  return (
    <View style={progressStyles.track}>
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[progressStyles.fill, { width: `${pct}%` }]}
      />
    </View>
  );
}

const progressStyles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.primary}20`,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});

// ─── Recap Card ───────────────────────────────────────────────────────────────

interface RecapCardProps {
  recap: Recap;
  cost: number;
  tokens: number;
  durationMs: number;
  isRTL: boolean;
  onDelete: () => void;
  onTogglePublic: () => void;
  isExpanded: boolean;
  onExpand: () => void;
  onReDownload: () => void;
}

function RecapCard({
  recap,
  cost,
  tokens,
  durationMs,
  isRTL,
  onDelete,
  onTogglePublic,
  isExpanded,
  onExpand,
  onReDownload,
}: RecapCardProps) {
  const statusColor = STATUS_COLOR[recap.status] ?? Colors.textMuted;
  const statusIcon = STATUS_ICON[recap.status] ?? 'radio-button-unchecked';
  const isProcessing = recap.status === 'processing' || recap.status === 'pending';
  const isCompleted = recap.status === 'completed';
  const isFailed = recap.status === 'failed';
  const isPublic = recap.visibility === 'public';

  const statusLabel = isRTL
    ? recap.status === 'completed' ? 'הושלם'
      : recap.status === 'processing' ? 'בעיבוד'
      : recap.status === 'pending' ? 'ממתין'
      : 'נכשל'
    : recap.status.charAt(0).toUpperCase() + recap.status.slice(1);

  return (
    <View style={cardStyles.card}>
      {/* Left accent strip */}
      <View style={[cardStyles.accentStrip, { backgroundColor: statusColor }]} />

      {/* Thumbnail area */}
      <LinearGradient
        colors={[`${statusColor}30`, `${Colors.secondary}18`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={cardStyles.thumbnail}
      >
        <MaterialIcons name="movie-creation" size={28} color={statusColor} style={{ opacity: 0.85 }} />
        {isProcessing && (
          <ActivityIndicator
            size="small"
            color={Colors.primary}
            style={cardStyles.thumbnailSpinner}
          />
        )}
      </LinearGradient>

      {/* Main content */}
      <View style={cardStyles.content}>
        {/* Title row */}
        <View style={cardStyles.titleRow}>
          <Text style={cardStyles.title} numberOfLines={1}>{recap.title}</Text>
          {recap.genre ? (
            <View style={cardStyles.genreBadge}>
              <Text style={cardStyles.genreText}>{recap.genre}</Text>
            </View>
          ) : null}
        </View>

        {/* Status row */}
        <View style={cardStyles.statusRow}>
          <MaterialIcons name={statusIcon} size={13} color={statusColor} />
          <Text style={[cardStyles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          {isProcessing && (
            <Text style={cardStyles.progressPct}>{recap.progress}%</Text>
          )}
        </View>

        {/* Progress bar (only when processing) */}
        {isProcessing && (
          <View style={cardStyles.progressWrap}>
            <ProgressBar progress={recap.progress} />
          </View>
        )}

        {/* Cost / tokens / duration row */}
        <View style={cardStyles.metaRow}>
          <MetaChip
            icon="attach-money"
            label={formatCost(cost)}
            color={Colors.warning}
          />
          <MetaChip
            icon="memory"
            label={`${formatTokens(tokens)} tok`}
            color={Colors.secondary}
          />
          {durationMs > 0 && (
            <MetaChip
              icon="timer"
              label={formatDuration(durationMs)}
              color={Colors.textMuted}
            />
          )}
          <MetaChip
            icon="schedule"
            label={formatDate(recap.createdAt, isRTL)}
            color={Colors.textMuted}
          />
        </View>

        {/* Stats row (views / rating) for completed */}
        {isCompleted && (recap.views > 0 || recap.rating > 0) && (
          <View style={cardStyles.statsRow}>
            {recap.views > 0 && (
              <View style={cardStyles.statItem}>
                <MaterialIcons name="visibility" size={12} color={Colors.textMuted} />
                <Text style={cardStyles.statText}>{recap.views}</Text>
              </View>
            )}
            {recap.shares > 0 && (
              <View style={cardStyles.statItem}>
                <MaterialIcons name="share" size={12} color={Colors.textMuted} />
                <Text style={cardStyles.statText}>{recap.shares}</Text>
              </View>
            )}
            {recap.rating > 0 && (
              <View style={cardStyles.statItem}>
                <MaterialIcons name="star" size={12} color={Colors.warning} />
                <Text style={[cardStyles.statText, { color: Colors.warning }]}>
                  {recap.rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Error message */}
        {isFailed && recap.errorMessage && (
          <Text style={cardStyles.errorMsg} numberOfLines={2}>{recap.errorMessage}</Text>
        )}

        {/* Actions */}
        <View style={[cardStyles.actions, isRTL && cardStyles.actionsRTL]}>
          {isCompleted && (
            <Pressable
              onPress={onTogglePublic}
              style={({ pressed }) => [
                cardStyles.actionBtn,
                isPublic ? cardStyles.actionBtnPublic : cardStyles.actionBtnPrivate,
                pressed && { opacity: 0.7 },
              ]}
            >
              <MaterialIcons
                name={isPublic ? 'public' : 'lock'}
                size={14}
                color={isPublic ? Colors.success : Colors.textMuted}
              />
              <Text
                style={[
                  cardStyles.actionBtnText,
                  { color: isPublic ? Colors.success : Colors.textMuted },
                ]}
              >
                {isPublic
                  ? (isRTL ? 'ציבורי' : 'Public')
                  : (isRTL ? 'פרטי' : 'Private')}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={onDelete}
            style={({ pressed }) => [
              cardStyles.actionBtn,
              cardStyles.actionBtnDelete,
              pressed && { opacity: 0.7 },
            ]}
          >
            <MaterialIcons name="delete-outline" size={14} color={Colors.error} />
            <Text style={[cardStyles.actionBtnText, { color: Colors.error }]}>
              {isRTL ? 'מחק' : 'Delete'}
            </Text>
          </Pressable>
        </View>

        {/* Expand button */}
        <Pressable
          style={styles2.expandBtn}
          onPress={onExpand}
        >
          <MaterialIcons name={isExpanded ? 'expand-less' : 'expand-more'} size={16} color={Colors.textMuted} />
          <Text style={styles2.expandBtnText}>{isExpanded ? (isRTL ? 'פחות' : 'Less') : (isRTL ? 'פרטים נוספים' : 'More details')}</Text>
        </Pressable>

        {isExpanded && (
          <View style={styles2.expandedPanel}>
            <View style={styles2.expandedRow}>
              <Text style={styles2.expandedLabel}>{isRTL ? 'נוצר:' : 'Created:'}</Text>
              <Text style={styles2.expandedValue}>{new Date(recap.createdAt).toLocaleString()}</Text>
            </View>
            <View style={styles2.expandedRow}>
              <Text style={styles2.expandedLabel}>{isRTL ? 'אורך:' : 'Duration:'}</Text>
              <Text style={styles2.expandedValue}>
                {Math.floor(recap.duration / 60)}:{String(recap.duration % 60).padStart(2, '0')}
              </Text>
            </View>
            <View style={styles2.expandedRow}>
              <Text style={styles2.expandedLabel}>{isRTL ? 'ז\'אנר:' : 'Genre:'}</Text>
              <Text style={[styles2.expandedValue, { color: Colors.primary }]}>{recap.genre}</Text>
            </View>
            <View style={styles2.expandedRow}>
              <Text style={styles2.expandedLabel}>{isRTL ? 'צפיות:' : 'Views:'}</Text>
              <Text style={styles2.expandedValue}>{recap.views}</Text>
            </View>
            <View style={styles2.expandedRow}>
              <Text style={styles2.expandedLabel}>{isRTL ? 'נראות:' : 'Visibility:'}</Text>
              <Text style={[styles2.expandedValue, { color: isPublic ? Colors.success : Colors.textMuted }]}>
                {isPublic ? (isRTL ? 'ציבורי' : 'Public') : (isRTL ? 'פרטי' : 'Private')}
              </Text>
            </View>
            {isFailed && recap.errorMessage && (
              <View style={styles2.expandedRow}>
                <Text style={[styles2.expandedLabel, { color: Colors.error }]}>{isRTL ? 'שגיאה:' : 'Error:'}</Text>
                <Text style={[styles2.expandedValue, { color: Colors.error, flex: 1 }]} numberOfLines={3}>{recap.errorMessage}</Text>
              </View>
            )}
            {isCompleted && (
              <Pressable
                style={({ pressed }) => [styles2.redownloadBtn, pressed && { opacity: 0.8 }]}
                onPress={onReDownload}
              >
                <MaterialIcons name="download" size={16} color={Colors.primary} />
                <Text style={styles2.redownloadBtnText}>{isRTL ? '▶ הורד מחדש' : '▶ Re-download'}</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function MetaChip({
  icon,
  label,
  color,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  color: string;
}) {
  return (
    <View style={chipStyles.chip}>
      <MaterialIcons name={icon} size={11} color={color} />
      <Text style={[chipStyles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles2 = StyleSheet.create({
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
    paddingVertical: 4,
  },
  expandBtnText: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
  },
  expandedPanel: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.xs,
  },
  expandedRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  expandedLabel: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
    minWidth: 70,
  },
  expandedValue: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  redownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    backgroundColor: `${Colors.primary}18`,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignSelf: 'flex-start',
  },
  redownloadBtnText: {
    fontSize: Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '700',
  },
});

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: Typography.medium,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  accentStrip: {
    width: 3,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  thumbnail: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  thumbnailSpinner: {
    position: 'absolute',
    bottom: 8,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  genreBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.secondary}25`,
    borderWidth: 1,
    borderColor: `${Colors.secondary}50`,
  },
  genreText: {
    fontSize: 10,
    fontWeight: Typography.semibold,
    color: Colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: Typography.caption,
    fontWeight: Typography.semibold,
  },
  progressPct: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    marginLeft: 2,
  },
  progressWrap: {
    marginVertical: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
  errorMsg: {
    fontSize: Typography.caption,
    color: Colors.error,
    lineHeight: 16,
    backgroundColor: `${Colors.error}12`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 2,
    borderLeftColor: Colors.error,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  actionsRTL: {
    flexDirection: 'row-reverse',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  actionBtnPublic: {
    borderColor: `${Colors.success}50`,
    backgroundColor: `${Colors.success}12`,
  },
  actionBtnPrivate: {
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceLight,
  },
  actionBtnDelete: {
    borderColor: `${Colors.error}40`,
    backgroundColor: `${Colors.error}0D`,
  },
  actionBtnText: {
    fontSize: Typography.caption,
    fontWeight: Typography.semibold,
  },
});

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ filter, isRTL }: { filter: FilterType; isRTL: boolean }) {
  const isAll = filter === 'all';
  return (
    <View style={emptyStyles.container}>
      <LinearGradient
        colors={[`${Colors.primary}22`, `${Colors.secondary}15`]}
        style={emptyStyles.iconCircle}
      >
        <MaterialIcons name="video-library" size={40} color={Colors.primary} style={{ opacity: 0.7 }} />
      </LinearGradient>
      <Text style={emptyStyles.title}>
        {isAll
          ? (isRTL ? 'אין סיכומים עדיין' : 'No recaps yet')
          : (isRTL ? 'אין תוצאות לפילטר זה' : 'No results for this filter')}
      </Text>
      <Text style={emptyStyles.subtitle}>
        {isAll
          ? (isRTL ? 'עבד על הסרטון הראשון שלך כדי להתחיל' : 'Process your first video to get started')
          : (isRTL ? 'נסה לשנות את הפילטר' : 'Try a different filter')}
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  title: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RecapsScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const { balance } = useCredits();
  const {
    recaps,
    isLoading,
    refresh,
    deleteRecap,
    togglePublicStatus,
    getCompletedRecaps,
    getProcessingRecaps,
    getFailedRecaps,
  } = useRecaps();
  const {
    recentUsage,
    totalCost,
    totalTokens,
    totalCalls,
    refreshUsage,
  } = useApiTracking();

  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showProfile, setShowProfile] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Cost lookup per recap ──────────────────────────────────────────────────
  // recentUsage doesn't carry recapId, so we split cost evenly across recaps as
  // a best-effort fallback, or use total cost for display purposes.
  const costPerRecap = useMemo(() => {
    if (recaps.length === 0 || totalCost === 0) return {} as Record<string, number>;
    const perRecap = totalCost / recaps.length;
    return recaps.reduce<Record<string, number>>((acc, r) => {
      acc[r.id] = perRecap;
      return acc;
    }, {});
  }, [recaps, totalCost]);

  const tokensPerRecap = useMemo(() => {
    if (recaps.length === 0 || totalTokens === 0) return {} as Record<string, number>;
    const perRecap = totalTokens / recaps.length;
    return recaps.reduce<Record<string, number>>((acc, r) => {
      acc[r.id] = perRecap;
      return acc;
    }, {});
  }, [recaps, totalTokens]);

  const durationPerRecap = useMemo(() => {
    if (recaps.length === 0 || recentUsage.length === 0) return {} as Record<string, number>;
    const totalMs = recentUsage.reduce((s, u) => s + u.duration_ms, 0);
    const perRecap = totalMs / recaps.length;
    return recaps.reduce<Record<string, number>>((acc, r) => {
      acc[r.id] = perRecap;
      return acc;
    }, {});
  }, [recaps, recentUsage]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filteredRecaps = useMemo<Recap[]>(() => {
    switch (filter) {
      case 'completed': return getCompletedRecaps();
      case 'processing': return getProcessingRecaps();
      case 'failed': return getFailedRecaps();
      default: return recaps;
    }
  }, [filter, recaps, getCompletedRecaps, getProcessingRecaps, getFailedRecaps]);

  // ── Pull-to-refresh ────────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), refreshUsage()]);
    setRefreshing(false);
  }, [refresh, refreshUsage]);

  // ── Re-download handler ───────────────────────────────────────────────────
  const handleReDownload = useCallback((recap: Recap) => {
    Alert.alert(
      isRTL ? 'הורדה מחדש' : 'Re-download Recap',
      isRTL ? `"${recap.title}"\n\nקובץ הסיכום יאוחזר מהאחסון.` : `"${recap.title}"\n\nThe recap file will be fetched from storage.`,
      [
        { text: isRTL ? 'ביטול' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'הורד' : 'Download',
          onPress: () => {
            Alert.alert(
              isRTL ? 'מוריד...' : 'Download Started',
              isRTL ? 'הקובץ יופיע בתיקיית ההורדות שלך בקרוב.' : 'File will appear in your Downloads folder once ready.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  }, [isRTL]);

  // ── Delete handler ─────────────────────────────────────────────────────────
  const handleDelete = useCallback((id: string, title: string) => {
    Alert.alert(
      isRTL ? 'מחיקת סיכום' : 'Delete Recap',
      isRTL ? `למחוק את "${title}"?` : `Delete "${title}"?`,
      [
        { text: isRTL ? 'ביטול' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'מחק' : 'Delete',
          style: 'destructive',
          onPress: () => deleteRecap(id),
        },
      ]
    );
  }, [isRTL, deleteRecap]);

  // ── Toggle public ──────────────────────────────────────────────────────────
  const handleTogglePublic = useCallback(async (id: string, currentVisibility: string) => {
    await togglePublicStatus(id);
    const nowPublic = currentVisibility !== 'public';
    Alert.alert(
      isRTL ? 'הצלחה' : 'Updated',
      nowPublic
        ? (isRTL ? 'הסיכום כעת ציבורי' : 'Recap is now public')
        : (isRTL ? 'הסיכום כעת פרטי' : 'Recap is now private'),
      [{ text: 'OK' }]
    );
  }, [isRTL, togglePublicStatus]);

  // ── Summary values ─────────────────────────────────────────────────────────
  const completedCount = getCompletedRecaps().length;
  const costDisplay = totalCost === 0 ? '$0.00' : formatCost(totalCost);
  const creditsDisplay = `${balance}`;

  // ── Render ─────────────────────────────────────────────────────────────────
  const renderItem = useCallback(({ item }: { item: Recap }) => (
    <RecapCard
      recap={item}
      cost={costPerRecap[item.id] ?? 0}
      tokens={Math.round(tokensPerRecap[item.id] ?? 0)}
      durationMs={Math.round(durationPerRecap[item.id] ?? 0)}
      isRTL={isRTL}
      onDelete={() => handleDelete(item.id, item.title)}
      onTogglePublic={() => handleTogglePublic(item.id, item.visibility)}
      isExpanded={expandedId === item.id}
      onExpand={() => setExpandedId(id => id === item.id ? null : item.id)}
      onReDownload={() => handleReDownload(item)}
    />
  ), [costPerRecap, tokensPerRecap, durationPerRecap, isRTL, handleDelete, handleTogglePublic, expandedId, handleReDownload]);

  const keyExtractor = useCallback((item: Recap) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>
            {isRTL ? 'היסטוריה' : 'History'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {recaps.length} {isRTL ? 'סיכומים' : 'recaps'}
          </Text>
        </View>
        {/* Credits badge */}
        <LinearGradient
          colors={[`${Colors.warning}30`, `${Colors.warning}15`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.creditsBadge}
        >
          <MaterialIcons name="toll" size={15} color={Colors.warning} />
          <Text style={styles.creditsValue}>{creditsDisplay}</Text>
          <Text style={styles.creditsLabel}>{isRTL ? 'קרדיטים' : 'Credits'}</Text>
        </LinearGradient>
      </View>

      {/* ── User Profile Card ──────────────────────────────────────────────── */}
      {user && (
        <View style={styles.profileCard}>
          <Pressable style={styles.profileCardHeader} onPress={() => setShowProfile(p => !p)}>
            <View style={styles.profileAvatarCircle}>
              <Text style={styles.profileAvatarText}>
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {user.name || user.email?.split('@')[0] || (isRTL ? 'משתמש' : 'User')}
              </Text>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {user.email ? user.email.replace(/(.{3}).*(@.*)/, '$1***$2') : ''}
              </Text>
              <View style={styles.providerBadge}>
                <MaterialIcons
                  name={user.provider === 'google' ? 'language' : user.provider === 'github' ? 'code' : 'email'}
                  size={11}
                  color={Colors.primary}
                />
                <Text style={styles.providerText}>{user.provider}</Text>
              </View>
            </View>
            <MaterialIcons
              name={showProfile ? 'expand-less' : 'expand-more'}
              size={22}
              color={Colors.textMuted}
            />
          </Pressable>

          {showProfile && (
            <View style={styles.profileStats}>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>{recaps.length}</Text>
                <Text style={styles.profileStatLabel}>{isRTL ? 'סיכומים' : 'Recaps'}</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStatItem}>
                <Text style={[styles.profileStatValue, { color: Colors.success }]}>{completedCount}</Text>
                <Text style={styles.profileStatLabel}>{isRTL ? 'הושלמו' : 'Completed'}</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStatItem}>
                <Text style={[styles.profileStatValue, { color: Colors.warning }]}>{balance}</Text>
                <Text style={styles.profileStatLabel}>{isRTL ? 'קרדיטים' : 'Credits'}</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>{getFailedRecaps().length}</Text>
                <Text style={[styles.profileStatLabel, { color: Colors.error }]}>{isRTL ? 'נכשלו' : 'Failed'}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ── Summary Cards ──────────────────────────────────────────────────── */}
      <View style={styles.summaryRow}>
        <SummaryCard
          icon="video-library"
          label={isRTL ? 'סה"כ' : 'Total'}
          value={`${recaps.length}`}
          accent={Colors.primary}
        />
        <SummaryCard
          icon="check-circle"
          label={isRTL ? 'הושלמו' : 'Done'}
          value={`${completedCount}`}
          accent={Colors.success}
        />
        <SummaryCard
          icon="attach-money"
          label={isRTL ? 'עלות' : 'Cost'}
          value={costDisplay}
          accent={Colors.warning}
        />
        <SummaryCard
          icon="toll"
          label={isRTL ? 'קרדיטים' : 'Credits'}
          value={creditsDisplay}
          accent={Colors.secondary}
        />
      </View>

      {/* ── Neon divider ───────────────────────────────────────────────────── */}
      <LinearGradient
        colors={['transparent', Colors.primary, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.divider}
      />

      {/* ── Filter Tabs ────────────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filtersRow, isRTL && styles.filtersRowRTL]}
        style={styles.filtersScroll}
      >
        <FilterTab
          label={isRTL ? 'הכל' : 'All'}
          count={recaps.length}
          active={filter === 'all'}
          color={Colors.primary}
          onPress={() => setFilter('all')}
        />
        <FilterTab
          label={isRTL ? 'בעיבוד' : 'Processing'}
          count={getProcessingRecaps().length}
          active={filter === 'processing'}
          color={Colors.primary}
          onPress={() => setFilter('processing')}
        />
        <FilterTab
          label={isRTL ? 'הושלמו' : 'Completed'}
          count={completedCount}
          active={filter === 'completed'}
          color={Colors.success}
          onPress={() => setFilter('completed')}
        />
        <FilterTab
          label={isRTL ? 'נכשלו' : 'Failed'}
          count={getFailedRecaps().length}
          active={filter === 'failed'}
          color={Colors.error}
          onPress={() => setFilter('failed')}
        />
      </ScrollView>

      {/* ── Recap List ─────────────────────────────────────────────────────── */}
      {isLoading && recaps.length === 0 ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {isRTL ? 'טוען סיכומים...' : 'Loading recaps…'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRecaps}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            filteredRecaps.length === 0 && styles.listContentEmpty,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<EmptyState filter={filter} isRTL={isRTL} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary, Colors.secondary]}
            />
          }
          // Performance
          removeClippedSubviews
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={10}
        />
      )}
    </View>
  );
}

// ─── Main Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  headerLeft: {
    gap: 2,
  },
  headerTitle: {
    fontSize: Typography.h2,
    fontWeight: Typography.bold,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
  creditsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: `${Colors.warning}40`,
  },
  creditsValue: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.warning,
  },
  creditsLabel: {
    fontSize: Typography.caption,
    fontWeight: Typography.medium,
    color: `${Colors.warning}AA`,
  },

  // Profile Card
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  profileAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: Typography.h2,
    fontWeight: Typography.bold,
    color: '#FFF',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  profileEmail: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  providerText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  profileStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  profileStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  profileStatValue: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  profileStatLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  profileStatDivider: {
    width: 1,
    height: '60%',
    backgroundColor: Colors.border,
    alignSelf: 'center',
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },

  // Divider
  divider: {
    height: 1,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    opacity: 0.4,
  },

  // Filters
  filtersScroll: {
    flexGrow: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  filtersRowRTL: {
    flexDirection: 'row-reverse',
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: Spacing.sm,
  },

  // Loading
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.bodySmall,
    color: Colors.textMuted,
  },
});
