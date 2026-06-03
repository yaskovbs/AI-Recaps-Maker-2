/**
 * AdMob Service
 * Handles all AdMob ad operations with frequency control and continuous learning.
 *
 * Real ad display is handled by AdMobContext.native.tsx (uses react-native-google-mobile-ads).
 * This service layer handles frequency tracking, impression recording, and learning analytics.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdMobConfig, RewardConfig } from '@/constants/admob';

const STORAGE_KEY = '@airm_admob_impressions';
const LEARNING_DATA_KEY = '@airm_admob_learning';

interface ImpressionRecord {
  timestamp: number;
  adType: 'appOpen' | 'interstitial' | 'rewarded' | 'rewardedInterstitial';
}

/**
 * Continuous Learning Data — tracks user ad interaction patterns
 * to optimize ad timing and reduce user disruption.
 */
interface AdLearningData {
  // Total ads watched per type
  totalWatched: Record<string, number>;
  // Total ads dismissed/skipped per type
  totalDismissed: Record<string, number>;
  // Average time of day user engages with rewarded ads (hour 0-23)
  preferredHours: number[];
  // Last 30 days engagement rate (watched / shown)
  engagementRate: number;
  // Tracks which sessions had ads shown
  sessionsWithAds: number;
  totalSessions: number;
  lastUpdated: number;
}

const DEFAULT_LEARNING_DATA: AdLearningData = {
  totalWatched: {},
  totalDismissed: {},
  preferredHours: [],
  engagementRate: 1,
  sessionsWithAds: 0,
  totalSessions: 0,
  lastUpdated: Date.now(),
};

/**
 * Load learning data from storage
 */
async function loadLearningData(): Promise<AdLearningData> {
  try {
    const stored = await AsyncStorage.getItem(LEARNING_DATA_KEY);
    if (stored) {
      return { ...DEFAULT_LEARNING_DATA, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load ad learning data:', error);
  }
  return { ...DEFAULT_LEARNING_DATA };
}

/**
 * Save learning data to storage
 */
async function saveLearningData(data: AdLearningData): Promise<void> {
  try {
    data.lastUpdated = Date.now();
    await AsyncStorage.setItem(LEARNING_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save ad learning data:', error);
  }
}

/**
 * Record ad interaction for continuous learning
 */
export async function recordAdInteraction(
  adType: string,
  action: 'watched' | 'dismissed' | 'session'
): Promise<void> {
  const data = await loadLearningData();

  if (action === 'watched') {
    data.totalWatched[adType] = (data.totalWatched[adType] || 0) + 1;
    data.preferredHours.push(new Date().getHours());
    // Keep only last 100 entries
    if (data.preferredHours.length > 100) {
      data.preferredHours = data.preferredHours.slice(-100);
    }
    data.sessionsWithAds++;
  } else if (action === 'dismissed') {
    data.totalDismissed[adType] = (data.totalDismissed[adType] || 0) + 1;
  } else if (action === 'session') {
    data.totalSessions++;
  }

  // Recalculate engagement rate
  const totalShown = Object.values(data.totalWatched).reduce((a, b) => a + b, 0) +
    Object.values(data.totalDismissed).reduce((a, b) => a + b, 0);
  const totalWatchedCount = Object.values(data.totalWatched).reduce((a, b) => a + b, 0);
  data.engagementRate = totalShown > 0 ? totalWatchedCount / totalShown : 1;

  await saveLearningData(data);
}

/**
 * Get learning insights for ad optimization
 */
export async function getAdLearningInsights(): Promise<{
  engagementRate: number;
  preferredHour: number | null;
  shouldReduceFrequency: boolean;
  totalAdsWatched: number;
}> {
  const data = await loadLearningData();

  // Find most common hour
  let preferredHour: number | null = null;
  if (data.preferredHours.length > 5) {
    const hourCounts: Record<number, number> = {};
    data.preferredHours.forEach((h) => {
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });
    preferredHour = Number(
      Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0]
    );
  }

  const totalAdsWatched = Object.values(data.totalWatched).reduce((a, b) => a + b, 0);

  return {
    engagementRate: data.engagementRate,
    preferredHour,
    // If engagement rate drops below 30%, suggest reducing frequency
    shouldReduceFrequency: data.engagementRate < 0.3 && totalAdsWatched > 10,
    totalAdsWatched,
  };
}

/**
 * Check if ad can be shown based on frequency limits
 */
async function canShowAd(
  adType: 'appOpen' | 'interstitial' | 'rewarded' | 'rewardedInterstitial'
): Promise<boolean> {
  try {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const settings = AdMobConfig[platform].settings;

    // Get frequency config for this ad type
    const frequencyKey = `${adType}Frequency` as keyof typeof settings;
    const frequency = settings[frequencyKey];

    if (!frequency) return true; // No limit
    if (frequency.maxImpressions === Infinity) return true; // Unlimited

    // Load impression history
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const impressions: ImpressionRecord[] = stored ? JSON.parse(stored) : [];

    // Filter impressions within time window
    const now = Date.now();
    const windowMs = frequency.perHours * 60 * 60 * 1000;
    const recentImpressions = impressions.filter(
      (imp) => imp.adType === adType && now - imp.timestamp < windowMs
    );

    // Check if under limit
    return recentImpressions.length < frequency.maxImpressions;
  } catch (error) {
    console.error('Failed to check ad frequency:', error);
    return true; // Allow on error
  }
}

/**
 * Record ad impression
 */
async function recordImpression(
  adType: 'appOpen' | 'interstitial' | 'rewarded' | 'rewardedInterstitial'
): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const impressions: ImpressionRecord[] = stored ? JSON.parse(stored) : [];

    // Add new impression
    impressions.push({
      timestamp: Date.now(),
      adType,
    });

    // Clean old impressions (older than 24 hours)
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const filtered = impressions.filter((imp) => imp.timestamp > dayAgo);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    // Record for continuous learning
    await recordAdInteraction(adType, 'watched');
  } catch (error) {
    console.error('Failed to record impression:', error);
  }
}

