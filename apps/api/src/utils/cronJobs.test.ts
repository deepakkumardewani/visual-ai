import { describe, it, expect, vi, beforeEach } from "vitest"

// Global mock setup for cronJobs tests
vi.mock("node-cron")
vi.mock("../lib/logger.js")
vi.mock("../models/user.js")

describe("cronJobs gate behavior", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.resetModules()
    })

    it("should schedule cron job when ENABLE_CRON is true", async () => {
        // Mock env with ENABLE_CRON=true BEFORE importing cronJobs
        vi.doMock("../config/env.js", () => ({
            env: { ENABLE_CRON: true },
        }))

        // Mock logger to capture log calls
        const mockLogger = {
            info: vi.fn(),
            error: vi.fn(),
        }
        vi.doMock("../lib/logger.js", () => ({
            createLogger: () => mockLogger,
        }))

        // Mock cron.schedule
        const mockSchedule = vi.fn()
        vi.doMock("node-cron", () => ({
            default: {
                schedule: mockSchedule,
            },
        }))

        // Now import cronJobs which will use the mocks
        await import("../utils/cronJobs.js")

        // Verify schedule was called for the cron job registration
        expect(mockSchedule).toHaveBeenCalledWith("0 0 * * *", expect.any(Function))
    })

    it("should not schedule cron job when ENABLE_CRON is false", async () => {
        // Mock env with ENABLE_CRON=false BEFORE importing cronJobs
        vi.doMock("../config/env.js", () => ({
            env: { ENABLE_CRON: false },
        }))

        // Mock logger to capture log calls
        const mockLogger = {
            info: vi.fn(),
            error: vi.fn(),
        }
        vi.doMock("../lib/logger.js", () => ({
            createLogger: () => mockLogger,
        }))

        // Mock cron.schedule
        const mockSchedule = vi.fn()
        vi.doMock("node-cron", () => ({
            default: {
                schedule: mockSchedule,
            },
        }))

        // Now import cronJobs which will use the mocks
        await import("../utils/cronJobs.js")

        // Verify schedule was NOT called
        expect(mockSchedule).not.toHaveBeenCalled()
    })
})
