import { getCreditCost } from '@visual-ai/shared';

import { getTierCreditLabel } from '@/utils/generationCredits';
import { MODELS, UPSCALER_MODELS } from '@/utils/models';
import type { Model } from '@/types/model';

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

function groupByLab(models: Model[]): Map<string, Model[]> {
  const labs = new Map<string, Model[]>();
  for (const model of models) {
    const lab = model.companyName ?? model.provider;
    labs.set(lab, [...(labs.get(lab) ?? []), model]);
  }
  return labs;
}

const labRows: RosterRow[] = Array.from(groupByLab(GENERATION_MODELS))
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
