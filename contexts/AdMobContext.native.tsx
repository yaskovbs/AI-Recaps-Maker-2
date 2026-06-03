import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus, Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';
import { getAdUnitId, getAppId } from '@/services/admob';

// Check if native module exists BEFORE attempting to require
const hasNativeModule = Boolean(NativeModules.RNGoogleMobileAdsModule);
const isExpoGo = Constants.appOwnership === 'expo';

// Runtime check for AdMob SDK availability
let isAdMobAvailable = false;
let mobileAds: any = null;
let InterstitialAd: any = null;
let RewardedAd: any = null;
let AppOpenAd: any = null;
let MaxAdContentRating: any = null;
let RewardedAdEventType: any = null;
let AdEventType: any = null;

// Safe lazy loading - only attempt if native module exists
function loadAdMobSDK() {
  if (isAdMobAvailable) return true;
  
  // CRITICAL: Check native module availability FIRST
  // This prevents the require() from being called in Expo Go
  if (isExpoGo || !hasNativeModule) {
    console.log('📱 Running in Expo Go or native module not available');
    console.log('   Ads will be simulated in fallback mode');
    console.log('   To enable real ads: build a Dev Client with "npx eas build --profile development"');
    return false;
  }
  
  try {
    // Only require if native module exists
    const adMobModule = require('react-native-google-mobile-ads');
    
    if (adMobModule?.default) {
      mobileAds = adMobModule.default;
      InterstitialAd = adMobModule.InterstitialAd;
      RewardedAd = adMobModule.RewardedAd;
      AppOpenAd = adMobModule.AppOpenAd;
      MaxAdContentRating = adMobModule.MaxAdContentRating;
      RewardedAdEventType = adMobModule.RewardedAdEventType;
      AdEventType = adMobModule.AdEventType;
      isAdMobAvailable = true;
      console.log('✅ AdMob SDK loaded successfully');
      return true;
    }
  } catch (error: any) {
    // Fallback for other environments where module might not be available
    console.log('ℹ️ AdMob SDK not available:', error?.message || 'Unknown error');
    console.log('   Running in fallback mode - ads will be simulated');
  }
  
  return false;
}

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

const STORAGE_KEY_TEST_MODE = '@airm_admob_test_mode';
const STORAGE_KEY_IMPRESSIONS = '@airm_admob_impressions';
const STORAGE_KEY_LAST_APP_OPEN = '@airm_admob_last_app_open';

