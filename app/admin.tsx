import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { blink } from '@/lib/blink';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ApiUsageRecord {
  id: string;
  apiType?: string;
  costInput?: number;
  costOutput?: number;
  createdAt?: string;
  userId?: string;
}

interface UserCreditsRecord {
  id: string;
  userId?: string;
  balance?: number;
  totalGranted?: number;
}

interface UserProfileRecord {
  id: string;
  userId?: string;
  displayName?: string;
  email?: string;
  isAdmin?: boolean;
  createdAt?: string;
}

interface ContactRecord {
  id: string;
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  status?: string;
  createdAt?: string;
}

interface DashboardData {
  apiUsage: ApiUsageRecord[];
  recapsCount: number;
  userCredits: UserCreditsRecord[];
  userProfiles: UserProfileRecord[];
  contacts: ContactRecord[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCostToDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function groupByApiType(records: ApiUsageRecord[]) {
  const map: Record<string, { calls: number; cost: number }> = {};
  for (const r of records) {
    const type = r.apiType || 'unknown';
    if (!map[type]) map[type] = { calls: 0, cost: 0 };
    map[type].calls += 1;
    map[type].cost += (r.costInput ?? 0) + (r.costOutput ?? 0);
  }
  return Object.entries(map).sort((a, b) => b[1].calls - a[1].calls);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ icon, title, color = Colors.primary }: { icon: any; title: string; color?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconWrap, { backgroundColor: `${color}20` }]}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function OverviewCard({
  icon,
  label,
  value,
  color,
  subtitle,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  subtitle?: string;
}) {
  return (
    <View style={[styles.overviewCard, { borderColor: `${color}30` }]}>
      <View style={[styles.overviewIconWrap, { backgroundColor: `${color}18` }]}>
        <MaterialIcons name={icon} size={26} color={color} />
      </View>
      <Text style={[styles.overviewValue, { color }]}>{value}</Text>
      <Text style={styles.overviewLabel}>{label}</Text>
      {subtitle ? <Text style={styles.overviewSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function NeonDivider() {
  return <View style={styles.neonDivider} />;
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status || 'pending').toLowerCase();
  const color =
    s === 'resolved' || s === 'closed'
      ? Colors.success
      : s === 'open' || s === 'new'
      ? Colors.primary
      : Colors.warning;
  return (
    <View style={[styles.badge, { backgroundColor: `${color}20`, borderColor: `${color}50` }]}>
      <Text style={[styles.badgeText, { color }]}>{status || 'pending'}</Text>
    </View>
  );
}

function AdminBadge() {
  return (
    <View style={[styles.badge, { backgroundColor: `${Colors.secondary}20`, borderColor: `${Colors.secondary}50` }]}>
      <MaterialIcons name="verified-user" size={10} color={Colors.secondary} style={{ marginRight: 2 }} />
      <Text style={[styles.badgeText, { color: Colors.secondary }]}>Admin</Text>
    </View>
  );
}

// ─── Access Denied Screen ────────────────────────────────────────────────────

function AccessDeniedScreen() {
  const router = useRouter();
  const { isRTL } = useLanguage();

  return (
    <View style={styles.accessDeniedContainer}>
      <View style={styles.accessDeniedCard}>
        <View style={styles.accessDeniedIconWrap}>
          <MaterialIcons name="lock" size={56} color={Colors.error} />
        </View>
        <Text style={styles.accessDeniedTitle}>
          {isRTL ? 'גישה נדחתה' : 'Access Denied'}
        </Text>
        <Text style={styles.accessDeniedSubtitle}>
          {isRTL
            ? 'אין לך הרשאות מנהל לצפות בדף זה.'
            : 'You do not have administrator privileges to view this page.'}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.accessDeniedButton, pressed && styles.pressed]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={20} color={Colors.background} />
          <Text style={styles.accessDeniedButtonText}>
            {isRTL ? 'חזרה' : 'Go Back'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { isRTL } = useLanguage();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [apiUsage, recapsCount, userCredits, userProfiles, contacts] = await Promise.all([
        blink.db.apiUsage.list({ orderBy: { createdAt: 'desc' }, limit: 100 }),
        blink.db.recaps.count({}),
        blink.db.userCredits.list({}),
        blink.db.userProfiles.list({}),
        blink.db.contacts.list({ orderBy: { createdAt: 'desc' }, limit: 20 }),
      ]);

      setData({
        apiUsage: apiUsage as ApiUsageRecord[],
        recapsCount: recapsCount as number,
        userCredits: userCredits as UserCreditsRecord[],
        userProfiles: userProfiles as UserProfileRecord[],
        contacts: contacts as ContactRecord[],
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to load data');
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchData().finally(() => setIsLoading(false));
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);

  // Guard: non-admin (must be after all hooks)
  if (!user?.isAdmin) {
    return (
      <View style={[styles.rootContainer, { paddingTop: insets.top }]}>
        <AccessDeniedScreen />
      </View>
    );
  }

  // ── Derived stats ──
  const totalApiCalls = data?.apiUsage.length ?? 0;
  const totalRevenueCents = (data?.apiUsage ?? []).reduce(
    (acc, r) => acc + (r.costInput ?? 0) + (r.costOutput ?? 0),
    0
  );
  const totalUsersCount = data?.userProfiles.length ?? 0;
  const totalCreditsDistributed = (data?.userCredits ?? []).reduce(
    (acc, r) => acc + (r.totalGranted ?? 0),
    0
  );
  const totalActiveBalance = (data?.userCredits ?? []).reduce(
    (acc, r) => acc + (r.balance ?? 0),
    0
  );
  const apiTypeBreakdown = groupByApiType(data?.apiUsage ?? []);
  const recentContacts = (data?.contacts ?? []).slice(0, 10);

  return (
    <View style={[styles.rootContainer, { paddingTop: insets.top }]}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={() => router.back()}
        >
          <MaterialIcons
            name={isRTL ? 'chevron-right' : 'chevron-left'}
            size={28}
            color={Colors.text}
          />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <MaterialIcons name="admin-panel-settings" size={22} color={Colors.primary} />
            <Text style={styles.headerTitle}>
              {isRTL ? 'לוח מנהל' : 'Admin Dashboard'}
            </Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {isRTL ? 'ניטור מערכת' : 'System Monitoring'}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}
          onPress={handleRefresh}
          disabled={isRefreshing || isLoading}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <MaterialIcons name="refresh" size={24} color={Colors.primary} />
          )}
        </Pressable>
      </View>

      {/* ── Neon accent bar ────────────────────────────────────── */}
      <View style={styles.accentBar} />

      {/* ── Loading ────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {isRTL ? 'טוען נתונים...' : 'Loading data…'}
          </Text>
        </View>
      ) : error ? (
        /* ── Error ──────────────────────────────────────────────── */
        <View style={styles.loadingContainer}>
          <MaterialIcons name="error-outline" size={52} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            onPress={handleRefresh}
          >
            <MaterialIcons name="refresh" size={18} color={Colors.primary} />
            <Text style={styles.retryText}>{isRTL ? 'נסה שוב' : 'Retry'}</Text>
          </Pressable>
        </View>
      ) : (
        /* ── Content ─────────────────────────────────────────────── */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing.xxl },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          {/* ── 1. System Overview ─────────────────────────────── */}
          <View style={styles.section}>
            <SectionHeader icon="dashboard" title={isRTL ? 'סקירת מערכת' : 'System Overview'} />
            <View style={styles.overviewGrid}>
              <OverviewCard
                icon="people"
                label={isRTL ? 'סה"כ משתמשים' : 'Total Users'}
                value={totalUsersCount}
                color={Colors.primary}
              />
              <OverviewCard
                icon="movie"
                label={isRTL ? 'סה"כ סיכומים' : 'Total Recaps'}
                value={data?.recapsCount ?? 0}
                color={Colors.secondary}
              />
              <OverviewCard
                icon="api"
                label={isRTL ? 'קריאות API' : 'API Calls'}
                value={totalApiCalls}
                color={Colors.info}
              />
              <OverviewCard
                icon="attach-money"
                label={isRTL ? 'עלות כוללת' : 'Total Cost'}
                value={formatCostToDollars(totalRevenueCents)}
                color={Colors.success}
                subtitle={isRTL ? 'input + output' : 'input + output'}
              />
            </View>
          </View>

          <NeonDivider />

          {/* ── 2. API Usage Breakdown ──────────────────────────── */}
          <View style={styles.section}>
            <SectionHeader
              icon="bar-chart"
              title={isRTL ? 'פירוט שימוש ב-API' : 'API Usage Breakdown'}
              color={Colors.info}
            />

            {apiTypeBreakdown.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialIcons name="info-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyText}>
                  {isRTL ? 'אין נתוני שימוש' : 'No usage data yet'}
                </Text>
              </View>
            ) : (
              <View style={styles.card}>
                {/* Header row */}
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  <Text style={[styles.tableCell, styles.tableCellFlex, styles.tableHeaderText]}>
                    {isRTL ? 'סוג API' : 'API Type'}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableHeaderText, { textAlign: 'center' }]}>
                    {isRTL ? 'קריאות' : 'Calls'}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableHeaderText, { textAlign: 'right' }]}>
                    {isRTL ? 'עלות' : 'Cost'}
                  </Text>
                </View>

                {apiTypeBreakdown.map(([type, stats], idx) => {
                  const maxCalls = apiTypeBreakdown[0]?.[1]?.calls || 1;
                  const barPercent = stats.calls / maxCalls;
                  return (
                    <View key={type}>
                      {idx > 0 && <View style={styles.rowDivider} />}
                      <View style={styles.tableRow}>
                        <View style={[styles.tableCell, styles.tableCellFlex]}>
                          <View style={[styles.apiTypeDot, { backgroundColor: Colors.primary }]} />
                          <Text style={styles.apiTypeText} numberOfLines={1}>
                            {type}
                          </Text>
                        </View>
                        <Text style={[styles.tableCell, styles.tableCellValue, { textAlign: 'center' }]}>
                          {stats.calls}
                        </Text>
                        <Text style={[styles.tableCell, styles.tableCellValue, { textAlign: 'right', color: Colors.success }]}>
                          {formatCostToDollars(stats.cost)}
                        </Text>
                      </View>
                      {/* Mini bar */}
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${Math.round(barPercent * 100)}%` },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}

                {/* Totals footer */}
                <View style={[styles.tableRow, styles.totalsRow]}>
                  <Text style={[styles.tableCell, styles.tableCellFlex, styles.totalsLabel]}>
                    {isRTL ? 'סה"כ' : 'Total'}
                  </Text>
                  <Text style={[styles.tableCell, styles.totalsValue, { textAlign: 'center' }]}>
                    {totalApiCalls}
                  </Text>
                  <Text style={[styles.tableCell, styles.totalsValue, { textAlign: 'right', color: Colors.success }]}>
                    {formatCostToDollars(totalRevenueCents)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <NeonDivider />

          {/* ── 3. Credits Overview ─────────────────────────────── */}
          <View style={styles.section}>
            <SectionHeader
              icon="account-balance-wallet"
              title={isRTL ? 'סקירת קרדיטים' : 'Credits Overview'}
              color={Colors.warning}
            />

            <View style={styles.creditsRow}>
              <View style={[styles.creditStatCard, { borderColor: `${Colors.warning}30` }]}>
                <MaterialIcons name="redeem" size={28} color={Colors.warning} />
                <Text style={[styles.creditStatValue, { color: Colors.warning }]}>
                  {totalCreditsDistributed.toLocaleString()}
                </Text>
                <Text style={styles.creditStatLabel}>
                  {isRTL ? 'קרדיטים שניתנו' : 'Credits Distributed'}
                </Text>
              </View>

              <View style={[styles.creditStatCard, { borderColor: `${Colors.success}30` }]}>
                <MaterialIcons name="savings" size={28} color={Colors.success} />
                <Text style={[styles.creditStatValue, { color: Colors.success }]}>
                  {totalActiveBalance.toLocaleString()}
                </Text>
                <Text style={styles.creditStatLabel}>
                  {isRTL ? 'יתרה פעילה' : 'Active Balance'}
                </Text>
              </View>

              <View style={[styles.creditStatCard, { borderColor: `${Colors.primary}30` }]}>
                <MaterialIcons name="group" size={28} color={Colors.primary} />
                <Text style={[styles.creditStatValue, { color: Colors.primary }]}>
                  {data?.userCredits.length ?? 0}
                </Text>
                <Text style={styles.creditStatLabel}>
                  {isRTL ? 'חשבונות' : 'Accounts'}
                </Text>
              </View>
            </View>
          </View>

          <NeonDivider />

          {/* ── 4. Recent Contact Messages ──────────────────────── */}
          <View style={styles.section}>
            <SectionHeader
              icon="message"
              title={isRTL ? 'הודעות יצירת קשר אחרונות' : 'Recent Contact Messages'}
              color={Colors.secondary}
            />

            {recentContacts.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialIcons name="mark-email-unread" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyText}>
                  {isRTL ? 'אין הודעות' : 'No messages yet'}
                </Text>
              </View>
            ) : (
              <View style={styles.card}>
                {recentContacts.map((msg, idx) => (
                  <View key={msg.id}>
                    {idx > 0 && <View style={styles.rowDivider} />}
                    <View style={styles.contactRow}>
                      <View style={styles.contactAvatar}>
                        <Text style={styles.contactAvatarText}>
                          {(msg.name || '?').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.contactInfo}>
                        <View style={styles.contactTopRow}>
                          <Text style={styles.contactName} numberOfLines={1}>
                            {msg.name || '—'}
                          </Text>
                          <StatusBadge status={msg.status} />
                        </View>
                        <Text style={styles.contactSubject} numberOfLines={1}>
                          {msg.subject || isRTL ? 'ללא נושא' : 'No subject'}
                        </Text>
                        <Text style={styles.contactMeta}>
                          {msg.email || ''}{msg.email && msg.createdAt ? '  ·  ' : ''}{formatDate(msg.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <NeonDivider />

          {/* ── 5. User List ────────────────────────────────────── */}
          <View style={styles.section}>
            <SectionHeader
              icon="manage-accounts"
              title={isRTL ? `משתמשים (${totalUsersCount})` : `Users (${totalUsersCount})`}
              color={Colors.primary}
            />

            {(data?.userProfiles ?? []).length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialIcons name="person-off" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyText}>
                  {isRTL ? 'אין משתמשים' : 'No users found'}
                </Text>
              </View>
            ) : (
              <View style={styles.card}>
                {(data?.userProfiles ?? []).map((profile, idx) => {
                  const displayName =
                    profile.displayName ||
                    profile.email?.split('@')[0] ||
                    `User ${idx + 1}`;
                  const initials = displayName.slice(0, 2).toUpperCase();
                  return (
                    <View key={profile.id}>
                      {idx > 0 && <View style={styles.rowDivider} />}
                      <View style={styles.userRow}>
                        <View style={styles.userAvatar}>
                          <Text style={styles.userAvatarText}>{initials}</Text>
                        </View>
                        <View style={styles.userInfo}>
                          <View style={styles.userTopRow}>
                            <Text style={styles.userName} numberOfLines={1}>
                              {displayName}
                            </Text>
                            {profile.isAdmin && <AdminBadge />}
                          </View>
                          <Text style={styles.userMeta} numberOfLines={1}>
                            {profile.email || profile.userId || '—'}
                          </Text>
                          <Text style={styles.userDate}>
                            {isRTL ? 'הצטרף: ' : 'Joined: '}
                            {formatDate(profile.createdAt)}
                          </Text>
                        </View>
                        <View style={styles.userIdBadge}>
                          <Text style={styles.userIdText} numberOfLines={1}>
                            #{(profile.userId || profile.id || '').slice(-6)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* ── Footer ─────────────────────────────────────────── */}
          <View style={styles.footer}>
            <MaterialIcons name="security" size={16} color={Colors.textMuted} />
            <Text style={styles.footerText}>
              {isRTL ? 'פאנל מנהל — גישה מוגבלת' : 'Admin Panel — Restricted Access'}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
  },
  accentBar: {
    height: 2,
    backgroundColor: Colors.primary,
    opacity: 0.6,
    // Glow via shadow
    ...Shadows.neon,
    shadowOpacity: 0.9,
  },

  pressed: { opacity: 0.72 },

  // ── Loading / Error
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: Typography.body,
    color: Colors.error,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  retryText: {
    fontSize: Typography.body,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },

  // ── Scroll
  scrollView: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.xl,
  },

  // ── Section
  section: { gap: Spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.text,
  },

  // ── Overview Grid
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  overviewCard: {
    width: '47.5%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    ...Shadows.md,
  },
  overviewIconWrap: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  overviewValue: {
    fontSize: Typography.h2,
    fontWeight: Typography.bold,
  },
  overviewLabel: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  overviewSubtitle: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // ── Neon Divider
  neonDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },

  // ── Generic card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },

  // ── Empty state
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.body,
    color: Colors.textMuted,
  },

  // ── Table
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  tableHeaderRow: {
    backgroundColor: Colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableHeaderText: {
    fontSize: Typography.caption,
    fontWeight: Typography.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableCell: {
    fontSize: Typography.bodySmall,
    color: Colors.text,
    minWidth: 60,
  },
  tableCellFlex: { flex: 1 },
  tableCellValue: {
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  apiTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  apiTypeText: {
    flex: 1,
    fontSize: Typography.bodySmall,
    color: Colors.text,
    fontWeight: Typography.medium,
  },
  barTrack: {
    height: 3,
    backgroundColor: `${Colors.primary}18`,
    marginHorizontal: Spacing.md,
    borderRadius: 2,
    marginBottom: Spacing.xs,
  },
  barFill: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    opacity: 0.75,
  },
  totalsRow: {
    backgroundColor: Colors.surfaceLight,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalsLabel: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  totalsValue: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.text,
  },

  // ── Credits
  creditsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  creditStatCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  creditStatValue: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
  },
  creditStatLabel: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // ── Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: Typography.semibold,
    textTransform: 'capitalize',
  },

  // ── Contacts
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.secondary}25`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  contactAvatarText: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.secondary,
  },
  contactInfo: { flex: 1, gap: 2 },
  contactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  contactName: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semibold,
    color: Colors.text,
    flex: 1,
  },
  contactSubject: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  contactMeta: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // ── Users
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
    flexShrink: 0,
  },
  userAvatarText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  userInfo: { flex: 1, gap: 2 },
  userTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semibold,
    color: Colors.text,
    flex: 1,
  },
  userMeta: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
  },
  userDate: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
  },
  userIdBadge: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    maxWidth: 80,
  },
  userIdText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
    fontVariant: ['tabular-nums'],
  },

  // ── Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.md,
    opacity: 0.6,
  },
  footerText: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
  },

  // ── Access Denied
  accessDeniedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  accessDeniedCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.error}30`,
    width: '100%',
    maxWidth: 380,
    ...Shadows.lg,
  },
  accessDeniedIconWrap: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.error}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  accessDeniedTitle: {
    fontSize: Typography.h2,
    fontWeight: Typography.bold,
    color: Colors.error,
    textAlign: 'center',
  },
  accessDeniedSubtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  accessDeniedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    ...Shadows.sm,
  },
  accessDeniedButtonText: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.background,
  },
});
