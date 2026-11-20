import type { Model } from '@/types/model';

import {
  MODEL_IDS,
  MODEL_REGISTRY,
  PREMIUM_MODEL_KEYS,
  getCreditCost,
  type ModelKey,
} from '@visual-ai/shared';

/**
 * Derive Model fields from the shared registry entry.
 * tier / pricePerImage / creditCost / id come from the single source of truth.
 */
function fromRegistry(
  key: keyof typeof MODEL_REGISTRY,
  overrides: Omit<Model, 'id' | 'tier' | 'pricePerImage' | 'creditCost'>,
): Model {
  const entry = MODEL_REGISTRY[key];
  return {
    ...overrides,
    id: MODEL_IDS[key],
    tier: entry.tier,
    pricePerImage: entry.pricePerImage,
    creditCost: getCreditCost(key),
  };
}

/** Full model catalog — metadata from MODEL_REGISTRY; presentation fields local. */
export const MODELS: Model[] = [
  // — Legacy FLUX models —
  fromRegistry('FLUX_BASIC', {
    title: 'Flux Lightning',
    provider: 'bfl',
    description: 'Prefers speed over quality. Good prompt adherence.',
    bestAt: 'Fastest generation',
    iconUrl: 'bfl.png',
    companyName: 'Black Forest Labs',
  }),
  fromRegistry('FLUX_QUICK', {
    title: 'Flux Schnell',
    provider: 'bfl',
    description: 'Combines speed with high quality. Great prompt adherence.',
    bestAt: 'Balanced speed & quality',
    iconUrl: 'bfl.png',
    companyName: 'Black Forest Labs',
  }),
  fromRegistry('FLUX_PRO', {
    title: 'Flux Pro',
    provider: 'bfl',
    description: 'State-of-the-art image generation. Top of the line prompt following.',
    bestAt: 'Prompt adherence',
    iconUrl: 'bfl.png',
    companyName: 'Black Forest Labs',
  }),
  fromRegistry('FLUX_1_1_PRO', {
    title: 'Flux 1.1 Pro',
    provider: 'bfl',
    description: 'Faster, better FLUX Pro. Excellent image quality & prompt adherence.',
    bestAt: 'Quality + speed',
    iconUrl: 'bfl.png',
    companyName: 'Black Forest Labs',
  }),
  fromRegistry('FLUX_REALISM', {
    title: 'Flux Realism',
    provider: 'bfl',
    description: 'Best at ultra realistic photos. Prioritizes details and textures.',
    bestAt: 'Ultra-realistic photos',
    iconUrl: 'bfl.png',
    companyName: 'Black Forest Labs',
  }),

  // — Pruna —
  fromRegistry('FLUX_FAST', {
    title: 'Flux Fast',
    provider: 'pruna',
    description: 'Fastest Flux variant for high-volume batch generation.',
    bestAt: 'Fastest Flux, batch volume',
    iconUrl: 'prunaai.png',
    companyName: 'Pruna',
  }),
  fromRegistry('P_IMAGE', {
    title: 'P-Image',
    provider: 'pruna',
    description: 'Sub-second production images with LoRA support.',
    bestAt: 'Sub-1s production, LoRA support',
    iconUrl: 'prunaai.png',
    companyName: 'Pruna',
  }),

  // — Z-Image —
  fromRegistry('Z_IMAGE_TURBO', {
    title: 'Z-Image Turbo',
    provider: 'zimage',
    description: 'Super-fast 6B parameter model for rapid iteration.',
    bestAt: 'Super-fast 6B model',
    featured: true,
    iconUrl: 'xai.jpg',
    companyName: 'Z-Image',
  }),

  // — xAI —
  fromRegistry('GROK_IMAGINE', {
    title: 'Grok Imagine',
    provider: 'xai',
    description: 'Affordable xAI image generation with simple controls.',
    bestAt: 'Cheap, simple xAI gen',
    iconUrl: 'xai.jpg',
    companyName: 'xAI',
  }),
  fromRegistry('GROK_IMAGINE_QUALITY', {
    title: 'Grok Imagine Quality',
    provider: 'xai',
    description: 'Sharper xAI output with better text rendering up to 2K.',
    bestAt: 'Sharper xAI, better text, 2K',
    iconUrl: 'xai.jpg',
    companyName: 'xAI',
  }),

  // — ByteDance —
  fromRegistry('SEEDREAM_4', {
    title: 'Seedream 4',
    provider: 'bytedance',
    description: '4K generation with single-sentence editing capabilities.',
    bestAt: '4K + single-sentence editing',
    featured: true,
    iconUrl: 'bytedance.png',
    companyName: 'ByteDance',
  }),

  // — BFL (Flux 2 / Kontext) —
  fromRegistry('FLUX_2_DEV', {
    title: 'Flux 2 Dev',
    provider: 'bfl',
    description: 'Open-weight quality generation and editing model.',
    bestAt: 'Quality gen+edit, open-weight',
    iconUrl: 'bfl.png',
    companyName: 'Black Forest Labs',
  }),
  fromRegistry('FLUX_2_PRO', {
    title: 'Flux 2 Pro',
    provider: 'bfl',
    description: 'Quality generation with up to 8 reference images.',
    bestAt: 'Quality + up to 8 reference images',
    featured: true,
    iconUrl: 'bfl.png',
    companyName: 'Black Forest Labs',
  }),
  fromRegistry('FLUX_KONTEXT_PRO', {
    title: 'Flux Kontext Pro',
    provider: 'bfl',
    description: 'State-of-the-art prompt-based image editing.',
    bestAt: 'SOTA prompt-based image editing',
    iconUrl: 'bfl.png',
    companyName: 'Black Forest Labs',
  }),
  fromRegistry('FLUX_2_MAX', {
    title: 'Flux 2 Max',
    provider: 'bfl',
    description: 'Highest-fidelity Flux generation up to 4 megapixels.',
    bestAt: 'Highest-fidelity Flux',
    iconUrl: 'bfl.png',
    companyName: 'Black Forest Labs',
  }),
  fromRegistry('FLUX_KONTEXT_MAX', {
    title: 'Flux Kontext Max',
    provider: 'bfl',
    description: 'Premium editing with superior typography rendering.',
    bestAt: 'Premium editing + typography',
    iconUrl: 'bfl.png',
    companyName: 'Black Forest Labs',
  }),

  // — Google —
  fromRegistry('NANO_BANANA_2', {
    title: 'Nano Banana 2',
    provider: 'google',
    description: 'Fast Google generation with editing and grounding.',
    bestAt: 'Fast Google gen, editing, grounding',
    featured: true,
    iconUrl: 'google.png',
    companyName: 'Google',
  }),
  fromRegistry('IMAGEN_4_ULTRA', {
    title: 'Imagen 4 Ultra',
    provider: 'google',
    description: 'Photorealistic output with strong prompt adherence.',
    bestAt: 'Photorealism, prompt adherence',
    iconUrl: 'google.png',
    companyName: 'Google',
  }),
  fromRegistry('NANO_BANANA_PRO', {
    title: 'Nano Banana Pro',
    provider: 'google',
    description: 'Google SOTA with character consistency up to 4K.',
    bestAt: 'Google SOTA, character consistency',
    featured: true,
    iconUrl: 'google.png',
    companyName: 'Google',
  }),

  // — OpenAI —
  fromRegistry('GPT_IMAGE_2', {
    title: 'GPT Image 2',
    provider: 'openai',
    description: 'Instruction-following generation with sharp text rendering.',
    bestAt: 'Instruction following, sharp text',
    featured: true,
    iconUrl: 'openai.png',
    companyName: 'OpenAI',
  }),
];

