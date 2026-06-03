import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRecaps, Recap } from '@/contexts/RecapsContext';
import { useApiTracking } from '@/hooks/useApiTracking';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCredits } from '@/contexts/CreditsContext';
import { formatCost } from '@/services/api-tracking';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'pending' | 'processing' | 'completed' | 'failed';

interface StatusConfig {
  label: string;
  labelHe: string;
  color: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  bgColor: string;
}

type SortOrder = 'newest' | 'oldest' | 'duration_desc' | 'duration_asc';
type GenreFilter = 'all' | 'sci-fi' | 'action' | 'drama' | 'comedy' | 'thriller' | 'horror' | 'romance' | 'mystery' | 'fantasy' | 'documentary';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: {
    label: 'Pending',
    labelHe: 'ממתין',
    color: Colors.warning,
    icon: 'hourglass-empty',
    bgColor: 'rgba(255, 184, 0, 0.12)',
  },
  processing: {
    label: 'Processing',
    labelHe: 'בעיבוד',
    color: Colors.primary,
    icon: 'sync',
    bgColor: 'rgba(0, 212, 255, 0.12)',
  },
  completed: {
    label: 'Completed',
    labelHe: 'הושלם',
    color: Colors.success,
    icon: 'check-circle',
    bgColor: 'rgba(0, 255, 127, 0.12)',
  },
  failed: {
    label: 'Failed',
    labelHe: 'נכשל',
    color: Colors.error,
    icon: 'error',
    bgColor: 'rgba(255, 51, 102, 0.12)',
  },
};

