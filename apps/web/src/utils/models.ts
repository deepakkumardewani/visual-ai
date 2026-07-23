import type { Model } from '@/types/model';

import { MODEL_IDS, MODEL_REGISTRY, isPro as isProFromRegistry } from '@visual-ai/shared';

/**
 * Derive Model fields from the shared registry entry.
 * tier / pricePerImage / isPro / id come from the single source of truth.
 */
function fromRegistry(
  key: keyof typeof MODEL_REGISTRY,
  overrides: Omit<Model, 'id' | 'tier' | 'pricePerImage' | 'isPro'>,
): Model {
  const entry = MODEL_REGISTRY[key];
  return {
    ...overrides,
    id: MODEL_IDS[key],
    tier: entry.tier,
    pricePerImage: entry.pricePerImage,
    isPro: isProFromRegistry(entry),
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

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  bfl: 'Black Forest Labs',
  openai: 'OpenAI',
  google: 'Google',
  bytedance: 'ByteDance',
  xai: 'xAI',
  pruna: 'Pruna',
  zimage: 'Z-Image',
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

export function groupModelsByCompany(models: Model[] = MODELS): Map<string, Model[]> {
  const featured = models.filter((m) => m.featured);

  // Company submenus must include every model for that company — including
  // featured ones (e.g. Nano Banana still appears under Google on hover).
  const groups = new Map<string, Model[]>();
  for (const model of models) {
    const company = model.companyName ?? model.provider;
    const list = groups.get(company) ?? [];
    list.push(model);
    groups.set(company, list);
  }

  const result = new Map<string, Model[]>();

  if (featured.length > 0) {
    result.set('Featured', featured);
  }

  const sortedCompanies = Array.from(groups.keys()).sort();
  for (const company of sortedCompanies) {
    result.set(company, groups.get(company) ?? []);
  }

  return result;
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