const LEGACY_MODEL_IDS: ReadonlySet<string> = new Set([
  MODEL_IDS.FLUX_QUICK,
  MODEL_IDS.FLUX_BASIC,
  MODEL_IDS.FLUX_PRO,
  MODEL_IDS.FLUX_1_1_PRO,
  MODEL_IDS.FLUX_REALISM,
]);

/** Alias preserving backward compatibility with aside store default */
export const FLUX_MODES: Model[] = MODELS.filter((m) => LEGACY_MODEL_IDS.has(m.id));

export function getFeaturedModels(models: Model[] = MODELS): Model[] {
  return models.filter((m) => m.featured);
}

export const UPSCALER_MODELS: Model[] = [
  fromRegistry('UPSCALE_IMAGE', {
    title: 'Clarity Upscaler',
    provider: 'community',
    description: 'Balanced everyday upscale.',
    bestAt: 'General photos',
    iconUrl: 'clarity-upscaler.jpg',
    companyName: 'Community',
  }),
  fromRegistry('UPSCALE_REAL_ESRGAN', {
    title: 'Real-ESRGAN',
    provider: 'community',
    description: 'Fast 2×–4× for photos and scans.',
    bestAt: 'Speed',
    iconUrl: 'real-esrgan.png',
    companyName: 'Community',
  }),
  fromRegistry('UPSCALE_PRUNA', {
    title: 'Pruna',
    provider: 'pruna',
    description: 'Modes for photos, art, and text.',
    bestAt: 'Flexible subjects',
    iconUrl: 'prunaai.png',
    companyName: 'Pruna',
  }),
  fromRegistry('UPSCALE_RECRAFT', {
    title: 'Recraft',
    provider: 'recraft',
    description: 'Keeps edges sharp on logos and UI.',
    bestAt: 'Graphics',
    iconUrl: 'recraft.png',
    companyName: 'Recraft',
  }),
  fromRegistry('UPSCALE_GOOGLE', {
    title: 'Google Upscaler',
    provider: 'google',
    description: 'Holds fine detail without oversharpening.',
    bestAt: 'Detail',
    iconUrl: 'google.png',
    companyName: 'Google',
  }),
  fromRegistry('UPSCALE_CLARITY_PRO', {
    title: 'Clarity Pro',
    provider: 'community',
    description: 'Higher fidelity with more control.',
    bestAt: 'Quality',
    iconUrl: 'clarity-upscaler.jpg',
    companyName: 'Community',
  }),
  fromRegistry('UPSCALE_TOPAZ', {
    title: 'Topaz',
    provider: 'topaz',
    description: 'Studio-grade recovery for tough shots.',
    bestAt: 'Hard cases',
    iconUrl: 'topaz.png',
    companyName: 'Topaz Labs',
  }),
];

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  bfl: 'Black Forest Labs',
  openai: 'OpenAI',
  google: 'Google',
  bytedance: 'ByteDance',
  xai: 'xAI',
  pruna: 'Pruna',
  zimage: 'Z-Image',
  community: 'Community',
  recraft: 'Recraft',
  topaz: 'Topaz Labs',
};

