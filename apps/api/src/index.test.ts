import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const listen = vi.fn((port: number, cb?: () => void) => {
    cb?.()
    return { close: vi.fn() }
})
const use = vi.fn()
const closeWorker = vi.fn().mockResolvedValue(undefined)
const quit = vi.fn().mockResolvedValue("OK")
const startGenerationWorker = vi.fn(() => ({ close: closeWorker }))
const logger = { error: vi.fn(), info: vi.fn() }

vi.mock("./app.js", () => ({
    app: { use, listen },
}))

vi.mock("./config/env.js", () => ({
    env: { APP_PORT: 9090, APP_SERVER: "http://api.test" },
}))

vi.mock("./config/redis.js", () => ({
    redisClient: { quit },
}))

vi.mock("./lib/errors.js", async () => {
    const actual = await vi.importActual<typeof import("./lib/errors.js")>("./lib/errors.js")
    return actual
})

vi.mock("./lib/logger.js", () => ({ logger }))

vi.mock("./queue/generation-worker.js", () => ({
    startGenerationWorker,
}))

describe("API bootstrap", () => {
    const processOn = process.on.bind(process)
    const listeners: Record<string, Array<(...args: unknown[]) => unknown>> = {}

    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
        listeners.SIGTERM = []
        listeners.SIGINT = []
        vi.spyOn(process, "on").mockImplementation(((
            event: string,
            handler: (...args: unknown[]) => unknown,
        ) => {
            if (event === "SIGTERM" || event === "SIGINT") {
                listeners[event].push(handler)
                return process
            }
            return processOn(event as NodeJS.Signals, handler as () => void)
        }) as typeof process.on)
        vi.spyOn(process, "exit").mockImplementation((() => undefined) as typeof process.exit)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("starts the generation worker and listens without importing a live app server", async () => {
        await import("./index.js")

        expect(startGenerationWorker).toHaveBeenCalledTimes(1)
        expect(listen).toHaveBeenCalledWith(9090, expect.any(Function))
        expect(logger.info).toHaveBeenCalledWith("API running at http://api.test:9090")
    })

    it("registers an error handler that returns HttpError status", async () => {
        await import("./index.js")
        const { HttpError } = await import("./lib/errors.js")

        const errorMw = use.mock.calls.find((call) => call[0].length === 4)?.[0]
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }

        errorMw(new HttpError(401, "no token"), { path: "/x", method: "GET" }, res, vi.fn())

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ message: "no token", status: 401 })
    })

    it("registers an error handler that returns 500 for unknown errors", async () => {
        await import("./index.js")

        const errorMw = use.mock.calls.find((call) => call[0].length === 4)?.[0]
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }

        errorMw(new Error("boom"), { path: "/x", method: "POST" }, res, vi.fn())

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({
            message: "Internal server error",
            status: 500,
        })
    })

    it("registers a 404 catch-all", async () => {
        await import("./index.js")

        const notFound = use.mock.calls.find((call) => call[0].length === 2)?.[0]
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }

        notFound({}, res)

        expect(res.status).toHaveBeenCalledWith(404)
        expect(res.json).toHaveBeenCalledWith({ message: "404 - Not Found" })
    })

    it("closes the worker and Redis on SIGTERM", async () => {
        await import("./index.js")

        listeners.SIGTERM[0]()

        await vi.waitFor(() => {
            expect(closeWorker).toHaveBeenCalledTimes(1)
            expect(quit).toHaveBeenCalledTimes(1)
            expect(process.exit).toHaveBeenCalledWith(0)
        })
        expect(logger.info).toHaveBeenCalledWith("SIGTERM signal received")
    })

    it("closes the worker and Redis on SIGINT", async () => {
        await import("./index.js")

        listeners.SIGINT[0]()

        await vi.waitFor(() => {
            expect(closeWorker).toHaveBeenCalledTimes(1)
            expect(quit).toHaveBeenCalledTimes(1)
            expect(process.exit).toHaveBeenCalledWith(0)
        })
        expect(logger.info).toHaveBeenCalledWith("SIGINT signal received")
    })
})
