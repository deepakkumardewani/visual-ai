import pino from "pino"

import { env } from "../config/env.js"

const isDevelopment = env.NODE_ENV !== "production"

/**
 * Dev: compact single-line human logs to stdout (terminal).
 * Prod: JSON lines to stdout — let the process manager / platform capture them.
 * Don't write log files from the app; tee/rotate externally if you need persistence.
 */
const pinoConfig: pino.LoggerOptions = {
    level: env.LOG_LEVEL,
    redact: {
        paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            'req.headers["x-api-key"]',
            'req.headers["x-auth-token"]',
        ],
        remove: true,
    },
}

const transport = isDevelopment
    ? {
          target: "pino-pretty",
          options: {
              colorize: true,
              singleLine: true,
              translateTime: "SYS:HH:MM:ss.l",
              ignore: "pid,hostname,module",
              messageFormat: "{msg}",
          },
      }
    : undefined

export const logger = pino(pinoConfig, transport ? pino.transport(transport) : undefined)

export function createLogger(module: string) {
    return logger.child({ module })
}

/** Short id for terminal readability (full UUID still available in JSON prod logs if passed). */
export function shortId(id: string | undefined, len = 8): string {
    if (!id) return "-"
    return id.slice(0, len)
}
