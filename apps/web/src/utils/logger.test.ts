import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiLogger, createLogger, logger, redactHeaders } from '@/utils/logger';

describe('createLogger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits scoped messages with a level prefix', () => {
    const log = createLogger('helpers');
    log.error('delete failed', { imageId: 'img_1' });

    expect(console.error).toHaveBeenCalledTimes(1);
    const [prefix, message, meta] = vi.mocked(console.error).mock.calls[0];
    expect(prefix).toMatch(/ERROR\s+helpers$/);
    expect(message).toBe('delete failed');
    expect(meta).toEqual({ imageId: 'img_1' });
  });

  it('serializes Error meta to name, message, and stack', () => {
    const log = createLogger('api');
    const err = new Error('boom');
    log.error('request failed', err);

    expect(vi.mocked(console.error).mock.calls[0][2]).toEqual({
      name: 'Error',
      message: 'boom',
      stack: err.stack,
    });
  });

  it('serializes fetch-like errors with statusCode and data', () => {
    const log = createLogger('api');
    log.warn('bad request', {
      name: 'FetchError',
      message: 'Bad Request',
      statusCode: 400,
      data: { message: 'invalid' },
      stack: 'stack',
    });

    expect(vi.mocked(console.warn).mock.calls[0][2]).toEqual({
      name: 'FetchError',
      message: 'Bad Request',
      statusCode: 400,
      data: { message: 'invalid' },
      stack: 'stack',
    });
  });

  it('omits meta when it is undefined', () => {
    const log = createLogger('app');
    log.info('ready');

    expect(vi.mocked(console.info).mock.calls[0]).toHaveLength(2);
  });

  it('exports default app and api loggers', () => {
    logger.debug('boot');
    apiLogger.info('ping');
    expect(vi.mocked(console.debug).mock.calls[0][0]).toMatch(/app$/);
    expect(vi.mocked(console.info).mock.calls[0][0]).toMatch(/api$/);
  });
});

describe('redactHeaders', () => {
  it('masks Authorization in either casing', () => {
    expect(
      redactHeaders({
        Authorization: 'Bearer secret',
        authorization: 'Bearer other',
        Accept: 'application/json',
      }),
    ).toEqual({
      Authorization: '***',
      authorization: '***',
      Accept: 'application/json',
    });
  });

  it('returns an empty object when headers are omitted', () => {
    expect(redactHeaders()).toEqual({});
  });

  it('does not mutate the original headers object', () => {
    const headers = { Authorization: 'Bearer secret' };
    redactHeaders(headers);
    expect(headers.Authorization).toBe('Bearer secret');
  });
});
