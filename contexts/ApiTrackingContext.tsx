// API Tracking Context - Blink DB
import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { useAuth } from './AuthContext';
import { blink } from '@/lib/blink';
import { getUserApiStats, ApiStats } from '@/services/api-tracking';
import { checkApiLimits } from '@/services/api-tracking';

interface ApiKey {
  id: string;
  api_type: string;
  key_name: string | null;
  daily_limit_tokens: number | null;
  monthly_limit_tokens: number | null;
  daily_limit_cost: number | null;
  monthly_limit_cost: number | null;
  total_uses: number;
  total_tokens: number;
  total_cost: number;
  last_used_at: string | null;
  is_active: boolean;
}

interface ApiUsage {
  id: string;
  api_type: string;
  tokens_total: number;
  cost_total: number;
  duration_ms: number;
  operation_type: string;
  status: string;
  created_at: string;
}

interface ApiTrackingContextType {
  stats: ApiStats[];
  statsLoading: boolean;
  apiKeys: ApiKey[];
  keysLoading: boolean;
  recentUsage: ApiUsage[];
  usageLoading: boolean;
  limitsExceeded: boolean;
  limitMessage: string | null;
  refreshStats: (period?: 'day' | 'week' | 'month' | 'year') => Promise<void>;
  refreshKeys: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  checkLimits: (apiKeyHash: string) => Promise<{ exceeded: boolean; message?: string }>;
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  averageDuration: number;
  overallSuccessRate: number;
}

export const ApiTrackingContext = createContext<ApiTrackingContextType | undefined>(undefined);

export function ApiTrackingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [stats, setStats] = useState<ApiStats[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [recentUsage, setRecentUsage] = useState<ApiUsage[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [limitsExceeded, setLimitsExceeded] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const refreshStats = async (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
    if (!user) return;
    setStatsLoading(true);
    try {
      const { data, error } = await getUserApiStats(period);
      if (!error && data) setStats(data);
    } catch (error) {
      console.error('❌ Failed to refresh stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const refreshKeys = async () => {
    if (!user) return;
    setKeysLoading(true);
    try {
      // user_api_keys table not in Blink DB — return empty
      setApiKeys([]);
    } catch (error) {
      console.error('❌ Failed to refresh keys:', error);
    } finally {
      setKeysLoading(false);
    }
  };

  const refreshUsage = async () => {
    if (!user) return;
    setUsageLoading(true);
    try {
      const data = await blink.db.apiUsage.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 20,
      });
      setRecentUsage(
        (data as any[]).map((d) => ({
          id: d.id,
          api_type: d.apiType,
          tokens_total: Number(d.tokensInput || 0) + Number(d.tokensOutput || 0),
          cost_total: Number(d.costInput || 0) + Number(d.costOutput || 0),
          duration_ms: Number(d.durationMs || 0),
          operation_type: d.operationType || 'other',
          status: d.status || 'success',
          created_at: d.createdAt,
        }))
      );
    } catch (error) {
      console.error('❌ Failed to refresh usage:', error);
    } finally {
      setUsageLoading(false);
    }
  };

  const checkLimitsWrapper = async (apiKeyHash: string) => {
    const result = await checkApiLimits(apiKeyHash);
    setLimitsExceeded(result.exceeded);
    setLimitMessage(result.message || null);
    return result;
  };

  useEffect(() => {
    if (user && !user.id.startsWith('guest_')) {
      refreshStats('month');
      refreshKeys();
      refreshUsage();
    } else {
      setStats([]);
      setApiKeys([]);
      setRecentUsage([]);
    }
  }, [user]);

  const totalCalls = stats.reduce((sum, s) => sum + Number(s.totalCalls), 0);
  const totalTokens = stats.reduce((sum, s) => sum + Number(s.totalTokens), 0);
  const totalCost = stats.reduce((sum, s) => sum + Number(s.totalCost), 0);
  const averageDuration =
    stats.length > 0
      ? stats.reduce((sum, s) => sum + Number(s.avgDurationMs), 0) / stats.length
      : 0;
  const overallSuccessRate =
    stats.length > 0
      ? stats.reduce((sum, s) => sum + Number(s.successRate), 0) / stats.length
      : 0;

  const value: ApiTrackingContextType = {
    stats,
    statsLoading,
    apiKeys,
    keysLoading,
    recentUsage,
    usageLoading,
    limitsExceeded,
    limitMessage,
    refreshStats,
    refreshKeys,
    refreshUsage,
    checkLimits: checkLimitsWrapper,
    totalCalls,
    totalTokens,
    totalCost,
    averageDuration,
    overallSuccessRate,
  };

  return (
    <ApiTrackingContext.Provider value={value}>
      {children}
    </ApiTrackingContext.Provider>
  );
}

export function useApiTracking() {
  const context = useContext(ApiTrackingContext);
  if (!context) throw new Error('useApiTracking must be used within ApiTrackingProvider');
  return context;
}
