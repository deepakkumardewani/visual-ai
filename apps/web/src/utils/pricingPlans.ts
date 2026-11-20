import {
  CREDIT_PACKS,
  DAILY_CREDITS,
  MODEL_REGISTRY,
  PREMIUM_MODEL_KEYS,
  SIGNUP_CREDITS,
} from '@visual-ai/shared';

import { PRO_PERKS } from '@/utils/proPerks';

export interface PlanContent {
  name: string;
  points: readonly string[];
  cta: string;
  to: string;
}

const BEST_SAVING_PERCENT = Math.max(...CREDIT_PACKS.map((pack) => pack.savingsPercent));

const NAMED_PREMIUM_MODELS = 2;

/** Names two real premium models and counts the rest, so the line fits a card without inventing facts. */
const PREMIUM_MODELS_POINT = `Premium models: ${PREMIUM_MODEL_KEYS.slice(0, NAMED_PREMIUM_MODELS)
  .map((key) => MODEL_REGISTRY[key].label)
  .join(', ')} and ${PREMIUM_MODEL_KEYS.length - NAMED_PREMIUM_MODELS} more`;

/** Privacy and priority perks only: the history cap is the weakest reason to upgrade and keeps the list at four. */
const PRO_PERK_POINTS = PRO_PERKS.slice(2);

export const FREE_PLAN: PlanContent = {
  name: 'Free',
  points: [
    `${SIGNUP_CREDITS} persistent credits at signup`,
    `${DAILY_CREDITS.free} daily credits (unused reset)`,
    'Budget and standard models',
    'Everyday models cost 1 credit',
  ],
  cta: 'Start free',
  to: '/signin',
};

export const PRO_PLAN: PlanContent = {
  name: 'Pro',
  points: [`${DAILY_CREDITS.pro} daily credits`, PREMIUM_MODELS_POINT, ...PRO_PERK_POINTS],
  cta: 'See Pro',
  to: '/pricing',
};

export const CREDIT_PACKS_PLAN: PlanContent = {
  name: 'Credit packs',
  points: [
    'Purchased credits never expire',
    'Combine with daily allowance',
    `Larger packs save up to ${BEST_SAVING_PERCENT}%`,
  ],
  cta: 'See packs',
  to: '/pricing#packs',
};
