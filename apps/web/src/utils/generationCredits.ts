import { TIER_CREDIT_COST, MODEL_REGISTRY } from '@visual-ai/shared';
import type { ModelKey, Tier } from '@visual-ai/shared';

/** Flat per-image base cost for text-to-image generation. */
const GENERATION_BASE_COST_PER_IMAGE = 1;

/** Default quality multiplier when quality does not change pricing. */
const DEFAULT_QUALITY_MULTIPLIER = 1;

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
  options?: { qualityMultiplier?: number },
): GenerationCreditBreakdown {
  const baseCostPerImage = GENERATION_BASE_COST_PER_IMAGE;
  const imageCount = Math.max(1, noOfOutputs);
  const qualityMultiplier = options?.qualityMultiplier ?? DEFAULT_QUALITY_MULTIPLIER;
  const total = Math.max(1, Math.ceil(baseCostPerImage * imageCount * qualityMultiplier));

  return { baseCostPerImage, imageCount, qualityMultiplier, total };
}

/** Credits consumed per generated image (1 credit each). */
export function getGenerationCreditCost(noOfOutputs: number): number {
  return getGenerationCreditBreakdown(noOfOutputs).total;
}

/** True when the user's balance covers the configured generation cost. */
export function canAffordGeneration(balance: number, noOfOutputs: number): boolean {
  return balance >= getGenerationCreditCost(noOfOutputs);
}

/**
 * Credits for upscale / colorize / revive / remove-bg transforms.
 * When modelKey is provided, uses tier-based pricing from the registry.
 * When modelKey is omitted, returns the legacy flat cost for backward compatibility.
 */
export function getTransformCreditCost(isPro: boolean, modelKey?: ModelKey): number {
  // If no model key, use legacy flat cost (backward compatibility)
  if (!modelKey) {
    return isPro ? 1 : 3;
  }

  // Tier-based pricing for utility models
  const model = MODEL_REGISTRY[modelKey];
  if (!model) {
    // Fallback to legacy cost if model not found
    return isPro ? 1 : 3;
  }

  const plan = isPro ? 'pro' : 'free';
  return TIER_CREDIT_COST[model.tier][plan];
}

/** Published credit cost for picker badges (pro-plan rate — integer, easy to scan). */
export function getTierCreditCost(tier: Tier): number {
  return TIER_CREDIT_COST[tier].pro;
}

/** Compact cost badge label derived from tier credit table. */
export function getTierCreditLabel(tier: Tier): string {
  return `${getTierCreditCost(tier)} cr`;
}
