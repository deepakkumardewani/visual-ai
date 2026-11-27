import { computed, ref } from 'vue';

import {
  CREDIT_PACKS,
  DEFAULT_PACK_CURRENCY,
  FALLBACK_CURRENCY,
  PRO_PRICE_USD_MONTHLY,
  computePackSavingsPercent,
  formatCreditRange,
  formatPrice,
  getCreditCost,
  isPackCurrency,
  isSupportedCurrency,
  maxPackSavingsPercent,
  MODEL_REGISTRY,
} from '@visual-ai/shared';
import type { CreditCostRange, CreditPack, ModelKey, PackCurrency } from '@visual-ai/shared';

import { useFetch } from '@/composables/useFetch';
import { withDevCountry } from '@/payments/devCountry';
import { createLogger } from '@/utils/logger';
import { formatPricePer100Credits } from '@/utils/pricePerCredits';

const log = createLogger('pricing-catalog');

const USD_MINOR_UNITS = 100;

type PriceEntry = { amountMinor: number; currency: string };
export type PricesResponse = {
  country: string | null;
  /** Pack currency for the buyer's country: INR for India, USD everywhere else. */
  currency: string;
  pro: PriceEntry;
  packs: Array<PriceEntry & { id: string }>;
};

/** Shared across callers so the dialog, Pro card and packs trigger a single fetch. */
const prices = ref<PricesResponse | null>(null);
let pricesRequest: Promise<void> | null = null;

