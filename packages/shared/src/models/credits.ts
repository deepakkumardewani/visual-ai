import type { ModelKey } from './types.js';
import { MODEL_REGISTRY } from './registry.js';

/** Signup credits for new users */
export const SIGNUP_CREDITS = 50;

/** Daily credits reset for all users */
export const DAILY_CREDITS = 30;

/** Bonus credits for successful referral (both referrer and referee) */
export const REFERRAL_BONUS = 50;

/**
 * Get the integer credit cost for a model.
 * Budget/standard generation: 1 credit
 * Premium generation (FLUX Pro/Max, Imagen Ultra): 4-5 credits
 * Utility models (upscale/colorize/revive/remove-bg): 2 credits
 * Premium upscalers (Clarity Pro, Topaz): 4 credits
 */
export function getCreditCost(modelKey: ModelKey): number {
  const model = MODEL_REGISTRY[modelKey];
  if (!model) {
    throw new Error(`Unknown model key: ${modelKey}`);
  }

  // Map model keys to credit costs
  const costs: Record<ModelKey, number> = {
    // Budget generation: 1 credit
    FLUX_QUICK: 1,
    FLUX_FAST: 1,
    P_IMAGE: 1,
    Z_IMAGE_TURBO: 1,
    GROK_IMAGINE: 1,
    COLORIZE_BASIC: 2,
    REVIVE: 2,
    UPSCALE_REAL_ESRGAN: 2,
    UPSCALE_PRUNA: 2,
    UPSCALE_RECRAFT: 2,

    // Standard generation: 1 credit
    FLUX_BASIC: 1,
    GROK_IMAGINE_QUALITY: 1,
    SEEDREAM_4: 1,
    FLUX_2_DEV: 1,
    FLUX_2_PRO: 1,
    FLUX_KONTEXT_PRO: 1,
    UPSCALE_IMAGE: 2,
    COLORIZE_ADVANCED: 2,
    OLD_PHOTOS: 2,
    BACKGROUND_REMOVER: 2,
    UPSCALE_GOOGLE: 2,
    NANO_BANANA_2: 1,
    IMAGEN_4_ULTRA: 4,

    // Premium generation: 4-5 credits
    FLUX_PRO: 5,
    FLUX_1_1_PRO: 5,
    FLUX_REALISM: 4,
    FLUX_2_MAX: 5,
    FLUX_KONTEXT_MAX: 4,
    NANO_BANANA_PRO: 5,
    GPT_IMAGE_2: 5,

    // Premium upscalers: 4 credits
    UPSCALE_CLARITY_PRO: 4,
    UPSCALE_TOPAZ: 4,
  };

  const cost = costs[modelKey];
  if (cost === undefined) {
    throw new Error(`No credit cost defined for model: ${modelKey}`);
  }
  return cost;
}
