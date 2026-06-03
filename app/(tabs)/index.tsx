import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { useRating } from '@/contexts/RatingContext';
import { useStats } from '@/contexts/StatsContext';
import { useAdMob } from '@/contexts/AdMobContext';
import { StarRating } from '@/components/StarRating';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { getAdUnitId } from '@/services/admob';
import HomeBannerAd from '@/components/HomeBannerAd';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const { balance, earnCreditFromAd } = useCredits();
  const { averageRating, totalRatings, userRating, submitRating } = useRating();
  const { recapsCreated, activeUsers, serviceUptime } = useStats();
  const { showRewardedAd, isTestMode } = useAdMob();

  const handleEarnCredits = async () => {
    try {
      const result = await showRewardedAd();
      
      if (result.success) {
        await earnCreditFromAd();
        Alert.alert(
          isRTL ? 'נהדר!' : 'Great!',
          isRTL ? 'קיבלת 1 קרדיט!' : 'You earned 1 credit!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          isRTL ? 'שגיאה' : 'Error',
          isRTL ? 'לא הצלחנו להציג מודעה כרגע' : 'Could not show ad at this time',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      Alert.alert(
        isRTL ? 'שגיאה' : 'Error',
        isRTL ? 'אירעה שגיאה' : 'An error occurred',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRatingChange = async (rating: number) => {
    await submitRating(rating, user?.id || 'guest');
    Alert.alert(
      isRTL ? 'תודה!' : 'Thank you!',
      isRTL ? `דירגת אותנו ${rating} כוכבים` : `You rated us ${rating} stars`,
      [{ text: 'OK' }]
    );
  };

  const bannerUnitId = getAdUnitId('banner', isTestMode);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Test Mode Banner */}
      {isTestMode && (
        <View style={styles.testModeBanner}>
          <MaterialIcons name="warning" size={16} color="#FFA000" />
          <Text style={styles.testModeText}>
            {isRTL ? 'מצב בדיקה' : 'Test Mode'}
          </Text>
        </View>
      )}

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <LinearGradient
            colors={Colors.gradientPrimary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientOverlay}
          >
            {/* Logo/Icon Area */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="auto-awesome" size={48} color={Colors.primary} />
              </View>
            </View>

            {/* Main Title */}
            <Text style={styles.mainTitle}>AI Recaps Maker</Text>
            
            {/* Tagline */}
            <Text style={styles.tagline}>
              {isRTL ? 'לסיכומי סרטים וסדרות טלוויזיה' : 'For Movies & TV Shows Recaps'}
            </Text>
            
            {/* App Name */}
            <Text style={styles.appName}>{t.appName}</Text>
            
            {/* Subtitle */}
            <Text style={styles.subtitle}>{t.subtitle}</Text>

            {/* CTA Buttons */}
            <View style={styles.ctaContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => router.push('/create')}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <MaterialIcons name="play-circle-filled" size={24} color="#FFF" />
                  <Text style={styles.primaryButtonText}>{t.getStarted}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </LinearGradient>
        </View>

        {/* Credits Card */}
        <View style={styles.creditsCard}>
          <View style={styles.creditsHeader}>
            <MaterialIcons name="stars" size={24} color={Colors.primary} />
            <Text style={styles.creditsTitle}>{t.credits}</Text>
          </View>
          <Text style={styles.creditsBalance}>{balance}</Text>
          
          <Pressable
            style={({ pressed }) => [
              styles.earnButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleEarnCredits}
          >
            <MaterialIcons name="play-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.earnButtonText}>{t.earnCredits}</Text>
          </Pressable>
        </View>

        {/* BYOK + YouTube Channels Shortcut */}
        <Pressable
          style={({ pressed }) => [
            styles.byokCard,
            pressed && styles.cardPressed,
          ]}
          onPress={() => router.push('/youtube-channels' as any)}
        >
          <View style={styles.byokIcon}>
            <MaterialIcons name="youtube-searched-for" size={32} color={Colors.secondary} />
          </View>
          <View style={styles.byokContent}>
            <Text style={styles.byokTitle}>{isRTL ? 'ערוצים + BYOK' : 'Channels + BYOK'}</Text>
            <Text style={styles.byokSubtitle}>{isRTL ? 'YouTube Data API v3' : 'YouTube Data API v3'}</Text>
            <Text style={styles.byokDescription}>
              {isRTL ? 'נהל ערוצים ומפתחות API' : 'Manage channels & API keys'}
            </Text>
          </View>
          <MaterialIcons 
            name={isRTL ? 'chevron-left' : 'chevron-right'} 
            size={24} 
            color={Colors.textSecondary} 
          />
        </Pressable>

        {/* Stats Section - המספרים מדברים בעד עצמם */}
        <View style={styles.statsSection}>
          <Text style={styles.statsSectionTitle}>
            {isRTL ? 'המספרים מדברים בעד עצמם' : 'The Numbers Speak for Themselves'}
          </Text>
          <Text style={styles.statsSectionSubtitle}>
            {isRTL ? 'ההישגים שלנו עד היום' : 'Our Achievements So Far'}
          </Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              value={recapsCreated.toString()}
              label={isRTL ? 'סיכומים נוצרו' : 'Recaps Created'}
              icon="video-library"
            />
            <StatCard
              value={activeUsers.toString()}
              label={isRTL ? 'משתמשים פעילים' : 'Active Users'}
              icon="people"
            />
            <StatCard
              value={`${serviceUptime.toFixed(1)}%`}
              label={isRTL ? 'זמינות השירות' : 'Service Uptime'}
              icon="verified"
              highlight
            />
            <StatCard
              value={`${averageRating.toFixed(1)}/5`}
              label={isRTL ? 'דירוג משתמשים' : 'User Rating'}
              icon="star"
              highlight
            />
          </View>
          
          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <Text style={styles.ratingTitle}>
              {isRTL ? 'דרג אותנו!' : 'Rate Us!'}
            </Text>
            <StarRating
              rating={userRating || 0}
              onRatingChange={handleRatingChange}
              size={40}
            />
            <Text style={styles.ratingCount}>
              {totalRatings} {isRTL ? 'דירוגים' : 'ratings'}
            </Text>
          </View>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          <FeatureCard
            icon="auto-awesome"
            title={isRTL ? '5 שלבים חכמים' : '5 Smart Steps'}
            description={isRTL ? 'Wizard מודרך מלא' : 'Full guided wizard'}
          />
          <FeatureCard
            icon="video-library"
            title={isRTL ? 'ניתוח וידאו AI' : 'AI Video Analysis'}
            description={isRTL ? 'Google Gemini' : 'Google Gemini'}
          />
          <FeatureCard
            icon="music-note"
            title={isRTL ? 'עיבוד אודיו' : 'Audio Processing'}
            description={isRTL ? 'MP3 אוטומטי' : 'Auto MP3'}
          />
          <FeatureCard
            icon="youtube-searched-for"
            title={isRTL ? 'למידה מיוטיוב' : 'YouTube Learning'}
            description={isRTL ? 'עד 11 ערוצים' : 'Up to 11 channels'}
          />
        </View>
      </ScrollView>

      {/* ── Banner Ad — Google Play policy compliant ──────────────────────────
           Position: fixed bottom, BELOW all content, NOT over any buttons.
           Invisible placeholder in Expo Go; real banner in production APK. */}
      <HomeBannerAd unitId={bannerUnitId} />
    </View>
  );
}

function StatCard({ value, label, icon, highlight }: { value: string; label: string; icon: any; highlight?: boolean }) {
  return (
    <View style={[styles.statCard, highlight && styles.statCardHighlight]}>
      <MaterialIcons name={icon} size={24} color={highlight ? Colors.secondary : Colors.primary} />
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FeatureCard({ icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <View style={styles.featureCard}>
      <MaterialIcons name={icon} size={32} color={Colors.primary} />
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  testModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255, 160, 0, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: '#FFA000',
    paddingVertical: Spacing.xs,
  },
  testModeText: {
    fontSize: Typography.caption,
    color: '#FFA000',
    fontWeight: Typography.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  
  // Hero
  hero: {
    minHeight: 400,
    marginBottom: Spacing.lg,
  },
  gradientOverlay: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.neon,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: Typography.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.xs,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 212, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  appName: {
    fontSize: Typography.h4,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontSize: Typography.h3,
    fontWeight: Typography.semibold,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  ctaContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  primaryButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  primaryButtonText: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: '#FFF',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  // Credits Card
  creditsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  creditsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  creditsTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  creditsBalance: {
    fontSize: 48,
    fontWeight: Typography.bold,
    color: Colors.primary,
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
  earnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  earnButtonText: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },

  // BYOK Card
  byokCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(178, 75, 243, 0.3)',
    ...Shadows.sm,
  },
  cardPressed: {
    opacity: 0.9,
  },
  byokIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(178, 75, 243, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  byokContent: {
    flex: 1,
  },
  byokTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: 2,
  },
  byokSubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.secondary,
    marginBottom: 4,
  },
  byokDescription: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statsSectionTitle: {
    fontSize: Typography.h2,
    fontWeight: Typography.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  statsSectionSubtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  statCardHighlight: {
    borderColor: Colors.secondary,
    backgroundColor: 'rgba(178, 75, 243, 0.05)',
  },
  statValue: {
    fontSize: 32,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  statValueHighlight: {
    color: Colors.secondary,
  },
  statLabel: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  // Rating Section
  ratingSection: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  ratingTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  ratingCount: {
    fontSize: Typography.bodySmall,
    color: Colors.textMuted,
  },

  // Features Grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  featureCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureTitle: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.text,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
