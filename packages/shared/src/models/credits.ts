import type { ModelKey } from './types.js';
import { MODEL_REGISTRY } from './registry.js';

/** Signup credits for new users */
export const SIGNUP_CREDITS = 30;

/** Daily credits granted per plan; resets unused at DAILY_RESET_UTC_HOUR. */
export const DAILY_CREDITS = { free: 30, pro: 50 } as const;

/** Hour (UTC) at which daily credits reset. */
export const DAILY_RESET_UTC_HOUR = 0;

/** Credit cost of every premium-tier generation model. */
export const PREMIUM_CREDIT_COST = 5;

export function getDailyCredits(isPro: boolean): number {
  return isPro ? DAILY_CREDITS.pro : DAILY_CREDITS.free;
}

/** Bonus credits for successful referral (both referrer and referee) */
export const REFERRAL_BONUS = 30;

/**
 * Get the integer credit cost for a model.
 * Budget/standard generation: 1 credit
 * Premium generation (FLUX Pro/Max/Realism/Kontext, Imagen Ultra, Nano Banana Pro, GPT Image 2): 5 credits
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

    // Standard generation: 1 credit (FLUX_2_PRO and FLUX_KONTEXT_PRO are 5)
    FLUX_BASIC: 1,
    GROK_IMAGINE_QUALITY: 1,
    SEEDREAM_4: 1,
    FLUX_2_DEV: 1,
    FLUX_2_PRO: PREMIUM_CREDIT_COST,
    FLUX_KONTEXT_PRO: PREMIUM_CREDIT_COST,
    UPSCALE_IMAGE: 2,
    COLORIZE_ADVANCED: 2,
    OLD_PHOTOS: 2,
    BACKGROUND_REMOVER: 2,
    UPSCALE_GOOGLE: 2,
    NANO_BANANA_2: 1,
    IMAGEN_4_ULTRA: PREMIUM_CREDIT_COST,

    // Premium generation: PREMIUM_CREDIT_COST credits
    FLUX_PRO: PREMIUM_CREDIT_COST,
    FLUX_1_1_PRO: PREMIUM_CREDIT_COST,
    FLUX_REALISM: PREMIUM_CREDIT_COST,
    FLUX_2_MAX: PREMIUM_CREDIT_COST,
    FLUX_KONTEXT_MAX: PREMIUM_CREDIT_COST,
    NANO_BANANA_PRO: PREMIUM_CREDIT_COST,
    GPT_IMAGE_2: PREMIUM_CREDIT_COST,

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
