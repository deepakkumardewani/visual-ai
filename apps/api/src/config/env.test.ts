import { z } from "zod"

/**
 * Environment variable schema for testing
 * Mirrors the schema in env.ts
 */
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production"]).default("development"),
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

/**
 * Test suite: Environment validation schema
 * Validates that all required environment variables are correctly typed and validated
 */

// Test 1: Reject missing REPLICATE_API_TOKEN
function testRejectMissingReplicateToken() {
    const testEnv = {
        MONGO_URI: "mongodb://localhost/test",
        CLOUDINARY_CLOUD_NAME: "test",
        CLOUDINARY_API_KEY: "test",
        CLOUDINARY_API_SECRET: "test",
        CLERK_SECRET_KEY: "test",
        CLERK_PUBLISHABLE_KEY: "test",
        CLERK_JWT_KEY: "test",
        RAZORPAY_KEY_ID: "test",
        RAZORPAY_KEY_SECRET: "test",
        EMAIL_USER: "test@test.com",
        EMAIL_PASSWORD: "test",
        WEBHOOK_SECRET: "test",
    } as Record<string, string>

    const result = envSchema.safeParse(testEnv)
    if (result.success) {
        console.error("FAIL: Schema should reject missing REPLICATE_API_TOKEN")
        process.exit(1)
    }
    const errorPaths = result.error.issues.map((i) => i.path.join("."))
    if (!errorPaths.includes("REPLICATE_API_TOKEN")) {
        console.error("FAIL: Error should mention REPLICATE_API_TOKEN")
        process.exit(1)
    }
    console.log("PASS: Correctly rejected missing REPLICATE_API_TOKEN")
}

// Test 2: Reject missing MONGO_URI
function testRejectMissingMongoUri() {
    const testEnv = {
        REPLICATE_API_TOKEN: "test",
        CLOUDINARY_CLOUD_NAME: "test",
        CLOUDINARY_API_KEY: "test",
        CLOUDINARY_API_SECRET: "test",
        CLERK_SECRET_KEY: "test",
        CLERK_PUBLISHABLE_KEY: "test",
        CLERK_JWT_KEY: "test",
        RAZORPAY_KEY_ID: "test",
        RAZORPAY_KEY_SECRET: "test",
        EMAIL_USER: "test@test.com",
        EMAIL_PASSWORD: "test",
        WEBHOOK_SECRET: "test",
    } as Record<string, string>

    const result = envSchema.safeParse(testEnv)
    if (result.success) {
        console.error("FAIL: Schema should reject missing MONGO_URI")
        process.exit(1)
    }
    const errorPaths = result.error.issues.map((i) => i.path.join("."))
    if (!errorPaths.includes("MONGO_URI")) {
        console.error("FAIL: Error should mention MONGO_URI")
        process.exit(1)
    }
    console.log("PASS: Correctly rejected missing MONGO_URI")
}

// Test 3: Reject invalid MONGO_URI format
function testRejectInvalidMongoUriFormat() {
    const testEnv = {
        MONGO_URI: "not-a-valid-uri",
        REPLICATE_API_TOKEN: "test",
        CLOUDINARY_CLOUD_NAME: "test",
        CLOUDINARY_API_KEY: "test",
        CLOUDINARY_API_SECRET: "test",
        CLERK_SECRET_KEY: "test",
        CLERK_PUBLISHABLE_KEY: "test",
        CLERK_JWT_KEY: "test",
        RAZORPAY_KEY_ID: "test",
        RAZORPAY_KEY_SECRET: "test",
        EMAIL_USER: "test@test.com",
        EMAIL_PASSWORD: "test",
        WEBHOOK_SECRET: "test",
    } as Record<string, string>

    const result = envSchema.safeParse(testEnv)
    if (result.success) {
        console.error("FAIL: Schema should reject invalid MONGO_URI format")
        process.exit(1)
    }
    console.log("PASS: Correctly rejected invalid MONGO_URI format")
}

// Test 4: Reject invalid EMAIL_USER format
function testRejectInvalidEmailFormat() {
    const testEnv = {
        MONGO_URI: "mongodb://localhost/test",
        REPLICATE_API_TOKEN: "test",
        CLOUDINARY_CLOUD_NAME: "test",
        CLOUDINARY_API_KEY: "test",
        CLOUDINARY_API_SECRET: "test",
        CLERK_SECRET_KEY: "test",
        CLERK_PUBLISHABLE_KEY: "test",
        CLERK_JWT_KEY: "test",
        RAZORPAY_KEY_ID: "test",
        RAZORPAY_KEY_SECRET: "test",
        EMAIL_USER: "not-an-email",
        EMAIL_PASSWORD: "test",
        WEBHOOK_SECRET: "test",
    } as Record<string, string>

    const result = envSchema.safeParse(testEnv)
    if (result.success) {
        console.error("FAIL: Schema should reject invalid email format")
        process.exit(1)
    }
    const errorMessages = result.error.issues.map((i) => i.message)
    if (!errorMessages.some((msg) => msg.includes("email"))) {
        console.error("FAIL: Error should mention email validation")
        process.exit(1)
    }
    console.log("PASS: Correctly rejected invalid email format")
}

