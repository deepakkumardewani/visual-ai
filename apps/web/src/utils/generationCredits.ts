import {
  getCategoryCreditRange,
  getCreditCost,
  getCreditCostRange,
  getModelKeysByCategory,
  MIN_CREDIT_COST,
  MODEL_REGISTRY,
} from '@visual-ai/shared';
import type { ModelKey, Tier } from '@visual-ai/shared';

/** Per-image base cost when no model cost is known (the cheapest possible run). */
const GENERATION_BASE_COST_PER_IMAGE = MIN_CREDIT_COST;

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
 * Model each one-click transform runs. Must match the API defaults
 * (generation-service: UPSCALE_IMAGE default, REVIVE, BACKGROUND_REMOVER).
 */
export const TRANSFORM_MODEL_KEYS = {
  upscale: 'UPSCALE_IMAGE',
  colorize: 'COLORIZE_ADVANCED',
  revive: 'REVIVE',
  remove_bg: 'BACKGROUND_REMOVER',
} as const satisfies Record<string, ModelKey>;

export type TransformAction = keyof typeof TRANSFORM_MODEL_KEYS;

/**
 * Credits for an upscale / colorize / revive / remove-bg transform, priced by the model it runs.
 * Without an action it returns the cheapest studio-tool cost (a "from" price).
 */
export function getTransformCreditCost(action?: TransformAction): number {
  if (!action) return getCategoryCreditRange('utility').min;
  return getCreditCost(TRANSFORM_MODEL_KEYS[action]);
}

/** Cheapest generation model in a tier, e.g. "1 cr" for budget. */
export function getTierCreditLabel(tier: Tier): string {
  const tierKeys = getModelKeysByCategory('generation').filter(
    (key) => MODEL_REGISTRY[key].tier === tier,
  );
  return `${getCreditCostRange(tierKeys).min} cr`;
}
