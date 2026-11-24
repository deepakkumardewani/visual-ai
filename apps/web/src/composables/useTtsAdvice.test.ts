import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import type { TtsDoc } from '@visual-ai/shared';

import {
  countWords,
  estimateSpokenSeconds,
  formatSpokenLength,
  NEAR_LIMIT_RATIO,
  SPOKEN_WORDS_PER_MIN,
  useTtsAdvice,
} from '@/composables/useTtsAdvice';

const LIMIT = 1000;

function words(n: number): string {
  return Array.from({ length: n }, () => 'word').join(' ');
}

describe('countWords', () => {
  it('counts words across text nodes and treats chips as separators', () => {
    const doc: TtsDoc = [
      { type: 'text', text: 'hello' },
      { type: 'tag', id: 'laugh' },
      { type: 'text', text: 'world  again' },
    ];
    expect(countWords(doc)).toBe(3);
  });

  it('returns zero for an empty or whitespace-only doc', () => {
    expect(countWords([])).toBe(0);
    expect(countWords([{ type: 'text', text: '  \n ' }])).toBe(0);
  });
});

describe('estimateSpokenSeconds', () => {
  it('converts the word count at the narration pace', () => {
    expect(estimateSpokenSeconds([{ type: 'text', text: words(SPOKEN_WORDS_PER_MIN) }])).toBe(60);
  });

  it('adds pause durations and ignores other chips', () => {
    const doc: TtsDoc = [
      { type: 'pause', seconds: 3 },
      { type: 'direction', text: 'slowly' },
    ];
    expect(estimateSpokenSeconds(doc)).toBe(3);
  });
});

describe('formatSpokenLength', () => {
  it.each([
    [0, '0 s'],
    [59, '59 s'],
    [60, '1 min'],
    [125, '2 min 5 s'],
  ])('formats %s seconds as %s', (seconds, expected) => {
    expect(formatSpokenLength(seconds)).toBe(expected);
  });
});

describe('useTtsAdvice', () => {
  function setup(chars: number, estimatedCost = false) {
    const doc = ref<TtsDoc>([{ type: 'text', text: words(75) }]);
    const charsRef = ref(chars);
    const advice = useTtsAdvice({
      doc,
      chars: charsRef,
      limit: LIMIT,
      estimatedCost: () => estimatedCost,
    });
    return { advice, doc, charsRef };
  }

  it('reports length, remaining characters and an ok level under the near threshold', () => {
    const { advice } = setup(100);

    expect(advice.seconds.value).toBe(30);
    expect(advice.spokenLabel.value).toBe('30 s');
    expect(advice.remaining.value).toBe(900);
    expect(advice.level.value).toBe('ok');
  });

  it('turns near at exactly the near ratio and over only above the limit', () => {
    const { advice, charsRef } = setup(LIMIT * NEAR_LIMIT_RATIO - 1);
    expect(advice.level.value).toBe('ok');

    charsRef.value = LIMIT * NEAR_LIMIT_RATIO;
    expect(advice.level.value).toBe('near');

    charsRef.value = LIMIT;
    expect(advice.level.value).toBe('near');

    charsRef.value = LIMIT + 1;
    expect(advice.level.value).toBe('over');
    expect(advice.remaining.value).toBe(-1);
  });

  it('recomputes when the doc changes', () => {
    const { advice, doc } = setup(10);
    doc.value = [{ type: 'text', text: words(150) }];
    expect(advice.spokenLabel.value).toBe('1 min');
  });

  it('mirrors the estimated-cost flag', () => {
    expect(setup(10, true).advice.isEstimated.value).toBe(true);
    expect(setup(10, false).advice.isEstimated.value).toBe(false);
  });
});