// Test 5: Accept valid environment
function testAcceptValidEnvironment() {
    const testEnv = {
        MONGO_URI: "mongodb://localhost/test",
        REPLICATE_API_TOKEN: "test-token",
        CLOUDINARY_CLOUD_NAME: "test-cloud",
        CLOUDINARY_API_KEY: "test-key",
        CLOUDINARY_API_SECRET: "test-secret",
        CLERK_SECRET_KEY: "clerk-secret",
        CLERK_PUBLISHABLE_KEY: "clerk-pub",
        CLERK_JWT_KEY: "clerk-jwt",
        RAZORPAY_KEY_ID: "razorpay-id",
        RAZORPAY_KEY_SECRET: "razorpay-secret",
        EMAIL_USER: "test@example.com",
        EMAIL_PASSWORD: "password",
        WEBHOOK_SECRET: "webhook-secret",
    } as Record<string, string>

    const result = envSchema.safeParse(testEnv)
    if (!result.success) {
        console.error("FAIL: Schema should accept valid environment variables")
        console.error(result.error.issues)
        process.exit(1)
    }
    console.log("PASS: Correctly accepted valid environment")
}

// Test 6: Provide default values
function testDefaultValues() {
    const testEnv = {
        MONGO_URI: "mongodb://localhost/test",
        REPLICATE_API_TOKEN: "test",
        CLOUDINARY_CLOUD_NAME: "test",
        CLOUDINARY_API_KEY: "test",
        CLOUDINARY_API_SECRET: "test",
        CLERK_SECRET_KEY: "test",
        CLERK_PUBLISHABLE_KEY: "test",
        CLERK_JWT_KEY: "test",
        RAZORPAY_KEY_ID: "test",
        RAZORPAY_KEY_SECRET: "test",
        EMAIL_USER: "test@test.com",
        EMAIL_PASSWORD: "test",
        WEBHOOK_SECRET: "test",
    } as Record<string, string>

    const result = envSchema.safeParse(testEnv)
    if (!result.success) {
        console.error("FAIL: Schema should provide default values")
        process.exit(1)
    }
    const data = result.data
    if (data.NODE_ENV !== "development") {
        console.error("FAIL: NODE_ENV should default to development")
        process.exit(1)
    }
    if (data.LOG_LEVEL !== "info") {
        console.error("FAIL: LOG_LEVEL should default to info")
        process.exit(1)
    }
    if (data.APP_PORT !== 8080) {
        console.error("FAIL: APP_PORT should default to 8080")
        process.exit(1)
    }
    if (data.APP_SERVER !== "http://localhost") {
        console.error("FAIL: APP_SERVER should default to http://localhost")
        process.exit(1)
    }
    if (data.REDIS_HOST !== "redis") {
        console.error("FAIL: REDIS_HOST should default to redis")
        process.exit(1)
    }
    if (data.REDIS_PORT !== 6379) {
        console.error("FAIL: REDIS_PORT should default to 6379")
        process.exit(1)
    }
    console.log("PASS: Default values are correct")
}

// Test 7: Transform port strings to numbers
function testPortTransformation() {
    const testEnv = {
        MONGO_URI: "mongodb://localhost/test",
        REPLICATE_API_TOKEN: "test",
        APP_PORT: "3000",
        REDIS_PORT: "6380",
        CLOUDINARY_CLOUD_NAME: "test",
        CLOUDINARY_API_KEY: "test",
        CLOUDINARY_API_SECRET: "test",
        CLERK_SECRET_KEY: "test",
        CLERK_PUBLISHABLE_KEY: "test",
        CLERK_JWT_KEY: "test",
        RAZORPAY_KEY_ID: "test",
        RAZORPAY_KEY_SECRET: "test",
        EMAIL_USER: "test@test.com",
        EMAIL_PASSWORD: "test",
        WEBHOOK_SECRET: "test",
    } as Record<string, string>

    const result = envSchema.safeParse(testEnv)
    if (!result.success) {
        console.error("FAIL: Schema should handle port transformation")
        process.exit(1)
    }
    const data = result.data
    if (data.APP_PORT !== 3000 || typeof data.APP_PORT !== "number") {
        console.error("FAIL: APP_PORT should be transformed to number 3000")
        process.exit(1)
    }
    if (data.REDIS_PORT !== 6380 || typeof data.REDIS_PORT !== "number") {
        console.error("FAIL: REDIS_PORT should be transformed to number 6380")
        process.exit(1)
    }
    console.log("PASS: Port transformation works correctly")
}

// Run all tests
console.log("Running environment validation tests...")
testRejectMissingReplicateToken()
testRejectMissingMongoUri()
testRejectInvalidMongoUriFormat()
testRejectInvalidEmailFormat()
testAcceptValidEnvironment()
testDefaultValues()
testPortTransformation()
console.log("\nAll environment validation tests passed!")
