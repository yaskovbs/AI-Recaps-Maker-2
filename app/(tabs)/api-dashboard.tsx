// API Dashboard Screen - Detailed API Usage Statistics
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApiTracking } from '@/hooks/useApiTracking';
import { formatCost } from '@/services/api-tracking';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

type Period = 'day' | 'week' | 'month' | 'year';

export default function ApiDashboardScreen() {
  const insets = useSafeAreaInsets();
  const {
    stats,
    statsLoading,
    apiKeys,
    recentUsage,
    totalCalls,
    totalTokens,
    totalCost,
    averageDuration,
    overallSuccessRate,
    refreshStats,
  } = useApiTracking();

  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshStats(selectedPeriod);
  }, [selectedPeriod]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshStats(selectedPeriod);
    setRefreshing(false);
  };

  const handleExportCSV = () => {
    // Format data as CSV
    const headers = 'Date,API Type,Tokens,Cost (USD),Duration (s),Status\n';
    const rows = recentUsage
      .map((usage) => {
        const date = new Date(usage.created_at).toLocaleDateString();
        const cost = (usage.cost_total / 100).toFixed(4);
        const duration = (usage.duration_ms / 1000).toFixed(2);
        return `${date},${usage.api_type},${usage.tokens_total},${cost},${duration},${usage.status}`;
      })
      .join('\n');

    const csv = headers + rows;

    // Download CSV (Web only for now)
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-usage-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      console.log('✅ CSV exported');
    } else {
      console.log('📊 CSV export:', csv);
      alert('CSV exported to console (mobile sharing coming soon)');
    }
  };

  if (statsLoading && stats.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>API Dashboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>טוען סטטיסטיקות...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>API Dashboard</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={handleRefresh} disabled={refreshing}>
            <MaterialIcons
              name="refresh"
              size={24}
              color={refreshing ? Colors.textMuted : Colors.primary}
            />
          </Pressable>
          <Pressable onPress={handleExportCSV}>
            <MaterialIcons name="file-download" size={24} color={Colors.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['day', 'week', 'month', 'year'] as Period[]).map((period) => (
            <Pressable
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive,
                ]}
              >
                {period === 'day' && 'יום'}
                {period === 'week' && 'שבוע'}
                {period === 'month' && 'חודש'}
                {period === 'year' && 'שנה'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="api"
            label="קריאות API"
            value={totalCalls.toLocaleString()}
            color={Colors.primary}
          />
          <SummaryCard
            icon="token"
            label="טוקנים"
            value={totalTokens.toLocaleString()}
            color="#FF9800"
          />
          <SummaryCard
            icon="attach-money"
            label="עלות"
            value={formatCost(totalCost)}
            color="#4CAF50"
          />
          <SummaryCard
            icon="speed"
            label="זמן ממוצע"
            value={`${(averageDuration / 1000).toFixed(1)}s`}
            color="#9C27B0"
          />
          <SummaryCard
            icon="check-circle"
            label="Success Rate"
            value={`${overallSuccessRate.toFixed(1)}%`}
            color={overallSuccessRate >= 90 ? Colors.success : Colors.warning}
          />
          <SummaryCard
            icon="vpn-key"
            label="API Keys"
            value={apiKeys.filter((k) => k.is_active).length.toString()}
            color="#607D8B"
          />
        </View>

        {/* API Type Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פילוח לפי סוג API</Text>
          {stats.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="bar-chart" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>אין נתונים לתקופה זו</Text>
            </View>
          ) : (
            stats.map((stat, index) => (
              <ApiTypeCard key={index} stat={stat} />
            ))
          )}
        </View>

        {/* Recent Usage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>שימוש אחרון</Text>
          {recentUsage.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="history" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>אין שימוש אחרון</Text>
            </View>
          ) : (
            recentUsage.slice(0, 10).map((usage) => (
              <UsageRow key={usage.id} usage={usage} />
            ))
          )}
        </View>

        {/* API Keys Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>מפתחות API</Text>
          {apiKeys.filter((k) => k.is_active).length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="vpn-key" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>אין מפתחות פעילים</Text>
            </View>
          ) : (
            apiKeys
              .filter((k) => k.is_active)
              .map((key) => <ApiKeyCard key={key.id} apiKey={key} />)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <MaterialIcons name={icon} size={28} color={color} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function ApiTypeCard({ stat }: { stat: any }) {
  const costUSD = Number(stat.totalCost) / 100;
  const avgDurationSec = Number(stat.avgDurationMs) / 1000;

  return (
    <View style={styles.apiTypeCard}>
      <View style={styles.apiTypeHeader}>
        <Text style={styles.apiTypeName}>{stat.apiType.toUpperCase()}</Text>
        <Text style={styles.apiTypeSuccess}>
          {Number(stat.successRate).toFixed(1)}% Success
        </Text>
      </View>
      
      <View style={styles.apiTypeStats}>
        <View style={styles.apiTypeStat}>
          <MaterialIcons name="api" size={16} color={Colors.textMuted} />
          <Text style={styles.apiTypeStatValue}>
            {Number(stat.totalCalls).toLocaleString()} calls
          </Text>
        </View>
        
        <View style={styles.apiTypeStat}>
          <MaterialIcons name="token" size={16} color={Colors.textMuted} />
          <Text style={styles.apiTypeStatValue}>
            {Number(stat.totalTokens).toLocaleString()} tokens
          </Text>
        </View>
        
        <View style={styles.apiTypeStat}>
          <MaterialIcons name="attach-money" size={16} color={Colors.textMuted} />
          <Text style={styles.apiTypeStatValue}>${costUSD.toFixed(4)}</Text>
        </View>
        
        <View style={styles.apiTypeStat}>
          <MaterialIcons name="speed" size={16} color={Colors.textMuted} />
          <Text style={styles.apiTypeStatValue}>{avgDurationSec.toFixed(2)}s avg</Text>
        </View>
      </View>
    </View>
  );
}

function UsageRow({ usage }: { usage: any }) {
  const date = new Date(usage.created_at);
  const timeAgo = getTimeAgo(date);
  const costUSD = usage.cost_total / 100;

  return (
    <View style={styles.usageRow}>
      <View style={styles.usageLeft}>
        <MaterialIcons
          name={usage.status === 'success' ? 'check-circle' : 'error'}
          size={20}
          color={usage.status === 'success' ? Colors.success : Colors.error}
        />
        <View>
          <Text style={styles.usageApi}>{usage.api_type}</Text>
          <Text style={styles.usageTime}>{timeAgo}</Text>
        </View>
      </View>
      
      <View style={styles.usageRight}>
        <Text style={styles.usageTokens}>{usage.tokens_total.toLocaleString()} tokens</Text>
        <Text style={styles.usageCost}>${costUSD.toFixed(4)}</Text>
      </View>
    </View>
  );
}

function ApiKeyCard({ apiKey }: { apiKey: any }) {
  const costUSD = apiKey.total_cost / 100;

  return (
    <View style={styles.apiKeyCard}>
      <View style={styles.apiKeyHeader}>
        <MaterialIcons name="vpn-key" size={20} color={Colors.primary} />
        <Text style={styles.apiKeyName}>
          {apiKey.key_name || apiKey.api_type.toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.apiKeyStats}>
        <View style={styles.apiKeyStat}>
          <Text style={styles.apiKeyStatLabel}>Total Uses</Text>
          <Text style={styles.apiKeyStatValue}>{apiKey.total_uses.toLocaleString()}</Text>
        </View>
        <View style={styles.apiKeyStat}>
          <Text style={styles.apiKeyStatLabel}>Total Tokens</Text>
          <Text style={styles.apiKeyStatValue}>{apiKey.total_tokens.toLocaleString()}</Text>
        </View>
        <View style={styles.apiKeyStat}>
          <Text style={styles.apiKeyStatLabel}>Total Cost</Text>
          <Text style={styles.apiKeyStatValue}>${costUSD.toFixed(2)}</Text>
        </View>
      </View>
      
      {apiKey.last_used_at && (
        <Text style={styles.apiKeyLastUsed}>
          Last used: {getTimeAgo(new Date(apiKey.last_used_at))}
        </Text>
      )}
    </View>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.body,
    color: Colors.textMuted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  
  periodSelector: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodButtonText: {
    fontSize: Typography.body,
    color: Colors.textMuted,
    fontWeight: Typography.semibold,
  },
  periodButtonTextActive: {
    color: Colors.background,
  },
  
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryValue: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  
  apiTypeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  apiTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  apiTypeName: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  apiTypeSuccess: {
    fontSize: Typography.bodySmall,
    color: Colors.success,
  },
  apiTypeStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  apiTypeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    width: '48%',
  },
  apiTypeStatValue: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
  },
  
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  usageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  usageApi: {
    fontSize: Typography.body,
    color: Colors.text,
    fontWeight: Typography.semibold,
  },
  usageTime: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
  },
  usageRight: {
    alignItems: 'flex-end',
  },
  usageTokens: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
  },
  usageCost: {
    fontSize: Typography.body,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  
  apiKeyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  apiKeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  apiKeyName: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  apiKeyStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  apiKeyStat: {
    flex: 1,
  },
  apiKeyStatLabel: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
  },
  apiKeyStatValue: {
    fontSize: Typography.body,
    color: Colors.text,
    fontWeight: Typography.semibold,
  },
  apiKeyLastUsed: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.body,
    color: Colors.textMuted,
  },
});
