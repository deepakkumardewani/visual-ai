import type { Model } from '@/types/model';

import { MODEL_IDS } from '@/utils/modelIds';

/** Full model catalog sourced from MODELS_COMPARISON.md */
export const MODELS: Model[] = [
  // — Legacy FLUX models (backend-ready via MODEL_IDS) —
  {
    title: 'Flux Lightning',
    id: MODEL_IDS.FLUX_BASIC,
    provider: 'bfl',
    description: 'Prefers speed over quality. Good prompt adherence.',
    bestAt: 'Fastest generation',
    tier: 'budget',
    pricePerImage: 0.005,
    isPro: false,
    iconUrl: 'bfl.png',
    companyName: 'Black Forest Labs',
  },
  {
    title: 'Flux Fast',
    id: MODEL_IDS.FLUX_BASIC,
    provider: 'bfl',
    description: 'Combines speed with high quality. Great prompt adherence.',
    bestAt: 'Balanced speed & quality',
    tier: 'standard',
    pricePerImage: 0.014,
    isPro: false,
    iconUrl: 'bfl.png',
    companyName: 'Black Forest Labs',
  },
  {
    title: 'Flux Pro',
    id: MODEL_IDS.FLUX_PRO,
    provider: 'bfl',
    description: 'State-of-the-art image generation. Top of the line prompt following.',
    bestAt: 'Prompt adherence',
    tier: 'premium',
    pricePerImage: 0.04,
    isPro: true,
    featured: true,
    iconUrl: 'bfl.png',
    companyName: 'Black Forest Labs',
  },
  {
    title: 'Flux 1.1 Pro',
    id: MODEL_IDS.FLUX_1_1_PRO,
    provider: 'bfl',
    description: 'Faster, better FLUX Pro. Excellent image quality & prompt adherence.',
    bestAt: 'Quality + speed',
    tier: 'premium',
    pricePerImage: 0.04,
    isPro: true,
    featured: true,
    iconUrl: 'bfl.png',
    companyName: 'Black Forest Labs',
  },
  {
    title: 'Flux Realism',
    id: MODEL_IDS.FLUX_REALISM,
    provider: 'bfl',
    description: 'Best at ultra realistic photos. Prioritizes details and textures.',
    bestAt: 'Ultra-realistic photos',
    tier: 'premium',
    pricePerImage: 0.03,
    isPro: true,
    iconUrl: 'bfl.png',
    companyName: 'Black Forest Labs',
  },

  // — Pruna —
  {
    title: 'Flux Fast',
    id: 'prunaai/flux-fast',
    provider: 'pruna',
    description: 'Fastest Flux variant for high-volume batch generation.',
    bestAt: 'Fastest Flux, batch volume',
    tier: 'budget',
    pricePerImage: 0.005,
    isPro: false,
    iconUrl: 'prunaai.png',
    companyName: 'Pruna',
  },
  {
    title: 'P-Image',
    id: 'prunaai/p-image',
    provider: 'pruna',
    description: 'Sub-second production images with LoRA support.',
    bestAt: 'Sub-1s production, LoRA support',
    tier: 'budget',
    pricePerImage: 0.005,
    isPro: false,
    iconUrl: 'prunaai.png',
    companyName: 'Pruna',
  },

  // — Z-Image —
  {
    title: 'Z-Image Turbo',
    id: 'prunaai/z-image-turbo',
    provider: 'zimage',
    description: 'Super-fast 6B parameter model for rapid iteration.',
    bestAt: 'Super-fast 6B model',
    tier: 'budget',
    pricePerImage: 0.02,
    isPro: false,
    iconUrl: 'xai.jpg',
    companyName: 'Z-Image',
  },

  // — xAI —
  {
    title: 'Grok Imagine',
    id: 'xai/grok-imagine-image',
    provider: 'xai',
    description: 'Affordable xAI image generation with simple controls.',
    bestAt: 'Cheap, simple xAI gen',
    tier: 'budget',
    pricePerImage: 0.02,
    isPro: false,
    iconUrl: 'xai.jpg',
    companyName: 'xAI',
  },
  {
    title: 'Grok Imagine Quality',
    id: 'xai/grok-imagine-image-quality',
    provider: 'xai',
    description: 'Sharper xAI output with better text rendering up to 2K.',
    bestAt: 'Sharper xAI, better text, 2K',
    tier: 'standard',
    pricePerImage: 0.07,
    isPro: false,
    iconUrl: 'xai.jpg',
    companyName: 'xAI',
  },

  // — ByteDance —
  {
    title: 'Seedream 4',
    id: 'bytedance/seedream-4',
    provider: 'bytedance',
    description: '4K generation with single-sentence editing capabilities.',
    bestAt: '4K + single-sentence editing',
    tier: 'standard',
    pricePerImage: 0.03,
    isPro: false,
    iconUrl: 'bytedance.png',
    companyName: 'ByteDance',
  },

  // — BFL (new generation) —
  {
    title: 'Flux 2 Dev',
    id: 'black-forest-labs/flux-2-dev',
    provider: 'bfl',
    description: 'Open-weight quality generation and editing model.',
    bestAt: 'Quality gen+edit, open-weight',
    tier: 'standard',
    pricePerImage: 0.014,
    isPro: false,
    iconUrl: 'bfl.png',
    companyName: 'Black Forest Labs',
  },
  {
    title: 'Flux 2 Pro',
    id: 'black-forest-labs/flux-2-pro',
    provider: 'bfl',
    description: 'Quality generation with up to 8 reference images.',
    bestAt: 'Quality + up to 8 reference images',
    tier: 'standard',
    pricePerImage: 0.015,
    isPro: false,
    featured: true,
    iconUrl: 'bfl.png',
    companyName: 'Black Forest Labs',
  },
  {
    title: 'Flux Kontext Pro',
    id: 'black-forest-labs/flux-kontext-pro',
    provider: 'bfl',
    description: 'State-of-the-art prompt-based image editing.',
    bestAt: 'SOTA prompt-based image editing',
    tier: 'standard',
    pricePerImage: 0.04,
    isPro: false,
    iconUrl: 'bfl.png',
    companyName: 'Black Forest Labs',
  },
  {
    title: 'Flux 2 Max',
    id: 'black-forest-labs/flux-2-max',
    provider: 'bfl',
    description: 'Highest-fidelity Flux generation up to 4 megapixels.',
    bestAt: 'Highest-fidelity Flux',
    tier: 'premium',
    pricePerImage: 0.12,
    isPro: true,
    iconUrl: 'bfl.png',
    companyName: 'Black Forest Labs',
  },
  {
    title: 'Flux Kontext Max',
    id: 'black-forest-labs/flux-kontext-max',
    provider: 'bfl',
    description: 'Premium editing with superior typography rendering.',
    bestAt: 'Premium editing + typography',
    tier: 'premium',
    pricePerImage: 0.08,
    isPro: true,
    iconUrl: 'bfl.png',
    companyName: 'Black Forest Labs',
  },

  // — Google —
  {
    title: 'Nano Banana 2',
    id: 'google/nano-banana-2',
    provider: 'google',
    description: 'Fast Google generation with editing and grounding.',
    bestAt: 'Fast Google gen, editing, grounding',
    tier: 'standard',
    pricePerImage: 0.067,
    isPro: false,
    iconUrl: 'google.png',
    companyName: 'Google',
  },
  {
    title: 'Imagen 4 Ultra',
    id: 'google/imagen-4-ultra',
    provider: 'google',
    description: 'Photorealistic output with strong prompt adherence.',
    bestAt: 'Photorealism, prompt adherence',
    tier: 'standard',
    pricePerImage: 0.06,
    isPro: false,
    iconUrl: 'google.png',
    companyName: 'Google',
  },
  {
    title: 'Nano Banana Pro',
    id: 'google/nano-banana-pro',
    provider: 'google',
    description: 'Google SOTA with character consistency up to 4K.',
    bestAt: 'Google SOTA, character consistency',
    tier: 'premium',
    pricePerImage: 0.15,
    isPro: true,
    featured: true,
    iconUrl: 'google.png',
    companyName: 'Google',
  },

  // — OpenAI —
  {
    title: 'GPT Image 2',
    id: 'openai/gpt-image-2',
    provider: 'openai',
    description: 'Instruction-following generation with sharp text rendering.',
    bestAt: 'Instruction following, sharp text',
    tier: 'premium',
    pricePerImage: 0.128,
    isPro: true,
    featured: true,
    iconUrl: 'openai.png',
    companyName: 'OpenAI',
  },
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

export const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  google: 'Google',
  bfl: 'Black Forest Labs',
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
  // Separate featured and non-featured models
  const featured = models.filter((m) => m.featured);
  const nonFeatured = models.filter((m) => !m.featured);

  // Create groups for non-featured models, sorted by company name
  const groups = new Map<string, Model[]>();
  for (const model of nonFeatured) {
    const company = model.companyName ?? model.provider;
    const list = groups.get(company) ?? [];
    list.push(model);
    groups.set(company, list);
  }

  // Create the result with featured models first, then other companies alphabetically
  const result = new Map<string, Model[]>();

  // Add featured models first
  if (featured.length > 0) {
    result.set('Featured', featured);
  }

  // Add other companies in alphabetical order
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
