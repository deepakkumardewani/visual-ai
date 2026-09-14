import { beforeEach, describe, expect, it, vi } from "vitest"

const processImage = vi.fn()
const processUpscale = vi.fn()
const processRevive = vi.fn()
const processColorize = vi.fn()
const processRemoveBg = vi.fn()
const setStatus = vi.fn()
const createRedisClient = vi.fn(() => ({ host: "worker-redis" }))

type Handler = (...args: never[]) => unknown

let processor: (job: { data: unknown }) => Promise<void>
let handlers: Record<string, Handler>
const workerCtorArgs: unknown[][] = []

vi.mock("bullmq", () => ({
    Worker: class {
        constructor(name: string, fn: Handler, opts: unknown) {
            workerCtorArgs.push([name, fn, opts])
            processor = fn as (job: { data: unknown }) => Promise<void>
            handlers = {}
        }
        on(event: string, handler: Handler) {
            handlers[event] = handler
            return this
        }
    },
}))

vi.mock("../config/env.js", () => ({
    env: { GENERATION_CONCURRENCY: 4 },
}))

vi.mock("../config/redis.js", () => ({ createRedisClient }))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({ info: vi.fn(), error: vi.fn() }),
}))

vi.mock("../services/generation-service.js", () => ({
    processImage,
    processUpscale,
    processRevive,
    processColorize,
    processRemoveBg,
}))

vi.mock("../services/redis-service.js", () => ({
    RedisService: class {
        setStatus = setStatus
    },
}))

vi.mock("./generation-queue.js", () => ({
    GENERATION_QUEUE_NAME: "test-generation",
}))

const { startGenerationWorker } = await import("./generation-worker.js")

describe("startGenerationWorker", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        startGenerationWorker()
    })

    it("creates a Worker with the generation queue, concurrency, and Redis connection", () => {
        expect(createRedisClient).toHaveBeenCalledWith({ maxRetriesPerRequest: null })
        expect(workerCtorArgs.at(-1)?.[0]).toBe("test-generation")
        expect(workerCtorArgs.at(-1)?.[1]).toEqual(expect.any(Function))
        expect(workerCtorArgs.at(-1)?.[2]).toEqual({
            connection: { host: "worker-redis" },
            concurrency: 4,
        })
    })

    it("dispatches image jobs", async () => {
        const body = { jobId: "job_1" }
        await processor({ data: { kind: "image", body } })
        expect(processImage).toHaveBeenCalledWith(body)
    })

    it("dispatches upscale jobs", async () => {
        const props = { body: { jobId: "job_2" } }
        await processor({ data: { kind: "upscale", props } })
        expect(processUpscale).toHaveBeenCalledWith(props)
    })

    it("dispatches revive jobs", async () => {
        const props = { body: { jobId: "job_3" } }
        await processor({ data: { kind: "revive", props } })
        expect(processRevive).toHaveBeenCalledWith(props)
    })

    it("dispatches colorize jobs", async () => {
        const props = { body: { jobId: "job_4" } }
        await processor({ data: { kind: "colorize", props } })
        expect(processColorize).toHaveBeenCalledWith(props)
    })

    it("dispatches remove-bg jobs", async () => {
        const props = { body: { jobId: "job_5" } }
        await processor({ data: { kind: "remove-bg", props } })
        expect(processRemoveBg).toHaveBeenCalledWith(props)
    })

    it("rejects unknown job kinds", async () => {
        await expect(processor({ data: { kind: "unknown" } })).rejects.toThrow(
            /Unknown generation job kind/,
        )
    })

    it("ignores failed events without a job", async () => {
        await handlers.failed(undefined, new Error("gone"))
        expect(setStatus).not.toHaveBeenCalled()
    })

    it("does not write an error status before the final attempt", async () => {
        await handlers.failed(
            {
                opts: { attempts: 2 },
                attemptsMade: 1,
                data: { kind: "image", body: { jobId: "job_retry" } },
            },
            new Error("retry"),
        )
        expect(setStatus).not.toHaveBeenCalled()
    })

    it("writes an error status after the final image attempt", async () => {
        await handlers.failed(
            {
                opts: { attempts: 2 },
                attemptsMade: 2,
                data: { kind: "image", body: { jobId: "job_final" } },
            },
            new Error("done"),
        )

        expect(setStatus).toHaveBeenCalledWith("job_final", {
            status: "error",
            image: undefined,
            userCreditsRemaining: null,
        })
    })

    it("reads jobId from props.body for transform failures", async () => {
        await handlers.failed(
            {
                opts: {},
                attemptsMade: 1,
                data: { kind: "upscale", props: { body: { jobId: "job_up" } } },
            },
            new Error("done"),
        )

        expect(setStatus).toHaveBeenCalledWith(
            "job_up",
            expect.objectContaining({ status: "error" }),
        )
    })

    it("swallows Redis status errors on final failure", async () => {
        setStatus.mockRejectedValueOnce(new Error("redis down"))

        await expect(
            handlers.failed(
                {
                    opts: { attempts: 1 },
                    attemptsMade: 1,
                    data: { kind: "image", body: { jobId: "job_err" } },
                },
                new Error("done"),
            ),
        ).resolves.toBeUndefined()
    })

    it("registers an error listener", () => {
        expect(typeof handlers.error).toBe("function")
        expect(() => handlers.error(new Error("worker boom"))).not.toThrow()
    })
})
