/**
 * Credits Purchase Modal — Stripe-powered credit packages
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CREDIT_PACKAGES,
  CreditPackage,
  purchaseCredits,
  getValueScore,
} from '@/services/stripe-credits';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  userId: string;
  currentBalance: number;
  onPurchaseComplete: (newBalance: number) => void;
  isRTL?: boolean;
}

function PackageCard({
  pkg,
  selected,
  onSelect,
  isRTL,
}: {
  pkg: CreditPackage;
  selected: boolean;
  onSelect: () => void;
  isRTL: boolean;
}) {
  const valueScore = getValueScore(pkg);

  return (
    <Pressable
      style={({ pressed }) => [
        cardStyles.card,
        selected && cardStyles.selected,
        pkg.popular && cardStyles.popular,
        pressed && { opacity: 0.9 },
      ]}
      onPress={onSelect}
    >
      {pkg.popular && (
        <View style={cardStyles.popularBadge}>
          <Text style={cardStyles.popularText}>
            {isRTL ? '🔥 הכי פופולרי' : '🔥 MOST POPULAR'}
          </Text>
        </View>
      )}

      <View style={cardStyles.row}>
        <Text style={cardStyles.icon}>{pkg.icon}</Text>
        <View style={cardStyles.info}>
          <Text style={cardStyles.name}>{isRTL ? pkg.nameHe : pkg.name}</Text>
          <Text style={cardStyles.description}>
            {isRTL ? pkg.descriptionHe : pkg.description}
          </Text>
        </View>
        <View style={cardStyles.right}>
          <Text style={cardStyles.credits}>
            {pkg.credits}
            <Text style={cardStyles.creditsLabel}> {isRTL ? 'ק׳' : 'cr'}</Text>
          </Text>
          <View style={cardStyles.priceWrap}>
            {pkg.originalPrice && (
              <Text style={cardStyles.originalPrice}>
                ${(pkg.originalPrice / 100).toFixed(2)}
              </Text>
            )}
            <Text style={[cardStyles.price, selected && { color: Colors.primary }]}>
              {pkg.priceDisplay}
            </Text>
          </View>
        </View>
      </View>

      <View style={cardStyles.footer}>
        <View style={cardStyles.valueWrap}>
          <MaterialIcons name="trending-up" size={12} color={Colors.success} />
          <Text style={cardStyles.valueText}>
            {valueScore} {isRTL ? 'קרדיטים לדולר' : 'credits/dollar'}
          </Text>
        </View>
        {pkg.discount && (
          <View style={cardStyles.discountBadge}>
            <Text style={cardStyles.discountText}>{pkg.discount}</Text>
          </View>
        )}
        {selected && (
          <MaterialIcons name="check-circle" size={18} color={Colors.primary} />
        )}
      </View>
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  selected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  popular: {
    borderColor: `${Colors.warning}60`,
    position: 'relative',
    paddingTop: Spacing.lg + 4,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: `${Colors.warning}20`,
    paddingVertical: 4,
    alignItems: 'center',
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
    borderBottomWidth: 1,
    borderColor: `${Colors.warning}40`,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.warning,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  icon: { fontSize: 24 },
  info: { flex: 1 },
  name: {
    fontSize: Typography.bodySmall,
    fontWeight: '700',
    color: Colors.text,
  },
  description: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  right: { alignItems: 'flex-end' },
  credits: {
    fontSize: Typography.h4,
    fontWeight: '800',
    color: Colors.text,
  },
  creditsLabel: {
    fontSize: Typography.caption,
    fontWeight: '400',
    color: Colors.textMuted,
  },
  priceWrap: { alignItems: 'flex-end' },
  originalPrice: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: Typography.body,
    fontWeight: '700',
    color: Colors.text,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  valueWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  valueText: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: '500',
  },
  discountBadge: {
    backgroundColor: `${Colors.success}20`,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: `${Colors.success}40`,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
  },
});

// ─── Main Modal ────────────────────────────────────────────────────────────────

export default function CreditsPurchaseModal({
  visible,
  onClose,
  userId,
  currentBalance,
  onPurchaseComplete,
  isRTL = false,
}: Props) {
  const [selectedId, setSelectedId] = useState<string>('popular');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const selectedPackage = CREDIT_PACKAGES.find((p) => p.id === selectedId);

  const handlePurchase = async () => {
    if (!selectedPackage || !userId) {
      Alert.alert(
        isRTL ? 'שגיאה' : 'Error',
        isRTL ? 'אנא בחר חבילה' : 'Please select a package'
      );
      return;
    }

    setIsPurchasing(true);
    try {
      const result = await purchaseCredits(userId, selectedId);

      if (result.success && result.newBalance !== undefined) {
        Alert.alert(
          isRTL ? '✅ רכישה הצליחה!' : '✅ Purchase Successful!',
          isRTL
            ? `נוספו ${result.creditsAdded} קרדיטים! יתרה חדשה: ${result.newBalance}`
            : `Added ${result.creditsAdded} credits! New balance: ${result.newBalance}`,
          [
            {
              text: 'OK',
              onPress: () => {
                onPurchaseComplete(result.newBalance!);
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          isRTL ? 'שגיאה' : 'Error',
          result.error || (isRTL ? 'הרכישה נכשלה' : 'Purchase failed')
        );
      }
    } catch (error) {
      Alert.alert(
        isRTL ? 'שגיאה' : 'Error',
        isRTL ? 'אירעה שגיאה בלתי צפויה' : 'Unexpected error occurred'
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{isRTL ? '💳 קנה קרדיטים' : '💳 Buy Credits'}</Text>
              <Text style={styles.subtitle}>
                {isRTL
                  ? `יתרה נוכחית: ${currentBalance} קרדיטים`
                  : `Current balance: ${currentBalance} credits`}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
            >
              <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {/* Info banner */}
          <View style={styles.infoBanner}>
            <MaterialIcons name="info-outline" size={14} color={Colors.primary} />
            <Text style={styles.infoText}>
              {isRTL
                ? '1 קרדיט = 1 סיכום וידאו. ניתן להרוויח גם קרדיטים חינם על ידי צפייה במודעות'
                : '1 credit = 1 video recap. Earn free credits by watching ads too'}
            </Text>
          </View>

          {/* Packages */}
          <ScrollView
            style={styles.packagesScroll}
            contentContainerStyle={styles.packagesContent}
            showsVerticalScrollIndicator={false}
          >
            {CREDIT_PACKAGES.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                selected={selectedId === pkg.id}
                onSelect={() => setSelectedId(pkg.id)}
                isRTL={isRTL}
              />
            ))}
          </ScrollView>

          {/* Purchase Button */}
          <View style={styles.footer}>
            {selectedPackage && (
              <Text style={styles.selectedSummary}>
                {isRTL
                  ? `${selectedPackage.nameHe}: ${selectedPackage.credits} קרדיטים ב-${selectedPackage.priceDisplay}`
                  : `${selectedPackage.name}: ${selectedPackage.credits} credits for ${selectedPackage.priceDisplay}`}
              </Text>
            )}
            <Pressable
              style={({ pressed }) => [styles.purchaseBtn, pressed && { opacity: 0.85 }]}
              onPress={handlePurchase}
              disabled={isPurchasing || !selectedPackage}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.purchaseGradient}
              >
                {isPurchasing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <MaterialIcons name="shopping-cart" size={20} color="#FFF" />
                    <Text style={styles.purchaseText}>
                      {isRTL ? 'קנה עכשיו' : 'Purchase Now'}
                      {selectedPackage ? ` — ${selectedPackage.priceDisplay}` : ''}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
            <Text style={styles.secureNote}>
              🔒 {isRTL ? 'תשלום מאובטח עם Stripe' : 'Secure payment powered by Stripe'}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: Typography.h3,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: `${Colors.primary}10`,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: `${Colors.primary}25`,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  packagesScroll: {
    maxHeight: 400,
    marginTop: Spacing.sm,
  },
  packagesContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  selectedSummary: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  purchaseBtn: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  purchaseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  purchaseText: {
    fontSize: Typography.body,
    fontWeight: '700',
    color: '#FFF',
  },
  secureNote: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
