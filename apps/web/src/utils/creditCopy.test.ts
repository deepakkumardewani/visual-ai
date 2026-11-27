import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { USD_PER_CREDIT } from '@visual-ai/shared';
import { describe, expect, it } from 'vitest';

import {
  creditEconomyLines,
  creditEconomyPhrase,
  formatCredits,
  formatCreditsRange,
  premiumUpscaleCreditRange,
  standardUpscaleCreditRange,
  transformCreditsLabel,
} from '@/utils/creditCopy';
import pricingFaq from '@/utils/pricingFAQ.json';

const PUBLIC_DIR = resolve(__dirname, '../../public');
const readPublic = (name: string): string => readFileSync(resolve(PUBLIC_DIR, name), 'utf8');

describe('formatCredits', () => {
  it('pluralises', () => {
    expect(formatCredits(1)).toBe('1 credit');
    expect(formatCredits(14)).toBe('14 credits');
  });
});

describe('formatCreditsRange', () => {
  it('renders a range or a single value', () => {
    expect(formatCreditsRange({ min: 1, max: 30 })).toBe('1–30 credits');
    expect(formatCreditsRange({ min: 2, max: 2 })).toBe('2 credits');
    expect(formatCreditsRange({ min: 1, max: 1 })).toBe('1 credit');
  });
});

describe('derived copy', () => {
  it('labels transforms by the model they run', () => {
    expect(transformCreditsLabel('colorize')).toBe('1 credit');
    expect(transformCreditsLabel('revive')).toBe('2 credits');
    expect(transformCreditsLabel('remove_bg')).toBe('1 credit');
  });

  it('splits upscalers by tier', () => {
    expect(standardUpscaleCreditRange()).toEqual({ min: 1, max: 6 });
    expect(premiumUpscaleCreditRange()).toEqual({ min: 6, max: 16 });
  });

  it('builds one phrase per pricing category', () => {
    expect(creditEconomyLines().map(creditEconomyPhrase)).toEqual([
      'Image generation: 1–30 credits',
      'Studio tools: 1–2 credits',
      'Upscaling: 1–16 credits',
    ]);
  });
});

/** Static copy cannot import the registry, so it must restate the derived ranges exactly. */
describe.each([
  ['pricingFAQ.json', () => JSON.stringify(pricingFaq)],
  ['public/pricing.md', () => readPublic('pricing.md')],
  ['public/llms.txt', () => readPublic('llms.txt')],
])('%s credit costs', (_name, read) => {
  it.each(creditEconomyLines().map((line) => [creditEconomyPhrase(line)]))(
    'states "%s"',
    (phrase) => {
      expect(read()).toContain(phrase);
    },
  );
});

describe.each([
  ['public/pricing.md', () => readPublic('pricing.md')],
  ['public/llms.txt', () => readPublic('llms.txt')],
])('%s credit unit', (_name, read) => {
  it('states the USD value of one credit', () => {
    expect(read()).toContain(`$${USD_PER_CREDIT}`);
  });
});
