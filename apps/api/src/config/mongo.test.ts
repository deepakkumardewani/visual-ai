import { beforeEach, describe, expect, it, vi } from "vitest"

const { connect, mockLogger } = vi.hoisted(() => ({
    connect: vi.fn(),
    mockLogger: { error: vi.fn(), info: vi.fn() },
}))

vi.mock("mongoose", () => ({
    default: {
        Promise: undefined,
        connect: (...args: unknown[]) => connect(...args),
    },
}))

vi.mock("./env.js", () => ({
    env: {
        MONGO_URI: "mongodb://localhost/test",
    },
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => mockLogger,
}))

import { connectDB } from "./mongo.js"

describe("connectDB", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("logs a success message when mongoose connects", async () => {
        connect.mockResolvedValue({})

        connectDB()

        await vi.waitFor(() => {
            expect(connect).toHaveBeenCalledWith("mongodb://localhost/test")
            expect(mockLogger.info).toHaveBeenCalledWith("Successfully connected to Mongo")
        })
    })

    it("logs the failure and exits the process when mongoose rejects", async () => {
        const error = new Error("authentication failed")
        connect.mockRejectedValue(error)
        const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never)

        connectDB()

        await vi.waitFor(() => {
            expect(mockLogger.error).toHaveBeenCalledWith(
                { err: error },
                "Database connection failed",
            )
            expect(exitSpy).toHaveBeenCalledWith(1)
        })

        exitSpy.mockRestore()
    })
})
