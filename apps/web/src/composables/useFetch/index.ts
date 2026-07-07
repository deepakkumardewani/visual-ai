import { createFetch } from '@vueuse/core';

import { useAuthStore } from '@/stores/auth';
import { apiLogger, redactHeaders } from '@/utils/logger';

export const CANCELLED_REQUEST = 20;

const REQUEST_START = Symbol('requestStart');

export const useFetch = createFetch({
  baseUrl: `${import.meta.env.VITE_API_BASEPATH}`,
  options: {
    async beforeFetch({ url, options }) {
      const { getToken } = useAuthStore();

      const token = await getToken();
      options.headers = {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers as Record<string, string>),
      };
      (options as Record<symbol, unknown>)[REQUEST_START] = Date.now();
      apiLogger.debug(`${options.method ?? 'GET'} ${url}`, {
        headers: redactHeaders(options.headers as Record<string, string>),
      });
      return {
        options,
      };
    },
    afterFetch({ data, response }) {
      apiLogger.debug(`→ ${response.status}`, {
        url: response.url,
      });
      return { data, response };
    },
    onFetchError(ctx) {
      if (ctx.error?.code === CANCELLED_REQUEST) {
        // 20 is the code for an abort error — AbortError is not a real error,
        // we probably just changed our mind.
        return ctx;
      }
      const _ctx = ctx as any;
      const start = (_ctx.options as Record<symbol, number> | undefined)?.[REQUEST_START];
      const duration = start ? Date.now() - start : undefined;
      const status = _ctx.response?.status ?? 'NETWORK_ERROR';
      apiLogger.error(`${_ctx.options.method ?? 'GET'} ${_ctx.url} → ${status}`, {
        duration,
        status,
        error: _ctx.error,
        body: _ctx.data,
      });
      return ctx;
    },
  },
});
