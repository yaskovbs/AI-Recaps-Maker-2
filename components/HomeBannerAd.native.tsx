/**
 * HomeBannerAd — Native (Android / iOS)
 * Google Play policy compliant: fixed bottom, below all content, not over buttons.
 */
import React from 'react';
import { View, StyleSheet, NativeModules } from 'react-native';
import Constants from 'expo-constants';
import { Colors } from '@/constants/theme';

const isExpoGo = Constants.appOwnership === 'expo';
const hasAdMobNative = Boolean(NativeModules.RNGoogleMobileAdsModule);

let BannerAd: any = null;
let BannerAdSize: any = null;

if (!isExpoGo && hasAdMobNative) {
  try {
    const ads = require('react-native-google-mobile-ads');
    BannerAd = ads.BannerAd;
    BannerAdSize = ads.BannerAdSize;
  } catch {
    // Silently fall back
  }
}

interface Props {
  unitId: string;
}

export default function HomeBannerAd({ unitId }: Props) {
  if (!BannerAd || !BannerAdSize) {
    // Expo Go: reserve space so layout is stable
    return <View style={styles.placeholder} />;
  }
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        onAdFailedToLoad={(err: any) =>
          console.warn('[Banner] Failed to load:', err?.message)
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 4,
  },
  placeholder: {
    width: '100%',
    height: 50,
    backgroundColor: 'transparent',
  },
});