function getRelativeTime(isoString: string, isRTL: boolean): string {
  const date = new Date(isoString);
  const now = Date.now();
  const diffMs = now - date.getTime();
  if (isNaN(diffMs) || diffMs < 0) return isRTL ? 'עכשיו' : 'Just now';
  const mins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);
  if (mins < 1) return isRTL ? 'עכשיו' : 'Just now';
  if (mins < 60) return isRTL ? `לפני ${mins} דק'` : `${mins}m ago`;
  if (hours < 24) return isRTL ? `לפני ${hours} שע'` : `${hours}h ago`;
  if (days < 7) return isRTL ? `לפני ${days} ימים` : `${days}d ago`;
  return date.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function SummaryCard({
  icon,
  iconColor,
  label,
  value,
  subValue,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <View style={summaryStyles.card}>
      <View style={[summaryStyles.iconWrap, { backgroundColor: `${iconColor}18` }]}>
        <MaterialIcons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={summaryStyles.value} numberOfLines={1}>
        {value}
      </Text>
      <Text style={summaryStyles.label} numberOfLines={1}>
        {label}
      </Text>
      {subValue ? (
        <Text style={summaryStyles.subValue} numberOfLines={1}>
          {subValue}
        </Text>
      ) : null}
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 72,
    ...Shadows.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  label: {
    fontSize: Typography.caption,
    fontWeight: Typography.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  subValue: {
    fontSize: Typography.caption - 1,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

// ─── Filter Chip ─────────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  color,
  count,
  onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  count: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        filterStyles.chip,
        active && { backgroundColor: `${color}20`, borderColor: color },
        pressed && filterStyles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <View style={[filterStyles.dot, { backgroundColor: color, opacity: active ? 1 : 0.4 }]} />
      <Text style={[filterStyles.chipLabel, active && { color, fontWeight: Typography.semibold }]}>
        {label}
      </Text>
      <View style={[filterStyles.badge, { backgroundColor: active ? color : Colors.surfaceLight }]}>
        <Text style={[filterStyles.badgeText, { color: active ? '#000' : Colors.textMuted }]}>
          {count}
        </Text>
      </View>
    </Pressable>
  );
}

const filterStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pressed: {
    opacity: 0.75,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipLabel: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.medium,
    color: Colors.textSecondary,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: Typography.bold,
  },
});

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  const pct = Math.min(Math.max(progress, 0), 100);
  return (
    <View style={progressStyles.track}>
      <View style={[progressStyles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
}

const progressStyles = StyleSheet.create({
  track: {
    height: 3,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});

// ─── Recap List Item ──────────────────────────────────────────────────────────

function RecapItem({
  recap,
  costLabel,
  isRTL,
}: {
  recap: Recap;
  costLabel: string;
  isRTL: boolean;
}) {
  const cfg = STATUS_CONFIG[recap.status] ?? STATUS_CONFIG.pending;
  const statusLabel = isRTL ? cfg.labelHe : cfg.label;
  const isProcessing = recap.status === 'processing' || recap.status === 'pending';
  const createdLabel = getRelativeTime(recap.createdAt, isRTL);

  return (
    <View style={itemStyles.card}>
      {/* Left accent bar */}
      <View style={[itemStyles.accentBar, { backgroundColor: cfg.color }]} />

      <View style={itemStyles.body}>
        {/* Row 1: title + cost */}
        <View style={itemStyles.rowBetween}>
          <Text style={itemStyles.title} numberOfLines={1}>
            {recap.title}
          </Text>
          <Text style={itemStyles.cost}>{costLabel}</Text>
        </View>

        {/* Row 2: genre badge + status badge */}
        <View style={itemStyles.rowWrap}>
          {recap.genre ? (
            <View style={itemStyles.genreBadge}>
              <MaterialIcons name="label" size={10} color={Colors.secondary} />
              <Text style={itemStyles.genreText}>{recap.genre}</Text>
            </View>
          ) : null}

          <View style={[itemStyles.statusBadge, { backgroundColor: cfg.bgColor, borderColor: `${cfg.color}40` }]}>
            <MaterialIcons name={cfg.icon} size={11} color={cfg.color} />
            <Text style={[itemStyles.statusText, { color: cfg.color }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Progress bar for active items */}
        {isProcessing && (
          <View style={itemStyles.progressSection}>
            <ProgressBar progress={recap.progress} color={cfg.color} />
            <Text style={[itemStyles.progressLabel, { color: cfg.color }]}>
              {recap.progress}%
            </Text>
          </View>
        )}

        {/* Row 3: meta info */}
        <View style={itemStyles.metaRow}>
          <View style={itemStyles.metaItem}>
            <MaterialIcons name="schedule" size={12} color={Colors.textMuted} />
            <Text style={itemStyles.metaText}>{createdLabel}</Text>
          </View>

          <View style={itemStyles.metaItem}>
            <MaterialIcons name="timer" size={12} color={Colors.textMuted} />
            <Text style={itemStyles.metaText}>{formatDuration(recap.duration)}</Text>
          </View>

          {recap.status === 'completed' && (
            <>
              <View style={itemStyles.metaItem}>
                <MaterialIcons name="visibility" size={12} color={Colors.textMuted} />
                <Text style={itemStyles.metaText}>{recap.views}</Text>
              </View>
              {recap.rating > 0 && (
                <View style={itemStyles.metaItem}>
                  <MaterialIcons name="star" size={12} color={Colors.warning} />
                  <Text style={[itemStyles.metaText, { color: Colors.warning }]}>
                    {recap.rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const itemStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  accentBar: {
    width: 3,
    alignSelf: 'stretch',
  },
  body: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  cost: {
    fontSize: Typography.caption,
    fontWeight: Typography.medium,
    color: Colors.primary,
    minWidth: 42,
    textAlign: 'right',
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  genreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(178, 75, 243, 0.12)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(178, 75, 243, 0.3)',
  },
  genreText: {
    fontSize: 10,
    fontWeight: Typography.medium,
    color: Colors.secondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: Typography.semibold,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  progressLabel: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    minWidth: 28,
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
  },
});

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ isRTL }: { isRTL: boolean }) {
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.iconWrap}>
        <MaterialIcons name="history" size={52} color={Colors.primary} style={{ opacity: 0.35 }} />
      </View>
      <Text style={emptyStyles.title}>
        {isRTL ? 'אין היסטוריה עדיין' : 'No History Yet'}
      </Text>
      <Text style={emptyStyles.subtitle}>
        {isRTL
          ? 'הסיכומים שלך יופיעו כאן לאחר שתצור אחד'
          : 'Your processed recaps will appear here once you create one'}
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(0, 212, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.h4,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { isRTL } = useLanguage();
  const { recaps, isLoading, refresh } = useRecaps();
  const {
    totalCalls,
    totalCost,
    overallSuccessRate,
    recentUsage,
    refreshStats,
    refreshUsage,
  } = useApiTracking();
  const { balance } = useCredits();

  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  // ── New filter state ────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [minDurationSec, setMinDurationSec] = useState<number>(0);
  const [genreFilter, setGenreFilter] = useState<GenreFilter>('all');

  // Build a lookup map: recapId → cost label from recentUsage
  const costByRecapId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const u of recentUsage) {
      map[u.id] = formatCost(u.cost_total);
    }
    return map;
  }, [recentUsage]);

  // ── Advanced filtering ──────────────────────────────────────────────────
  const filteredRecaps = useMemo(() => {
    let list = recaps;

    // Status filter
    if (activeFilter !== 'all') list = list.filter((r) => r.status === activeFilter);

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) => r.title.toLowerCase().includes(q) || (r.genre || '').toLowerCase().includes(q)
      );
    }

    // Date range filter
    const now = Date.now();
    if (dateRange === 'today') {
      list = list.filter((r) => now - new Date(r.createdAt).getTime() < 86_400_000);
    } else if (dateRange === 'week') {
      list = list.filter((r) => now - new Date(r.createdAt).getTime() < 7 * 86_400_000);
    } else if (dateRange === 'month') {
      list = list.filter((r) => now - new Date(r.createdAt).getTime() < 30 * 86_400_000);
    }

    // Min duration filter
    if (minDurationSec > 0) {
      list = list.filter((r) => r.duration >= minDurationSec);
    }

    // Genre filter
    if (genreFilter !== 'all') {
      list = list.filter((r) => (r.genre || '').toLowerCase() === genreFilter);
    }

    // Sort
    list = [...list].sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOrder === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOrder === 'duration_desc') return b.duration - a.duration;
      if (sortOrder === 'duration_asc') return a.duration - b.duration;
      return 0;
    });

    return list;
  }, [recaps, activeFilter, searchQuery, dateRange, minDurationSec, sortOrder]);

  // Count per status
  const counts = useMemo(() => {
    const c = { all: recaps.length, pending: 0, processing: 0, completed: 0, failed: 0 };
    for (const r of recaps) {
      if (r.status in c) (c as any)[r.status]++;
    }
    return c;
  }, [recaps]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refresh(), refreshStats('month'), refreshUsage()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh, refreshStats, refreshUsage]);

  const successRateLabel = useMemo(() => {
    if (totalCalls === 0) return isRTL ? 'אין נתונים' : 'N/A';
    return `${Math.round(overallSuccessRate)}%`;
  }, [overallSuccessRate, totalCalls, isRTL]);

  const totalCostLabel = useMemo(() => formatCost(totalCost), [totalCost]);

  // ── CSV export ──────────────────────────────────────────────────────────
  const handleExportCSV = useCallback(() => {
    const header = 'Title,Genre,Status,Duration(s),Created,Views\n';
    const rows = filteredRecaps
      .map((r) =>
        [r.title.replace(/,/g, ' '), r.genre, r.status, r.duration, r.createdAt, r.views].join(',')
      )
      .join('\n');
    const csv = header + rows;
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `history-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      console.log('CSV:\n', csv);
    }
  }, [filteredRecaps]);

  const activeAdvancedCount = [
    dateRange !== 'all',
    minDurationSec > 0,
    sortOrder !== 'newest',
    searchQuery.trim().length > 0,
    genreFilter !== 'all',
  ].filter(Boolean).length;

  const summaryCards = [
    {
      icon: 'video-library' as const,
      iconColor: Colors.primary,
      label: isRTL ? 'סה"כ סיכומים' : 'Total Recaps',
      value: String(recaps.length),
    },
    {
      icon: 'attach-money' as const,
      iconColor: Colors.success,
      label: isRTL ? 'עלות כוללת' : 'Total Cost',
      value: totalCostLabel,
      subValue: `${totalCalls} ${isRTL ? 'קריאות' : 'calls'}`,
    },
    {
      icon: 'toll' as const,
      iconColor: Colors.secondary,
      label: isRTL ? 'קרדיטים' : 'Credits',
      value: String(balance),
    },
    {
      icon: 'verified' as const,
      iconColor: Colors.warning,
      label: isRTL ? 'הצלחה' : 'Success',
      value: successRateLabel,
    },
  ];

  const filters: Array<{ key: StatusFilter; label: string; labelHe: string; color: string }> = [
    { key: 'all', label: 'All', labelHe: 'הכל', color: Colors.primary },
    { key: 'completed', label: 'Done', labelHe: 'הושלמו', color: Colors.success },
    { key: 'processing', label: 'Active', labelHe: 'פעיל', color: Colors.primary },
    { key: 'pending', label: 'Pending', labelHe: 'ממתין', color: Colors.warning },
    { key: 'failed', label: 'Failed', labelHe: 'נכשלו', color: Colors.error },
  ];

  const renderItem = useCallback(
    ({ item }: { item: Recap }) => {
      // Try matching recap to a usage entry (best-effort via index)
      // Since ApiTracking doesn't expose recapId in context, fallback to '—'
      const costLabel = '—';
      return <RecapItem recap={item} costLabel={costLabel} isRTL={isRTL} />;
    },
    [isRTL, costByRecapId]
  );

  const keyExtractor = useCallback((item: Recap) => item.id, []);

  const ListHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          {summaryCards.map((c) => (
            <SummaryCard key={c.label} {...c} />
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* ── Search + export row ── */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={isRTL ? 'חיפוש...' : 'Search recaps...'}
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              textAlign={isRTL ? 'right' : 'left'}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={16} color={Colors.textMuted} />
              </Pressable>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
            onPress={() => setShowAdvancedFilters(true)}
          >
            {activeAdvancedCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeAdvancedCount}</Text>
              </View>
            )}
            <MaterialIcons name="tune" size={20} color={activeAdvancedCount > 0 ? Colors.primary : Colors.textSecondary} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
            onPress={handleExportCSV}
          >
            <MaterialIcons name="file-download" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {/* Section Title */}
        <View style={styles.sectionTitleRow}>
          <MaterialIcons name="history" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>
            {isRTL ? 'היסטוריית עיבוד' : 'Processing History'}
          </Text>
          <View style={styles.countBubble}>
            <Text style={styles.countBubbleText}>{filteredRecaps.length}</Text>
          </View>
        </View>

        {/* Status Filter Chips */}
        <View style={styles.filtersRow}>
          {filters.map((f) => (
            <FilterChip
              key={f.key}
              label={isRTL ? f.labelHe : f.label}
              active={activeFilter === f.key}
              color={f.color}
              count={counts[f.key]}
              onPress={() => setActiveFilter(f.key)}
            />
          ))}
        </View>

        {/* Active advanced filters summary */}
        {activeAdvancedCount > 0 && (
          <View style={styles.activeFiltersBar}>
            <MaterialIcons name="filter-list" size={14} color={Colors.primary} />
            <Text style={styles.activeFiltersText}>
              {isRTL ? `${activeAdvancedCount} פילטרים פעילים` : `${activeAdvancedCount} active filter${activeAdvancedCount !== 1 ? 's' : ''}`}
            </Text>
            <Pressable
              onPress={() => { setSearchQuery(''); setSortOrder('newest'); setDateRange('all'); setMinDurationSec(0); setGenreFilter('all'); }}
              style={styles.clearFiltersBtn}
            >
              <Text style={styles.clearFiltersText}>{isRTL ? 'נקה' : 'Clear'}</Text>
            </Pressable>
          </View>
        )}
      </View>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [summaryCards, isRTL, filteredRecaps.length, activeFilter, counts, searchQuery, activeAdvancedCount]
  );

  const ListEmpty = useMemo(
    () =>
      isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {isRTL ? 'טוען היסטוריה...' : 'Loading history...'}
          </Text>
        </View>
      ) : (
        <EmptyState isRTL={isRTL} />
      ),
    [isLoading, isRTL]
  );

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: Platform.OS === 'web' ? Math.max(insets.top, Spacing.md) : insets.top },
      ]}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <MaterialIcons name="history" size={22} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>
              {isRTL ? 'היסטוריית עיבוד' : 'Processing History'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isRTL ? 'AI Recaps Maker' : 'AI Recaps Maker'}
            </Text>
          </View>
        </View>

        {/* Live indicator */}
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{isRTL ? 'חי' : 'Live'}</Text>
        </View>
      </View>

      {/* ── List ───────────────────────────────────────────────────── */}
      <FlatList
        data={filteredRecaps}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + Spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary, Colors.secondary]}
            progressBackgroundColor={Colors.surface}
          />
        }
        // Web-safe: avoid native-only props conditionally
        {...(Platform.OS !== 'web'
          ? {
              initialNumToRender: 10,
              maxToRenderPerBatch: 8,
              windowSize: 5,
            }
          : {})}
      />

      {/* ── Advanced Filters Modal ──────────────────────────────────── */}
      <Modal
        visible={showAdvancedFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdvancedFilters(false)}
      >
        <View style={advStyles.overlay}>
          <View style={advStyles.sheet}>
            {/* Modal header */}
            <View style={advStyles.sheetHeader}>
              <Text style={advStyles.sheetTitle}>{isRTL ? 'פילטרים מתקדמים' : 'Advanced Filters'}</Text>
              <Pressable onPress={() => setShowAdvancedFilters(false)} style={advStyles.closeBtn}>
                <MaterialIcons name="close" size={22} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView style={advStyles.body} showsVerticalScrollIndicator={false}>
              {/* ── Sort Order ── */}
              <Text style={advStyles.label}>{isRTL ? 'מיון' : 'Sort Order'}</Text>
              <View style={advStyles.optionRow}>
                {([
                  { key: 'newest', label: isRTL ? 'חדש ביותר' : 'Newest' },
                  { key: 'oldest', label: isRTL ? 'ישן ביותר' : 'Oldest' },
                  { key: 'duration_desc', label: isRTL ? 'ארוך ביותר' : 'Longest' },
                  { key: 'duration_asc', label: isRTL ? 'קצר ביותר' : 'Shortest' },
                ] as { key: SortOrder; label: string }[]).map((o) => (
                  <Pressable
                    key={o.key}
                    style={[advStyles.optBtn, sortOrder === o.key && advStyles.optBtnActive]}
                    onPress={() => setSortOrder(o.key)}
                  >
                    <Text style={[advStyles.optText, sortOrder === o.key && advStyles.optTextActive]}>
                      {o.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* ── Date Range ── */}
              <Text style={advStyles.label}>{isRTL ? 'טווח תאריכים' : 'Date Range'}</Text>
              <View style={advStyles.optionRow}>
                {([
                  { key: 'all', label: isRTL ? 'הכל' : 'All Time' },
                  { key: 'today', label: isRTL ? 'היום' : 'Today' },
                  { key: 'week', label: isRTL ? 'שבוע' : 'This Week' },
                  { key: 'month', label: isRTL ? 'חודש' : 'This Month' },
                ] as { key: typeof dateRange; label: string }[]).map((o) => (
                  <Pressable
                    key={o.key}
                    style={[advStyles.optBtn, dateRange === o.key && advStyles.optBtnActive]}
                    onPress={() => setDateRange(o.key)}
                  >
                    <Text style={[advStyles.optText, dateRange === o.key && advStyles.optTextActive]}>
                      {o.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* ── Min Duration ── */}
              <Text style={advStyles.label}>
                {isRTL ? `משך מינימלי: ${minDurationSec}ש'` : `Min Duration: ${minDurationSec}s`}
              </Text>
              <View style={advStyles.optionRow}>
                {[0, 30, 60, 120, 300].map((sec) => (
                  <Pressable
                    key={sec}
                    style={[advStyles.optBtn, minDurationSec === sec && advStyles.optBtnActive]}
                    onPress={() => setMinDurationSec(sec)}
                  >
                    <Text style={[advStyles.optText, minDurationSec === sec && advStyles.optTextActive]}>
                      {sec === 0 ? (isRTL ? 'הכל' : 'Any') : `${sec}s`}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* ── Genre Filter ── */}
              <Text style={advStyles.label}>{isRTL ? 'פילטר ז\u05f3אנר' : 'Genre Filter'}</Text>
              <View style={[advStyles.optionRow, { flexWrap: 'wrap' }]}>
                {(['all', 'sci-fi', 'action', 'drama', 'comedy', 'thriller', 'horror', 'romance', 'mystery', 'fantasy', 'documentary'] as GenreFilter[]).map((g) => (
                  <Pressable
                    key={g}
                    style={[advStyles.optBtn, genreFilter === g && advStyles.optBtnActive, { marginBottom: 6 }]}
                    onPress={() => setGenreFilter(g)}
                  >
                    <Text style={[advStyles.optText, genreFilter === g && advStyles.optTextActive]}>
                      {g === 'all' ? (isRTL ? 'הכל' : 'All') : g}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Apply / Reset */}
            <View style={advStyles.footer}>
              <Pressable
                style={({ pressed }) => [advStyles.resetBtn, pressed && { opacity: 0.7 }]}
                onPress={() => { setSortOrder('newest'); setDateRange('all'); setMinDurationSec(0); setGenreFilter('all'); }}
              >
                <Text style={advStyles.resetText}>{isRTL ? 'איפוס' : 'Reset'}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [advStyles.applyBtn, pressed && { opacity: 0.8 }]}
                onPress={() => setShowAdvancedFilters(false)}
              >
                <Text style={advStyles.applyText}>{isRTL ? 'החל' : 'Apply'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.text,
    lineHeight: 22,
  },
  headerSubtitle: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 255, 127, 0.1)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 127, 0.25)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  liveText: {
    fontSize: Typography.caption,
    fontWeight: Typography.semibold,
    color: Colors.success,
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.md,
    flexGrow: 1,
  },
  listHeader: {
    paddingTop: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },

  // Search row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.bodySmall,
    color: Colors.text,
    padding: 0,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: Typography.bold,
    color: Colors.background,
  },

  // Section title
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.text,
    flex: 1,
  },
  countBubble: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  countBubbleText: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },

  // Filters
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },

  // Active filters bar
  activeFiltersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(0, 212, 255, 0.06)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  activeFiltersText: {
    flex: 1,
    fontSize: Typography.caption,
    color: Colors.primary,
  },
  clearFiltersBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  clearFiltersText: {
    fontSize: Typography.caption,
    fontWeight: Typography.semibold,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },

  // Loading / empty
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.bodySmall,
    color: Colors.textMuted,
  },
});

// ─── Advanced Filters Modal Styles ────────────────────────────────────────────

const advStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Colors.border,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  body: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  label: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optBtnActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderColor: Colors.primary,
  },
  optText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  optTextActive: {
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  resetText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  applyBtn: {
    flex: 2,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  applyText: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.background,
  },
});
