import { describe, expect, it } from 'vitest';

import { MODEL_IDS } from '@visual-ai/shared';
import type { Model } from '@/types/model';
import {
  filterModelsBySearch,
  FLUX_MODES,
  formatPrice,
  getFeaturedModels,
  getProviderDisplayName,
  groupModelsByCompany,
  getModelBestForHint,
  getModelLogoUrl,
  getModelSpeedHint,
  groupModelsByProvider,
  MODELS,
  PICKER_SECTION,
  sortByCostThenName,
  UPSCALER_MODELS,
} from '@/utils/models';

describe('models catalog', () => {
  it('exports typed MODELS with required fields', () => {
    expect(MODELS.length).toBeGreaterThan(5);

    for (const model of MODELS) {
      expect(model.title).toBeTruthy();
      expect(model.id).toBeTruthy();
      expect(model.provider).toBeTruthy();
      expect(model.description).toBeTruthy();
      expect(['budget', 'standard', 'premium']).toContain(model.tier);
      expect(typeof model.creditCost).toBe('number');
      expect(model.creditCost).toBeGreaterThan(0);
    }
  });

  it('keeps FLUX_MODES alias for legacy backend model ids', () => {
    expect(FLUX_MODES.length).toBe(5);
    expect(FLUX_MODES[0].title).toBe('Flux Lightning');
    expect(FLUX_MODES[0].id).toBe(MODEL_IDS.FLUX_BASIC);

    const ids = FLUX_MODES.map((m) => m.id);
    expect(ids).toContain(MODEL_IDS.FLUX_BASIC);
    expect(ids).toContain(MODEL_IDS.FLUX_PRO);
    expect(ids).toContain(MODEL_IDS.FLUX_1_1_PRO);
    expect(ids).toContain(MODEL_IDS.FLUX_REALISM);
  });

  it('assigns credit costs based on tier', () => {
    const premium = MODELS.filter((m) => m.tier === 'premium');

    expect(premium.length).toBeGreaterThan(0);
    // Premium models should have higher credit costs than budget/standard
    for (const model of premium) {
      expect(model.creditCost).toBeGreaterThanOrEqual(4);
    }
  });

  it('groups models by provider', () => {
    const groups = groupModelsByProvider(MODELS);
    expect(groups.get('bfl')!.length).toBeGreaterThan(1);
    expect(groups.get('openai')!.length).toBe(1);
    expect(groups.get('google')!.length).toBe(3);
  });

  it('marks a featured set of 5-6 models', () => {
    const featured = getFeaturedModels();
    expect(featured.length).toBeGreaterThanOrEqual(5);
    expect(featured.length).toBeLessThanOrEqual(6);

    const titles = featured.map((m) => m.title);
    expect(titles).toContain('Z-Image Turbo');
    expect(titles).toContain('GPT Image 2');
    expect(titles).toContain('Nano Banana 2');
    expect(titles).toContain('Nano Banana Pro');
    expect(titles).toContain('Seedream 4');
    expect(titles).toContain('Flux 2 Pro');
  });

  it('filters featured models from an arbitrary list', () => {
    const subset = MODELS.filter((m) => !m.featured);
    expect(getFeaturedModels(subset)).toEqual([]);
  });

  it('resolves provider display names with raw fallback', () => {
    expect(getProviderDisplayName('openai')).toBe('OpenAI');
    expect(getProviderDisplayName('bfl')).toBe('Black Forest Labs');
    expect(getProviderDisplayName('zimage')).toBe('Z-Image');
    expect(getProviderDisplayName('unknown-provider')).toBe('unknown-provider');
  });

  it('formats price per image', () => {
    expect(formatPrice(0.005)).toBe('$0.005');
    expect(formatPrice(0.014)).toBe('$0.014');
    expect(formatPrice(0.15)).toBe('$0.15');
    expect(formatPrice(undefined)).toBeNull();
  });
});

