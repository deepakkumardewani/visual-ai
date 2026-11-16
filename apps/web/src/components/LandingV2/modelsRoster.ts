import { getCreditCost } from '@visual-ai/shared';

import { getTierCreditLabel } from '@/utils/generationCredits';
import { MODELS, UPSCALER_MODELS, groupModelsByCompany } from '@/utils/models';
import type { Model } from '@/types/model';

/** Group key `groupModelsByCompany` adds for the featured shortlist; it is not a lab. */
const FEATURED_GROUP_KEY = 'Featured';
/** Upscalers are listed on their own line, not as image generators. */
const UPSCALE_ID_PREFIX = 'UPSCALE_';

export interface RosterModel {
  id: string;
  title: string;
  creditLabel: string;
}

export interface RosterRow {
  name: string;
  models: RosterModel[];
  /** Upscalers and tools sit under a "Finishing" label after the labs. */
  finishing: boolean;
}

const isGenerationModel = (model: Model): boolean => !model.id.startsWith(UPSCALE_ID_PREFIX);

/** Prefer the model's own cost; fall back to its tier's label. */
function toRosterModel(model: Model): RosterModel {
  return {
    id: model.id,
    title: model.title,
    creditLabel:
      model.creditCost === undefined
        ? getTierCreditLabel(model.tier)
        : toCreditLabel(model.creditCost),
  };
}

const GENERATION_MODELS = MODELS.filter(isGenerationModel);

export const GENERATION_MODEL_COUNT = GENERATION_MODELS.length;

const toCreditLabel = (cost: number): string => `${cost} cr`;

const labRows: RosterRow[] = Array.from(groupModelsByCompany(GENERATION_MODELS))
  .filter(([name]) => name !== FEATURED_GROUP_KEY)
  .map(([name, models]) => ({ name, models: models.map(toRosterModel), finishing: false }))
  .sort((a, b) => b.models.length - a.models.length || a.name.localeCompare(b.name));

/** Same function that prices the job in the app, so the label cannot drift from the charge. */
const finishingTool = (id: string, title: string, key: Parameters<typeof getCreditCost>[0]) => ({
  id,
  title,
  creditLabel: toCreditLabel(getCreditCost(key)),
});

const finishingRows: RosterRow[] = [
  { name: 'Upscalers', models: UPSCALER_MODELS.map(toRosterModel), finishing: true },
  {
    name: 'Tools',
    models: [
      finishingTool('colorize', 'Colorize', 'COLORIZE_BASIC'),
      finishingTool('restore', 'Restore faces', 'REVIVE'),
      finishingTool('remove-bg', 'Remove background', 'BACKGROUND_REMOVER'),
    ],
    finishing: true,
  },
];

export const ROSTER_ROWS: RosterRow[] = [...labRows, ...finishingRows];
