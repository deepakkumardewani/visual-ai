import {
  formatCreditRange,
  getCategoryCreditRange,
  getCreditCostRange,
  getModelKeysByCategory,
  MODEL_REGISTRY,
} from '@visual-ai/shared';
import type { CreditCostRange, ModelKey } from '@visual-ai/shared';

import { getTransformCreditCost, TRANSFORM_MODEL_KEYS } from '@/utils/generationCredits';
import type { TransformAction } from '@/utils/generationCredits';

/** "1 credit" / "14 credits". */
export function formatCredits(count: number): string {
  return `${count} credit${count === 1 ? '' : 's'}`;
}

/** "1–30 credits", or "2 credits" when the range is a single value. */
export function formatCreditsRange(range: CreditCostRange): string {
  if (range.min === range.max) return formatCredits(range.min);
  return `${formatCreditRange(range)} credits`;
}

/** Cost label for a one-click studio tool, e.g. "2 credits" for revive. */
export function transformCreditsLabel(action: TransformAction): string {
  return formatCredits(getTransformCreditCost(action));
}

const upscalerKeys = (premium: boolean): ModelKey[] =>
  getModelKeysByCategory('upscale').filter(
    (key) => (MODEL_REGISTRY[key].tier === 'premium') === premium,
  );

/** Standard (non-premium tier) upscalers' credit range. */
export const standardUpscaleCreditRange = (): CreditCostRange =>
  getCreditCostRange(upscalerKeys(false));

/** Premium-tier upscalers' (Clarity Pro, Topaz) credit range. */
export const premiumUpscaleCreditRange = (): CreditCostRange =>
  getCreditCostRange(upscalerKeys(true));

/**
 * Range of the one-click studio tools (colorize, restore, remove background) as the studio runs
 * them. Narrower than the whole utility category, which also lists models no tool runs.
 */
export const studioToolCreditRange = (): CreditCostRange => {
  const { colorize, revive, remove_bg } = TRANSFORM_MODEL_KEYS;
  return getCreditCostRange([colorize, revive, remove_bg]);
};

export interface CreditEconomyLine {
  label: string;
  range: CreditCostRange;
}

/**
 * Per-category cost lines for pricing copy. Static files that cannot import this
 * (pricingFAQ.json, public/pricing.md, public/llms.txt) are checked against it in a drift test.
 */
export function creditEconomyLines(): CreditEconomyLine[] {
  return [
    { label: 'Image generation', range: getCategoryCreditRange('generation') },
    { label: 'Studio tools', range: studioToolCreditRange() },
    { label: 'Upscaling', range: getCategoryCreditRange('upscale') },
  ];
}

/** "Image generation: 1–30 credits" — the exact phrase static copy must contain. */
export function creditEconomyPhrase({ label, range }: CreditEconomyLine): string {
  return `${label}: ${formatCreditsRange(range)}`;
}
