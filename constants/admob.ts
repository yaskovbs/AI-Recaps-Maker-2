/**
 * AdMob Configuration
 * Complete setup for Android & iOS ad units
 *
 * Android App: AI Recaps Maker & Auto Post Android App
 * iOS App: AI Recaps Maker & Auto Post Android App (iOS)
 */

/**
 * ⚠️ UPDATED: Real Ad Unit IDs from AdMob Console (TigerPlay campaign)
 * App ID: ca-app-pub-9953179201685717~4175960790
 */
export const AdMobConfig = {
  android: {
    appId: 'ca-app-pub-9953179201685717~4175960790',  // ✅ TigerPlay Games Prizes and Earn
    adUnits: {
      // מתגמלת (Rewarded) - שם: "1"
      // תמריץ: 1 Reward 1: RECAP preparation
      // סוג: וידאו | רצפי מודעות | אינטראקטיבית
      rewarded: 'ca-app-pub-9953179201685717/6229927427',       // ✅ מתגמלת — 00.00.1

      // מעברון (Interstitial) — ID: 0.1
      interstitial: 'ca-app-pub-9953179201685717/5210675011',    // ✅ מעברון — 0.1

      // פתיחת אפליקציה (App Open) — נשאר כפי שהיה
      appOpen: 'ca-app-pub-9953179201685717/1980714621',

      // מודעת מעברון מתוגמלת — ID: 0.10
      rewardedInterstitial: 'ca-app-pub-9953179201685717/8848066496', // ✅ מעברון מתוגמל — 0.10

      // באנר — ID: 00.1
      banner: 'ca-app-pub-9953179201685717/1363779404',             // ✅ באנר — 00.1
    },
    settings: {
      // Rewarded - מכסת תדירות: משותק (ללא הגבלה)
      rewardedFrequency: {
        maxImpressions: Infinity,
        perHours: 0,
      },
      // Interstitial - מכסת תדירות: לא יותר מ-44 חשיפות למשתמש בכל 6 שעות
      interstitialFrequency: {
        maxImpressions: 44,
        perHours: 6,
      },
      // App Open - מכסת תדירות: לא יותר מ-22 חשיפות למשתמש בכל 3 שעות
      appOpenFrequency: {
        maxImpressions: 22,
        perHours: 3,
      },
      // Rewarded Interstitial - מכסת תדירות: לא יותר מ-9 חשיפות למשתמש בכל 9 שעות
      rewardedInterstitialFrequency: {
        maxImpressions: 9,
        perHours: 9,
      },
    },
  },

  ios: {
    appId: 'ca-app-pub-9953179201685717~6597950204',
    adUnits: {
      // מתגמלת (Rewarded) - שם: "1 RECAP Preparation"
      // תמריץ: 1 Reward 1 RECAP Preparation
      // סוג: וידאו | רצפי מודעות | אינטראקטיבית
      rewarded: 'ca-app-pub-9953179201685717/1057848917',

      // מעברון (Interstitial) - שם: "44.7"
      // סוג: טקסט, תמונה ומדיה עשירה | וידאו
      interstitial: 'ca-app-pub-9953179201685717/5284868532',

      // פתיחת אפליקציה (App Open) - שם: "22.5"
      // סוג: טקסט, תמונה ומדיה עשירה | וידאו
      appOpen: 'ca-app-pub-9953179201685717/9352772332',

      // מודעת מעברון מתוגמלת (Rewarded Interstitial) - שם: "2"
      // תמריץ: 1 1 Reward 1: RECAP preparation
      // סוג: וידאו | אינטראקטיבית
      rewardedInterstitial: 'ca-app-pub-9953179201685717/3226991885',
    },
    settings: {
      // Rewarded - מכסת תדירות: משותק (ללא הגבלה)
      rewardedFrequency: {
        maxImpressions: Infinity,
        perHours: 0,
      },
      // Interstitial - מכסת תדירות: לא יותר מ-44 חשיפות למשתמש בכל 7 שעות
      interstitialFrequency: {
        maxImpressions: 44,
        perHours: 7,
      },
      // App Open - מכסת תדירות: לא יותר מ-22 חשיפות למשתמש בכל 5 שעות
      appOpenFrequency: {
        maxImpressions: 22,
        perHours: 5,
      },
      // Rewarded Interstitial - מכסת תדירות: לא יותר מ-8 חשיפות למשתמש בכל 9 שעות
      rewardedInterstitialFrequency: {
        maxImpressions: 8,
        perHours: 9,
      },
    },
  },

  // Test IDs (for development in Expo Go)
  test: {
    android: {
      appId: 'ca-app-pub-3940256099942544~3347511713',
      adUnits: {
        rewarded: 'ca-app-pub-3940256099942544/5224354917',
        interstitial: 'ca-app-pub-3940256099942544/1033173712',
        appOpen: 'ca-app-pub-3940256099942544/3419835294',
        rewardedInterstitial: 'ca-app-pub-3940256099942544/5354046379',
      },
    },
    ios: {
      appId: 'ca-app-pub-3940256099942544~1458002511',
      adUnits: {
        rewarded: 'ca-app-pub-3940256099942544/1712485313',
        interstitial: 'ca-app-pub-3940256099942544/4411468910',
        appOpen: 'ca-app-pub-3940256099942544/5662855259',
        rewardedInterstitial: 'ca-app-pub-3940256099942544/6978759866',
      },
    },
  },
};

/**
 * Reward Configuration
 * Used for both Rewarded and Rewarded Interstitial ads
 */
export const RewardConfig = {
  rewardAmount: 1,
  rewardName: 'RECAP preparation',
  rewardDescription: {
    he: '1 קרדיט להכנת סיכום',
    en: '1 credit for recap preparation',
  },
};

/**
 * Get current platform config
 */
export function getAdMobConfig(platform: 'android' | 'ios', useTestIds = false) {
  if (useTestIds) {
    return AdMobConfig.test[platform];
  }
  return AdMobConfig[platform];
}
