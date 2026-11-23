import { STT_RATE_LIMIT } from "@visual-ai/shared"
import type { Request } from "express"
import rateLimit, { ipKeyGenerator } from "express-rate-limit"
import RedisStore from "rate-limit-redis"

import { env } from "../config/env.js"
import { redisClient } from "../config/redis.js"

const STT_LIMIT_MESSAGE = "Too many voice requests. Try again later."
const UPLOAD_LIMIT_MESSAGE = "Too many uploads. Try again later."
const LYRICS_LIMIT_MESSAGE = "Daily lyrics limit reached. Try again tomorrow."
const LYRICS_WINDOW_MS = 24 * 60 * 60 * 1000
export const LYRICS_DAILY_LIMIT = 30
const UPLOAD_RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 30 } as const

function userRateLimitKey(req: Request): string {
    const userId = req.auth?.userId
    if (userId) {
        return userId
    }
    return ipKeyGenerator(req.ip ?? "127.0.0.1", 56)
}

function createStore(name: string) {
    if (env.NODE_ENV === "test") {
        return undefined
    }
    return new RedisStore({
        sendCommand: (command: string, ...args: string[]) =>
            redisClient.call(command, ...args) as Promise<number>,
        prefix: `${env.QUEUE_PREFIX}:${name}-rl:`,
    })
}

function createUserRateLimiter(options: {
    name: string
    windowMs: number
    max: number
    message: string
}) {
    return rateLimit({
        windowMs: options.windowMs,
        max: options.max,
        standardHeaders: true,
        legacyHeaders: false,
        message: options.message,
        keyGenerator: userRateLimitKey,
        store: createStore(options.name),
        handler: (_req, res, _next, limitOptions) => {
            const retryAfterSeconds = Math.ceil(limitOptions.windowMs / 1000)
            res.setHeader("Retry-After", String(retryAfterSeconds))
            res.status(limitOptions.statusCode).json({ message: options.message })
        },
    })
}

export const sttRateLimiter = createUserRateLimiter({
    name: "stt",
    ...STT_RATE_LIMIT,
    message: STT_LIMIT_MESSAGE,
})

export const uploadRateLimiter = createUserRateLimiter({
    name: "upload",
    ...UPLOAD_RATE_LIMIT,
    message: UPLOAD_LIMIT_MESSAGE,
})

export const lyricsRateLimiter = createUserRateLimiter({
    name: "lyrics",
    windowMs: LYRICS_WINDOW_MS,
    max: LYRICS_DAILY_LIMIT,
    message: LYRICS_LIMIT_MESSAGE,
})
