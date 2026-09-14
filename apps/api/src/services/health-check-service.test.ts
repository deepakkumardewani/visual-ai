import { beforeEach, describe, expect, it, vi } from "vitest"

import mongoose from "mongoose"

import { redisClient } from "../config/redis.js"
import { HealthCheckService } from "./health-check-service.js"

const pingMongo = vi.fn()
const pingRedis = vi.fn()

vi.mock("../config/redis.js", () => ({
    redisClient: {
        ping: vi.fn(),
    },
}))

vi.mock("mongoose", () => ({
    default: {
        connection: {
            db: {
                admin: () => ({
                    ping: (...args: unknown[]) => pingMongo(...args),
                }),
            },
        },
    },
}))

describe("HealthCheckService", () => {
    const service = new HealthCheckService()

    beforeEach(() => {
        vi.clearAllMocks()
        pingMongo.mockReset()
        pingRedis.mockReset()
        vi.mocked(redisClient.ping).mockImplementation(pingRedis)
        vi.spyOn(process, "memoryUsage").mockReturnValue({
            rss: 200 * 1024 * 1024,
            heapTotal: 0,
            heapUsed: 0,
            external: 0,
            arrayBuffers: 0,
        })
        vi.spyOn(process, "uptime").mockReturnValue(60)
    })

    it("reports healthy when mongo, redis, and node checks pass", async () => {
        pingMongo.mockResolvedValue({ ok: 1 })
        pingRedis.mockResolvedValue("PONG")

        const result = await service.performHealthCheck()

        expect(result.status).toBe("healthy")
        expect(result.services.mongodb.status).toBe("healthy")
        expect(result.services.redis.status).toBe("healthy")
        expect(result.services.nodejs.status).toBe("healthy")
        expect(result.services.nodejs.responseTime).toBe(0)
        expect(result.errors).toBeUndefined()
        expect(result.timestamp).toBeInstanceOf(Date)
        expect(result.services.mongodb.responseTime).toBeGreaterThanOrEqual(0)
        expect(mongoose.connection.db).toBeDefined()
    })

    it("marks mongodb unhealthy when ping throws an Error", async () => {
        pingMongo.mockRejectedValue(new Error("mongo timeout"))
        pingRedis.mockResolvedValue("PONG")

        const result = await service.performHealthCheck()

        expect(result.status).toBe("unhealthy")
        expect(result.services.mongodb).toMatchObject({
            status: "unhealthy",
            error: "mongo timeout",
        })
        expect(result.errors).toContain("mongo timeout")
    })

    it("uses Unknown error when mongo ping throws a non-Error", async () => {
        pingMongo.mockRejectedValue("boom")
        pingRedis.mockResolvedValue("PONG")

        const result = await service.performHealthCheck()

        expect(result.services.mongodb.error).toBe("Unknown error")
    })

    it("marks redis unhealthy when ping throws an Error", async () => {
        pingMongo.mockResolvedValue({ ok: 1 })
        pingRedis.mockRejectedValue(new Error("redis down"))

        const result = await service.performHealthCheck()

        expect(result.services.redis).toMatchObject({
            status: "unhealthy",
            error: "redis down",
        })
        expect(result.status).toBe("unhealthy")
    })

    it("uses Unknown error when redis ping throws a non-Error", async () => {
        pingMongo.mockResolvedValue({ ok: 1 })
        pingRedis.mockRejectedValue(42)

        const result = await service.performHealthCheck()

        expect(result.services.redis.error).toBe("Unknown error")
    })

    it("marks nodejs unhealthy when RSS exceeds 1GB", async () => {
        pingMongo.mockResolvedValue({ ok: 1 })
        pingRedis.mockResolvedValue("PONG")
        vi.spyOn(process, "memoryUsage").mockReturnValue({
            rss: 1500 * 1024 * 1024,
            heapTotal: 0,
            heapUsed: 0,
            external: 0,
            arrayBuffers: 0,
        })

        const result = await service.performHealthCheck()

        expect(result.services.nodejs.status).toBe("unhealthy")
        expect(result.services.nodejs.error).toMatch(/High memory usage/)
        expect(result.status).toBe("unhealthy")
        expect(result.errors?.[0]).toMatch(/High memory usage/)
    })

    it("marks nodejs unhealthy when uptime is below 10 seconds", async () => {
        pingMongo.mockResolvedValue({ ok: 1 })
        pingRedis.mockResolvedValue("PONG")
        vi.spyOn(process, "uptime").mockReturnValue(3)

        const result = await service.performHealthCheck()

        expect(result.services.nodejs.status).toBe("unhealthy")
        expect(result.services.nodejs.error).toMatch(/low uptime: 3s/)
    })
})
