import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Switch, Modal, TextInput, Alert, Linking, Platform,
} from 'react-native';
import CreditsPurchaseModal from '@/components/CreditsPurchaseModal';
import { useCredits } from '@/contexts/CreditsContext';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAdMob } from '@/contexts/AdMobContext';
import { getLearningStats, resetLearningData } from '@/services/admob';
import { useAdvancedSettings } from '@/contexts/AdvancedSettingsContext';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const SETTINGS_GENRES = [
  { value: 'sci-fi',       labelHe: 'מדע בדיוני',   labelEn: 'Sci-Fi' },
  { value: 'action',       labelHe: 'אקשן',          labelEn: 'Action' },
  { value: 'drama',        labelHe: 'דרמה',          labelEn: 'Drama' },
  { value: 'comedy',       labelHe: 'קומדיה',        labelEn: 'Comedy' },
  { value: 'thriller',     labelHe: 'מותחן',         labelEn: 'Thriller' },
  { value: 'horror',       labelHe: 'אימה',          labelEn: 'Horror' },
  { value: 'romance',      labelHe: 'רומנטי',        labelEn: 'Romance' },
  { value: 'mystery',      labelHe: 'מסתורין',       labelEn: 'Mystery' },
  { value: 'fantasy',      labelHe: 'פנטזיה',        labelEn: 'Fantasy' },
  { value: 'adventure',    labelHe: 'הרפתקאות',      labelEn: 'Adventure' },
  { value: 'crime',        labelHe: 'פשע',           labelEn: 'Crime' },
  { value: 'documentary',  labelHe: 'דוקומנטרי',     labelEn: 'Documentary' },
  { value: 'animation',    labelHe: 'אנימציה',       labelEn: 'Animation' },
  { value: 'historical',   labelHe: 'היסטורי',       labelEn: 'Historical' },
  { value: 'biographical', labelHe: 'ביוגרפי',       labelEn: 'Biographical' },
];

