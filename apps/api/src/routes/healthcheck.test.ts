import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const healthCheckService = vi.hoisted(() => ({
    performHealthCheck: vi.fn(),
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({ error: vi.fn(), info: vi.fn(), debug: vi.fn() }),
}))

vi.mock("../services/health-check-service.js", () => ({
    healthCheckService,
}))

const { healthCheckRoute } = await import("./healthcheck.js")

function mockRes() {
    return {
        statusCode: 0,
        body: undefined as unknown,
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(data: unknown) {
            this.body = data
            return this
        },
    }
}

async function dispatch(req: object, res: object) {
    const layer = healthCheckRoute.stack.find(
        (entry: any) => entry.route?.path === "/healthcheck" && entry.route.methods.get,
    )
    if (!layer) {
        throw new Error("Missing route GET /healthcheck")
    }
    const handle = layer.route.stack[0].handle
    await handle(req, res)
}

describe("healthCheckRoute", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2026-09-14T00:00:00.000Z"))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("returns 200 when the service is healthy", async () => {
        const healthStatus = {
            status: "healthy",
            redis: "up",
            timestamp: "2026-09-14T00:00:00.000Z",
        }
        healthCheckService.performHealthCheck.mockResolvedValue(healthStatus)
        const res = mockRes()
        await dispatch({}, res)

        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual(healthStatus)
    })

    it("returns 503 when the service is unhealthy", async () => {
        const healthStatus = { status: "unhealthy", redis: "down" }
        healthCheckService.performHealthCheck.mockResolvedValue(healthStatus)
        const res = mockRes()
        await dispatch({}, res)

        expect(res.statusCode).toBe(503)
        expect(res.body).toEqual(healthStatus)
    })

    it("returns 500 when the health check throws", async () => {
        healthCheckService.performHealthCheck.mockRejectedValue(new Error("mongo timeout"))
        const res = mockRes()
        await dispatch({}, res)

        expect(res.statusCode).toBe(500)
        expect(res.body).toEqual({
            status: "unhealthy",
            error: "mongo timeout",
            timestamp: new Date("2026-09-14T00:00:00.000Z"),
        })
    })

    it("returns a generic error message for non-Error throws", async () => {
        healthCheckService.performHealthCheck.mockRejectedValue("boom")
        const res = mockRes()
        await dispatch({}, res)

        expect(res.statusCode).toBe(500)
        expect(res.body).toMatchObject({
            status: "unhealthy",
            error: "Unknown error",
        })
    })
})
