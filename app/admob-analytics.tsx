import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdMob } from '@/contexts/AdMobContext';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function AdMobAnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { adImpressions, isTestMode, resetImpressions } = useAdMob();

  // Mock eCPM values (in production, get from AdMob API)
  const mockECPM = {
    rewarded: 5.2,
    interstitial: 3.8,
    appOpen: 4.5,
  };

  const estimatedRevenue = (
    (adImpressions.rewarded * mockECPM.rewarded) +
    (adImpressions.interstitial * mockECPM.interstitial) +
    (adImpressions.appOpen * mockECPM.appOpen)
  ) / 1000;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons 
            name={isRTL ? 'chevron-right' : 'chevron-left'} 
            size={28} 
            color={Colors.text} 
          />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isRTL ? 'ניתוח AdMob' : 'AdMob Analytics'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Test Mode Warning */}
      {isTestMode && (
        <View style={styles.testModeBanner}>
          <MaterialIcons name="warning" size={20} color="#FFA000" />
          <Text style={styles.testModeText}>
            {isRTL ? 'מצב בדיקה פעיל - מזהי מודעות Test' : 'Test Mode Active - Using Test Ad IDs'}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isRTL ? 'סיכום' : 'Overview'}
          </Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              icon="visibility"
              title={isRTL ? 'סה"כ חשיפות' : 'Total Impressions'}
              value={adImpressions.rewarded + adImpressions.interstitial + adImpressions.appOpen}
              color={Colors.primary}
            />
            <StatCard
              icon="attach-money"
              title={isRTL ? 'הכנסה משוערת' : 'Est. Revenue'}
              value={`$${estimatedRevenue.toFixed(2)}`}
              color={Colors.success}
            />
          </View>
        </View>

        {/* Impressions by Ad Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isRTL ? 'חשיפות לפי סוג מודעה' : 'Impressions by Ad Type'}
          </Text>
          
          <AdTypeCard
            icon="card-giftcard"
            title={isRTL ? 'מתגמלת (Rewarded)' : 'Rewarded'}
            impressions={adImpressions.rewarded}
            ecpm={mockECPM.rewarded}
            revenue={(adImpressions.rewarded * mockECPM.rewarded) / 1000}
            color="#4CAF50"
          />
          
          <AdTypeCard
            icon="web"
            title={isRTL ? 'מעברון (Interstitial)' : 'Interstitial'}
            impressions={adImpressions.interstitial}
            ecpm={mockECPM.interstitial}
            revenue={(adImpressions.interstitial * mockECPM.interstitial) / 1000}
            color="#2196F3"
          />
          
          <AdTypeCard
            icon="open-in-new"
            title={isRTL ? 'פתיחת אפליקציה (App Open)' : 'App Open'}
            impressions={adImpressions.appOpen}
            ecpm={mockECPM.appOpen}
            revenue={(adImpressions.appOpen * mockECPM.appOpen) / 1000}
            color="#9C27B0"
          />
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [
              styles.resetButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={resetImpressions}
          >
            <MaterialIcons name="refresh" size={20} color={Colors.error} />
            <Text style={styles.resetButtonText}>
              {isRTL ? 'איפוס ספירת חשיפות' : 'Reset Impression Counters'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, title, value, color }: { icon: any; title: string; value: string | number; color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <MaterialIcons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function AdTypeCard({ 
  icon, 
  title, 
  impressions, 
  ecpm, 
  revenue, 
  color 
}: { 
  icon: any; 
  title: string; 
  impressions: number; 
  ecpm: number; 
  revenue: number; 
  color: string;
}) {
  const { isRTL } = useLanguage();
  
  return (
    <View style={styles.adTypeCard}>
      <View style={styles.adTypeHeader}>
        <View style={[styles.adTypeIcon, { backgroundColor: `${color}20` }]}>
          <MaterialIcons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.adTypeTitle}>{title}</Text>
      </View>
      
      <View style={styles.adTypeStats}>
        <View style={styles.adTypeStat}>
          <Text style={styles.adTypeStatLabel}>
            {isRTL ? 'חשיפות' : 'Impressions'}
          </Text>
          <Text style={[styles.adTypeStatValue, { color }]}>{impressions}</Text>
        </View>
        
        <View style={styles.adTypeStat}>
          <Text style={styles.adTypeStatLabel}>eCPM</Text>
          <Text style={[styles.adTypeStatValue, { color }]}>${ecpm.toFixed(2)}</Text>
        </View>
        
        <View style={styles.adTypeStat}>
          <Text style={styles.adTypeStatLabel}>
            {isRTL ? 'הכנסה' : 'Revenue'}
          </Text>
          <Text style={[styles.adTypeStatValue, { color }]}>${revenue.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  
  testModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 160, 0, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#FFA000',
    padding: Spacing.md,
  },
  testModeText: {
    fontSize: Typography.bodySmall,
    color: '#FFA000',
    fontWeight: Typography.semibold,
    flex: 1,
  },
  
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statValue: {
    fontSize: Typography.h2,
    fontWeight: Typography.bold,
  },
  
  adTypeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  adTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  adTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adTypeTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.semibold,
    color: Colors.text,
  },
  adTypeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  adTypeStat: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  adTypeStatLabel: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  adTypeStatValue: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
  },
  
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  resetButtonText: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.error,
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
