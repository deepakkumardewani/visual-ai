import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const redis = vi.hoisted(() => ({
    setStatus: vi.fn(),
    getStatus: vi.fn(),
    deleteStatus: vi.fn(),
}))

const enqueueGeneration = vi.hoisted(() => vi.fn())

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({ debug: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

vi.mock("../queue/generation-queue.js", () => ({
    enqueueGeneration,
}))

vi.mock("../middlewares/clerk.js", () => ({
    ClerkExpressRequireAuth: () => (req: any, res: any, next: any) => {
        if (!req.auth) {
            res.status(401).json({ message: "Unauthorized" })
            return
        }
        next()
    },
}))

vi.mock("../middlewares/multer.js", () => ({
    upload: { single: () => (_req: unknown, _res: unknown, next: () => void) => next() },
}))

vi.mock("../services/redis-service.js", () => ({
    RedisService: class {
        setStatus = redis.setStatus
        getStatus = redis.getStatus
        deleteStatus = redis.deleteStatus
    },
}))

const { generateRoute } = await import("./generate.js")

function mockRes() {
    return {
        statusCode: 0,
        body: undefined as unknown,
        headers: {} as Record<string, string>,
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(data: unknown) {
            this.body = data
            return this
        },
        writeHead(code: number, headers: Record<string, string>) {
            this.statusCode = code
            this.headers = headers
        },
        write: vi.fn(),
        end: vi.fn(),
        on: vi.fn(),
    }
}

async function dispatch(method: string, path: string, req: object, res: object) {
    const layer = generateRoute.stack.find(
        (entry: any) => entry.route?.path === path && entry.route.methods[method],
    )
    if (!layer) {
        throw new Error(`Missing route ${method.toUpperCase()} ${path}`)
    }
    const handles = layer.route.stack.map((item: any) => item.handle)
    let index = 0
    let rejected: unknown
    const next = async (err?: unknown) => {
        if (err) {
            rejected = err
            return
        }
        const handle = handles[index++]
        if (!handle) return
        await handle(req, res, next)
    }
    await next()
    if (rejected) throw rejected
}

describe("generateRoute", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        enqueueGeneration.mockResolvedValue(undefined)
        redis.setStatus.mockResolvedValue(undefined)
        redis.getStatus.mockResolvedValue(null)
        redis.deleteStatus.mockResolvedValue(undefined)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    describe("GET /progress", () => {
        it("writes SSE status and cleans up on close", async () => {
            const status = { status: "processing", image: undefined, userCreditsRemaining: null }
            redis.getStatus.mockResolvedValue(status)
            const listeners: Record<string, () => Promise<void>> = {}
            const res = mockRes()
            res.on = vi.fn((event: string, fn: () => Promise<void>) => {
                listeners[event] = fn
            })

            await dispatch("get", "/progress", { query: { jobId: "job-1" } }, res)

            expect(res.statusCode).toBe(200)
            expect(res.headers["Content-Type"]).toBe("text/event-stream")
            expect(redis.setStatus).toHaveBeenCalledWith("job-1", {
                status: "processing",
                image: undefined,
                userCreditsRemaining: null,
            })
            expect(res.write).toHaveBeenCalledWith(`data: ${JSON.stringify(status)}\n\n`)

            await listeners.close()
            expect(redis.deleteStatus).toHaveBeenCalledWith("job-1")
            expect(res.end).toHaveBeenCalled()
        })

        it("skips the initial write when Redis has no status yet", async () => {
            redis.getStatus.mockResolvedValue(null)
            const res = mockRes()
            await dispatch("get", "/progress", { query: { jobId: "job-empty" } }, res)
            expect(res.write).not.toHaveBeenCalled()
        })

        it("skips interval writes when the polled status is missing", async () => {
            vi.useFakeTimers()
            redis.getStatus.mockResolvedValue(null)
            const res = mockRes()
            res.on = vi.fn()
            await dispatch("get", "/progress", { query: { jobId: "job-gap" } }, res)
            await vi.advanceTimersByTimeAsync(1000)
            expect(res.write).not.toHaveBeenCalled()
        })

        it("writes again when the polled job completes", async () => {
            vi.useFakeTimers()
            const processing = {
                status: "processing",
                image: undefined,
                userCreditsRemaining: null,
            }
            const completed = {
                status: "completed",
                image: "https://cdn/done.png",
                userCreditsRemaining: 4,
            }
            redis.getStatus.mockResolvedValueOnce(processing).mockResolvedValue(completed)
            const res = mockRes()
            res.on = vi.fn()

            await dispatch("get", "/progress", { query: { jobId: "job-done" } }, res)
            expect(res.write).toHaveBeenCalledTimes(1)

            await vi.advanceTimersByTimeAsync(1000)
            expect(res.write).toHaveBeenCalledWith(`data: ${JSON.stringify(completed)}\n\n`)
            expect(res.write).toHaveBeenCalledTimes(3)
        })

        it("writes again when the polled job errors", async () => {
            vi.useFakeTimers()
            const failed = {
                status: "error",
                image: "https://cdn/fail.png",
                userCreditsRemaining: 0,
            }
            redis.getStatus.mockResolvedValue(failed)
            const res = mockRes()
            res.on = vi.fn()

            await dispatch("get", "/progress", { query: { jobId: "job-err" } }, res)
            await vi.advanceTimersByTimeAsync(1000)
            expect(res.write).toHaveBeenCalledWith(`data: ${JSON.stringify(failed)}\n\n`)
        })

        it("does not double-write while credits are still null", async () => {
            vi.useFakeTimers()
            const pending = {
                status: "completed",
                image: "https://cdn/done.png",
                userCreditsRemaining: null,
            }
            redis.getStatus.mockResolvedValue(pending)
            const res = mockRes()
            res.on = vi.fn()

            await dispatch("get", "/progress", { query: { jobId: "job-pending" } }, res)
            await vi.advanceTimersByTimeAsync(1000)
            expect(res.write).toHaveBeenCalledTimes(2)
        })
    })

    describe("POST /generate/image", () => {
        it("returns 401 when clerk auth is missing", async () => {
            const res = mockRes()
            await dispatch("post", "/generate/image", { body: {} }, res)
            expect(res.statusCode).toBe(401)
            expect(enqueueGeneration).not.toHaveBeenCalled()
        })

        it("enqueues generation and returns 202", async () => {
            const res = mockRes()
            const body = { prompt: "a red fox" }
            await dispatch("post", "/generate/image", { body, auth: { userId: "user_1" } }, res)

            expect(enqueueGeneration).toHaveBeenCalledWith({ kind: "image", body })
            expect(res.statusCode).toBe(202)
            expect(res.body).toEqual({ message: "Processing started", status: "processing" })
        })
    })

    const uploadRoutes = [
        { path: "/generate/upscale/image", kind: "upscale" },
        { path: "/generate/revive/image", kind: "revive" },
        { path: "/generate/colorize/image", kind: "colorize" },
        { path: "/generate/remove-bg/image", kind: "remove-bg" },
    ] as const

    for (const { path, kind } of uploadRoutes) {
        describe(`POST ${path}`, () => {
            it("returns 401 when clerk auth is missing", async () => {
                const res = mockRes()
                await dispatch("post", path, { body: {}, file: { path: "/tmp/a.png" } }, res)
                expect(res.statusCode).toBe(401)
            })

            it("throws BadRequestError when no image file is provided", async () => {
                const res = mockRes()
                await expect(
                    dispatch("post", path, { body: {}, auth: { userId: "user_1" } }, res),
                ).rejects.toMatchObject({
                    name: "BadRequestError",
                    statusCode: 400,
                    message: "No image file provided",
                })
            })

            it("throws BadRequestError when the uploaded file has no path", async () => {
                const res = mockRes()
                await expect(
                    dispatch(
                        "post",
                        path,
                        { body: {}, auth: { userId: "user_1" }, file: { filename: "empty.png" } },
                        res,
                    ),
                ).rejects.toMatchObject({ message: "No image file provided" })
            })

            it("enqueues the job and returns 202", async () => {
                const res = mockRes()
                const body = { scale: "2" }
                await dispatch(
                    "post",
                    path,
                    {
                        body,
                        auth: { userId: "user_1" },
                        file: { path: "/tmp/photo.png", filename: "photo.png" },
                    },
                    res,
                )

                expect(enqueueGeneration).toHaveBeenCalledWith({
                    kind,
                    props: { body, filePath: "/tmp/photo.png", fileName: "photo.png" },
                })
                expect(res.statusCode).toBe(202)
            })
        })
    }
})