export function getProviderDisplayName(provider: string): string {
  return PROVIDER_DISPLAY_NAMES[provider] ?? provider;
}

export function groupModelsByProvider(models: Model[]): Map<string, Model[]> {
  const groups = new Map<string, Model[]>();
  for (const model of models) {
    const list = groups.get(model.provider) ?? [];
    list.push(model);
    groups.set(model.provider, list);
  }
  return groups;
}

export const PICKER_SECTION = {
  FEATURED: 'Featured',
  FREE: 'Free',
  PRO: 'Pro',
} as const;

export type PickerSection = (typeof PICKER_SECTION)[keyof typeof PICKER_SECTION];

export interface CompanyGroup {
  company: string;
  models: Model[];
}

export type PickerSectionGroup =
  | { section: typeof PICKER_SECTION.FEATURED; models: Model[] }
  | {
      section: typeof PICKER_SECTION.FREE | typeof PICKER_SECTION.PRO;
      companies: CompanyGroup[];
    };

const DEFAULT_CREDIT_COST = 1;

/** Cheapest first, then title; returns a new array. */
export function sortByCostThenName(models: Model[]): Model[] {
  return [...models].sort(
    (a, b) =>
      (a.creditCost ?? DEFAULT_CREDIT_COST) - (b.creditCost ?? DEFAULT_CREDIT_COST) ||
      a.title.localeCompare(b.title),
  );
}

const isPremiumModel = (model: Model): boolean => PREMIUM_MODEL_KEYS.includes(model.id as ModelKey);