const LANGUAGE_NAMES: Record<string, string> = {
  he: '🇮🇱 עברית', en: '🇺🇸 English', ar: '🇸🇦 العربية',
  es: '🇪🇸 Español', fr: '🇫🇷 Français', de: '🇩🇪 Deutsch',
  ru: '🇷🇺 Русский', ja: '🇯🇵 日本語', zh: '🇨🇳 中文',
  pt: '🇧🇷 Português', hi: '🇮🇳 हिन्दी', ko: '🇰🇷 한국어',
  it: '🇮🇹 Italiano', tr: '🇹🇷 Türkçe', vi: '🇻🇳 Tiếng Việt',
  th: '🇹🇭 ไทย', pl: '🇵🇱 Polski', nl: '🇳🇱 Nederlands',
  sv: '🇸🇪 Svenska', ro: '🇷🇴 Română', cs: '🇨🇿 Čeština',
  el: '🇬🇷 Ελληνικά', hu: '🇭🇺 Magyar', fi: '🇫🇮 Suomi',
  da: '🇩🇰 Dansk', no: '🇳🇴 Norsk', sk: '🇸🇰 Slovenčina',
  hr: '🇭🇷 Hrvatski', bg: '🇧🇬 Български', sr: '🇷🇸 Српски',
  uk: '🇺🇦 Українська', ca: '🇪🇸 Català',
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, isRTL, language, setLanguage } = useLanguage();
  const { balance } = useCredits();

  const {
    user, signOut, freezeAccount, deleteAccount,
    geminiApiKey, setGeminiApiKey, clearGeminiKey, hasGeminiKey,
    youtubeApiKey, setYoutubeApiKey, clearYoutubeKey, hasYoutubeKey,
    googleSearchApiKey, setGoogleSearchApiKey, clearGoogleSearchKey, hasGoogleSearchKey,
    searchEngineId, setSearchEngineId, clearSearchEngineId, hasSearchEngineId,
    googleClientId, setGoogleClientId, clearGoogleClientId, hasGoogleClientId,
    googleClientSecret, setGoogleClientSecret, clearGoogleClientSecret, hasGoogleClientSecret,
  } = useAuth();

  const { isTestMode, setTestMode } = useAdMob();
  const { settings: advSettings, updateSettings: updateAdvSettings, resetSettings: resetAdvSettings } = useAdvancedSettings();

  const [showCreditsShop, setShowCreditsShop] = useState(false);
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [notifications, setNotificationsState] = useState(false);
  const [learning, setLearningState] = useState(false);
  const [learningStats, setLearningStats] = useState<{
    totalWatched: number; engagementRate: number; preferredHourLabel: string;
  } | null>(null);

  // API Key Modals
  const [showGeminiKeyModal, setShowGeminiKeyModal] = useState(false);
  const [showYoutubeKeyModal, setShowYoutubeKeyModal] = useState(false);
  const [showGoogleSearchKeyModal, setShowGoogleSearchKeyModal] = useState(false);
  const [showSearchEngineIdModal, setShowSearchEngineIdModal] = useState(false);
  const [showGoogleClientIdModal, setShowGoogleClientIdModal] = useState(false);
  const [showGoogleClientSecretModal, setShowGoogleClientSecretModal] = useState(false);

  const [newGeminiKey, setNewGeminiKey] = useState('');
  const [newYoutubeKey, setNewYoutubeKey] = useState('');
  const [newGoogleSearchKey, setNewGoogleSearchKey] = useState('');
  const [newSearchEngineId, setNewSearchEngineId] = useState('');
  const [newGoogleClientId, setNewGoogleClientId] = useState('');
  const [newGoogleClientSecret, setNewGoogleClientSecret] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet(['@airm_pref_notifications', '@airm_pref_learning'])
      .then(([notif, learn]) => {
        if (notif[1] !== null) setNotificationsState(JSON.parse(notif[1]));
        if (learn[1] !== null) setLearningState(JSON.parse(learn[1]));
      }).catch(() => {});
    getLearningStats().then(setLearningStats).catch(() => {});
  }, []);

  const setNotifications = (v: boolean) => {
    setNotificationsState(v);
    AsyncStorage.setItem('@airm_pref_notifications', JSON.stringify(v)).catch(() => {});
  };
  const setLearning = (v: boolean) => {
    setLearningState(v);
    AsyncStorage.setItem('@airm_pref_learning', JSON.stringify(v)).catch(() => {});
  };

  const getMaskedKey = (key: string) =>
    key.length < 8 ? key : `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;

  const handleResetLearning = () => {
    Alert.alert(
      isRTL ? 'איפוס נתוני למידה' : 'Reset Learning Data',
      isRTL
        ? 'פעולה זו תמחק את כל נתוני הלמידה המצטברים על הרגלי הצפייה שלך.'
        : 'This will delete all accumulated data about your ad viewing habits.',
      [
        { text: isRTL ? 'ביטול' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'אפס' : 'Reset', style: 'destructive',
          onPress: async () => {
            await resetLearningData();
            const fresh = await getLearningStats();
            setLearningStats(fresh);
          },
        },
      ]
    );
  };

  const handleSaveApiKey = async (
    key: string,
    saveFunction: (key: string) => Promise<boolean>,
    successMessage: string,
    setModalVisible: (v: boolean) => void,
    clearInput: () => void
  ) => {
    if (!key?.trim()) {
      Alert.alert(isRTL ? 'שגיאה' : 'Error', isRTL ? 'אנא הזן מפתח API תקין' : 'Please enter a valid API key');
      return;
    }
    setIsSavingKey(true);
    try {
      const saved = await saveFunction(key);
      if (saved) {
        Alert.alert(isRTL ? 'הצלחה!' : 'Success!', successMessage, [{
          text: 'OK', onPress: () => { setModalVisible(false); clearInput(); }
        }]);
      } else {
        Alert.alert(isRTL ? 'שגיאה' : 'Error', isRTL ? 'שמירת המפתח נכשלה' : 'Failed to save key');
      }
    } catch {
      Alert.alert(isRTL ? 'שגיאה' : 'Error', isRTL ? 'אירעה שגיאה בשמירת המפתח' : 'An error occurred while saving the key');
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleClearKey = (clearFunction: () => Promise<boolean>, keyName: string) => {
    Alert.alert(
      isRTL ? 'מחיקת מפתח' : 'Delete Key',
      isRTL ? `האם למחוק את מפתח ${keyName}?` : `Delete the ${keyName} API key?`,
      [
        { text: isRTL ? 'ביטול' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'מחק' : 'Delete', style: 'destructive',
          onPress: async () => {
            const cleared = await clearFunction();
            if (cleared) Alert.alert(isRTL ? 'הצלחה' : 'Success', isRTL ? 'המפתח נמחק בהצלחה' : 'Key deleted successfully');
          },
        },
      ]
    );
  };

  const handleFreezeAccount = () => {
    Alert.alert(t.freezeAccountConfirm, t.freezeAccountMessage, [
      { text: isRTL ? 'ביטול' : 'Cancel', style: 'cancel' },
      {
        text: t.freeze, style: 'destructive',
        onPress: async () => {
          try {
            await freezeAccount();
            Alert.alert(t.accountFrozen, t.accountFrozenMessage);
          } catch {
            Alert.alert(isRTL ? 'שגיאה' : 'Error', isRTL ? 'הקפאת החשבון נכשלה' : 'Failed to freeze account');
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(t.deleteAccountConfirm, t.deleteAccountMessage, [
      { text: isRTL ? 'ביטול' : 'Cancel', style: 'cancel' },
      {
        text: t.delete, style: 'destructive',
        onPress: async () => {
          try {
            await deleteAccount();
            Alert.alert(t.accountDeleted, t.accountDeletedMessage);
          } catch {
            Alert.alert(isRTL ? 'שגיאה' : 'Error', isRTL ? 'מחיקת החשבון נכשלה' : 'Failed to delete account');
          }
        },
      },
    ]);
  };

  // ─── API Keys Config ─────────────────────────────────────────────────────────

  const apiKeys = [
    {
      id: 'gemini',
      icon: 'auto-awesome' as const,
      label: 'Google Gemini AI',
      has: hasGeminiKey,
      value: geminiApiKey,
      color: '#4285F4',
      onPress: () => { setNewGeminiKey(geminiApiKey); setShowGeminiKeyModal(true); },
      onClear: () => handleClearKey(clearGeminiKey, 'Gemini'),
    },
    {
      id: 'youtube',
      icon: 'play-circle-filled' as const,
      label: 'YouTube Data API',
      has: hasYoutubeKey,
      value: youtubeApiKey,
      color: '#FF0000',
      onPress: () => { setNewYoutubeKey(youtubeApiKey); setShowYoutubeKeyModal(true); },
      onClear: () => handleClearKey(clearYoutubeKey, 'YouTube'),
    },
    {
      id: 'search',
      icon: 'search' as const,
      label: 'Google Search API',
      has: hasGoogleSearchKey,
      value: googleSearchApiKey,
      color: '#34A853',
      onPress: () => { setNewGoogleSearchKey(googleSearchApiKey); setShowGoogleSearchKeyModal(true); },
      onClear: () => handleClearKey(clearGoogleSearchKey, 'Google Search'),
    },
    {
      id: 'searchId',
      icon: 'manage-search' as const,
      label: 'Search Engine ID',
      has: hasSearchEngineId,
      value: searchEngineId,
      color: '#FBBC05',
      onPress: () => { setNewSearchEngineId(searchEngineId); setShowSearchEngineIdModal(true); },
      onClear: () => handleClearKey(clearSearchEngineId, 'Search Engine'),
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.settings}</Text>
        {user?.isAdmin && (
          <Pressable
            style={({ pressed }) => [styles.adminBadge, pressed && { opacity: 0.75 }]}
            onPress={() => router.push('/admin')}
          >
            <MaterialIcons name="admin-panel-settings" size={14} color="#FFF" />
            <Text style={styles.adminBadgeText}>{isRTL ? 'מנהל' : 'Admin'}</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── User Card ──────────────────────────────────────────────── */}
        {user && (
          <View style={styles.userCard}>
            <View style={styles.userAvatarWrap}>
              <MaterialIcons name="person" size={28} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.name || user.email}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
            </View>
            <View style={styles.userBadge}>
              <MaterialIcons name="verified" size={14} color={Colors.primary} />
              <Text style={styles.userBadgeText}>
                {user.provider === 'guest' ? (isRTL ? 'אורח' : 'Guest') : (isRTL ? 'מחובר' : 'Active')}
              </Text>
            </View>
          </View>
        )}

        {/* ── SECTION: General ───────────────────────────────────────── */}
        <SectionHeader icon="tune" label={isRTL ? 'כללי' : 'General'} />
        <View style={styles.card}>
          <SettingRow
            icon="language"
            iconColor="#4285F4"
            title={isRTL ? 'שפת אפליקציה' : 'App Language'}
            value={LANGUAGE_NAMES[language]}
            onPress={() => setShowLanguageModal(true)}
            isRTL={isRTL}
          />
          <Divider />
          <SettingToggle
            icon="notifications"
            iconColor="#FF9800"
            title={isRTL ? 'התראות' : 'Notifications'}
            value={notifications}
            onValueChange={setNotifications}
          />
        </View>

        {/* ── SECTION: Credits ───────────────────────────────────────── */}
        <SectionHeader icon="toll" label={isRTL ? 'קרדיטים' : 'Credits'} />
        <View style={styles.card}>
          <View style={styles.creditsHero}>
            <View style={styles.creditsIcon}>
              <MaterialIcons name="toll" size={22} color={Colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.creditsLabel}>{isRTL ? 'יתרה נוכחית' : 'Current Balance'}</Text>
              <Text style={styles.creditsValue}>{balance} {isRTL ? 'קרדיטים' : 'credits'}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.buyButton, pressed && { opacity: 0.8 }]}
              onPress={() => setShowCreditsShop(true)}
            >
              <MaterialIcons name="add" size={16} color="#FFF" />
              <Text style={styles.buyButtonText}>{isRTL ? 'רכוש' : 'Buy'}</Text>
            </Pressable>
          </View>
        </View>

        <CreditsPurchaseModal
          visible={showCreditsShop}
          onClose={() => setShowCreditsShop(false)}
          userId={user?.id || 'user_current'}
          currentBalance={balance}
          onPurchaseComplete={(newBalance) => {
            console.log('Credits updated:', newBalance);
            setShowCreditsShop(false);
          }}
          isRTL={isRTL}
        />

        {/* ── SECTION: Recap Defaults ────────────────────────────────── */}
        <SectionHeader icon="movie-creation" label={isRTL ? 'הגדרות ברירת מחדל' : 'Recap Defaults'} />
        <View style={styles.card}>
          {/* Title */}
          <View style={styles.inputRow}>
            <View style={[styles.rowIconWrap, { backgroundColor: 'rgba(178,75,243,0.12)' }]}>
              <MaterialIcons name="title" size={18} color={Colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputRowLabel}>{isRTL ? 'כותרת ברירת מחדל' : 'Default Title'}</Text>
              <TextInput
                style={[styles.inlineInput, isRTL && { textAlign: 'right' }]}
                placeholder={isRTL ? 'ללא כותרת' : 'No title'}
                placeholderTextColor={Colors.textMuted}
                value={advSettings.movieTitle}
                onChangeText={(v) => updateAdvSettings({ movieTitle: v })}
              />
            </View>
          </View>
          <Divider />

          {/* Description */}
          <View style={styles.inputRow}>
            <View style={[styles.rowIconWrap, { backgroundColor: 'rgba(178,75,243,0.12)' }]}>
              <MaterialIcons name="description" size={18} color={Colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputRowLabel}>{isRTL ? 'תיאור ברירת מחדל' : 'Default Description'}</Text>
              <TextInput
                style={[styles.inlineInput, { minHeight: 40 }, isRTL && { textAlign: 'right' }]}
                placeholder={isRTL ? 'ללא תיאור' : 'No description'}
                placeholderTextColor={Colors.textMuted}
                value={advSettings.movieDescription}
                onChangeText={(v) => updateAdvSettings({ movieDescription: v })}
                multiline
              />
            </View>
          </View>
          <Divider />

          {/* Genre */}
          <SettingRow
            icon="local-movies"
            iconColor={Colors.secondary}
            title={isRTL ? "ז'אנר ברירת מחדל" : 'Default Genre'}
            value={advSettings.selectedGenre}
            onPress={() => setShowGenreModal(true)}
            isRTL={isRTL}
          />
          <Divider />

          {/* Duration */}
          <View style={styles.timeRow}>
            <View style={[styles.rowIconWrap, { backgroundColor: 'rgba(0,212,255,0.10)' }]}>
              <MaterialIcons name="timer" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.timeRowLabel}>{isRTL ? 'משך ברירת מחדל' : 'Default Duration'}</Text>
            <View style={styles.timeInputs}>
              {(['recapHours', 'recapMinutes', 'recapSeconds'] as const).map((field, i) => (
                <View key={field} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {i > 0 && <Text style={styles.timeSep}>:</Text>}
                  <View style={styles.timeField}>
                    <TextInput
                      style={styles.timeInput}
                      value={String(advSettings[field]).padStart(2, '0')}
                      onChangeText={(v) => {
                        const max = field === 'recapHours' ? 3 : 59;
                        updateAdvSettings({ [field]: Math.min(max, Math.max(0, parseInt(v) || 0)) });
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={styles.timeUnit}>
                      {field === 'recapHours' ? (isRTL ? 'ש' : 'h') : field === 'recapMinutes' ? (isRTL ? 'ד' : 'm') : (isRTL ? 'ש' : 's')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
          <Divider />

          {/* Cut Interval */}
          <View style={styles.timeRow}>
            <View style={[styles.rowIconWrap, { backgroundColor: 'rgba(255,184,0,0.10)' }]}>
              <MaterialIcons name="content-cut" size={18} color={Colors.warning} />
            </View>
            <Text style={styles.timeRowLabel}>{isRTL ? 'מרווח חיתוך' : 'Cut Interval'}</Text>
            <View style={styles.timeInputs}>
              {(['cutMinutes', 'cutSeconds'] as const).map((field, i) => (
                <View key={field} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {i > 0 && <Text style={styles.timeSep}>:</Text>}
                  <View style={styles.timeField}>
                    <TextInput
                      style={styles.timeInput}
                      value={String(advSettings[field]).padStart(2, '0')}
                      onChangeText={(v) => {
                        updateAdvSettings({ [field]: Math.min(59, Math.max(0, parseInt(v) || 0)) });
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={styles.timeUnit}>
                      {field === 'cutMinutes' ? (isRTL ? 'ד' : 'm') : (isRTL ? 'ש' : 's')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
          <Divider />

          {/* AI Feature Toggles */}
          <SettingToggle
            icon="search"
            iconColor="#34A853"
            title={isRTL ? 'חיפוש ווב' : 'Web Search'}
            value={advSettings.webSearchEnabled}
            onValueChange={(v) => updateAdvSettings({ webSearchEnabled: v })}
          />
          <Divider />
          <SettingToggle
            icon="play-circle-outline"
            iconColor="#FF0000"
            title={isRTL ? 'למידת YouTube' : 'YouTube Learning'}
            value={advSettings.youTubeLearningEnabled}
            onValueChange={(v) => updateAdvSettings({ youTubeLearningEnabled: v })}
          />
          <Divider />
          <SettingToggle
            icon="auto-awesome"
            iconColor={Colors.secondary}
            title={isRTL ? 'למידה מתמשכת (AI)' : 'Continuous AI Learning'}
            value={advSettings.continuousLearningEnabled}
            onValueChange={(v) => updateAdvSettings({ continuousLearningEnabled: v })}
          />
          <Divider />

          {/* Reset button */}
          <Pressable
            style={({ pressed }) => [styles.textActionRow, pressed && { opacity: 0.7 }]}
            onPress={() => Alert.alert(
              isRTL ? 'איפוס הגדרות' : 'Reset Defaults',
              isRTL ? 'האם לאפס את כל הגדרות הסיכום לברירת המחדל?' : 'Reset all recap settings to defaults?',
              [
                { text: isRTL ? 'ביטול' : 'Cancel', style: 'cancel' },
                { text: isRTL ? 'אפס' : 'Reset', style: 'destructive', onPress: resetAdvSettings },
              ]
            )}
          >
            <MaterialIcons name="restore" size={16} color={Colors.error} />
            <Text style={[styles.textActionLabel, { color: Colors.error }]}>
              {isRTL ? 'אפס הגדרות ברירת מחדל' : 'Reset Recap Defaults'}
            </Text>
          </Pressable>
        </View>

        {/* ── SECTION: BYOK API Keys ─────────────────────────────────── */}
        <SectionHeader icon="vpn-key" label={isRTL ? 'מפתחות API (BYOK)' : 'API Keys (BYOK)'} />
        <View style={styles.card}>
          {apiKeys.map((k, i) => (
            <View key={k.id}>
              {i > 0 && <Divider />}
              <View style={styles.apiKeyRow}>
                <View style={[styles.rowIconWrap, { backgroundColor: k.color + '18' }]}>
                  <MaterialIcons name={k.icon} size={18} color={k.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.apiKeyLabel}>{k.label}</Text>
                  <Text style={styles.apiKeyValue} numberOfLines={1}>
                    {k.has ? getMaskedKey(k.value) : (isRTL ? 'לא מוגדר' : 'Not configured')}
                  </Text>
                </View>
                <View style={styles.apiKeyActions}>
                  <View style={[styles.statusDot, { backgroundColor: k.has ? Colors.success : Colors.error }]} />
                  {k.has ? (
                    <Pressable
                      style={({ pressed }) => [styles.apiIconBtn, pressed && { opacity: 0.7 }]}
                      onPress={k.onClear}
                    >
                      <MaterialIcons name="delete-outline" size={18} color={Colors.error} />
                    </Pressable>
                  ) : null}
                  <Pressable
                    style={({ pressed }) => [styles.apiIconBtn, { backgroundColor: k.color + '18' }, pressed && { opacity: 0.7 }]}
                    onPress={k.onPress}
                  >
                    <MaterialIcons name={k.has ? 'edit' : 'add'} size={18} color={k.color} />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ── SECTION: Ad Settings ───────────────────────────────────── */}
        <SectionHeader icon="monetization-on" label={isRTL ? 'הגדרות מודעות' : 'Ad Settings'} />
        <View style={styles.card}>
          <View style={styles.admobHeader}>
            <View style={[styles.rowIconWrap, { backgroundColor: 'rgba(66,133,244,0.12)' }]}>
              <MaterialIcons name="monetization-on" size={18} color="#4285F4" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.admobTitle}>AdMob</Text>
              <Text style={styles.admobSubtitle}>{isRTL ? 'מוגדר ומחובר' : 'Configured & Connected'}</Text>
            </View>
            <MaterialIcons name="check-circle" size={20} color={Colors.success} />
          </View>
          <Divider />

          {/* Ad Unit IDs */}
          <View style={styles.admobIds}>
            {[
              { platform: 'Android', icon: 'phone-android' as const, id: 'ca-app-pub-9953179201685717~4175960790' },
              { platform: 'iOS', icon: 'phone-iphone' as const, id: 'ca-app-pub-9953179201685717~6597950204' },
            ].map((p) => (
              <View key={p.platform} style={styles.admobIdRow}>
                <MaterialIcons name={p.icon} size={14} color={Colors.textMuted} />
                <Text style={styles.admobIdLabel}>{p.platform}</Text>
                <Text style={styles.admobIdValue} numberOfLines={1}>{p.id}</Text>
              </View>
            ))}
          </View>
          <Divider />

          {/* Test Mode Toggle */}
          <View style={styles.settingRow}>
            <View style={[styles.rowIconWrap, { backgroundColor: isTestMode ? 'rgba(255,184,0,0.12)' : 'rgba(0,255,127,0.10)' }]}>
              <MaterialIcons name={isTestMode ? 'science' : 'check-circle'} size={18} color={isTestMode ? Colors.warning : Colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                {isTestMode ? (isRTL ? 'מצב בדיקה פעיל' : 'Test Mode Active') : (isRTL ? 'מצב פרודקשן' : 'Production Mode')}
              </Text>
              {isTestMode && (
                <Text style={styles.rowSubtitle}>
                  {isRTL ? 'מזהי מודעות לפיתוח בלבד' : 'Using development ad IDs'}
                </Text>
              )}
            </View>
            <Switch
              value={isTestMode}
              onValueChange={(v) => setTestMode(v)}
              trackColor={{ false: Colors.border, true: Colors.warning + '55' }}
              thumbColor={isTestMode ? Colors.warning : Colors.textMuted}
              ios_backgroundColor={Colors.border}
            />
          </View>
        </View>

        {/* ── SECTION: AI Learning ──────────────────────────────────── */}
        <SectionHeader icon="psychology" label={isRTL ? 'AI למידה' : 'AI Learning'} />
        <View style={styles.card}>
          <SettingToggle
            icon="psychology"
            iconColor={Colors.secondary}
            title={isRTL ? 'למידה מהרגלי צפייה' : 'Learn from Viewing Habits'}
            value={learning}
            onValueChange={setLearning}
          />

          {learningStats && learningStats.totalWatched > 0 && (
            <>
              <Divider />
              <View style={styles.statsRow}>
                <StatChip icon="visibility" value={String(learningStats.totalWatched)} label={isRTL ? 'נצפו' : 'Watched'} color={Colors.primary} />
                <StatChip icon="percent" value={`${learningStats.engagementRate}%`} label={isRTL ? 'מעורבות' : 'Engagement'} color={Colors.success} />
                <StatChip icon="schedule" value={learningStats.preferredHourLabel} label={isRTL ? 'שעה מועדפת' : 'Preferred'} color={Colors.warning} />
              </View>
            </>
          )}
          <Divider />

          <Pressable
            style={({ pressed }) => [styles.textActionRow, pressed && { opacity: 0.7 }]}
            onPress={handleResetLearning}
          >
            <MaterialIcons name="delete-sweep" size={16} color={Colors.error} />
            <Text style={[styles.textActionLabel, { color: Colors.error }]}>
              {isRTL ? 'אפס נתוני למידה' : 'Reset Learning Data'}
            </Text>
          </Pressable>
        </View>

        {/* ── SECTION: About ─────────────────────────────────────────── */}
        <SectionHeader icon="info" label={isRTL ? 'אודות' : 'About'} />
        <View style={styles.card}>
          <SettingRow
            icon="info-outline"
            iconColor={Colors.primary}
            title={isRTL ? 'גרסה' : 'Version'}
            value="1.0.0"
            isRTL={isRTL}
          />
          <Divider />
          <SettingRow
            icon="description"
            iconColor={Colors.textMuted}
            title={isRTL ? 'תנאי שימוש' : 'Terms of Service'}
            onPress={() => Linking.openURL('https://react-9bgbn2.onspace.build/terms')}
            isRTL={isRTL}
          />
          <Divider />
          <SettingRow
            icon="privacy-tip"
            iconColor={Colors.textMuted}
            title={isRTL ? 'מדיניות פרטיות' : 'Privacy Policy'}
            onPress={() => Linking.openURL('https://react-9bgbn2.onspace.build/privacy')}
            isRTL={isRTL}
          />
        </View>

        {/* ── SECTION: Account ───────────────────────────────────────── */}
        {user && user.provider !== 'guest' && (
          <>
            <SectionHeader icon="manage-accounts" label={t.account} danger />
            <View style={styles.card}>
              <Pressable
                style={({ pressed }) => [styles.dangerRow, pressed && { opacity: 0.75 }]}
                onPress={handleFreezeAccount}
              >
                <View style={[styles.rowIconWrap, { backgroundColor: 'rgba(255,184,0,0.12)' }]}>
                  <MaterialIcons name="pause-circle" size={18} color={Colors.warning} />
                </View>
                <Text style={[styles.rowTitle, { color: Colors.warning }]}>{t.freezeAccount}</Text>
                <MaterialIcons name="chevron-right" size={18} color={Colors.warning} />
              </Pressable>
              <Divider />
              <Pressable
                style={({ pressed }) => [styles.dangerRow, pressed && { opacity: 0.75 }]}
                onPress={handleDeleteAccount}
              >
                <View style={[styles.rowIconWrap, { backgroundColor: 'rgba(255,51,102,0.12)' }]}>
                  <MaterialIcons name="delete-forever" size={18} color={Colors.error} />
                </View>
                <Text style={[styles.rowTitle, { color: Colors.error }]}>{t.deleteAccount}</Text>
                <MaterialIcons name="chevron-right" size={18} color={Colors.error} />
              </Pressable>
            </View>
          </>
        )}

        {/* Sign Out */}
        {user && (
          <Pressable
            style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.8 }]}
            onPress={signOut}
          >
            <MaterialIcons name="logout" size={20} color={Colors.error} />
            <Text style={styles.signOutText}>{isRTL ? 'התנתק' : 'Sign Out'}</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* ── Modals ────────────────────────────────────────────────────── */}

      {/* Genre Modal */}
      <Modal visible={showGenreModal} transparent animationType="slide" onRequestClose={() => setShowGenreModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowGenreModal(false)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{isRTL ? "בחר ז'אנר ברירת מחדל" : 'Select Default Genre'}</Text>
              <Pressable onPress={() => setShowGenreModal(false)} style={styles.sheetClose}>
                <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.md }}>
              {SETTINGS_GENRES.map((g) => {
                const active = advSettings.selectedGenre === g.value;
                return (
                  <Pressable
                    key={g.value}
                    style={({ pressed }) => [styles.optionRow, active && styles.optionRowActive, pressed && { opacity: 0.75 }]}
                    onPress={() => { updateAdvSettings({ selectedGenre: g.value }); setShowGenreModal(false); }}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {isRTL ? g.labelHe : g.labelEn}
                    </Text>
                    {active && <MaterialIcons name="check" size={18} color={Colors.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Language Modal */}
      <Modal visible={showLanguageModal} transparent animationType="slide" onRequestClose={() => setShowLanguageModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowLanguageModal(false)}>
          <View style={[styles.sheet, { maxHeight: '80%' }]} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{isRTL ? 'בחר שפה' : 'Select Language'}</Text>
              <Pressable onPress={() => setShowLanguageModal(false)} style={styles.sheetClose}>
                <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.md }}>
              {(Object.keys(LANGUAGE_NAMES) as string[]).map((lang) => {
                const active = language === lang;
                return (
                  <Pressable
                    key={lang}
                    style={({ pressed }) => [styles.optionRow, active && styles.optionRowActive, pressed && { opacity: 0.75 }]}
                    onPress={() => { setLanguage(lang as any); setShowLanguageModal(false); }}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {LANGUAGE_NAMES[lang]}
                    </Text>
                    {active && <MaterialIcons name="check" size={18} color={Colors.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* API Key Modals */}
      <ApiKeyModal
        visible={showGeminiKeyModal}
        onClose={() => { setShowGeminiKeyModal(false); setNewGeminiKey(''); }}
        title="Google Gemini API"
        description={isRTL ? 'מפתח API של Google Gemini מאפשר שימוש ב-AI ליצירת סיכומים. המפתח נשמר באופן מאובטח על המכשיר.' : "Google Gemini API key enables AI-powered recap creation. Stored securely on your device."}
        value={newGeminiKey}
        onChangeText={setNewGeminiKey}
        onSave={() => handleSaveApiKey(newGeminiKey, setGeminiApiKey, isRTL ? 'מפתח Gemini נשמר בהצלחה' : 'Gemini key saved', setShowGeminiKeyModal, () => setNewGeminiKey(''))}
        isSaving={isSavingKey}
        isRTL={isRTL}
      />
      <ApiKeyModal
        visible={showYoutubeKeyModal}
        onClose={() => { setShowYoutubeKeyModal(false); setNewYoutubeKey(''); }}
        title="YouTube Data API"
        description={isRTL ? 'מפתח YouTube Data API מאפשר שימוש בערוצי YouTube ללמידה.' : 'YouTube Data API key enables channel-based learning features.'}
        value={newYoutubeKey}
        onChangeText={setNewYoutubeKey}
        onSave={() => handleSaveApiKey(newYoutubeKey, setYoutubeApiKey, isRTL ? 'מפתח YouTube נשמר' : 'YouTube key saved', setShowYoutubeKeyModal, () => setNewYoutubeKey(''))}
        isSaving={isSavingKey}
        isRTL={isRTL}
      />
      <ApiKeyModal
        visible={showGoogleSearchKeyModal}
        onClose={() => { setShowGoogleSearchKeyModal(false); setNewGoogleSearchKey(''); }}
        title="Google Search API"
        description={isRTL ? 'מפתח Google Search API מאפשר חיפוש תוכן מתוך האפליקציה.' : 'Google Search API key enables in-app content search.'}
        value={newGoogleSearchKey}
        onChangeText={setNewGoogleSearchKey}
        onSave={() => handleSaveApiKey(newGoogleSearchKey, setGoogleSearchApiKey, isRTL ? 'מפתח Google Search נשמר' : 'Google Search key saved', setShowGoogleSearchKeyModal, () => setNewGoogleSearchKey(''))}
        isSaving={isSavingKey}
        isRTL={isRTL}
      />
      <ApiKeyModal
        visible={showSearchEngineIdModal}
        onClose={() => { setShowSearchEngineIdModal(false); setNewSearchEngineId(''); }}
        title="Search Engine ID"
        description={isRTL ? 'מזהה מנוע החיפוש משמש לחיפוש ממוקד בתוכן.' : 'The Search Engine ID scopes content searches to your custom engine.'}
        value={newSearchEngineId}
        onChangeText={setNewSearchEngineId}
        onSave={() => handleSaveApiKey(newSearchEngineId, setSearchEngineId, isRTL ? 'מזהה נשמר' : 'Search Engine ID saved', setShowSearchEngineIdModal, () => setNewSearchEngineId(''))}
        isSaving={isSavingKey}
        isRTL={isRTL}
      />
      <ApiKeyModal
        visible={showGoogleClientIdModal}
        onClose={() => { setShowGoogleClientIdModal(false); setNewGoogleClientId(''); }}
        title="Google Client ID"
        description={isRTL ? 'מזהה לקוח Google OAuth להתחברות עם Google.' : 'Google OAuth Client ID for Google Sign-In.'}
        value={newGoogleClientId}
        onChangeText={setNewGoogleClientId}
        onSave={() => handleSaveApiKey(newGoogleClientId, setGoogleClientId, isRTL ? 'Client ID נשמר' : 'Client ID saved', setShowGoogleClientIdModal, () => setNewGoogleClientId(''))}
        isSaving={isSavingKey}
        isRTL={isRTL}
      />
      <ApiKeyModal
        visible={showGoogleClientSecretModal}
        onClose={() => { setShowGoogleClientSecretModal(false); setNewGoogleClientSecret(''); }}
        title="Google Client Secret"
        description={isRTL ? 'סוד הלקוח של Google OAuth לאימות מאובטח.' : 'Google OAuth Client Secret for secure authentication.'}
        value={newGoogleClientSecret}
        onChangeText={setNewGoogleClientSecret}
        onSave={() => handleSaveApiKey(newGoogleClientSecret, setGoogleClientSecret, isRTL ? 'Client Secret נשמר' : 'Client Secret saved', setShowGoogleClientSecretModal, () => setNewGoogleClientSecret(''))}
        isSaving={isSavingKey}
        isRTL={isRTL}
      />
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, label, danger }: { icon: any; label: string; danger?: boolean }) {
  return (
    <View style={sectionHeaderStyles.wrap}>
      <MaterialIcons name={icon} size={13} color={danger ? Colors.error : Colors.textMuted} />
      <Text style={[sectionHeaderStyles.text, danger && { color: Colors.error }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const sectionHeaderStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4, marginTop: 4 },
  text: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.8 },
});

function Divider() {
  return <View style={{ height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md }} />;
}

function StatChip({ icon, value, label, color }: { icon: any; value: string; label: string; color: string }) {
  return (
    <View style={[statStyles.chip, { borderColor: color + '30', backgroundColor: color + '12' }]}>
      <MaterialIcons name={icon} size={14} color={color} />
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 2,
  },
  value: { fontSize: 14, fontWeight: '700' },
  label: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },
});

function SettingRow({
  icon, iconColor, title, value, onPress, isRTL,
}: {
  icon: any; iconColor?: string; title: string; value?: string;
  onPress?: () => void; isRTL: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingRow, pressed && onPress && { opacity: 0.75 }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.rowIconWrap, { backgroundColor: (iconColor || Colors.textMuted) + '18' }]}>
        <MaterialIcons name={icon} size={18} color={iconColor || Colors.textMuted} />
      </View>
      <Text style={styles.rowTitle}>{title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {value != null && <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>}
        {onPress && (
          <MaterialIcons name={isRTL ? 'chevron-left' : 'chevron-right'} size={18} color={Colors.textMuted} />
        )}
      </View>
    </Pressable>
  );
}

function SettingToggle({
  icon, iconColor, title, value, onValueChange,
}: {
  icon: any; iconColor?: string; title: string; value: boolean; onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={[styles.rowIconWrap, { backgroundColor: (iconColor || Colors.textMuted) + '18' }]}>
        <MaterialIcons name={icon} size={18} color={iconColor || Colors.textMuted} />
      </View>
      <Text style={[styles.rowTitle, { flex: 1 }]}>{title}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.border, true: Colors.primary + '55' }}
        thumbColor={value ? Colors.primary : Colors.textMuted}
        ios_backgroundColor={Colors.border}
      />
    </View>
  );
}

function ApiKeyModal({
  visible, onClose, title, description, value, onChangeText, onSave, isSaving, isRTL,
}: {
  visible: boolean; onClose: () => void; title: string; description: string;
  value: string; onChangeText: (t: string) => void;
  onSave: () => void; isSaving: boolean; isRTL: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.sheet, styles.apiSheet]} onStartShouldSetResponder={() => true}>
          <View style={styles.sheetHeader}>
            <View style={[styles.rowIconWrap, { backgroundColor: Colors.primary + '18' }]}>
              <MaterialIcons name="vpn-key" size={18} color={Colors.primary} />
            </View>
            <Text style={[styles.sheetTitle, { flex: 1, marginLeft: 10 }]}>{title}</Text>
            <Pressable onPress={onClose} style={styles.sheetClose}>
              <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
            <Text style={styles.apiDesc}>{description}</Text>

            <View style={styles.apiInputWrap}>
              <MaterialIcons name="vpn-key" size={18} color={Colors.textMuted} />
              <TextInput
                style={[styles.apiInput, isRTL && { textAlign: 'right' }]}
                placeholder={isRTL ? 'הזן מפתח API...' : 'Enter API key...'}
                placeholderTextColor={Colors.textMuted}
                value={value}
                onChangeText={onChangeText}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.apiInfoBanner}>
              <MaterialIcons name="lock" size={14} color={Colors.primary} />
              <Text style={styles.apiInfoText}>
                {isRTL ? 'המפתח נשמר באופן מאובטח על המכשיר שלך בלבד' : 'Stored securely on your device only'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Pressable
                style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.75 }]}
                onPress={onClose}
              >
                <Text style={styles.cancelText}>{isRTL ? 'ביטול' : 'Cancel'}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.saveBtn, isSaving && { opacity: 0.55 }, pressed && { opacity: 0.75 }]}
                onPress={onSave}
                disabled={isSaving}
              >
                <MaterialIcons name={isSaving ? 'hourglass-empty' : 'save'} size={18} color="#FFF" />
                <Text style={styles.saveText}>{isSaving ? (isRTL ? 'שומר...' : 'Saving...') : (isRTL ? 'שמור' : 'Save')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  adminBadge: {
    position: 'absolute',
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  adminBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFF' },

  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.sm },

  // User Card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  userAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,212,255,0.12)',
    borderWidth: 2,
    borderColor: Colors.primary + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  userEmail: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  userBadgeText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },

  // Setting Row base
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    gap: Spacing.md,
  },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.text },
  rowSubtitle: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  rowValue: { fontSize: 14, color: Colors.textSecondary, maxWidth: 120 },

  // Credits hero
  creditsHero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.md,
  },
  creditsIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,184,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditsLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  creditsValue: { fontSize: 22, fontWeight: '800', color: Colors.warning, marginTop: 1 },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  buyButtonText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

  // Input row (inline textInput inside card)
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: Spacing.md,
  },
  inputRowLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  inlineInput: {
    fontSize: 15,
    color: Colors.text,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 3,
  },

  // Time inputs
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: Spacing.sm,
  },
  timeRowLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.text },
  timeInputs: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  timeField: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  timeInput: {
    width: 32,
    height: 32,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  timeSep: { fontSize: 16, color: Colors.textMuted, marginHorizontal: 2, fontWeight: '700' },
  timeUnit: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },

  // Text action (danger link style)
  textActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
  },
  textActionLabel: { fontSize: 14, fontWeight: '600' },

  // API Key rows
  apiKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: Spacing.md,
  },
  apiKeyLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  apiKeyValue: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  apiKeyActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  apiIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceLight,
  },

  // AdMob
  admobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.md,
  },
  admobTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  admobSubtitle: { fontSize: 11, color: Colors.success, marginTop: 1 },
  admobIds: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: 6 },
  admobIdRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  admobIdLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, width: 50 },
  admobIdValue: { flex: 1, fontSize: 11, color: Colors.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  // Stats chips row
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },

  // Danger rows
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.md,
  },

  // Sign Out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 15,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.error + '15',
    borderWidth: 1,
    borderColor: Colors.error + '50',
    marginTop: Spacing.xs,
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: Colors.error },

  // Sheet (bottom modal)
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  apiSheet: {
    borderRadius: 20,
    margin: Spacing.lg,
    maxHeight: undefined,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  sheetClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  // Option rows in sheets
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: 2,
  },
  optionRowActive: {
    backgroundColor: Colors.primary + '15',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  optionText: { fontSize: 15, color: Colors.text },
  optionTextActive: { color: Colors.primary, fontWeight: '600' },

  // API Key Modal internals
  apiDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  apiInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  apiInput: { flex: 1, paddingVertical: 13, fontSize: 14, color: Colors.text },
  apiInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '12',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  apiInfoText: { flex: 1, fontSize: 12, color: Colors.primary },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  saveText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
