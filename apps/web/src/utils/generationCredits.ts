import type { Tier } from '@visual-ai/shared';

/** Flat per-image base cost for text-to-image generation. */
const GENERATION_BASE_COST_PER_IMAGE = 1;

/** Default quality multiplier when quality does not change pricing. */
const DEFAULT_QUALITY_MULTIPLIER = 1;

/** Credit cost for utility models (upscale, colorize, revive, remove-bg) */
const TRANSFORM_CREDIT_COST = 2;

export type GenerationCreditBreakdown = {
  baseCostPerImage: number;
  imageCount: number;
  qualityMultiplier: number;
  total: number;
};

/**
 * Breaks down generation credit cost into base × images × quality.
 * Quality multiplier defaults to 1 (no quality surcharge today).
 */
export function getGenerationCreditBreakdown(
  noOfOutputs: number,
  options?: { qualityMultiplier?: number; baseCostPerImage?: number },
): GenerationCreditBreakdown {
  const baseCostPerImage = options?.baseCostPerImage ?? GENERATION_BASE_COST_PER_IMAGE;
  const imageCount = Math.max(1, noOfOutputs);
  const qualityMultiplier = options?.qualityMultiplier ?? DEFAULT_QUALITY_MULTIPLIER;
  const total = Math.max(1, Math.ceil(baseCostPerImage * imageCount * qualityMultiplier));

  return { baseCostPerImage, imageCount, qualityMultiplier, total };
}

/** Credits consumed for a generation run (model cost × image count). */
export function getGenerationCreditCost(
  noOfOutputs: number,
  baseCostPerImage = GENERATION_BASE_COST_PER_IMAGE,
): number {
  return getGenerationCreditBreakdown(noOfOutputs, { baseCostPerImage }).total;
}

/** True when the user's balance covers the configured generation cost. */
export function canAffordGeneration(
  balance: number,
  noOfOutputs: number,
  baseCostPerImage = GENERATION_BASE_COST_PER_IMAGE,
): boolean {
  return balance >= getGenerationCreditCost(noOfOutputs, baseCostPerImage);
}

/**
 * Credits for upscale / colorize / revive / remove-bg transforms.
 * Returns the flat utility model cost (2 credits).
 */
export function getTransformCreditCost(): number {
  return TRANSFORM_CREDIT_COST;
}

/** Get the credit cost label for a tier (e.g., "1 cr", "4 cr", "5 cr"). */
export function getTierCreditLabel(tier: Tier): string {
  // Map tiers to their minimum credit cost for display
  const tierCosts: Record<Tier, number> = {
    budget: 1,
    standard: 1,
    premium: 4,
  };
  return `${tierCosts[tier]} cr`;
}
