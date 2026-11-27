import { formatPrice, getCategoryCreditRange } from '@visual-ai/shared';
import type { SupportedCurrency } from '@visual-ai/shared';

export const PRICE_BASIS_CREDITS = 100;

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

const pluralCredits = (count: number): string => `${count} credit${count === 1 ? '' : 's'}`;

/** How many images a credit amount buys at the cheapest and the priciest generation model. */
export function estimateImages(credits: number): ImageEstimate {
  const { min, max } = getCategoryCreditRange('generation');
  return {
    budgetImages: Math.floor(credits / min),
    premiumImages: Math.floor(credits / max),
  };
}

export function formatImageEstimate(credits: number): string {
  const { min, max } = getCategoryCreditRange('generation');
  const { budgetImages, premiumImages } = estimateImages(credits);
  return `≈ ${budgetImages} images at ${pluralCredits(min)} / ${premiumImages} at ${pluralCredits(max)}`;
}
