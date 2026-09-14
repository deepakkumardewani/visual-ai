import { beforeEach, describe, expect, it, vi } from "vitest"

const sendMail = vi.fn()
const createTransport = vi.fn(() => ({ sendMail }))

vi.mock("nodemailer", () => ({
    default: {
        createTransport,
    },
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    }),
}))

const healthyService = { status: "healthy" as const, responseTime: 12 }
const unhealthyService = {
    status: "unhealthy" as const,
    responseTime: 80,
    error: "connection refused",
}

function healthStatus(overrides: Record<string, unknown> = {}) {
    return {
        status: "unhealthy" as const,
        timestamp: new Date("2024-07-01T08:00:00.000Z"),
        services: {
            mongodb: unhealthyService,
            redis: healthyService,
            nodejs: { status: "healthy" as const },
        },
        errors: ["connection refused"],
        ...overrides,
    }
}

async function loadService(enableCron: boolean) {
    vi.resetModules()
    vi.doMock("../config/env.js", () => ({
        env: {
            ENABLE_CRON: enableCron,
            EMAIL_USER: "visual.ai.app@gmail.com",
            EMAIL_PASSWORD: "app-password",
        },
    }))
    const mod = await import("./email-notification-service.js")
    return mod
}

describe("EmailNotificationService", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        sendMail.mockReset()
        createTransport.mockClear()
    })

    it("creates a Gmail transporter from env credentials", async () => {
        await loadService(true)

        expect(createTransport).toHaveBeenCalledWith({
            service: "gmail",
            auth: {
                user: "visual.ai.app@gmail.com",
                pass: "app-password",
            },
        })
    })

    it("skips sending when outbound email is disabled", async () => {
        const { emailNotificationService } = await loadService(false)

        await emailNotificationService.sendHealthCheckFailureNotification(healthStatus())

        expect(sendMail).not.toHaveBeenCalled()
    })

    it("sends a formatted HTML notification when email is enabled", async () => {
        sendMail.mockResolvedValue({ messageId: "m1" })
        const { emailNotificationService } = await loadService(true)

        await emailNotificationService.sendHealthCheckFailureNotification(healthStatus())

        expect(sendMail).toHaveBeenCalledTimes(1)
        const options = sendMail.mock.calls[0]?.[0] as {
            from: string
            to: string
            subject: string
            html: string
        }
        expect(options.from).toBe("visual.ai.app@gmail.com")
        expect(options.to).toBe("visual.ai.app@gmail.com")
        expect(options.subject).toContain("Health Check Failed")
        expect(options.html).toContain("2024-07-01T08:00:00.000Z")
        expect(options.html).toContain("MONGODB")
        expect(options.html).toContain("connection refused")
        expect(options.html).toContain("REDIS")
        expect(options.html).toContain("(12ms)")
        expect(options.html).toContain("<h3>Errors:</h3>")
        expect(options.html).toContain("❌")
        expect(options.html).toContain("✅")
    })

    it("omits the errors section and response time when they are absent", async () => {
        sendMail.mockResolvedValue({})
        const { emailNotificationService } = await loadService(true)

        await emailNotificationService.sendHealthCheckFailureNotification(
            healthStatus({
                errors: undefined,
                services: {
                    mongodb: { status: "unhealthy" },
                    redis: { status: "healthy" },
                    nodejs: { status: "healthy" },
                },
            }),
        )

        const html = (sendMail.mock.calls[0]?.[0] as { html: string }).html
        expect(html).not.toContain("<h3>Errors:</h3>")
        expect(html).not.toContain("ms)")
    })

    it("swallows sendMail failures instead of throwing", async () => {
        sendMail.mockRejectedValue(new Error("SMTP down"))
        const { emailNotificationService } = await loadService(true)

        await expect(
            emailNotificationService.sendHealthCheckFailureNotification(healthStatus()),
        ).resolves.toBeUndefined()
    })
})
