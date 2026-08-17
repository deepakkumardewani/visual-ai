import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/composables/useFetch', () => ({
  useFetch: vi.fn(),
}));

import { useFetch } from '@/composables/useFetch';
import PROMPTS from '@/utils/prompts.json';
import REALISTIC_PROMPTS from '@/utils/realisticPrompts.json';
import {
  describeImage,
  generateRandomPrompt,
  improvePrompt,
  pickRandomPrompt,
} from '@/utils/promptAi';
import { MODEL_IDS } from '@visual-ai/shared';

type FetchResult = {
  data: { value: { text?: string } | null };
  error: { value: unknown };
};

function mockFetchJson(result: FetchResult) {
  vi.mocked(useFetch).mockReturnValue({
    json: async () => result,
  } as unknown as ReturnType<typeof useFetch>);
}

describe('promptAi', () => {
  beforeEach(() => {
    vi.mocked(useFetch).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('improvePrompt', () => {
    it('returns improved text on success', async () => {
      mockFetchJson({
        data: { value: { text: 'A red fox in snow, cinematic lighting' } },
        error: { value: null },
      });

      const result = await improvePrompt('A red fox in snow');

      expect(useFetch).toHaveBeenCalledWith(
        '/prompt/improve',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ prompt: 'A red fox in snow' }),
        }),
      );
      expect(result.text).toBe('A red fox in snow, cinematic lighting');
    });

    it('throws when the API returns an error', async () => {
      mockFetchJson({
        data: { value: null },
        error: { value: { message: 'bad request' } },
      });

      await expect(improvePrompt('A red fox')).rejects.toThrow(
        'Failed to improve prompt. Please try again.',
      );
    });

    it('throws when the response is missing text', async () => {
      mockFetchJson({
        data: { value: {} },
        error: { value: null },
      });

      await expect(improvePrompt('A red fox')).rejects.toThrow(
        'Failed to improve prompt. Please try again.',
      );
    });
  });

  describe('describeImage', () => {
    it('returns description text on success', async () => {
      mockFetchJson({
        data: { value: { text: 'A sunset over a beach' } },
        error: { value: null },
      });

      const file = new File(['pixels'], 'sunset-beach.png', { type: 'image/png' });
      const result = await describeImage(file);

      expect(useFetch).toHaveBeenCalledWith(
        '/prompt/describe',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        }),
      );
      expect(result.text).toBe('A sunset over a beach');
    });
  });

  describe('generateRandomPrompt', () => {
    it('returns API text on success', async () => {
      mockFetchJson({
        data: { value: { text: 'Neon city at midnight' } },
        error: { value: null },
      });

      const text = await generateRandomPrompt(MODEL_IDS.FLUX_BASIC);

      expect(useFetch).toHaveBeenCalledWith(
        '/prompt/random',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(text).toBe('Neon city at midnight');
    });

    it('falls back to pickRandomPrompt when the API fails', async () => {
      mockFetchJson({
        data: { value: null },
        error: { value: { message: 'network' } },
      });
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const text = await generateRandomPrompt(MODEL_IDS.FLUX_BASIC);

      expect(text).toBe(PROMPTS[0]);
    });
  });

  describe('pickRandomPrompt', () => {
    it('selects from realistic prompts for FLUX_REALISM', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const prompt = pickRandomPrompt(MODEL_IDS.FLUX_REALISM);
      expect(prompt).toBe(REALISTIC_PROMPTS[0]);
    });

    it('selects from general prompts for other models', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const prompt = pickRandomPrompt(MODEL_IDS.FLUX_BASIC);
      expect(prompt).toBe(PROMPTS[0]);
    });
  });
});
