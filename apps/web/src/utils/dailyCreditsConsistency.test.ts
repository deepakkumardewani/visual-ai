import { DAILY_CREDITS, SIGNUP_CREDITS } from '@visual-ai/shared';
import { describe, expect, it } from 'vitest';

import generalFaq from '@/utils/generalFAQ.json';
import { FAQS } from '@/utils/landing';
import pricingFaq from '@/utils/pricingFAQ.json';
import {
  colorizeFreeTierFaqAnswer,
  freeTierSignupFaqAnswer,
  newAccountCreditsDefinition,
} from '@/utils/seo';

interface FaqEntry {
  question: string;
  answer: string;
}

/** Matches "30 daily credits" and "Daily credits (30)", never "50 persistent". */
const DAILY_NUMBER_PATTERNS = [/(\d+)\s+daily\b/gi, /\bdaily credits\s*\((\d+)\)/gi];
/** Matches "receive 30 more every day". */
const PER_DAY_PATTERN = /(\d+)\s+more every day/gi;

function dailyNumbers(text: string): number[] {
  return [...DAILY_NUMBER_PATTERNS, PER_DAY_PATTERN].flatMap((pattern) =>
    [...text.matchAll(pattern)].map((match) => Number(match[1])),
  );
}

function expectAllDailyNumbersToBeFree(text: string): void {
  const numbers = dailyNumbers(text);
  expect(numbers.length).toBeGreaterThan(0);
  expect(numbers.every((n) => n === DAILY_CREDITS.free)).toBe(true);
}

describe('dailyNumbers extractor', () => {
  it('reads numbers adjacent to daily and ignores persistent credits', () => {
    expect(dailyNumbers('50 persistent credits plus 7 daily credits')).toEqual([7]);
    expect(dailyNumbers('Daily credits (9) reset')).toEqual([9]);
    expect(dailyNumbers('receive 4 more every day')).toEqual([4]);
  });

  it('detects drift from the shared constant', () => {
    expect(dailyNumbers('plus 31 daily credits').every((n) => n === DAILY_CREDITS.free)).toBe(
      false,
    );
  });
});

describe.each([
  ['generalFAQ.json', generalFaq as FaqEntry[]],
  ['pricingFAQ.json', pricingFaq as FaqEntry[]],
])('%s', (_name, entries) => {
  it('every number adjacent to "daily" equals DAILY_CREDITS.free', () => {
    const mentions = entries.flatMap((entry) => dailyNumbers(entry.answer));
    expect(mentions.length).toBeGreaterThan(0);
    expect(mentions.every((n) => n === DAILY_CREDITS.free)).toBe(true);
  });
});

describe('landing FAQS', () => {
  it('state the Free daily amount from shared', () => {
    const mentions = FAQS.flatMap((faq) => dailyNumbers(faq.answer));
    expect(mentions.length).toBeGreaterThan(0);
    expect(mentions.every((n) => n === DAILY_CREDITS.free)).toBe(true);
  });

  it('state the signup amount from shared', () => {
    expect(FAQS.some((faq) => faq.answer.includes(`${SIGNUP_CREDITS} persistent credits`))).toBe(
      true,
    );
  });
});

describe('seo copy', () => {
  it.each([
    ['newAccountCreditsDefinition', newAccountCreditsDefinition],
    ['freeTierSignupFaqAnswer', freeTierSignupFaqAnswer],
    ['colorizeFreeTierFaqAnswer', colorizeFreeTierFaqAnswer],
  ])('%s uses the Free daily amount', (_name, build) => {
    expectAllDailyNumbersToBeFree(build());
  });
});
