import { beforeEach, describe, expect, it, vi } from 'vitest';

const getToken = vi.hoisted(() => vi.fn());
const apiLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  error: vi.fn(),
}));
const fetchConfig = vi.hoisted(() => ({ current: null as Record<string, any> | null }));
const createFetch = vi.hoisted(() =>
  vi.fn((config: Record<string, any>) => {
    fetchConfig.current = config;
    return vi.fn();
  }),
);

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ getToken }),
}));

vi.mock('@/utils/logger', () => ({
  apiLogger,
  redactHeaders: (headers: Record<string, string>) => headers,
}));

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>();
  return {
    ...actual,
    createFetch,
  };
});

import { CANCELLED_REQUEST, useFetch } from '@/composables/useFetch';

describe('useFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports the abort code and a fetch factory', () => {
    expect(CANCELLED_REQUEST).toBe(20);
    expect(fetchConfig.current).toBeTruthy();
    expect(useFetch).toEqual(expect.any(Function));
  });

  it('attaches a bearer token and logs the request', async () => {
    getToken.mockResolvedValue('tok_abc');
    const config = fetchConfig.current;
    const options: Record<string | symbol, unknown> = {
      method: 'POST',
      headers: { 'X-Trace': '1' },
    };

    const result = await config.options.beforeFetch({
      url: '/v1/generate',
      options,
    });

    expect((result.options.headers as Record<string, string>).Authorization).toBe('Bearer tok_abc');
    expect((result.options.headers as Record<string, string>).Accept).toBe('application/json');
    expect((result.options.headers as Record<string, string>)['X-Trace']).toBe('1');
    expect(apiLogger.debug).toHaveBeenCalled();
  });

  it('logs successful responses', () => {
    const config = fetchConfig.current;
    const response = { status: 200, url: 'https://api.example/v1/me' };
    const out = config.options.afterFetch({ data: { ok: true }, response });
    expect(out.data).toEqual({ ok: true });
    expect(apiLogger.debug).toHaveBeenCalledWith('→ 200', { url: response.url });
  });

  it('skips abort errors and logs real failures', () => {
    const config = fetchConfig.current;
    const aborted = { error: { code: CANCELLED_REQUEST }, options: {} };
    expect(config.options.onFetchError(aborted)).toBe(aborted);
    expect(apiLogger.error).not.toHaveBeenCalled();

    const failed = {
      error: new Error('offline'),
      options: { method: 'GET' },
      url: '/v1/me',
      data: { message: 'down' },
    };
    expect(config.options.onFetchError(failed)).toBe(failed);
    expect(apiLogger.error).toHaveBeenCalled();
  });
});