describe('upscaler models', () => {
  it('exports UPSCALER_MODELS with 7 entries', () => {
    expect(UPSCALER_MODELS.length).toBe(7);
  });

  it('includes required upscaler models without hand-set tier/price', () => {
    const modelIds = new Set([
      'UPSCALE_IMAGE',
      'UPSCALE_REAL_ESRGAN',
      'UPSCALE_PRUNA',
      'UPSCALE_RECRAFT',
      'UPSCALE_GOOGLE',
      'UPSCALE_CLARITY_PRO',
      'UPSCALE_TOPAZ',
    ]);
    const upscalerIds = new Set(UPSCALER_MODELS.map((m) => m.id));
    expect(upscalerIds).toEqual(modelIds);

    for (const model of UPSCALER_MODELS) {
      expect(model.title).toBeTruthy();
      expect(model.provider).toBeTruthy();
      expect(model.description).toBeTruthy();
      expect(['budget', 'standard', 'premium']).toContain(model.tier);
      expect(typeof model.creditCost).toBe('number');
      expect(model.creditCost).toBeGreaterThan(0);
    }
  });

  it('assigns higher credit costs to premium upscalers', () => {
    const premiumUpscalers = UPSCALER_MODELS.filter((m) => m.tier === 'premium');
    expect(premiumUpscalers.length).toBe(2); // Clarity Pro and Topaz
    for (const model of premiumUpscalers) {
      expect(model.creditCost).toBe(4);
    }
  });

  it('includes UPSCALE_IMAGE as first entry for backward compatibility', () => {
    expect(UPSCALER_MODELS[0].id).toBe('UPSCALE_IMAGE');
  });
});

const makeModel = (overrides: Partial<Model> & Pick<Model, 'id' | 'title'>): Model => ({
  provider: 'google',
  description: 'desc',
  tier: 'standard',
  creditCost: 1,
  ...overrides,
});

describe('sortByCostThenName', () => {
  it('orders by credit cost ascending, then title', () => {
    const sorted = sortByCostThenName([
      makeModel({ id: 'A', title: 'Zeta', creditCost: 2 }),
      makeModel({ id: 'B', title: 'Beta', creditCost: 5 }),
      makeModel({ id: 'C', title: 'Alpha', creditCost: 2 }),
      makeModel({ id: 'D', title: 'Omega', creditCost: 1 }),
    ]);
    expect(sorted.map((m) => m.title)).toEqual(['Omega', 'Alpha', 'Zeta', 'Beta']);
  });

  it('treats an undefined creditCost as 1', () => {
    const sorted = sortByCostThenName([
      makeModel({ id: 'A', title: 'Two', creditCost: 2 }),
      makeModel({ id: 'B', title: 'Undefined', creditCost: undefined }),
      makeModel({ id: 'C', title: 'Zero-ish', creditCost: 1 }),
    ]);
    // undefined ties with cost 1, so the title decides between them
    expect(sorted.map((m) => m.title)).toEqual(['Undefined', 'Zero-ish', 'Two']);
  });

  it('returns a new array without mutating the input', () => {
    const input = [
      makeModel({ id: 'A', title: 'B', creditCost: 3 }),
      makeModel({ id: 'B', title: 'A', creditCost: 1 }),
    ];
    const snapshot = [...input];
    const sorted = sortByCostThenName(input);
    expect(sorted).not.toBe(input);
    expect(input).toEqual(snapshot);
  });

  it('returns an empty array for empty input', () => {
    expect(sortByCostThenName([])).toEqual([]);
  });
});

