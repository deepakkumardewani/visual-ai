import { z } from "zod"

/**
 * Environment variable schema with zod validation
 * All required environment variables are validated at application boot.
 * Fails fast with a clear message listing missing or invalid vars.
 */
const envSchema = z
    .object({
        // Node environment
        NODE_ENV: z.enum(["development", "production", "staging", "test"]).default("development"),
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
        REDIS_PASSWORD: z.string().optional(),
        GENERATION_CONCURRENCY: z
            .string()
            .transform((v) => parseInt(v, 10))
            .pipe(z.number().positive())
            .default("10"),

        // Cloudinary
        CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
        CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
        CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
        CLOUDINARY_BASE_PATH: z
            .string()
            .min(1, "CLOUDINARY_BASE_PATH is required")
            .transform((v) => v.replace(/\/+$/, "")),

        // Clerk
        CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
        CLERK_PUBLISHABLE_KEY: z.string().min(1, "CLERK_PUBLISHABLE_KEY is required"),
        CLERK_JWT_KEY: z.string().min(1, "CLERK_JWT_KEY is required"),

        // Replicate
        REPLICATE_API_TOKEN: z.string().min(1, "REPLICATE_API_TOKEN is required"),

        // Payments provider
        PAYMENT_PROVIDER: z.enum(["dodo"]).default("dodo"),
        PAYMENT_RETURN_URL: z.string().url("PAYMENT_RETURN_URL must be a valid URL").optional(),

        // Dodo Payments (required when PAYMENT_PROVIDER=dodo)
        DODO_PAYMENTS_API_KEY: z.string().optional(),
        DODO_PAYMENTS_ENVIRONMENT: z.enum(["test_mode", "live_mode"]).default("test_mode"),
        DODO_PAYMENTS_WEBHOOK_KEY: z.string().optional(),
        DODO_PRODUCT_ID_PACK_200: z.string().optional(),
        DODO_PRODUCT_ID_PACK_450: z.string().optional(),
        DODO_PRODUCT_ID_PACK_960: z.string().optional(),
        DODO_PRODUCT_ID_PACK_2000: z.string().optional(),

        // Email
        EMAIL_USER: z.string().email("EMAIL_USER must be a valid email"),
        EMAIL_PASSWORD: z.string().min(1, "EMAIL_PASSWORD is required"),

        // V2 announcement email + unsubscribe (all optional so the API boots without them;
        // UNSUBSCRIBE_SECRET unset makes the unsubscribe route answer 400)
        UNSUBSCRIBE_SECRET: z.string().optional(),
        APP_PUBLIC_URL: z.string().optional(),
        API_PUBLIC_URL: z.string().optional(),
        RESEND_API_KEY: z.string().optional(),
        MAIL_FROM: z.string().optional(),
        EMAIL_REPLY_TO: z.string().optional(),
        MAIL_POSTAL_ADDRESS: z.string().optional(),

        // Webhooks
        WEBHOOK_SECRET: z.string().min(1, "WEBHOOK_SECRET is required"),

        // Prompt enhancement (DeepSeek)
        DEEPSEEK_API_KEY: z.string().min(1, "DEEPSEEK_API_KEY is required"),
        ENHANCE_MODEL: z.string().default("deepseek-chat"),

        // Prompt describe (Anthropic / Claude vision)
        ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
        DESCRIBE_MODEL: z.string().default("claude-sonnet-4-5"),

        // Grok speech-to-text (optional — /stt returns 503 when unset)
        XAI_API_KEY: z.string().optional(),

        // Environment isolation
        ENABLE_CRON: z
            .string()
            .transform((v) => v.toLowerCase() === "true")
            .pipe(z.boolean())
            .default("false"),
        QUEUE_PREFIX: z.string().default("prod"),

        // Comma-separated browser origins allowed to call this API (CORS).
        // Prod lists the apex + www; staging lists staging.visual-ai.app.
        ALLOWED_ORIGINS: z
            .string()
            .default("")
            .transform((v) =>
                v
                    .split(",")
                    .map((origin) => origin.trim())
                    .filter(Boolean),
            ),
    })
    .superRefine((data, ctx) => {
        if (data.PAYMENT_PROVIDER !== "dodo") {
            return
        }

        const dodoRequired: Array<keyof typeof data> = [
            "DODO_PAYMENTS_API_KEY",
            "DODO_PAYMENTS_WEBHOOK_KEY",
            "DODO_PRODUCT_ID_PACK_200",
            "DODO_PRODUCT_ID_PACK_450",
            "DODO_PRODUCT_ID_PACK_960",
            "DODO_PRODUCT_ID_PACK_2000",
            "PAYMENT_RETURN_URL",
        ]

        for (const key of dodoRequired) {
            const value = data[key]
            if (typeof value !== "string" || value.length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: [key],
                    message: `${String(key)} is required when PAYMENT_PROVIDER=dodo`,
                })
            }
        }
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