function groupByCompany(models: Model[]): CompanyGroup[] {
  const byCompany = new Map<string, Model[]>();
  for (const model of models) {
    const company = model.companyName ?? model.provider;
    byCompany.set(company, [...(byCompany.get(company) ?? []), model]);
  }
  return Array.from(byCompany, ([company, list]) => ({
    company,
    models: sortByCostThenName(list),
  })).sort((a, b) => a.company.localeCompare(b.company));
}

/**
 * Picker layout: Featured (source order), then Free and Pro, each split by company.
 * A featured model also appears in its tier group; empty sections are dropped.
 * Models are identified by `id` + `title` because variants can share an `id`.
 */
export function groupModelsByCompany(models: Model[] = MODELS): PickerSectionGroup[] {
  const featured = models.filter((m) => m.featured);
  const free = models.filter((m) => !isPremiumModel(m));
  const pro = models.filter(isPremiumModel);

  const sections: PickerSectionGroup[] = [
    { section: PICKER_SECTION.FEATURED, models: featured },
    { section: PICKER_SECTION.FREE, companies: groupByCompany(free) },
    { section: PICKER_SECTION.PRO, companies: groupByCompany(pro) },
  ];
  return sections.filter((s) => ('models' in s ? s.models.length : s.companies.length) > 0);
}

/**
 * Models whose title, company, `bestAt` or description contain the trimmed query
 * (case-insensitive). A blank query returns the input unchanged.
 */
export function filterModelsBySearch(models: Model[], query: string): Model[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return models;
  return models.filter((model) =>
    [model.title, model.companyName ?? model.provider, model.bestAt, model.description].some(
      (field) => field?.toLowerCase().includes(needle),
    ),
  );
}

export function getModelLogoUrl(iconUrl?: string): string | null {
  if (!iconUrl) return null;
  return new URL(`../assets/models/${iconUrl}`, import.meta.url).href;
}

export function formatPrice(price?: number): string | null {
  if (price === undefined) return null;
  if (price < 0.1) return `$${price.toFixed(3)}`;
  return `$${price.toFixed(2)}`;
}

/** Relative generation speed for picker badges (presentation-only; not in registry). */
export type ModelSpeedHint = 'Fast' | 'Balanced' | 'Quality';

const MODEL_SPEED_HINTS: Record<string, ModelSpeedHint> = {
  FLUX_BASIC: 'Fast',
  FLUX_QUICK: 'Fast',
  FLUX_FAST: 'Fast',
  P_IMAGE: 'Fast',
  Z_IMAGE_TURBO: 'Fast',
  GROK_IMAGINE: 'Fast',
  UPSCALE_REAL_ESRGAN: 'Fast',
  UPSCALE_PRUNA: 'Fast',

  FLUX_1_1_PRO: 'Balanced',
  GROK_IMAGINE_QUALITY: 'Balanced',
  SEEDREAM_4: 'Balanced',
  FLUX_2_DEV: 'Balanced',
  FLUX_KONTEXT_PRO: 'Balanced',
  NANO_BANANA_2: 'Balanced',
  UPSCALE_IMAGE: 'Balanced',
  UPSCALE_RECRAFT: 'Balanced',
  UPSCALE_GOOGLE: 'Balanced',

  FLUX_PRO: 'Quality',
  FLUX_REALISM: 'Quality',
  FLUX_2_PRO: 'Quality',
  FLUX_2_MAX: 'Quality',
  FLUX_KONTEXT_MAX: 'Quality',
  NANO_BANANA_PRO: 'Quality',
  IMAGEN_4_ULTRA: 'Quality',
  GPT_IMAGE_2: 'Quality',
  UPSCALE_CLARITY_PRO: 'Quality',
  UPSCALE_TOPAZ: 'Quality',
};

export function getModelSpeedHint(modelId: string): ModelSpeedHint | undefined {
  return MODEL_SPEED_HINTS[modelId];
}

/** One-line “best for” copy — prefers curated `bestAt`, falls back to description. */
export function getModelBestForHint(model: Model): string {
  return model.bestAt?.trim() || model.description;
}