export function AdMobProvider({ children }: { children: ReactNode }) {
  const [isTestMode, setIsTestMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [adImpressions, setAdImpressions] = useState({
    rewarded: 0,
    interstitial: 0,
    appOpen: 0,
  });
  
  const [rewardedAd, setRewardedAd] = useState<typeof RewardedAd | null>(null);
  const [interstitialAd, setInterstitialAd] = useState<typeof InterstitialAd | null>(null);
  const [appOpenAd, setAppOpenAd] = useState<typeof AppOpenAd | null>(null);

  useEffect(() => {
    // Try to load AdMob SDK
    const sdkLoaded = loadAdMobSDK();
    
    if (sdkLoaded) {
      initializeAdMob();
      setupAppStateListener();
    } else {
      setIsInitialized(false);
      console.log('📱 Running in Expo Go fallback mode - ads will be simulated');
    }
    
    loadTestMode();
    loadImpressions();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      preloadAds();
    }
  }, [isInitialized, isTestMode]);

  const initializeAdMob = async () => {
    if (!isAdMobAvailable) {
      console.log('Skipping AdMob initialization - SDK not available');
      return;
    }
    
    try {
      await mobileAds().initialize();
      
      // Set content rating
      await mobileAds().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.PG,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
      });
      
      setIsInitialized(true);
      console.log('AdMob initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AdMob:', error);
      setIsInitialized(false);
    }
  };

  const loadTestMode = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_TEST_MODE);
      if (stored !== null) {
        setIsTestMode(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load test mode:', error);
    }
  };

  const loadImpressions = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_IMPRESSIONS);
      if (stored) {
        setAdImpressions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load impressions:', error);
    }
  };

  const saveImpressions = async (impressions: typeof adImpressions) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_IMPRESSIONS, JSON.stringify(impressions));
      setAdImpressions(impressions);
    } catch (error) {
      console.error('Failed to save impressions:', error);
    }
  };

  const setTestMode = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_TEST_MODE, JSON.stringify(enabled));
      setIsTestMode(enabled);
      // Reload ads with new mode
      preloadAds();
    } catch (error) {
      console.error('Failed to set test mode:', error);
    }
  };

  const preloadAds = () => {
    if (!isAdMobAvailable || !isInitialized) {
      return; // Silent skip - normal in Expo Go
    }
    
    try {
      // Rewarded Ad
      const rewarded = RewardedAd.createForAdRequest(getAdUnitId('rewarded', isTestMode));
      rewarded.load();
      setRewardedAd(rewarded);

      // Interstitial Ad
      const interstitial = InterstitialAd.createForAdRequest(getAdUnitId('interstitial', isTestMode));
      interstitial.load();
      setInterstitialAd(interstitial);

      // App Open Ad
      const appOpen = AppOpenAd.createForAdRequest(getAdUnitId('appOpen', isTestMode));
      appOpen.load();
      setAppOpenAd(appOpen);
      
      console.log('📢 Ads preloaded successfully');
    } catch (error) {
      console.error('❌ Failed to preload ads:', error);
    }
  };

  const showRewardedAd = async (): Promise<{ success: boolean; reward?: { amount: number } }> => {
    if (!isAdMobAvailable) {
      console.log('💰 AdMob not available - simulating rewarded ad');
      // Fallback: simulate successful ad watch (for Expo Go)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate ad duration
      return { success: true, reward: { amount: 1 } };
    }
    
    return new Promise((resolve) => {
      if (!rewardedAd) {
        console.log('Rewarded ad not loaded');
        resolve({ success: false });
        return;
      }

      let rewarded = false;

      const unsubscribeEarned = rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward: any) => {
        console.log('User earned reward:', reward);
        rewarded = true;
      });

      const unsubscribeLoaded = rewardedAd.addAdEventListener(AdEventType.LOADED, () => {
        rewardedAd.show();
      });

      const unsubscribeClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
        unsubscribeEarned();
        unsubscribeLoaded();
        unsubscribeClosed();
        
        // Increment impression count
        const newImpressions = { ...adImpressions, rewarded: adImpressions.rewarded + 1 };
        saveImpressions(newImpressions);
        
        // Preload next ad
        preloadAds();
        
        resolve({ success: rewarded, reward: rewarded ? { amount: 1 } : undefined });
      });

      // If already loaded, show immediately
      if (rewardedAd.loaded) {
        rewardedAd.show();
      } else {
        rewardedAd.load();
      }
    });
  };

  const showInterstitialAd = async (): Promise<boolean> => {
    if (!isAdMobAvailable) {
      console.log('📺 AdMob not available - simulating interstitial ad');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate ad duration
      return true;
    }
    
    return new Promise((resolve) => {
      if (!interstitialAd) {
        console.log('Interstitial ad not loaded');
        resolve(false);
        return;
      }

      const unsubscribeLoaded = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        interstitialAd.show();
      });

      const unsubscribeClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        unsubscribeLoaded();
        unsubscribeClosed();
        
        // Increment impression count
        const newImpressions = { ...adImpressions, interstitial: adImpressions.interstitial + 1 };
        saveImpressions(newImpressions);
        
        // Preload next ad
        preloadAds();
        
        resolve(true);
      });

      // If already loaded, show immediately
      if (interstitialAd.loaded) {
        interstitialAd.show();
      } else {
        interstitialAd.load();
      }
    });
  };

  const showAppOpenAd = async (): Promise<boolean> => {
    if (!isAdMobAvailable) {
      // Silent skip in fallback mode
      return false;
    }
    
    try {
      // Check cooldown (5 hours)
      const lastShown = await AsyncStorage.getItem(STORAGE_KEY_LAST_APP_OPEN);
      if (lastShown) {
        const hoursSince = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60);
        const cooldownHours = Platform.OS === 'ios' ? 5 : 3;
        
        if (hoursSince < cooldownHours) {
          console.log(`App Open ad cooldown active (${hoursSince.toFixed(1)}h / ${cooldownHours}h)`);
          return false;
        }
      }

      return new Promise((resolve) => {
        if (!appOpenAd) {
          console.log('App Open ad not loaded');
          resolve(false);
          return;
        }

        const unsubscribeLoaded = appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
          appOpenAd.show();
        });

        const unsubscribeClosed = appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
          unsubscribeLoaded();
          unsubscribeClosed();
          
          // Save last shown timestamp
          AsyncStorage.setItem(STORAGE_KEY_LAST_APP_OPEN, Date.now().toString());
          
          // Increment impression count
          const newImpressions = { ...adImpressions, appOpen: adImpressions.appOpen + 1 };
          saveImpressions(newImpressions);
          
          // Preload next ad
          preloadAds();
          
          resolve(true);
        });

        // If already loaded, show immediately
        if (appOpenAd.loaded) {
          appOpenAd.show();
        } else {
          appOpenAd.load();
        }
      });
    } catch (error) {
      console.error('Failed to show App Open ad:', error);
      return false;
    }
  };

  const setupAppStateListener = () => {
    let appState = AppState.currentState;

    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground
        console.log('App has come to foreground - attempting to show App Open ad');
        showAppOpenAd();
      }
      appState = nextAppState;
    });
  };

  const resetImpressions = async () => {
    const reset = { rewarded: 0, interstitial: 0, appOpen: 0 };
    await saveImpressions(reset);
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
