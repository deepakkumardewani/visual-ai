import { formatPrice, PREMIUM_CREDIT_COST } from '@visual-ai/shared';
import type { SupportedCurrency } from '@visual-ai/shared';

export const PRICE_BASIS_CREDITS = 100;
const BUDGET_IMAGE_CREDIT_COST = 1;

/**
 * Localized price of 100 credits. Scaling before rounding keeps a pack's per-credit
 * cost readable (a per-credit amount rounds to a zero price for large packs); the
 * result is rounded to a whole minor unit so zero-decimal currencies never show fractions.
 */
export function formatPricePer100Credits(
  amountMinor: number,
  credits: number,
  currency: SupportedCurrency,
): string {
  const perBasisMinor = Math.round((amountMinor * PRICE_BASIS_CREDITS) / credits);
  return formatPrice(perBasisMinor, currency);
}

export type ImageEstimate = { budgetImages: number; premiumImages: number };

/** How many images a credit amount buys at the cheapest and the premium model price. */
export function estimateImages(credits: number): ImageEstimate {
  return {
    budgetImages: Math.floor(credits / BUDGET_IMAGE_CREDIT_COST),
    premiumImages: Math.floor(credits / PREMIUM_CREDIT_COST),
  };
}

export function formatImageEstimate(credits: number): string {
  const { budgetImages, premiumImages } = estimateImages(credits);
  return `≈ ${budgetImages} images at ${BUDGET_IMAGE_CREDIT_COST} credit / ${premiumImages} at ${PREMIUM_CREDIT_COST} credits`;
}
