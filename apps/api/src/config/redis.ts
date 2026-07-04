import IORedis from "ioredis"

interface RedisConfig {
    host: string
    port: number
}

const redisConfig: RedisConfig = {
    host: process.env.REDIS_HOST || "redis",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
}

export const createRedisClient = (): IORedis => {
    const redis = new IORedis(redisConfig)

    redis.on("error", (err: Error) => {
        console.error("Redis Client Error:", err)
    })

    redis.on("connect", () => {
        console.log("Redis Client Connected")
        console.log("===========================")
    })

    return redis
}

export const redisClient = createRedisClient()