describe('groupModelsByCompany', () => {
  const free = (id: string, title: string, extra: Partial<Model> = {}) =>
    makeModel({ id, title, ...extra });

  it('exposes the section names', () => {
    expect(PICKER_SECTION).toEqual({
      FEATURED: 'Featured',
      FREE: 'Free',
      PRO: 'Pro',
    });
  });

  it('orders sections Featured, Free, Pro', () => {
    const sections = groupModelsByCompany([
      free('GPT_IMAGE_2', 'GPT Image 2', {
        companyName: 'OpenAI',
        featured: true,
      }),
      free('FREE_1', 'Free One', { companyName: 'Acme' }),
    ]);
    expect(sections.map((s) => s.section)).toEqual(['Featured', 'Free', 'Pro']);
  });

  it('keeps Featured in source order, not sorted', () => {
    const sections = groupModelsByCompany([
      free('Z', 'Zulu', { featured: true, creditCost: 9 }),
      free('N', 'Not featured'),
      free('A', 'Alpha', { featured: true, creditCost: 1 }),
      free('M', 'Mike', { featured: true, creditCost: 4 }),
    ]);
    const featured = sections[0];
    expect(featured.section).toBe('Featured');
    expect('models' in featured && featured.models.map((m) => m.title)).toEqual([
      'Zulu',
      'Alpha',
      'Mike',
    ]);
  });

  it('sorts companies alphabetically within a tier', () => {
    const sections = groupModelsByCompany([
      free('1', 'One', { companyName: 'Zed' }),
      free('2', 'Two', { companyName: 'Acme' }),
      free('3', 'Three', { companyName: 'Mid' }),
    ]);
    const freeSection = sections.find((s) => s.section === 'Free');
    expect(
      freeSection && 'companies' in freeSection && freeSection.companies.map((c) => c.company),
    ).toEqual(['Acme', 'Mid', 'Zed']);
  });

  it('falls back to provider when companyName is missing', () => {
    const sections = groupModelsByCompany([free('1', 'One', { provider: 'bfl' })]);
    const freeSection = sections.find((s) => s.section === 'Free');
    expect(freeSection && 'companies' in freeSection && freeSection.companies[0].company).toBe(
      'bfl',
    );
  });

  it('places a company with free and Pro models in both tiers with disjoint models', () => {
    const sections = groupModelsByCompany([
      free('FREE_G', 'Free G', { companyName: 'Google' }),
      free('NANO_BANANA_PRO', 'Nano Banana Pro', { companyName: 'Google' }),
      free('IMAGEN_4_ULTRA', 'Imagen 4 Ultra', { companyName: 'Google' }),
    ]);
    const freeSection = sections.find((s) => s.section === 'Free');
    const proSection = sections.find((s) => s.section === 'Pro');
    const freeGoogle = freeSection && 'companies' in freeSection ? freeSection.companies : [];
    const proGoogle = proSection && 'companies' in proSection ? proSection.companies : [];

    expect(freeGoogle.map((c) => c.company)).toEqual(['Google']);
    expect(proGoogle.map((c) => c.company)).toEqual(['Google']);
    expect(freeGoogle[0].models.map((m) => m.id)).toEqual(['FREE_G']);
    expect(proGoogle[0].models.map((m) => m.id).sort()).toEqual([
      'IMAGEN_4_ULTRA',
      'NANO_BANANA_PRO',
    ]);
  });

  it('sorts models inside a company by cost then title', () => {
    const sections = groupModelsByCompany([
      free('1', 'Pricey', { companyName: 'Acme', creditCost: 5 }),
      free('2', 'Beta', { companyName: 'Acme', creditCost: 2 }),
      free('3', 'Alpha', { companyName: 'Acme', creditCost: 2 }),
      free('4', 'Unset', { companyName: 'Acme', creditCost: undefined }),
    ]);
    const freeSection = sections.find((s) => s.section === 'Free');
    const acme = freeSection && 'companies' in freeSection ? freeSection.companies[0] : undefined;
    expect(acme?.models.map((m) => m.title)).toEqual(['Unset', 'Alpha', 'Beta', 'Pricey']);
  });

  it('also lists a featured model in its tier group', () => {
    const sections = groupModelsByCompany([
      free('GPT_IMAGE_2', 'GPT Image 2', {
        companyName: 'OpenAI',
        featured: true,
      }),
    ]);
    const pro = sections.find((s) => s.section === 'Pro');
    expect(pro && 'companies' in pro && pro.companies[0].models.map((m) => m.id)).toEqual([
      'GPT_IMAGE_2',
    ]);
    expect(sections[0].section).toBe('Featured');
  });

  it('keeps same-id variants distinct', () => {
    const sections = groupModelsByCompany([
      free('SHARED', 'Variant A', { companyName: 'Acme' }),
      free('SHARED', 'Variant B', { companyName: 'Acme' }),
    ]);
    const freeSection = sections.find((s) => s.section === 'Free');
    const acme = freeSection && 'companies' in freeSection ? freeSection.companies[0] : undefined;
    expect(acme?.models.map((m) => m.title)).toEqual(['Variant A', 'Variant B']);
  });

  it('drops empty sections', () => {
    const onlyFree = groupModelsByCompany([free('1', 'One', { companyName: 'Acme' })]);
    expect(onlyFree.map((s) => s.section)).toEqual(['Free']);

    const onlyPro = groupModelsByCompany([free('FLUX_REALISM', 'Realism', { companyName: 'BFL' })]);
    expect(onlyPro.map((s) => s.section)).toEqual(['Pro']);

    expect(groupModelsByCompany([])).toEqual([]);
  });

  it('defaults to the full catalog and partitions it across Free and Pro', () => {
    const sections = groupModelsByCompany();
    const count = (name: string) => {
      const s = sections.find((x) => x.section === name);
      return s && 'companies' in s ? s.companies.reduce((n, c) => n + c.models.length, 0) : 0;
    };
    expect(sections[0].section).toBe('Featured');
    expect(count('Free') + count('Pro')).toBe(MODELS.length);
    expect(count('Pro')).toBeGreaterThan(0);
  });
});