function loadPrices(): Promise<void> {
  if (prices.value) return Promise.resolve();
  pricesRequest ??= (async () => {
    const { data, error } = await useFetch(
      withDevCountry('/payments/prices'),
    ).json<PricesResponse>();
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

/** Generation models at or under this cost are the draft-friendly "everyday" band. */
const EVERYDAY_MAX_CREDITS = 3;

const toBandRows = (rows: PricingModelRow[]): PricingBandRow[] =>
  namesByCost(rows).map(([cost, labels]) => ({ names: labels.join(', '), cost }));

function generationBands(rows: PricingModelRow[]): PricingBand[] {
  const everyday = rows.filter((row) => row.cost <= EVERYDAY_MAX_CREDITS);
  const premium = rows.filter((row) => row.cost > EVERYDAY_MAX_CREDITS);
  const bands: PricingBand[] = [];

  if (everyday.length) {
    bands.push({
      title: 'Everyday generation',
      hint: 'Fast models for drafts and volume',
      rows: toBandRows(everyday),
    });
  }

  if (premium.length) {
    bands.push({
      title: 'Premium generation',
      hint: 'Higher fidelity when the first pass needs more',
      rows: toBandRows(premium),
    });
  }

  return bands;
}

/** One band per job; when several models do the same job, show the cheapest ("from") cost. */
function utilityBands(rows: PricingModelRow[]): PricingBand[] {
  const byTitle = new Map<string, PricingBand>();

  for (const row of rows) {
    const job = UTILITY_JOBS[row.key];
    const title = job?.title ?? row.label;
    const existing = byTitle.get(title);
    if (existing) {
      existing.rows[0].cost = Math.min(existing.rows[0].cost, row.cost);
      continue;
    }
    byTitle.set(title, { title, hint: job?.hint, rows: [{ names: '', cost: row.cost }] });
  }

  return [...byTitle.values()];
}

const PREMIUM_UPSCALE_LINE: Partial<Record<ModelKey, string>> = {
  UPSCALE_CLARITY_PRO: 'Clarity Pro — portraits, more scale steps (up to 16×)',
  UPSCALE_TOPAZ: 'Topaz — tough photos, faces, and small text',
};

const isPremiumUpscaler = (row: PricingModelRow): boolean =>
  MODEL_REGISTRY[row.key]?.tier === 'premium';

function upscaleBands(rows: PricingModelRow[]): PricingBand[] {
  const standard = rows.filter((row) => !isPremiumUpscaler(row));
  const premium = rows.filter(isPremiumUpscaler);
  const bands: PricingBand[] = [];

  if (standard.length) {
    bands.push({
      title: 'Standard upscale',
      hint: 'Sharper, larger files',
      rows: toBandRows(standard),
    });
  }

  if (premium.length) {
    bands.push({
      title: 'Premium upscale',
      hint: 'Different strengths for tough photos.',
      rows: premium.map((row) => ({
        names: PREMIUM_UPSCALE_LINE[row.key] ?? row.label,
        cost: row.cost,
      })),
    });
  }

  return bands;
}

/** Cheapest and priciest row across bands; null when there are no rows. */
function bandsRange(bands: PricingBand[]): CreditCostRange | null {
  const costs = bands.flatMap((band) => band.rows.map((row) => row.cost));
  if (costs.length === 0) return null;
  return { min: Math.min(...costs), max: Math.max(...costs) };
}

function creditsLabel(range: CreditCostRange | null): string {
  if (!range) return 'priced per model';
  const unit = range.min === 1 && range.max === 1 ? 'credit' : 'credits';
  return `${formatCreditRange(range)} ${unit}`;
}

function generationBlurb(range: CreditCostRange | null): string {
  if (!range) return 'Each model shows its credit cost.';
  if (range.min === range.max) return `Every model costs ${creditsLabel(range)}.`;
  return `Drafts start at ${creditsLabel({ min: range.min, max: range.min })}. Flagship models cost up to ${range.max}.`;
}

function upscaleBlurb(bands: PricingBand[]): string {
  const [first, second] = bands;
  if (!first) return 'Each upscaler shows its credit cost.';
  const lead = `${first.title} is ${creditsLabel(bandsRange([first]))}.`;
  if (!second) return lead;
  return `${lead} ${second.title} is ${creditsLabel(bandsRange([second]))}.`;
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
    const generation = generationBands(cats['Image Generation']);
    const studio = utilityBands(cats.Utilities);
    const upscale = upscaleBands(cats.Upscaling);
    return [
      {
        category: 'Image generation',
        blurb: generationBlurb(bandsRange(generation)),
        bands: generation,
      },
      {
        category: 'Studio tools',
        blurb: `Colorize, restore, and cutout — ${creditsLabel(bandsRange(studio))} per run.`,
        bands: studio,
      },
      {
        category: 'Upscaling',
        blurb: upscaleBlurb(upscale),
        bands: upscale,
      },
    ];
  });

  const creditPacks = computed(() => [...CREDIT_PACKS]);

  const proPrice = computed(() =>
    prices.value ? (formatEntry(prices.value.pro) ?? FALLBACK_PRO_PRICE) : FALLBACK_PRO_PRICE,
  );

  /** The server's pack currency for this buyer; USD until /payments/prices answers. */
  const packCurrency = computed<PackCurrency>(() => {
    const currency = prices.value?.currency;
    return currency && isPackCurrency(currency) ? currency : DEFAULT_PACK_CURRENCY;
  });

  function formatPackPrice(pack: CreditPack): string {
    return formatPrice(pack.prices[packCurrency.value], packCurrency.value);
  }

  function formatPackPer100Credits(pack: CreditPack): string {
    return formatPricePer100Credits(
      pack.prices[packCurrency.value],
      pack.credits,
      packCurrency.value,
    );
  }

  /** Per-credit saving vs the smallest pack in the shown currency; 0 means no badge. */
  function packSavingsPercent(pack: CreditPack): number {
    return computePackSavingsPercent(pack, packCurrency.value);
  }

  const bestPackSavingsPercent = computed(() => maxPackSavingsPercent(packCurrency.value));

  /** True once the buyer's own currency is known; before that USD is shown as a placeholder. */
  const hasServerPrices = computed(() => prices.value !== null);

  return {
    modelsByCategory,
    pricingBoard,
    creditPacks,
    proPrice,
    hasServerPrices,
    packCurrency,
    formatPackPrice,
    formatPackPer100Credits,
    packSavingsPercent,
    bestPackSavingsPercent,
    loadPrices,
  };
}
