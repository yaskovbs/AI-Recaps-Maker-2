/**
 * Stripe Credits Service
 * Handles credit package definitions and purchase flow
 * Real Stripe webhook processing happens server-side
 */
import { blink } from '@/lib/blink';

export interface CreditPackage {
  id: string;
  name: string;
  nameHe: string;
  credits: number;
  price: number; // USD cents
  priceDisplay: string;
  originalPrice?: number;
  discount?: string;
  popular?: boolean;
  icon: string;
  description: string;
  descriptionHe: string;
  stripePriceId: string; // Used for real Stripe integration
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    nameHe: 'חבילת מתחיל',
    credits: 10,
    price: 299,
    priceDisplay: '$2.99',
    icon: '⚡',
    description: 'Perfect for trying out the service',
    descriptionHe: 'מושלם להתנסות בשירות',
    stripePriceId: 'price_starter_10',
  },
  {
    id: 'basic',
    name: 'Basic Pack',
    nameHe: 'חבילה בסיסית',
    credits: 25,
    price: 599,
    priceDisplay: '$5.99',
    icon: '🎬',
    description: 'For casual recap creators',
    descriptionHe: 'ליוצרי סיכומים מזדמנים',
    stripePriceId: 'price_basic_25',
  },
  {
    id: 'popular',
    name: 'Pro Pack',
    nameHe: 'חבילת פרו',
    credits: 75,
    price: 1499,
    priceDisplay: '$14.99',
    originalPrice: 1799,
    discount: '17% OFF',
    popular: true,
    icon: '🔥',
    description: 'Most popular — best value for regular users',
    descriptionHe: 'הנמכרת ביותר — ערך מצוין למשתמשים קבועים',
    stripePriceId: 'price_popular_75',
  },
  {
    id: 'creator',
    name: 'Creator Pack',
    nameHe: 'חבילת יוצר',
    credits: 200,
    price: 3499,
    priceDisplay: '$34.99',
    originalPrice: 5000,
    discount: '30% OFF',
    icon: '🚀',
    description: 'For power creators producing many recaps',
    descriptionHe: 'ליוצרים שמייצרים הרבה סיכומים',
    stripePriceId: 'price_creator_200',
  },
  {
    id: 'studio',
    name: 'Studio Pack',
    nameHe: 'חבילת סטודיו',
    credits: 500,
    price: 7999,
    priceDisplay: '$79.99',
    originalPrice: 12500,
    discount: '36% OFF',
    icon: '💎',
    description: 'Maximum value for professional studios',
    descriptionHe: 'ערך מקסימלי לסטודיוס מקצועיים',
    stripePriceId: 'price_studio_500',
  },
];

export interface PurchaseResult {
  success: boolean;
  creditsAdded?: number;
  newBalance?: number;
  transactionId?: string;
  error?: string;
}

/**
 * Simulate credit purchase (replace with real Stripe checkout in production)
 * In production: open Stripe checkout → webhook updates DB → return result
 */
export async function purchaseCredits(
  userId: string,
  packageId: string
): Promise<PurchaseResult> {
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) {
    return { success: false, error: 'Invalid package' };
  }

  try {
    // Get current balance
    const existing = await blink.db.userCredits.list({
      where: { userId },
      limit: 1,
    });

    const currentBalance = existing.length > 0 ? (existing[0].balance as number) : 0;
    const newBalance = currentBalance + pkg.credits;

    if (existing.length > 0) {
      await blink.db.userCredits.update(existing[0].id as string, {
        balance: newBalance,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await blink.db.userCredits.create({
        userId,
        balance: newBalance,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Log credit history
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await blink.db.creditsHistory.create({
      userId,
      type: 'purchase',
      amount: pkg.credits,
      reason: `Purchased ${pkg.name} (${pkg.priceDisplay}) — txn: ${transactionId}`,
      createdAt: new Date().toISOString(),
    });

    console.log(`✅ Credits purchased: +${pkg.credits} → balance: ${newBalance}`);
    return {
      success: true,
      creditsAdded: pkg.credits,
      newBalance,
      transactionId,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Purchase failed';
    console.error('❌ Credit purchase failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Get current credit balance for a user
 */
export async function getCreditBalance(userId: string): Promise<number> {
  try {
    const rows = await blink.db.userCredits.list({
      where: { userId },
      limit: 1,
    });
    return rows.length > 0 ? (rows[0].balance as number) : 0;
  } catch {
    return 0;
  }
}

/**
 * Calculate value: credits per dollar
 */
export function getValueScore(pkg: CreditPackage): number {
  return Math.round((pkg.credits / pkg.price) * 100);
}
