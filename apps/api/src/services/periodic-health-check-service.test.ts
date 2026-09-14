import { beforeEach, describe, expect, it, vi } from "vitest"

import cron from "node-cron"

import { emailNotificationService } from "./email-notification-service.js"
import { healthCheckService } from "./health-check-service.js"
import { PeriodicHealthCheckService } from "./periodic-health-check-service.js"

vi.mock("node-cron", () => ({
    default: {
        schedule: vi.fn(),
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

vi.mock("./email-notification-service.js", () => ({
    emailNotificationService: {
        sendHealthCheckFailureNotification: vi.fn(),
    },
}))

vi.mock("./health-check-service.js", () => ({
    healthCheckService: {
        performHealthCheck: vi.fn(),
    },
}))

function health(status: "healthy" | "unhealthy") {
    return {
        status,
        timestamp: new Date("2024-07-01T12:00:00.000Z"),
        services: {
            mongodb: { status },
            redis: { status },
            nodejs: { status },
        },
    }
}

async function runScheduledTick() {
    const callback = vi.mocked(cron.schedule).mock.calls.at(-1)?.[1] as () => Promise<void>
    await callback()
}

describe("PeriodicHealthCheckService", () => {
    let service: PeriodicHealthCheckService

    beforeEach(() => {
        vi.clearAllMocks()
        service = new PeriodicHealthCheckService()
    })

    it("starts with idle status", () => {
        expect(service.getStatus()).toEqual({
            isRunning: false,
            lastHealthStatus: null,
        })
    })

    it("schedules a 5-minute cron job on first start", () => {
        service.startPeriodicHealthCheck()

        expect(cron.schedule).toHaveBeenCalledWith("*/5 * * * *", expect.any(Function))
        expect(service.getStatus().isRunning).toBe(true)
    })

    it("does not schedule again when already running", () => {
        service.startPeriodicHealthCheck()
        service.startPeriodicHealthCheck()

        expect(cron.schedule).toHaveBeenCalledTimes(1)
    })

    it("does not email on the first unhealthy result", async () => {
        vi.mocked(healthCheckService.performHealthCheck).mockResolvedValue(health("unhealthy"))
        service.startPeriodicHealthCheck()

        await runScheduledTick()

        expect(emailNotificationService.sendHealthCheckFailureNotification).not.toHaveBeenCalled()
        expect(service.getStatus().lastHealthStatus).toBe("unhealthy")
    })

    it("emails only when status changes from healthy to unhealthy", async () => {
        service.startPeriodicHealthCheck()
        vi.mocked(healthCheckService.performHealthCheck)
            .mockResolvedValueOnce(health("healthy"))
            .mockResolvedValueOnce(health("unhealthy"))
            .mockResolvedValueOnce(health("unhealthy"))

        await runScheduledTick()
        expect(emailNotificationService.sendHealthCheckFailureNotification).not.toHaveBeenCalled()

        await runScheduledTick()
        expect(emailNotificationService.sendHealthCheckFailureNotification).toHaveBeenCalledTimes(1)
        expect(emailNotificationService.sendHealthCheckFailureNotification).toHaveBeenCalledWith(
            expect.objectContaining({ status: "unhealthy" }),
        )

        await runScheduledTick()
        expect(emailNotificationService.sendHealthCheckFailureNotification).toHaveBeenCalledTimes(1)
    })

    it("swallows errors from performHealthCheck", async () => {
        vi.mocked(healthCheckService.performHealthCheck).mockRejectedValue(
            new Error("check failed"),
        )
        service.startPeriodicHealthCheck()

        await expect(runScheduledTick()).resolves.toBeUndefined()
        expect(service.getStatus().lastHealthStatus).toBeNull()
    })

    it("stopPeriodicHealthCheck clears the running flag", () => {
        service.startPeriodicHealthCheck()
        service.stopPeriodicHealthCheck()

        expect(service.getStatus()).toEqual({
            isRunning: false,
            lastHealthStatus: null,
        })
    })
})