/**
 * App Open Ad
 * Real ad display is handled by AdMobContext.native.tsx (uses react-native-google-mobile-ads).
 * This service layer handles frequency tracking only.
 */
export async function showAppOpenAd(): Promise<boolean> {
  const canShow = await canShowAd('appOpen');
  if (!canShow) {
    console.log('App Open ad frequency limit reached');
    return false;
  }

  // Real ad display is handled by AdMobContext.native.tsx (uses react-native-google-mobile-ads).
  // This service layer handles frequency tracking only.
  console.log('Showing App Open ad (service layer - tracking)');
  await recordImpression('appOpen');
  return true;
}

/**
 * Interstitial Ad
 * Real ad display is handled by AdMobContext.native.tsx (uses react-native-google-mobile-ads).
 * This service layer handles frequency tracking only.
 */
export async function showInterstitialAd(): Promise<boolean> {
  const canShow = await canShowAd('interstitial');
  if (!canShow) {
    console.log('Interstitial ad frequency limit reached');
    return false;
  }

  // Real ad display is handled by AdMobContext.native.tsx (uses react-native-google-mobile-ads).
  // This service layer handles frequency tracking only.
  console.log('Showing Interstitial ad (service layer - tracking)');
  await recordImpression('interstitial');
  return true;
}

/**
 * Rewarded Ad
 * Real ad display is handled by AdMobContext.native.tsx (uses react-native-google-mobile-ads).
 * This service layer handles frequency tracking only.
 */
export async function showRewardedAd(): Promise<{
  success: boolean;
  reward?: { amount: number; name: string };
}> {
  const canShow = await canShowAd('rewarded');
  if (!canShow) {
    console.log('Rewarded ad frequency limit reached');
    return { success: false };
  }

  // Real ad display is handled by AdMobContext.native.tsx (uses react-native-google-mobile-ads).
  // This service layer handles frequency tracking only.
  console.log('Showing Rewarded ad (service layer - tracking)');
  await recordImpression('rewarded');

  return {
    success: true,
    reward: {
      amount: RewardConfig.rewardAmount,
      name: RewardConfig.rewardName,
    },
  };
}

/**
 * Rewarded Interstitial Ad
 * Real ad display is handled by AdMobContext.native.tsx (uses react-native-google-mobile-ads).
 * This service layer handles frequency tracking only.
 */
export async function showRewardedInterstitialAd(): Promise<{
  success: boolean;
  reward?: { amount: number; name: string };
}> {
  const canShow = await canShowAd('rewardedInterstitial');
  if (!canShow) {
    console.log('Rewarded Interstitial ad frequency limit reached');
    return { success: false };
  }

  // Real ad display is handled by AdMobContext.native.tsx (uses react-native-google-mobile-ads).
  // This service layer handles frequency tracking only.
  console.log('Showing Rewarded Interstitial ad (service layer - tracking)');
  await recordImpression('rewardedInterstitial');

  return {
    success: true,
    reward: {
      amount: RewardConfig.rewardAmount,
      name: RewardConfig.rewardName,
    },
  };
}

/**
 * Get a formatted summary of continuous-learning stats for display in Settings.
 */
export async function getLearningStats(): Promise<{
  totalWatched: number;
  totalDismissed: number;
  engagementRate: number;
  preferredHour: number | null;
  preferredHourLabel: string;
  lastUpdated: number | null;
}> {
  const data = await loadLearningData();

  const totalWatched = Object.values(data.totalWatched).reduce((a, b) => a + b, 0);
  const totalDismissed = Object.values(data.totalDismissed).reduce((a, b) => a + b, 0);

  let preferredHour: number | null = null;
  if (data.preferredHours.length > 5) {
    const counts: Record<number, number> = {};
    data.preferredHours.forEach((h) => {
      counts[h] = (counts[h] || 0) + 1;
    });
    preferredHour = Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
  }

  const preferredHourLabel =
    preferredHour !== null
      ? `${preferredHour}:00–${preferredHour + 1}:00`
      : '—';

  return {
    totalWatched,
    totalDismissed,
    engagementRate: Math.round(data.engagementRate * 100),
    preferredHour,
    preferredHourLabel,
    lastUpdated: data.lastUpdated || null,
  };
}

/**
 * Reset all continuous-learning data (called from Settings → Reset Learning Data).
 */
export async function resetLearningData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LEARNING_DATA_KEY);
    console.log('🗑️ AdMob learning data reset');
  } catch (error) {
    console.error('Failed to reset learning data:', error);
  }
}

/**
 * Get ad unit IDs (for direct usage)
 */
export function getAdUnitId(
  adType: 'appOpen' | 'interstitial' | 'rewarded' | 'rewardedInterstitial' | 'banner',
  useTestIds = false
): string {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  if (adType === 'banner') {
    // Banner test ID (Google official)
    if (useTestIds) return platform === 'ios'
      ? 'ca-app-pub-3940256099942544/2934735716'
      : 'ca-app-pub-3940256099942544/6300978111';
    // Real banner IDs — android has it, iOS falls back to android
    const androidBanner = 'ca-app-pub-9953179201685717/1363779404';
    return androidBanner;
  }
  const config = useTestIds ? AdMobConfig.test : AdMobConfig;
  return (config[platform].adUnits as any)[adType] ?? '';
}

/**
 * Get app ID (for initialization)
 */
export function getAppId(useTestIds = false): string {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const config = useTestIds ? AdMobConfig.test : AdMobConfig;
  return config[platform].appId;
}
