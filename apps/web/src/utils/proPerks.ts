import { HISTORY_CAP, MODEL_REGISTRY, PLAN, PREMIUM_MODEL_KEYS } from '@visual-ai/shared';

const PRO_MODEL_NAMES = PREMIUM_MODEL_KEYS.map((key) => MODEL_REGISTRY[key].label).join(', ');

export const PRO_PERKS = [
  `Keep up to ${HISTORY_CAP[PLAN.PRO]} images in your history`,
  `Premium models: ${PRO_MODEL_NAMES}`,
  'Your generations stay private, hidden from Explore',
  'Priority queue: your jobs start first',
] as const;
