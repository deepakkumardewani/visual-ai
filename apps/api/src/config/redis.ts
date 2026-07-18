import IORedis from "ioredis"

import { env } from "./env.js"
import { createLogger } from "../lib/logger.js"

const logger = createLogger("redis")

interface RedisConfig {
    host: string
    port: number
}

const redisConfig: RedisConfig = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
}

export const createRedisClient = (): IORedis => {
    const redis = new IORedis(redisConfig)

    redis.on("error", (err: Error) => {
        logger.error({ err }, "Redis client error")
    })

    redis.on("connect", () => {
        logger.info("Redis client connected")
    })

    return redis
}

export const redisClient = createRedisClient()
