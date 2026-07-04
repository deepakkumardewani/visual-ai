type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

function resolveMinLevel(): LogLevel {
  const explicit = (import.meta.env.VITE_LOG_LEVEL as string | undefined)?.toLowerCase();
  if (explicit && explicit in LEVEL_PRIORITY) return explicit as LogLevel;
  return import.meta.env.DEV ? 'debug' : 'error';
}

const MIN_LEVEL = resolveMinLevel();

function safeSerialize(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  // vueuse FetchError carries statusCode + parsed body on .data
  if (value && typeof value === 'object' && 'message' in (value as Record<string, unknown>)) {
    const v = value as Record<string, unknown>;
    if ('statusCode' in v || 'data' in v) {
      return {
        name: v.name,
        message: v.message,
        statusCode: v.statusCode,
        data: v.data,
        stack: v.stack,
      };
    }
  }
  return value;
}

function emit(scope: string, level: LogLevel, message: string, meta?: unknown) {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[MIN_LEVEL]) return;
  const ts = new Date().toISOString();
  const prefix = `[${ts}] ${level.toUpperCase().padEnd(5)} ${scope}`;
  const payload = meta === undefined ? undefined : safeSerialize(meta);
  const args = payload === undefined ? [prefix, message] : [prefix, message, payload];
  switch (level) {
    case 'debug':
      // eslint-disable-next-line no-console
      console.debug(...args);
      break;
    case 'info':
      // eslint-disable-next-line no-console
      console.info(...args);
      break;
    case 'warn':
      console.warn(...args);
      break;
    case 'error':
      console.error(...args);
      break;
  }
}

export interface Logger {
  debug: (message: string, meta?: unknown) => void;
  info: (message: string, meta?: unknown) => void;
  warn: (message: string, meta?: unknown) => void;
  error: (message: string, meta?: unknown) => void;
}

export function createLogger(scope: string): Logger {
  return {
    debug: (m, meta) => emit(scope, 'debug', m, meta),
    info: (m, meta) => emit(scope, 'info', m, meta),
    warn: (m, meta) => emit(scope, 'warn', m, meta),
    error: (m, meta) => emit(scope, 'error', m, meta),
  };
}

export const logger = createLogger('app');
export const apiLogger = createLogger('api');

export function redactHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const safe: Record<string, string> = { ...headers };
  if (safe.Authorization) safe.Authorization = '***';
  if (safe.authorization) safe.authorization = '***';
  return safe;
}
