import type { ModelDefinition, ModelKey } from './types.js';
import { MODEL_REGISTRY } from './registry.js';

/** Signup credits for new users */
export const SIGNUP_CREDITS = 30;

/** Daily credits granted per plan; resets unused at DAILY_RESET_UTC_HOUR. */
export const DAILY_CREDITS = { free: 30, pro: 50 } as const;

/** Hour (UTC) at which daily credits reset. */
export const DAILY_RESET_UTC_HOUR = 0;

export function getDailyCredits(isPro: boolean): number {
  return isPro ? DAILY_CREDITS.pro : DAILY_CREDITS.free;
}

/** Bonus credits for successful referral (both referrer and referee) */
export const REFERRAL_BONUS = 30;

/** One credit covers roughly this much Replicate cost (USD). */
export const USD_PER_CREDIT = 0.005;

/** Lowest charge for any run, so cheap models are never free. */
export const MIN_CREDIT_COST = 1;

const MICRO_USD_PER_USD = 1_000_000;

/** Integer micro-USD avoids float error: 0.07 / 0.005 is 14.000000000000002 in JS. */
function toMicroUsd(usd: number): number {
  return Math.round(usd * MICRO_USD_PER_USD);
}

/** Credits for a Replicate price: ceil(price / USD_PER_CREDIT), at least MIN_CREDIT_COST. */
export function creditsForPrice(usd: number): number {
  if (!Number.isFinite(usd) || usd < 0) {
    throw new Error(`Invalid model price: ${usd}`);
  }
  const credits = Math.ceil(toMicroUsd(usd) / toMicroUsd(USD_PER_CREDIT));
  return Math.max(MIN_CREDIT_COST, credits);
}

/** Integer credit cost for a model, derived from its registry `pricePerImage`. */
export function getCreditCost(modelKey: ModelKey): number {
  const model = MODEL_REGISTRY[modelKey];
  if (!model) {
    throw new Error(`Unknown model key: ${modelKey}`);
  }
  return creditsForPrice(model.pricePerImage);
}

/** Pricing groups shown to users: text-to-image, studio tools, upscalers. */
export type CreditCategory = 'generation' | 'utility' | 'upscale';

export function getCreditCategory(model: ModelDefinition): CreditCategory {
  if (!model.utility) return 'generation';
  return model.key.startsWith('UPSCALE') ? 'upscale' : 'utility';
}

export type CreditCostRange = { min: number; max: number };

/** Cheapest and most expensive credit cost across the given models. */
export function getCreditCostRange(keys: readonly ModelKey[]): CreditCostRange {
  if (keys.length === 0) {
    throw new Error('Cannot compute a credit range for zero models');
  }
  const costs = keys.map(getCreditCost);
  return { min: Math.min(...costs), max: Math.max(...costs) };
}

/** Model keys in a pricing category, in registry order. */
export function getModelKeysByCategory(category: CreditCategory): ModelKey[] {
  return Object.values(MODEL_REGISTRY)
    .filter((model) => getCreditCategory(model) === category)
    .map((model) => model.key);
}

/** Credit range for a pricing category, e.g. generation → { min: 1, max: 30 }. */
export function getCategoryCreditRange(category: CreditCategory): CreditCostRange {
  return getCreditCostRange(getModelKeysByCategory(category));
}

/** Range label such as "1–30", or "2" when every model costs the same. */
export function formatCreditRange({ min, max }: CreditCostRange): string {
  return min === max ? String(min) : `${min}–${max}`;
}
