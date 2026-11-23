import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
    schedule: vi.fn(),
    updateMany: vi.fn(),
    find: vi.fn(),
    deleteOne: vi.fn(),
    deleteUploadedFile: vi.fn(),
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
    env: { ENABLE_CRON: true },
}))

vi.mock("node-cron", () => ({
    default: { schedule: mocks.schedule },
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => mocks.logger,
}))

vi.mock("../models/media-upload.js", () => ({
    MediaUploadModel: { find: mocks.find, deleteOne: mocks.deleteOne },
}))
vi.mock("../lib/media-upload.js", () => ({
    deleteUploadedFile: mocks.deleteUploadedFile,
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

    describe("expired upload sweep", () => {
        const NOW = new Date("2026-06-15T10:17:00.000Z")
        const queryOf = (rows: unknown[]) => {
            const limit = vi.fn().mockResolvedValue(rows)
            mocks.find.mockReturnValue({ limit })
            return limit
        }

        it("schedules the sweep hourly in UTC", async () => {
            await import("./cronJobs.js")

            expect(mocks.schedule).toHaveBeenCalledWith("17 * * * *", expect.any(Function), {
                timezone: "UTC",
            })
        })

        it("deletes the file then the row for each expired upload and counts them", async () => {
            const limit = queryOf([
                { _id: "u1", publicId: "p1", mime: "audio/mpeg" },
                { _id: "u2", publicId: "p2", mime: "image/png" },
            ])
            mocks.deleteUploadedFile.mockResolvedValue(undefined)
            mocks.deleteOne.mockResolvedValue({})
            const { sweepExpiredMediaUploads } = await import("./cronJobs.js")

            const removed = await sweepExpiredMediaUploads(NOW)

            expect(removed).toBe(2)
            expect(mocks.find).toHaveBeenCalledWith({ expiresAt: { $lte: NOW } })
            expect(limit).toHaveBeenCalledWith(200)
            expect(mocks.deleteUploadedFile).toHaveBeenCalledWith(
                expect.objectContaining({ publicId: "p1" }),
            )
            expect(mocks.deleteOne).toHaveBeenCalledWith({ _id: "u1" })
            expect(mocks.deleteOne).toHaveBeenCalledWith({ _id: "u2" })
        })

        it("defaults to the current time", async () => {
            vi.useFakeTimers()
            vi.setSystemTime(NOW)
            queryOf([])
            const { sweepExpiredMediaUploads } = await import("./cronJobs.js")

            await expect(sweepExpiredMediaUploads()).resolves.toBe(0)

            expect(mocks.find).toHaveBeenCalledWith({ expiresAt: { $lte: NOW } })
            vi.useRealTimers()
        })

        it("keeps the row when the file delete fails and carries on with the rest", async () => {
            queryOf([
                { _id: "u1", publicId: "p1", mime: "audio/mpeg" },
                { _id: "u2", publicId: "p2", mime: "audio/mpeg" },
            ])
            mocks.deleteUploadedFile
                .mockRejectedValueOnce(new Error("cloud down"))
                .mockResolvedValueOnce(undefined)
            mocks.deleteOne.mockResolvedValue({})
            const { sweepExpiredMediaUploads } = await import("./cronJobs.js")

            const removed = await sweepExpiredMediaUploads(NOW)

            expect(removed).toBe(1)
            expect(mocks.deleteOne).toHaveBeenCalledTimes(1)
            expect(mocks.deleteOne).toHaveBeenCalledWith({ _id: "u2" })
            expect(mocks.logger.error).toHaveBeenCalledWith(
                { err: expect.any(Error), uploadId: "u1" },
                "Failed to sweep expired upload",
            )
        })

        it("logs the swept count from the scheduled job", async () => {
            queryOf([{ _id: "u1", publicId: "p1", mime: "audio/mpeg" }])
            mocks.deleteUploadedFile.mockResolvedValue(undefined)
            mocks.deleteOne.mockResolvedValue({})
            await import("./cronJobs.js")
            const job = mocks.schedule.mock.calls[1]?.[1] as () => Promise<void>

            await job()

            expect(mocks.logger.info).toHaveBeenCalledWith(
                { removed: 1 },
                "Expired media uploads swept",
            )
        })

        it("logs when the scheduled sweep itself fails", async () => {
            mocks.find.mockImplementation(() => {
                throw new Error("mongo unavailable")
            })
            await import("./cronJobs.js")
            const job = mocks.schedule.mock.calls[1]?.[1] as () => Promise<void>

            await job()

            expect(mocks.logger.error).toHaveBeenCalledWith(
                { err: expect.any(Error) },
                "Error sweeping expired media uploads",
            )
        })
    })
})
