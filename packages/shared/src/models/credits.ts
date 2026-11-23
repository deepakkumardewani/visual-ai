import type { MediaModelKey, MediaPricing, ModelKey } from './types.js';
import { TTS_BILLING_UNIT_CHARS } from './media-limits.js';
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
  const costs: Partial<Record<ModelKey, number>> = {
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
    // Media models have no flat cost; callers must use getMediaCreditCost.
    throw new Error(`No credit cost defined for model: ${modelKey}`);
  }
  return cost;
}

/** Credits charged per USD of Replicate cost on every media model (single source, D2). */
export const MEDIA_CREDITS_PER_USD = 200;

/** Every paid job costs at least this many credits. */
export const MIN_JOB_CREDITS = 1;

/** USD x rate is rounded to this many decimals before ceil to drop float noise. */
const CREDIT_ROUND_DECIMALS = 6;
/** Subtracted before ceil so 5.0000000001 never becomes 6. */
const CEIL_EPSILON = 1e-9;

/** The billable quantity of one media job; the variant must match the model's pricing unit. */
export type MediaCostInput =
  | { kind: 'file' }
  | { kind: 'chars'; chars: number }
  | { kind: 'seconds'; durationSec: number; resolution: string; draft?: boolean }
  | { kind: 'run' }
  | { kind: 'blocks'; videoSec: number };

function round6(value: number): number {
  const factor = 10 ** CREDIT_ROUND_DECIMALS;
  return Math.round(value * factor) / factor;
}

function assertNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
}

function secondRate(pricing: MediaPricing, input: { resolution: string; draft?: boolean }): number {
  const table = input.draft ? pricing.draftByResolution : pricing.byResolution;
  const rate = table?.[input.resolution];
  if (rate === undefined) {
    throw new Error(`No ${input.draft ? 'draft ' : ''}price for resolution: ${input.resolution}`);
  }
  return rate;
}

/** Replicate cost in USD for one job; throws when `input` does not fit the pricing unit. */
function getMediaUsd(
  modelKey: MediaModelKey,
  pricing: MediaPricing,
  input: MediaCostInput,
): number {
  const mismatch = () =>
    new Error(
      `Cost input "${input.kind}" does not match ${modelKey} pricing unit "${pricing.unit}"`,
    );
  switch (input.kind) {
    case 'file':
      if (pricing.unit !== 'file') throw mismatch();
      return pricing.usd;
    case 'run':
      if (pricing.unit !== 'run' || pricing.blockSec !== undefined) throw mismatch();
      return pricing.usd;
    case 'chars':
      if (pricing.unit !== 'kChars' && pricing.unit !== 'kTokens') throw mismatch();
      assertNonNegative(input.chars, 'chars');
      return (pricing.usd * input.chars) / TTS_BILLING_UNIT_CHARS;
    case 'seconds':
      if (pricing.unit !== 'second') throw mismatch();
      assertNonNegative(input.durationSec, 'durationSec');
      return secondRate(pricing, input) * input.durationSec;
    case 'blocks':
      if (pricing.unit !== 'run' || pricing.blockSec === undefined) throw mismatch();
      assertNonNegative(input.videoSec, 'videoSec');
      return pricing.usd * Math.ceil(input.videoSec / pricing.blockSec);
  }
}

/**
 * Integer credits for one media job: max(MIN_JOB_CREDITS, ceil(usd x MEDIA_CREDITS_PER_USD)).
 * Pure and shared by the web (before Generate) and the API (pre-check and deduction).
 */
export function getMediaCreditCost(modelKey: MediaModelKey, input: MediaCostInput): number {
  const pricing = MODEL_REGISTRY[modelKey]?.media?.pricing;
  if (!pricing) {
    throw new Error(`Not a priced media model: ${modelKey}`);
  }
  const usd = getMediaUsd(modelKey, pricing, input);
  const credits = Math.ceil(round6(usd * MEDIA_CREDITS_PER_USD) - CEIL_EPSILON);
  return Math.max(MIN_JOB_CREDITS, credits);
}
