import { computed, ref } from 'vue';

import {
  CREDIT_PACKS,
  CREDIT_PACK_CURRENCY,
  FALLBACK_CURRENCY,
  PRO_PRICE_USD_MONTHLY,
  formatPrice,
  getCreditCost,
  isSupportedCurrency,
  MODEL_REGISTRY,
} from '@visual-ai/shared';
import type { CreditPack, ModelKey, SupportedCurrency } from '@visual-ai/shared';

import { useFetch } from '@/composables/useFetch';
import { createLogger } from '@/utils/logger';

const log = createLogger('pricing-catalog');

const USD_MINOR_UNITS = 100;

type PriceEntry = { amountMinor: number; currency: string };
export type PricesResponse = {
  country: string | null;
  currency: string;
  isEstimate: true;
  pro: PriceEntry;
  packs: Array<PriceEntry & { id: string }>;
};

/** Shared across callers so the dialog, Pro card and packs trigger a single fetch. */
const prices = ref<PricesResponse | null>(null);
let pricesRequest: Promise<void> | null = null;

function loadPrices(): Promise<void> {
  if (prices.value) return Promise.resolve();
  pricesRequest ??= (async () => {
    const { data, error } = await useFetch('/payments/prices').json<PricesResponse>();
    if (error.value || !data.value?.pro) {
      // Keep the USD fallback; clear the memo so the next open can retry.
      log.warn('prices fetch failed, using USD fallback', { error: error.value });
      pricesRequest = null;
      return;
    }
    prices.value = data.value;
  })();
  return pricesRequest;
}

/** Formats an API price entry, or null when the currency is not one we can format. */
function formatEntry(entry: PriceEntry): string | null {
  if (!isSupportedCurrency(entry.currency)) return null;
  return formatPrice(entry.amountMinor, entry.currency);
}

const FALLBACK_PRO_PRICE = formatPrice(PRO_PRICE_USD_MONTHLY * USD_MINOR_UNITS, FALLBACK_CURRENCY);

export type PricingModelRow = { key: ModelKey; label: string; cost: number };
export type PricingCategory = 'Image Generation' | 'Utilities' | 'Upscaling';

export type PricingBandRow = { names: string; cost: number };
export type PricingBand = { title: string; hint?: string; rows: PricingBandRow[] };
export type PricingBoardColumn = { category: string; blurb: string; bands: PricingBand[] };

const UTILITY_JOBS: Partial<Record<ModelKey, { title: string; hint: string }>> = {
  COLORIZE_BASIC: {
    title: 'Colorize photos',
    hint: 'Black-and-white to color — basic or advanced',
  },
  COLORIZE_ADVANCED: {
    title: 'Colorize photos',
    hint: 'Black-and-white to color — basic or advanced',
  },
  REVIVE: {
    title: 'Restore faces',
    hint: 'Sharpens faces in old portraits',
  },
  OLD_PHOTOS: {
    title: 'Restore prints',
    hint: 'Scratches, fading, and torn edges',
  },
  BACKGROUND_REMOVER: {
    title: 'Remove background',
    hint: 'Keeps the subject, drops the backdrop',
  },
};

function namesByCost(rows: PricingModelRow[]) {
  const grouped = new Map<number, string[]>();
  for (const row of rows) {
    const names = grouped.get(row.cost) ?? [];
    names.push(row.label);
    grouped.set(row.cost, names);
  }
  return [...grouped.entries()].sort((a, b) => a[0] - b[0]);
}

function generationBands(rows: PricingModelRow[]): PricingBand[] {
  const everyday = rows.filter((row) => row.cost === 1);
  const premium = namesByCost(rows.filter((row) => row.cost > 1));
  const bands: PricingBand[] = [];

  if (everyday.length) {
    bands.push({
      title: 'Everyday generation',
      hint: 'Fast models for drafts and volume',
      rows: [{ names: everyday.map((row) => row.label).join(', '), cost: 1 }],
    });
  }

  if (premium.length) {
    bands.push({
      title: 'Premium generation',
      hint: 'Higher fidelity when the first pass needs more',
      rows: premium.map(([cost, labels]) => ({ names: labels.join(', '), cost })),
    });
  }

  return bands;
}

