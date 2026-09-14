import { describe, expect, it, vi } from "vitest"

const connectDB = vi.fn()
const startPeriodicHealthCheck = vi.fn()
const cloudinaryConfig = vi.fn()
const logger = { error: vi.fn(), info: vi.fn() }

const webhookRouter = Object.assign(
    vi.fn((_req: unknown, _res: unknown, next: () => void) => next()),
    {
        use: vi.fn(),
    },
)
const healthCheckRoute = Object.assign(
    vi.fn((_req: unknown, _res: unknown, next: () => void) => next()),
    {
        use: vi.fn(),
    },
)
const router = Object.assign(
    vi.fn((_req: unknown, _res: unknown, next: () => void) => next()),
    {
        use: vi.fn(),
    },
)

const corsCapture = vi.hoisted(() => ({ options: undefined as any }))
const pinoCapture = vi.hoisted(() => ({ options: undefined as any }))

vi.mock("cloudinary", () => ({
    v2: { config: cloudinaryConfig },
}))

vi.mock("cors", () => ({
    default: (options: any) => {
        corsCapture.options = options
        const corsMiddleware = (_req: unknown, _res: unknown, next: () => void) => next()
        return corsMiddleware
    },
}))

vi.mock("pino-http", () => ({
    default: (options: any) => {
        pinoCapture.options = options
        return (_req: unknown, _res: unknown, next: () => void) => next()
    },
}))

vi.mock("./config/mongo.js", () => ({ connectDB }))

vi.mock("./config/env.js", () => ({
    env: {
        ALLOWED_ORIGINS: ["https://visual-ai.app"],
        CLOUDINARY_CLOUD_NAME: "demo-cloud",
        CLOUDINARY_API_KEY: "key",
        CLOUDINARY_API_SECRET: "secret",
    },
}))

vi.mock("./lib/errors.js", async () => {
    const actual = await vi.importActual<typeof import("./lib/errors.js")>("./lib/errors.js")
    return actual
})

vi.mock("./lib/logger.js", () => ({ logger }))

vi.mock("./routes/healthcheck.js", () => ({ healthCheckRoute }))

vi.mock("./routes/index.js", () => ({ router }))

vi.mock("./services/periodic-health-check-service.js", () => ({
    periodicHealthCheckService: { startPeriodicHealthCheck },
}))

vi.mock("./utils/cronJobs.js", () => ({}))

vi.mock("./webhook/index.js", () => ({ webhookRouter }))

const { app } = await import("./app.js")
const { HttpError } = await import("./lib/errors.js")

function errorHandlers() {
    return app._router.stack.filter(
        (layer: { handle?: { length: number } }) => layer.handle?.length === 4,
    )
}

describe("app", () => {
    it("creates an Express application", () => {
        expect(app).toBeDefined()
        expect(typeof app.use).toBe("function")
        expect(typeof app.listen).toBe("function")
    })

    it("connects to Mongo and starts the periodic health check at import", () => {
        expect(connectDB).toHaveBeenCalledTimes(1)
        expect(startPeriodicHealthCheck).toHaveBeenCalledTimes(1)
    })

    it("configures Cloudinary from env", () => {
        expect(cloudinaryConfig).toHaveBeenCalledWith({
            cloud_name: "demo-cloud",
            api_key: "key",
            api_secret: "secret",
            secure: true,
        })
    })

    it("mounts webhook, health, and application routers", () => {
        const handles = app._router.stack.map((layer: { handle: unknown }) => layer.handle)
        expect(handles).toContain(webhookRouter)
        expect(handles).toContain(healthCheckRoute)
        expect(handles).toContain(router)
        expect(router.use).toHaveBeenCalled()
    })

    it("registers body-parsing and cookie middleware", () => {
        const names = app._router.stack.map((layer: { name?: string }) => layer.name)
        expect(names).toContain("jsonParser")
        expect(names).toContain("urlencodedParser")
        expect(names).toContain("cookieParser")
        expect(names).toContain("corsMiddleware")
    })

    it("maps HttpError to the error status and message", () => {
        const handler = errorHandlers().at(-1).handle
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
        const req = { method: "GET", url: "/fail" }

        handler(new HttpError(403, "nope"), req, res, vi.fn())

        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith({ error: "nope" })
        expect(logger.error).toHaveBeenCalled()
    })

    it("maps unknown errors to 500", () => {
        const handler = errorHandlers().at(-1).handle
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
        const req = { method: "POST", url: "/boom" }

        handler(new Error("kaboom"), req, res, vi.fn())

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({ error: "kaboom" })
    })

    it("uses a fallback message when the thrown value is not an Error", () => {
        const handler = errorHandlers().at(-1).handle
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
        const req = { method: "GET", url: "/weird" }

        handler("string-error", req, res, vi.fn())

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" })
    })

    it("allows missing, local, and configured CORS origins", () => {
        const origin = corsCapture.options.origin
        const allow = vi.fn()
        origin(undefined, allow)
        origin("http://localhost:3000", allow)
        origin("https://visual-ai.app", allow)
        expect(allow).toHaveBeenCalledWith(null, undefined)
        expect(allow).toHaveBeenCalledWith(null, "http://localhost:3000")
        expect(allow).toHaveBeenCalledWith(null, "https://visual-ai.app")
    })

    it("rejects unknown CORS origins", () => {
        const deny = vi.fn()
        corsCapture.options.origin("https://evil.example", deny)
        expect(deny).toHaveBeenCalledWith(expect.any(Error))
        expect(deny.mock.calls[0][0].message).toBe("Not allowed by CORS")
    })

    it("skips HTTP access logs for health, progress, and generate paths", () => {
        const ignore = pinoCapture.options.autoLogging.ignore
        expect(ignore({ url: "/health" })).toBe(true)
        expect(ignore({ url: "/progress?jobId=1" })).toBe(true)
        expect(ignore({ url: "/generate/image" })).toBe(true)
        expect(ignore({ url: "/users" })).toBe(false)
        expect(ignore({})).toBe(false)
    })

    it("formats pino success/error lines and drops req/res serializers", () => {
        const req = { method: "GET", url: "/missing" }
        const res = { statusCode: 404 }
        expect(pinoCapture.options.customSuccessMessage(req, res)).toBe("GET /missing 404")
        expect(pinoCapture.options.customErrorMessage(req, { statusCode: 500 })).toBe(
            "GET /missing 500",
        )
        expect(pinoCapture.options.serializers.req()).toBeUndefined()
        expect(pinoCapture.options.serializers.res()).toBeUndefined()
        expect(typeof pinoCapture.options.genReqId()).toBe("string")
    })
})
