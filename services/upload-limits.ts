// Credit cost tiers for video uploads
export const UPLOAD_CREDIT_COSTS = {
  small:  { maxSize: 500 * 1024 * 1024,      credits: 1 }, // up to 500MB = 1 credit
  medium: { maxSize: 2 * 1024 * 1024 * 1024, credits: 2 }, // up to 2GB   = 2 credits
  large:  { maxSize: 5 * 1024 * 1024 * 1024, credits: 3 }, // up to 5GB   = 3 credits
} as const;

export type UploadTier = keyof typeof UPLOAD_CREDIT_COSTS;

/**
 * Returns the matching upload tier and credit cost for a given file size,
 * or null if the file exceeds the 5 GB maximum.
 */
export function getUploadCreditCost(
  fileSizeBytes: number
): { tier: string; credits: number; maxSize: number } | null {
  for (const [tier, config] of Object.entries(UPLOAD_CREDIT_COSTS)) {
    if (fileSizeBytes <= config.maxSize) {
      return { tier, credits: config.credits, maxSize: config.maxSize };
    }
  }
  return null; // exceeds 5 GB
}

/**
 * Returns whether a user with the given credit balance can upload a file
 * of the given size, along with a reason and credits needed when blocked.
 */
export function canUserUpload(
  balance: number,
  fileSizeBytes: number
): { allowed: boolean; reason?: string; creditsNeeded?: number } {
  const tier = getUploadCreditCost(fileSizeBytes);

  if (!tier) {
    return {
      allowed: false,
      reason: 'File exceeds the maximum allowed size of 5 GB.',
    };
  }

  if (balance < tier.credits) {
    return {
      allowed: false,
      reason: `You need ${tier.credits} credit${tier.credits !== 1 ? 's' : ''} to upload this file, but you only have ${balance}.`,
      creditsNeeded: tier.credits,
    };
  }

  return { allowed: true };
}

/**
 * Returns a human-readable description of an upload tier,
 * e.g. "500 MB (1 credit)" or "2 GB (2 credits)".
 */
export function formatUploadLimit(tier: string): string {
  const config = UPLOAD_CREDIT_COSTS[tier as UploadTier];
  if (!config) return tier;

  const { maxSize, credits } = config;
  const label =
    maxSize >= 1024 * 1024 * 1024
      ? `${maxSize / (1024 * 1024 * 1024)} GB`
      : `${maxSize / (1024 * 1024)} MB`;

  return `${label} (${credits} credit${credits !== 1 ? 's' : ''})`;
}
