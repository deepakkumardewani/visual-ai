import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/logger', () => ({
  createLogger: () => ({ error: vi.fn(), debug: vi.fn() }),
}));

vi.mock('@/composables/useFetch', () => ({
  useFetch: vi.fn(),
}));

import { useFetch } from '@/composables/useFetch';
import { CheckoutClientError, createCheckoutSession, fetchCheckoutStatus } from './checkoutClient';

type FetchJsonResult = {
  data: { value: unknown };
  error: { value: unknown };
  response: { value: { ok: boolean; status?: number } | undefined };
};

function mockFetchJson(result: Partial<FetchJsonResult>) {
  vi.mocked(useFetch).mockReturnValue({
    json: async () => ({
      data: { value: null },
      error: { value: null },
      response: { value: { ok: true, status: 200 } },
      ...result,
    }),
  } as unknown as ReturnType<typeof useFetch>);
}

describe('checkoutClient', () => {
  beforeEach(() => {
    vi.mocked(useFetch).mockReset();
  });

  describe('createCheckoutSession', () => {
    it('returns checkout url and session id on success', async () => {
      mockFetchJson({
        data: {
          value: { checkoutUrl: 'https://pay.example/c', sessionId: 'sess_abc' },
        },
      });

      const result = await createCheckoutSession('pack_200');

      expect(useFetch).toHaveBeenCalledWith(
        '/payments/checkout',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ packId: 'pack_200' }),
        }),
      );
      expect(result).toEqual({
        checkoutUrl: 'https://pay.example/c',
        sessionId: 'sess_abc',
      });
    });

    it('throws when the API returns an error', async () => {
      mockFetchJson({
        error: { value: { message: 'network' } },
        response: { value: { ok: false, status: 503 } },
      });

      await expect(createCheckoutSession('pack_200')).rejects.toThrow(CheckoutClientError);
      await expect(createCheckoutSession('pack_200')).rejects.toThrow('Could not start checkout');
    });

    it('throws when the response body is invalid', async () => {
      mockFetchJson({
        data: { value: { checkoutUrl: 'https://pay.example/c' } },
      });

      await expect(createCheckoutSession('pack_200')).rejects.toThrow('Invalid checkout response');
    });
  });

  describe('fetchCheckoutStatus', () => {
    it('returns status for a valid session', async () => {
      mockFetchJson({
        data: { value: { status: 'succeeded', credits: 120 } },
      });

      const result = await fetchCheckoutStatus('sess_1');

      expect(useFetch).toHaveBeenCalledWith('/payments/checkout/sess_1/status', { method: 'GET' });
      expect(result).toEqual({ status: 'succeeded', credits: 120 });
    });

    it('encodes special characters in the session id', async () => {
      mockFetchJson({
        data: { value: { status: 'pending' } },
      });

      await fetchCheckoutStatus('a/b c');

      expect(useFetch).toHaveBeenCalledWith('/payments/checkout/a%2Fb%20c/status', {
        method: 'GET',
      });
    });

    it('throws when status fetch fails', async () => {
      mockFetchJson({
        response: { value: { ok: false, status: 404 } },
      });

      await expect(fetchCheckoutStatus('sess_missing')).rejects.toThrow(
        'Could not read payment status',
      );
    });

    it('throws when status payload is invalid', async () => {
      mockFetchJson({
        data: { value: { credits: 50 } },
      });

      await expect(fetchCheckoutStatus('sess_1')).rejects.toThrow('Invalid status response');
    });
  });

  it('names CheckoutClientError correctly', () => {
    const err = new CheckoutClientError('test');
    expect(err.name).toBe('CheckoutClientError');
  });
});
