import { STT_RATE_LIMIT } from "@visual-ai/shared"
import type { Request, Response } from "express"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const envMock = vi.hoisted(() => ({
    NODE_ENV: "test" as string,
    QUEUE_PREFIX: "test-prefix",
}))

const rateLimitOptions = vi.hoisted(() => ({ value: null as Record<string, unknown> | null }))
const ipKeyGeneratorMock = vi.hoisted(() => vi.fn((ip: string, _ipv6Subnet?: number) => `ip:${ip}`))
const redisStoreCtor = vi.hoisted(() => vi.fn())

vi.mock("../config/env.js", () => ({
    env: envMock,
}))

vi.mock("../config/redis.js", () => ({
    redisClient: { call: vi.fn().mockResolvedValue(0) },
}))

vi.mock("rate-limit-redis", () => ({
    default: class MockRedisStore {
        constructor(options: unknown) {
            redisStoreCtor(options)
        }
        increment = vi.fn()
        decrement = vi.fn()
        resetKey = vi.fn()
    },
}))

vi.mock("express-rate-limit", async (importOriginal) => {
    const actual = await importOriginal<typeof import("express-rate-limit")>()
    return {
        ...actual,
        ipKeyGenerator: ipKeyGeneratorMock,
        default: (options: Record<string, unknown>) => {
            rateLimitOptions.value = options
            return actual.default(options)
        },
    }
})

const { sttRateLimiter } = await import("./rate-limit.js")
const testModeRateLimitOptions = rateLimitOptions.value

function mockResponse() {
    const headers: Record<string, string> = {}
    let finish: (() => void) | undefined
    const response = {
        statusCode: 200,
        body: undefined as unknown,
        setHeader(name: string, value: string) {
            headers[name.toLowerCase()] = value
        },
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(payload: unknown) {
            this.body = payload
            finish?.()
            return this
        },
        getHeader(name: string) {
            return headers[name.toLowerCase()]
        },
        waitForFinish(onFinish: () => void) {
            finish = onFinish
        },
    }
    return response
}

type TestLimiterRequest = Omit<Partial<Request>, "auth"> & {
    auth?: { userId: string }
    ip?: string
}

async function invokeLimiter(req: TestLimiterRequest, res: ReturnType<typeof mockResponse>) {
    const next = vi.fn()
    await new Promise<void>((resolve, reject) => {
        res.waitForFinish(resolve)
        sttRateLimiter(req as Request, res as unknown as Response, (err?: unknown) => {
            if (err) {
                reject(err)
                return
            }
            next(err)
            resolve()
        })
    })
    return next
}

describe("sttRateLimiter configuration", () => {
    it("registers STT limits, message, and custom key generator", () => {
        expect(testModeRateLimitOptions).toMatchObject({
            windowMs: STT_RATE_LIMIT.windowMs,
            max: STT_RATE_LIMIT.max,
            message: "Too many voice requests. Try again later.",
            standardHeaders: true,
            legacyHeaders: false,
        })
        expect(testModeRateLimitOptions?.store).toBeUndefined()
    })

    it("keys authenticated users by Clerk user id", () => {
        const keyGenerator = testModeRateLimitOptions?.keyGenerator as (req: Request) => string
        expect(keyGenerator({ auth: { userId: "user_abc" }, ip: "1.2.3.4" } as Request)).toBe(
            "user_abc",
        )
    })

    it("falls back to ipKeyGenerator when auth is missing", () => {
        const keyGenerator = testModeRateLimitOptions?.keyGenerator as (req: Request) => string
        expect(keyGenerator({ ip: "198.51.100.4" } as Request)).toBe("ip:198.51.100.4")
        expect(ipKeyGeneratorMock).toHaveBeenCalledWith("198.51.100.4", 56)
    })

    it("uses a localhost fallback ip when req.ip is missing", () => {
        const keyGenerator = testModeRateLimitOptions?.keyGenerator as (req: Request) => string
        expect(keyGenerator({} as Request)).toBe("ip:127.0.0.1")
        expect(ipKeyGeneratorMock).toHaveBeenCalledWith("127.0.0.1", 56)
    })

    it("sets Retry-After and JSON body in the rate-limit handler", () => {
        const handler = testModeRateLimitOptions?.handler as (
            req: Request,
            res: Response,
            next: () => void,
            options: { windowMs: number; statusCode: number },
        ) => void
        const res = mockResponse()
        handler({} as Request, res as unknown as Response, vi.fn(), {
            windowMs: STT_RATE_LIMIT.windowMs,
            statusCode: 429,
        })
        expect(res.statusCode).toBe(429)
        expect(res.body).toEqual({ message: "Too many voice requests. Try again later." })
        expect(res.getHeader("retry-after")).toBe(String(Math.ceil(STT_RATE_LIMIT.windowMs / 1000)))
    })
})

describe("sttRateLimiter enforcement", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("keys limits per authenticated user", async () => {
        for (let i = 0; i < STT_RATE_LIMIT.max; i++) {
            const res = mockResponse()
            await invokeLimiter({ auth: { userId: "user-a" }, ip: "1.1.1.1" }, res)
        }
        const blocked = mockResponse()
        await invokeLimiter({ auth: { userId: "user-a" }, ip: "1.1.1.1" }, blocked)
        expect(blocked.statusCode).toBe(429)

        const otherUser = mockResponse()
        const next = await invokeLimiter({ auth: { userId: "user-b" }, ip: "1.1.1.1" }, otherUser)
        expect(next).toHaveBeenCalled()
    })

    it("resets the window after windowMs elapses", async () => {
        vi.useFakeTimers()
        try {
            for (let i = 0; i < STT_RATE_LIMIT.max; i++) {
                const res = mockResponse()
                await invokeLimiter({ auth: { userId: "window-user" }, ip: "9.9.9.9" }, res)
            }
            const blocked = mockResponse()
            await invokeLimiter({ auth: { userId: "window-user" }, ip: "9.9.9.9" }, blocked)
            expect(blocked.statusCode).toBe(429)

            await vi.advanceTimersByTimeAsync(STT_RATE_LIMIT.windowMs + 1)

            const afterReset = mockResponse()
            const next = await invokeLimiter(
                { auth: { userId: "window-user" }, ip: "9.9.9.9" },
                afterReset,
            )
            expect(next).toHaveBeenCalled()
        } finally {
            vi.useRealTimers()
        }
    })
})

describe("sttRateLimiter Redis store", () => {
    beforeEach(() => {
        vi.resetModules()
        redisStoreCtor.mockClear()
        rateLimitOptions.value = null
        envMock.NODE_ENV = "development"
    })

    afterEach(() => {
        envMock.NODE_ENV = "test"
    })

    it("wires RedisStore when not running in test mode", async () => {
        await import("./rate-limit.js")
        expect(redisStoreCtor).toHaveBeenCalled()
        const storeOptions = redisStoreCtor.mock.calls[0]?.[0] as {
            prefix: string
            sendCommand: (command: string, ...args: string[]) => Promise<number>
        }
        expect(storeOptions.prefix).toBe("test-prefix:stt-rl:")
        await storeOptions.sendCommand("INCR", "stt-key")
    })
})
