import { beforeEach, describe, expect, it, vi } from "vitest"

const { instances, mockLogger } = vi.hoisted(() => ({
    instances: [] as Array<{ options: unknown; on: ReturnType<typeof vi.fn> }>,
    mockLogger: { error: vi.fn(), info: vi.fn() },
}))

vi.mock("ioredis", () => {
    class MockRedis {
        options: unknown
        on = vi.fn()

        constructor(options: unknown) {
            this.options = options
            instances.push(this)
        }
    }

    return { default: MockRedis }
})

vi.mock("./env.js", () => ({
    env: {
        REDIS_HOST: "redis.internal",
        REDIS_PORT: 6380,
        REDIS_PASSWORD: undefined,
    },
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => mockLogger,
}))

describe("createRedisClient", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        instances.length = 0
        vi.resetModules()
    })

    it("builds a client from env and logs connect and error events", async () => {
        vi.doMock("./env.js", () => ({
            env: {
                REDIS_HOST: "redis.internal",
                REDIS_PORT: 6380,
                REDIS_PASSWORD: undefined,
            },
        }))

        const { createRedisClient } = await import("./redis.js")
        const client = createRedisClient({ maxRetriesPerRequest: null }) as any

        expect(client.options).toMatchObject({
            host: "redis.internal",
            port: 6380,
            maxRetriesPerRequest: null,
        })
        expect(client.options).not.toHaveProperty("password")

        const errorHandler = client.on.mock.calls.find(
            (call: unknown[]) => call[0] === "error",
        )?.[1]
        const connectHandler = client.on.mock.calls.find(
            (call: unknown[]) => call[0] === "connect",
        )?.[1]
        const err = new Error("ECONNREFUSED")

        errorHandler(err)
        connectHandler()

        expect(mockLogger.error).toHaveBeenCalledWith({ err }, "Redis client error")
        expect(mockLogger.info).toHaveBeenCalledWith("Redis client connected")
    })

    it("includes the redis password when it is configured", async () => {
        vi.doMock("./env.js", () => ({
            env: {
                REDIS_HOST: "redis.internal",
                REDIS_PORT: 6379,
                REDIS_PASSWORD: "s3cret",
            },
        }))

        const { createRedisClient, redisClient } = await import("./redis.js")
        const client = createRedisClient() as any

        expect(client.options).toMatchObject({
            host: "redis.internal",
            port: 6379,
            password: "s3cret",
        })
        expect(redisClient).toBeDefined()
    })
})
