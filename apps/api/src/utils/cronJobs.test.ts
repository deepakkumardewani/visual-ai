import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
    schedule: vi.fn(),
    updateMany: vi.fn(),
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
    env: { ENABLE_CRON: true },
}))

vi.mock("node-cron", () => ({
    default: { schedule: mocks.schedule },
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => mocks.logger,
}))

vi.mock("../models/user.js", () => ({
    UserModel: { updateMany: mocks.updateMany },
}))

vi.mock("../config/env.js", () => ({
    env: mocks.env,
}))

describe("cronJobs", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.resetModules()
        vi.useRealTimers()
        mocks.env.ENABLE_CRON = true
    })

    it("schedules the midnight job and resets daily credits", async () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2026-06-15T00:00:00.000Z"))
        mocks.updateMany.mockResolvedValue({ modifiedCount: 3 })

        await import("./cronJobs.js")

        expect(mocks.schedule).toHaveBeenCalledWith("0 0 * * *", expect.any(Function), {
            timezone: "UTC",
        })
        expect(mocks.logger.info).toHaveBeenCalledWith("Cron jobs enabled")

        const job = mocks.schedule.mock.calls[0]?.[1] as () => Promise<void>
        await job()

        expect(mocks.updateMany).toHaveBeenCalledTimes(2)
        const now = new Date("2026-06-15T00:00:00.000Z")
        const literalProFilter = {
            plan: "pro",
            $or: [
                { "subscription.status": "active" },
                {
                    "subscription.status": { $in: ["past_due", "cancelled"] },
                    "subscription.currentPeriodEnd": { $gt: now },
                },
            ],
        }
        expect(mocks.updateMany).toHaveBeenNthCalledWith(1, literalProFilter, {
            $set: { dailyCredits: 50 },
        })
        expect(mocks.updateMany).toHaveBeenNthCalledWith(
            2,
            { $nor: [literalProFilter] },
            { $set: { dailyCredits: 30 } },
        )
        expect(mocks.logger.info).toHaveBeenCalledWith("Daily credits successfully reset")
        vi.useRealTimers()
    })

    it("logs when the scheduled reset fails", async () => {
        mocks.updateMany.mockRejectedValue(new Error("mongo unavailable"))

        await import("./cronJobs.js")
        const job = mocks.schedule.mock.calls[0]?.[1] as () => Promise<void>
        await job()

        expect(mocks.logger.error).toHaveBeenCalledWith(
            { err: expect.any(Error) },
            "Error resetting daily credits",
        )
    })

    it("does not schedule jobs when ENABLE_CRON is false", async () => {
        mocks.env.ENABLE_CRON = false

        await import("./cronJobs.js")

        expect(mocks.schedule).not.toHaveBeenCalled()
        expect(mocks.logger.info).toHaveBeenCalledWith("Cron disabled - no scheduled jobs will run")
    })
})