function utilityBands(rows: PricingModelRow[]): PricingBand[] {
  const seen = new Set<string>();
  const bands: PricingBand[] = [];

  for (const row of rows) {
    const job = UTILITY_JOBS[row.key];
    const title = job?.title ?? row.label;
    if (seen.has(title)) continue;
    seen.add(title);
    bands.push({
      title,
      hint: job?.hint,
      rows: [{ names: '', cost: row.cost }],
    });
  }

  return bands;
}

const PREMIUM_UPSCALE_LINE: Partial<Record<ModelKey, string>> = {
  UPSCALE_CLARITY_PRO: 'Clarity Pro — portraits, more scale steps (up to 16×)',
  UPSCALE_TOPAZ: 'Topaz — tough photos, faces, and small text',
};

function upscaleBands(rows: PricingModelRow[]): PricingBand[] {
  const standard = rows.filter((row) => row.cost <= 2);
  const premium = rows.filter((row) => row.cost > 2);
  const bands: PricingBand[] = [];

  if (standard.length) {
    bands.push({
      title: 'Standard upscale',
      hint: 'Sharper, larger files',
      rows: [{ names: standard.map((row) => row.label).join(', '), cost: standard[0].cost }],
    });
  }

  if (premium.length) {
    bands.push({
      title: 'Premium upscale',
      hint: 'Same price. Different strengths.',
      rows: premium.map((row) => ({
        names: PREMIUM_UPSCALE_LINE[row.key] ?? row.label,
        cost: row.cost,
      })),
    });
  }

  return bands;
}

export function usePricingCatalog() {
  const modelsByCategory = computed(() => {
    const categories: Record<PricingCategory, PricingModelRow[]> = {
      'Image Generation': [],
      Utilities: [],
      Upscaling: [],
    };

    for (const key in MODEL_REGISTRY) {
      const modelKey = key as ModelKey;
      const model = MODEL_REGISTRY[modelKey];
      if (!model) continue;

      try {
        const row: PricingModelRow = {
          key: modelKey,
          label: model.label,
          cost: getCreditCost(modelKey),
        };

        if (!model.utility) {
          categories['Image Generation'].push(row);
        } else if (modelKey.includes('UPSCALE')) {
          categories['Upscaling'].push(row);
        } else {
          categories['Utilities'].push(row);
        }
      } catch {
        continue;
      }
    }

    return categories;
  });

  const pricingBoard = computed<PricingBoardColumn[]>(() => {
    const cats = modelsByCategory.value;
    return [
      {
        category: 'Image generation',
        blurb: 'Most prompts cost 1 credit. A few flagship models cost 4 or 5.',
        bands: generationBands(cats['Image Generation']),
      },
      {
        category: 'Studio tools',
        blurb: 'Colorize, restore, and cutout — 2 credits each.',
        bands: utilityBands(cats.Utilities),
      },
      {
        category: 'Upscaling',
        blurb: 'Standard is 2 credits. Clarity Pro and Topaz are 4.',
        bands: upscaleBands(cats.Upscaling),
      },
    ];
  });

  const creditPacks = computed(() => [...CREDIT_PACKS]);

  const proPrice = computed(() =>
    prices.value ? (formatEntry(prices.value.pro) ?? FALLBACK_PRO_PRICE) : FALLBACK_PRO_PRICE,
  );

  /** Localized amount for a pack, or the pack's own (INR) price when estimates are unavailable. */
  function packAmount(pack: CreditPack): { amountMinor: number; currency: SupportedCurrency } {
    const entry = prices.value?.packs.find((candidate) => candidate.id === pack.id);
    if (entry && isSupportedCurrency(entry.currency)) {
      return { amountMinor: entry.amountMinor, currency: entry.currency };
    }
    return { amountMinor: pack.priceMinor, currency: CREDIT_PACK_CURRENCY };
  }

  function formatPackPrice(pack: CreditPack): string {
    const { amountMinor, currency } = packAmount(pack);
    return formatPrice(amountMinor, currency);
  }

  function formatPackPerCredit(pack: CreditPack): string {
    const { amountMinor, currency } = packAmount(pack);
    return formatPrice(amountMinor / pack.credits, currency);
  }

  return {
    modelsByCategory,
    pricingBoard,
    creditPacks,
    proPrice,
    formatPackPrice,
    formatPackPerCredit,
    loadPrices,
  };
}
