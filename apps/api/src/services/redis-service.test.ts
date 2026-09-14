import { beforeEach, describe, expect, it, vi } from "vitest"

import { redisClient } from "../config/redis.js"
import type { JobStatus } from "../types/index.js"
import { RedisService } from "./redis-service.js"

vi.mock("../config/redis.js", () => ({
    redisClient: {
        set: vi.fn(),
        get: vi.fn(),
        del: vi.fn(),
    },
}))

const JOB_ID = "job_abc"
const KEY = "job_status:job_abc"
const STATUS: JobStatus = {
    status: "processing",
    image: undefined,
    userCreditsRemaining: 12,
    progress: 40,
}

describe("RedisService", () => {
    const service = new RedisService()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("writes status JSON with a 10-minute expiry", async () => {
        vi.mocked(redisClient.set).mockResolvedValue("OK")

        await service.setStatus(JOB_ID, STATUS)

        expect(redisClient.set).toHaveBeenCalledWith(KEY, JSON.stringify(STATUS), "EX", 600)
    })

    it("parses stored status JSON", async () => {
        vi.mocked(redisClient.get).mockResolvedValue(JSON.stringify(STATUS))

        await expect(service.getStatus(JOB_ID)).resolves.toEqual(STATUS)
        expect(redisClient.get).toHaveBeenCalledWith(KEY)
    })

    it("returns null when the key is missing", async () => {
        vi.mocked(redisClient.get).mockResolvedValue(null)

        await expect(service.getStatus(JOB_ID)).resolves.toBeNull()
    })

    it("deletes the job status key", async () => {
        vi.mocked(redisClient.del).mockResolvedValue(1)

        await service.deleteStatus(JOB_ID)

        expect(redisClient.del).toHaveBeenCalledWith(KEY)
    })

    it("propagates redis write errors", async () => {
        vi.mocked(redisClient.set).mockRejectedValue(new Error("redis unavailable"))

        await expect(service.setStatus(JOB_ID, STATUS)).rejects.toThrow("redis unavailable")
    })
})
