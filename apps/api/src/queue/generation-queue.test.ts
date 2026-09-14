import { beforeEach, describe, expect, it, vi } from "vitest"

const add = vi.fn()
const createRedisClient = vi.fn(() => ({ host: "mock-redis" }))
const setStatus = vi.fn()
const queueCtorArgs: unknown[][] = []

vi.mock("bullmq", () => ({
    Queue: class {
        add = add
        constructor(...args: unknown[]) {
            queueCtorArgs.push(args)
        }
    },
}))

vi.mock("../config/env.js", () => ({
    env: { QUEUE_PREFIX: "test" },
}))

vi.mock("../config/redis.js", () => ({ createRedisClient }))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({ info: vi.fn(), error: vi.fn() }),
}))

vi.mock("../services/redis-service.js", () => ({
    RedisService: class {
        setStatus = setStatus
    },
}))

const { enqueueGeneration, GENERATION_QUEUE_NAME, generationQueue, queueConnection } =
    await import("./generation-queue.js")

describe("generation queue module", () => {
    it("names the queue from QUEUE_PREFIX", () => {
        expect(GENERATION_QUEUE_NAME).toBe("test-generation")
    })

    it("creates a Redis connection that does not retry per request", () => {
        expect(createRedisClient).toHaveBeenCalledWith({ maxRetriesPerRequest: null })
        expect(queueConnection).toEqual({ host: "mock-redis" })
    })

    it("constructs a BullMQ queue with retry and retention defaults", () => {
        expect(queueCtorArgs[0]).toEqual([
            "test-generation",
            {
                connection: { host: "mock-redis" },
                defaultJobOptions: {
                    attempts: 2,
                    backoff: { type: "exponential", delay: 5000 },
                    removeOnComplete: { age: 3600 },
                    removeOnFail: { age: 86400 },
                },
            },
        ])
        expect(generationQueue.add).toBe(add)
    })
})

describe("enqueueGeneration", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("throws when an image job is missing jobId", async () => {
        await expect(
            enqueueGeneration({ kind: "image", body: { jobId: "" } as never }),
        ).rejects.toMatchObject({
            name: "BadRequestError",
            message: "jobId is required",
            statusCode: 400,
        })

        expect(setStatus).not.toHaveBeenCalled()
        expect(add).not.toHaveBeenCalled()
    })

    it("throws when a transform job is missing jobId", async () => {
        await expect(
            enqueueGeneration({
                kind: "upscale",
                props: { body: {} } as never,
            }),
        ).rejects.toMatchObject({
            name: "BadRequestError",
            message: "jobId is required",
            statusCode: 400,
        })
    })

    it("marks the job processing and enqueues an image job", async () => {
        const data = { kind: "image" as const, body: { jobId: "job_img" } as never }

        await enqueueGeneration(data)

        expect(setStatus).toHaveBeenCalledWith("job_img", {
            status: "processing",
            image: undefined,
            userCreditsRemaining: null,
        })
        expect(add).toHaveBeenCalledWith("image", data, { jobId: "job_img" })
    })

    it("reads jobId from props.body for transform jobs", async () => {
        const data = {
            kind: "colorize" as const,
            props: { body: { jobId: "job_color" } } as never,
        }

        await enqueueGeneration(data)

        expect(setStatus).toHaveBeenCalledWith("job_color", expect.any(Object))
        expect(add).toHaveBeenCalledWith("colorize", data, { jobId: "job_color" })
    })
})
