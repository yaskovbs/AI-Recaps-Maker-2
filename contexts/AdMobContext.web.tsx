import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Web-only fallback - AdMob doesn't run on web
interface AdMobContextType {
  isTestMode: boolean;
  isInitialized: boolean;
  setTestMode: (enabled: boolean) => Promise<void>;
  showRewardedAd: () => Promise<{ success: boolean; reward?: { amount: number } }>;
  showInterstitialAd: () => Promise<boolean>;
  showAppOpenAd: () => Promise<boolean>;
  adImpressions: {
    rewarded: number;
    interstitial: number;
    appOpen: number;
  };
  resetImpressions: () => Promise<void>;
}

const AdMobContext = createContext<AdMobContextType | undefined>(undefined);

export function AdMobProvider({ children }: { children: ReactNode }) {
  const [isTestMode] = useState(false);
  const [isInitialized] = useState(false);
  const [adImpressions] = useState({
    rewarded: 0,
    interstitial: 0,
    appOpen: 0,
  });

  useEffect(() => {
    console.log('🌐 AdMob Web fallback mode - ads are not available on web platform');
  }, []);

  const setTestMode = async () => {
    console.log('Web platform: Test mode toggle not applicable');
  };

  const showRewardedAd = async (): Promise<{ success: boolean; reward?: { amount: number } }> => {
    console.log('💰 Web platform: Simulating rewarded ad');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, reward: { amount: 1 } };
  };

  const showInterstitialAd = async (): Promise<boolean> => {
    console.log('📺 Web platform: Simulating interstitial ad');
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  };

  const showAppOpenAd = async (): Promise<boolean> => {
    console.log('🚪 Web platform: App Open ads not applicable');
    return false;
  };

  const resetImpressions = async () => {
    console.log('Web platform: Impressions reset (no-op)');
  };

  const value: AdMobContextType = {
    isTestMode,
    isInitialized,
    setTestMode,
    showRewardedAd,
    showInterstitialAd,
    showAppOpenAd,
    adImpressions,
    resetImpressions,
  };

  return <AdMobContext.Provider value={value}>{children}</AdMobContext.Provider>;
}

export function useAdMob() {
  const context = useContext(AdMobContext);
  if (!context) {
    throw new Error('useAdMob must be used within AdMobProvider');
  }
  return context;
}
