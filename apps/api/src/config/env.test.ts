import { describe, expect, it } from "vitest"
import { z } from "zod"

/**
 * Environment variable schema for testing
 * Mirrors the schema in env.ts
 */
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    LOG_LEVEL: z.string().default("info"),
    APP_PORT: z
        .string()
        .transform((v) => parseInt(v, 10))
        .pipe(z.number().positive())
        .default("8080"),
    APP_SERVER: z.string().default("http://localhost"),
    MONGO_URI: z.string().url("MONGO_URI must be a valid MongoDB URI"),
    REDIS_HOST: z.string().default("redis"),
    REDIS_PORT: z
        .string()
        .transform((v) => parseInt(v, 10))
        .pipe(z.number().positive())
        .default("6379"),
    CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
    CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
    CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
    CLOUDINARY_BASE_PATH: z
        .string()
        .min(1, "CLOUDINARY_BASE_PATH is required")
        .transform((v) => v.replace(/\/+$/, "")),
    CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
    CLERK_PUBLISHABLE_KEY: z.string().min(1, "CLERK_PUBLISHABLE_KEY is required"),
    CLERK_JWT_KEY: z.string().min(1, "CLERK_JWT_KEY is required"),
    REPLICATE_API_TOKEN: z.string().min(1, "REPLICATE_API_TOKEN is required"),
    RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required"),
    RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
    EMAIL_USER: z.string().email("EMAIL_USER must be a valid email"),
    EMAIL_PASSWORD: z.string().min(1, "EMAIL_PASSWORD is required"),
    WEBHOOK_SECRET: z.string().min(1, "WEBHOOK_SECRET is required"),
})

const VALID_ENV: Record<string, string> = {
    MONGO_URI: "mongodb://localhost/test",
    REPLICATE_API_TOKEN: "test-token",
    CLOUDINARY_CLOUD_NAME: "test-cloud",
    CLOUDINARY_API_KEY: "test-key",
    CLOUDINARY_API_SECRET: "test-secret",
    CLOUDINARY_BASE_PATH: "private/development/uploads",
    CLERK_SECRET_KEY: "clerk-secret",
    CLERK_PUBLISHABLE_KEY: "clerk-pub",
    CLERK_JWT_KEY: "clerk-jwt",
    RAZORPAY_KEY_ID: "razorpay-id",
    RAZORPAY_KEY_SECRET: "razorpay-secret",
    EMAIL_USER: "test@example.com",
    EMAIL_PASSWORD: "password",
    WEBHOOK_SECRET: "webhook-secret",
}

describe("environment validation schema", () => {
    it("rejects a missing REPLICATE_API_TOKEN", () => {
        const { REPLICATE_API_TOKEN: _omit, ...testEnv } = VALID_ENV
        const result = envSchema.safeParse(testEnv)
        expect(result.success).toBe(false)
        if (!result.success) {
            const errorPaths = result.error.issues.map((i) => i.path.join("."))
            expect(errorPaths).toContain("REPLICATE_API_TOKEN")
        }
    })

    it("rejects a missing MONGO_URI", () => {
        const { MONGO_URI: _omit, ...testEnv } = VALID_ENV
        const result = envSchema.safeParse(testEnv)
        expect(result.success).toBe(false)
        if (!result.success) {
            const errorPaths = result.error.issues.map((i) => i.path.join("."))
            expect(errorPaths).toContain("MONGO_URI")
        }
    })

    it("rejects an invalid MONGO_URI format", () => {
        const testEnv = { ...VALID_ENV, MONGO_URI: "not-a-valid-uri" }
        const result = envSchema.safeParse(testEnv)
        expect(result.success).toBe(false)
    })

    it("rejects an invalid EMAIL_USER format", () => {
        const testEnv = { ...VALID_ENV, EMAIL_USER: "not-an-email" }
        const result = envSchema.safeParse(testEnv)
        expect(result.success).toBe(false)
        if (!result.success) {
            const errorMessages = result.error.issues.map((i) => i.message)
            expect(errorMessages.some((msg) => msg.includes("email"))).toBe(true)
        }
    })

    it("accepts a valid environment", () => {
        const result = envSchema.safeParse(VALID_ENV)
        expect(result.success).toBe(true)
    })

    it("provides default values", () => {
        const result = envSchema.safeParse(VALID_ENV)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.NODE_ENV).toBe("development")
            expect(result.data.LOG_LEVEL).toBe("info")
            expect(result.data.APP_PORT).toBe(8080)
            expect(result.data.APP_SERVER).toBe("http://localhost")
            expect(result.data.REDIS_HOST).toBe("redis")
            expect(result.data.REDIS_PORT).toBe(6379)
        }
    })

    it("transforms port strings to numbers", () => {
        const testEnv = { ...VALID_ENV, APP_PORT: "3000", REDIS_PORT: "6380" }
        const result = envSchema.safeParse(testEnv)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.APP_PORT).toBe(3000)
            expect(result.data.REDIS_PORT).toBe(6380)
        }
    })
})
