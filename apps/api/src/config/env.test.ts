import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const REQUIRED_ENV: Record<string, string> = {
    MONGO_URI: "mongodb://localhost/test",
    CLOUDINARY_CLOUD_NAME: "test-cloud",
    CLOUDINARY_API_KEY: "test-key",
    CLOUDINARY_API_SECRET: "test-secret",
    CLOUDINARY_BASE_PATH: "private/development/uploads",
    CLERK_SECRET_KEY: "clerk-secret",
    CLERK_PUBLISHABLE_KEY: "clerk-pub",
    CLERK_JWT_KEY: "clerk-jwt",
    REPLICATE_API_TOKEN: "test-token",
    RAZORPAY_KEY_ID: "razorpay-id",
    RAZORPAY_KEY_SECRET: "razorpay-secret",
    EMAIL_USER: "test@example.com",
    EMAIL_PASSWORD: "password",
    WEBHOOK_SECRET: "webhook-secret",
    DEEPSEEK_API_KEY: "deepseek-key",
    ANTHROPIC_API_KEY: "anthropic-key",
}

const MANAGED_KEYS = [
    ...Object.keys(REQUIRED_ENV),
    "NODE_ENV",
    "LOG_LEVEL",
    "APP_PORT",
    "APP_SERVER",
    "REDIS_HOST",
    "REDIS_PORT",
    "REDIS_PASSWORD",
    "GENERATION_CONCURRENCY",
    "ENHANCE_MODEL",
    "DESCRIBE_MODEL",
    "ENABLE_CRON",
    "QUEUE_PREFIX",
    "ALLOWED_ORIGINS",
]

let snapshot: NodeJS.ProcessEnv

function applyEnv(overrides: Record<string, string | undefined> = {}) {
    for (const key of MANAGED_KEYS) {
        delete process.env[key]
    }
    Object.assign(process.env, REQUIRED_ENV)
    for (const [key, value] of Object.entries(overrides)) {
        if (value === undefined) {
            delete process.env[key]
        } else {
            process.env[key] = value
        }
    }
}

async function importEnv() {
    return import("./env.js")
}

describe("env parse", () => {
    beforeEach(() => {
        snapshot = { ...process.env }
        vi.resetModules()
    })

    afterEach(() => {
        process.env = { ...snapshot }
        vi.restoreAllMocks()
    })

    it("parses a complete environment and applies defaults", async () => {
        applyEnv()
        const { env } = await importEnv()

        expect(env.NODE_ENV).toBe("development")
        expect(env.LOG_LEVEL).toBe("info")
        expect(env.APP_PORT).toBe(8080)
        expect(env.APP_SERVER).toBe("http://localhost")
        expect(env.REDIS_HOST).toBe("redis")
        expect(env.REDIS_PORT).toBe(6379)
        expect(env.REDIS_PASSWORD).toBeUndefined()
        expect(env.GENERATION_CONCURRENCY).toBe(10)
        expect(env.ENHANCE_MODEL).toBe("deepseek-chat")
        expect(env.DESCRIBE_MODEL).toBe("claude-sonnet-4-5")
        expect(env.ENABLE_CRON).toBe(false)
        expect(env.QUEUE_PREFIX).toBe("prod")
        expect(env.ALLOWED_ORIGINS).toEqual([])
        expect(env.CLOUDINARY_BASE_PATH).toBe("private/development/uploads")
    })

    it.each(["development", "production", "staging", "test"] as const)(
        "accepts NODE_ENV=%s",
        async (nodeEnv) => {
            applyEnv({ NODE_ENV: nodeEnv })
            const { env } = await importEnv()
            expect(env.NODE_ENV).toBe(nodeEnv)
        },
    )

    it("transforms numeric strings and optional redis password", async () => {
        applyEnv({
            APP_PORT: "3000",
            REDIS_PORT: "6380",
            GENERATION_CONCURRENCY: "4",
            REDIS_PASSWORD: "s3cret",
            LOG_LEVEL: "debug",
            APP_SERVER: "https://api.example.com",
            REDIS_HOST: "cache",
            ENHANCE_MODEL: "deepseek-reasoner",
            DESCRIBE_MODEL: "claude-opus",
            QUEUE_PREFIX: "staging",
        })
        const { env } = await importEnv()
        expect(env.APP_PORT).toBe(3000)
        expect(env.REDIS_PORT).toBe(6380)
        expect(env.GENERATION_CONCURRENCY).toBe(4)
        expect(env.REDIS_PASSWORD).toBe("s3cret")
        expect(env.LOG_LEVEL).toBe("debug")
        expect(env.ENHANCE_MODEL).toBe("deepseek-reasoner")
        expect(env.DESCRIBE_MODEL).toBe("claude-opus")
        expect(env.QUEUE_PREFIX).toBe("staging")
    })

    it("strips trailing slashes from CLOUDINARY_BASE_PATH", async () => {
        applyEnv({ CLOUDINARY_BASE_PATH: "private/uploads///" })
        const { env } = await importEnv()
        expect(env.CLOUDINARY_BASE_PATH).toBe("private/uploads")
    })

    it("parses ENABLE_CRON true/false case-insensitively", async () => {
        applyEnv({ ENABLE_CRON: "TRUE" })
        expect((await importEnv()).env.ENABLE_CRON).toBe(true)

        vi.resetModules()
        applyEnv({ ENABLE_CRON: "false" })
        expect((await importEnv()).env.ENABLE_CRON).toBe(false)
    })

    it("splits, trims, and drops empty ALLOWED_ORIGINS", async () => {
        applyEnv({ ALLOWED_ORIGINS: " https://visual-ai.app, ,https://www.visual-ai.app " })
        const { env } = await importEnv()
        expect(env.ALLOWED_ORIGINS).toEqual(["https://visual-ai.app", "https://www.visual-ai.app"])
    })

    it("exits with a listed error when required vars are missing or invalid", async () => {
        const exit = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
            throw new Error(`process.exit:${code}`)
        }) as typeof process.exit)
        const error = vi.spyOn(console, "error").mockImplementation(() => {})

        applyEnv({
            MONGO_URI: "not-a-valid-uri",
            EMAIL_USER: "not-an-email",
            APP_PORT: "0",
            REDIS_PORT: "-1",
            GENERATION_CONCURRENCY: "abc",
            NODE_ENV: "qa",
            REPLICATE_API_TOKEN: undefined,
            DEEPSEEK_API_KEY: undefined,
            ANTHROPIC_API_KEY: undefined,
            CLOUDINARY_CLOUD_NAME: "",
        })

        await expect(importEnv()).rejects.toThrow("process.exit:1")
        expect(exit).toHaveBeenCalledWith(1)
        expect(error).toHaveBeenCalledWith(
            "Environment validation failed. Missing or invalid variables:",
        )
        expect(error.mock.calls.some((call) => String(call[0]).includes("Missing vars:"))).toBe(
            true,
        )
    })
})
