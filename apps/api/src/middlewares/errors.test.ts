import { beforeEach, describe, expect, it, vi } from "vitest"

const { mockLogger } = vi.hoisted(() => ({
    mockLogger: { error: vi.fn(), info: vi.fn() },
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => mockLogger,
}))

import { errorHandler } from "./errors.js"

describe("errorHandler", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("logs the error and responds with a generic 500 payload", () => {
        const err = new Error("secret internals")
        const req = { path: "/users" } as any
        const res = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn(),
        } as any
        const next = vi.fn()

        errorHandler(err, req, res, next)

        expect(mockLogger.error).toHaveBeenCalledWith({ err, stack: err.stack }, "Request error")
        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.send).toHaveBeenCalledWith({
            errors: [{ message: "Something went wrong" }],
        })
        expect(next).not.toHaveBeenCalled()
    })
})
