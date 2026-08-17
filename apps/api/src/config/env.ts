import { z } from "zod"

/**
 * Environment variable schema with zod validation
 * All required environment variables are validated at application boot.
 * Fails fast with a clear message listing missing or invalid vars.
 */
const envSchema = z.object({
    // Node environment
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    LOG_LEVEL: z.string().default("info"),

    // Server
    APP_PORT: z
        .string()
        .transform((v) => parseInt(v, 10))
        .pipe(z.number().positive())
        .default("8080"),
    APP_SERVER: z.string().default("http://localhost"),

    // Database
    MONGO_URI: z.string().url("MONGO_URI must be a valid MongoDB URI"),

    // Redis
    REDIS_HOST: z.string().default("redis"),
    REDIS_PORT: z
        .string()
        .transform((v) => parseInt(v, 10))
        .pipe(z.number().positive())
        .default("6379"),
    GENERATION_CONCURRENCY: z
        .string()
        .transform((v) => parseInt(v, 10))
        .pipe(z.number().positive())
        .default("10"),

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
    CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
    CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),

    // Clerk
    CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
    CLERK_PUBLISHABLE_KEY: z.string().min(1, "CLERK_PUBLISHABLE_KEY is required"),
    CLERK_JWT_KEY: z.string().min(1, "CLERK_JWT_KEY is required"),

    // Replicate
    REPLICATE_API_TOKEN: z.string().min(1, "REPLICATE_API_TOKEN is required"),

    // Razorpay
    RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required"),
    RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),

    // Email
    EMAIL_USER: z.string().email("EMAIL_USER must be a valid email"),
    EMAIL_PASSWORD: z.string().min(1, "EMAIL_PASSWORD is required"),

    // Webhooks
    WEBHOOK_SECRET: z.string().min(1, "WEBHOOK_SECRET is required"),

    // Prompt enhancement (DeepSeek)
    DEEPSEEK_API_KEY: z.string().min(1, "DEEPSEEK_API_KEY is required"),
    ENHANCE_MODEL: z.string().default("deepseek-chat"),

    // Prompt describe (Anthropic / Claude vision)
    ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
    DESCRIBE_MODEL: z.string().default("claude-sonnet-4-5"),
})

/**
 * Parse and validate environment variables at boot
 */
function validateEnv() {
    const result = envSchema.safeParse(process.env)

    if (!result.success) {
        const missingVars = result.error.issues.map((issue) => issue.path.join(".")).join(", ")
        const errors = result.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("\n")

        console.error("Environment validation failed. Missing or invalid variables:")
        console.error(errors)
        console.error(`\nMissing vars: ${missingVars}`)
        process.exit(1)
    }

    return result.data
}

/**
 * Validated environment variables
 */
export const env = validateEnv()
