import pino from "pino"

import { env } from "../config/env.js"

const isDevelopment = env.NODE_ENV !== "production"

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
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
          },
      }
    : undefined

export const logger = pino(pinoConfig, transport ? pino.transport(transport) : undefined)

/**
 * Create a child logger with a module name for context
 */
export function createLogger(module: string) {
    return logger.child({ module })
}
