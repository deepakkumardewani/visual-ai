import { STT_RATE_LIMIT } from "@visual-ai/shared"
import type { Request } from "express"
import rateLimit, { ipKeyGenerator } from "express-rate-limit"
import RedisStore from "rate-limit-redis"

import { env } from "../config/env.js"
import { redisClient } from "../config/redis.js"

const STT_LIMIT_MESSAGE = "Too many voice requests. Try again later."

export function userOrIpRateLimitKey(req: Request): string {
    const userId = req.auth?.userId
    if (userId) {
        return userId
    }
    return ipKeyGenerator(req.ip ?? "127.0.0.1", 56)
}

export function createRateLimitStore(prefixName: string) {
    if (env.NODE_ENV === "test") {
        return undefined
    }
    return new RedisStore({
        sendCommand: (command: string, ...args: string[]) =>
            redisClient.call(command, ...args) as Promise<number>,
        prefix: `${env.QUEUE_PREFIX}:${prefixName}:`,
    })
}

export const sttRateLimiter = rateLimit({
    windowMs: STT_RATE_LIMIT.windowMs,
    max: STT_RATE_LIMIT.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: STT_LIMIT_MESSAGE,
    keyGenerator: userOrIpRateLimitKey,
    store: createRateLimitStore("stt-rl"),
    handler: (req, res, _next, options) => {
        const retryAfterSeconds = Math.ceil(options.windowMs / 1000)
        res.setHeader("Retry-After", String(retryAfterSeconds))
        res.status(options.statusCode).json({ message: STT_LIMIT_MESSAGE })
    },
})