describe('model presentation helpers', () => {
  it('returns null for a missing logo and an asset url otherwise', () => {
    expect(getModelLogoUrl(undefined)).toBeNull();
    expect(getModelLogoUrl('')).toBeNull();
    expect(getModelLogoUrl('openai.svg')).toEqual(expect.any(String));
  });

  it('maps known model ids to a speed hint and unknown ids to undefined', () => {
    expect(getModelSpeedHint('FLUX_BASIC')).toBe('Fast');
    expect(getModelSpeedHint('SEEDREAM_4')).toBe('Balanced');
    expect(getModelSpeedHint('GPT_IMAGE_2')).toBe('Quality');
    expect(getModelSpeedHint('NOT_A_MODEL')).toBeUndefined();
  });

  it('prefers trimmed bestAt and falls back to description', () => {
    const base = makeModel({
      id: 'X',
      title: 'X',
      description: 'Plain description',
    });
    expect(getModelBestForHint({ ...base, bestAt: '  Portraits  ' })).toBe('Portraits');
    expect(getModelBestForHint({ ...base, bestAt: '   ' })).toBe('Plain description');
    expect(getModelBestForHint(base)).toBe('Plain description');
  });
});

describe('filterModelsBySearch', () => {
  const luna = makeModel({
    id: 'LUNA',
    title: 'Lunar Brush',
    companyName: 'Moonworks',
    bestAt: 'Watercolour landscapes',
    description: 'Gentle pastel rendering',
  });
  const forge = makeModel({
    id: 'FORGE',
    title: 'Iron Forge',
    companyName: 'Smithy Labs',
    bestAt: 'Hard-surface props',
    description: 'Metallic detail pass',
  });
  const noCompany = makeModel({
    id: 'NOCO',
    title: 'Plain',
    provider: 'bfl',
    bestAt: undefined,
    description: 'Nothing special',
  });
  const catalog = [luna, forge, noCompany];

  it('matches on title', () => {
    expect(filterModelsBySearch(catalog, 'brush')).toEqual([luna]);
  });

  it('matches on company name', () => {
    expect(filterModelsBySearch(catalog, 'smithy')).toEqual([forge]);
  });

  it('matches on bestAt', () => {
    expect(filterModelsBySearch(catalog, 'watercolour')).toEqual([luna]);
  });

  it('matches on description', () => {
    expect(filterModelsBySearch(catalog, 'metallic')).toEqual([forge]);
  });

  it('is case-insensitive in both directions', () => {
    expect(filterModelsBySearch(catalog, 'IRON FORGE')).toEqual([forge]);
    expect(filterModelsBySearch([makeModel({ id: 'U', title: 'UPPER' })], 'upper')).toHaveLength(1);
  });

  it('trims the query before matching', () => {
    expect(filterModelsBySearch(catalog, '   forge  ')).toEqual([forge]);
  });

  it.each(['', '   ', '\t\n'])('returns every model for the blank query %j', (query) => {
    expect(filterModelsBySearch(catalog, query)).toEqual(catalog);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterModelsBySearch(catalog, 'zzz-no-such-thing')).toEqual([]);
  });

  it('returns an empty list for an empty catalog', () => {
    expect(filterModelsBySearch([], 'forge')).toEqual([]);
  });

  it('falls back to the provider when there is no company name', () => {
    expect(filterModelsBySearch(catalog, 'bfl')).toEqual([noCompany]);
  });

  it('skips a missing bestAt without throwing', () => {
    expect(filterModelsBySearch([noCompany], 'special')).toEqual([noCompany]);
    expect(filterModelsBySearch([noCompany], 'undefined')).toEqual([]);
  });

  it('keeps source order of the matches', () => {
    const a = makeModel({ id: 'A', title: 'Zed shared' });
    const b = makeModel({ id: 'B', title: 'Alpha shared' });
    expect(filterModelsBySearch([a, b], 'shared')).toEqual([a, b]);
  });

  describe('combined with groupModelsByCompany', () => {
    it('drops empty sections and companies after filtering', () => {
      const featured = makeModel({
        id: 'F',
        title: 'Star Pick',
        companyName: 'Starco',
        featured: true,
      });
      const sections = groupModelsByCompany(
        filterModelsBySearch([featured, luna, forge], 'moonworks'),
      );
      expect(sections.map((s) => s.section)).toEqual(['Free']);
      const [free] = sections;
      expect('companies' in free && free.companies.map((c) => c.company)).toEqual(['Moonworks']);
    });

    it('keeps every model of a company matched by name only', () => {
      const sibling = makeModel({
        id: 'SIB',
        title: 'Unrelated Title',
        companyName: 'Moonworks',
        description: 'x',
      });
      const result = filterModelsBySearch([luna, sibling, forge], 'moonworks');
      expect(result).toEqual([luna, sibling]);
    });
  });
});
