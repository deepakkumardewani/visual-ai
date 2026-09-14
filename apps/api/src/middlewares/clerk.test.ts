import { beforeEach, describe, expect, it, vi } from "vitest"

const { verifyToken, createClerkClient, createClerkExpressRequireAuth, mockLogger } = vi.hoisted(
    () => {
        const verifyToken = vi.fn()
        return {
            verifyToken,
            createClerkClient: vi.fn(() => ({ verifyToken })),
            createClerkExpressRequireAuth: vi.fn(() => "require-auth-middleware"),
            mockLogger: { error: vi.fn(), info: vi.fn() },
        }
    },
)

vi.mock("@clerk/clerk-sdk-node", () => ({
    createClerkClient: (...args: unknown[]) => createClerkClient(...args),
    createClerkExpressRequireAuth: (...args: unknown[]) => createClerkExpressRequireAuth(...args),
}))

vi.mock("../config/env.js", () => ({
    env: {
        CLERK_SECRET_KEY: "clerk-secret",
        CLERK_PUBLISHABLE_KEY: "clerk-pub",
        CLERK_JWT_KEY: "clerk-jwt",
    },
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => mockLogger,
}))

import { ClerkExpressRequireAuth, authenticateProgress, clerkClient } from "./clerk.js"

describe("clerk middleware", () => {
    beforeEach(() => {
        verifyToken.mockReset()
        mockLogger.error.mockClear()
    })

    it("exports a clerk client and require-auth middleware", () => {
        expect(clerkClient).toEqual({ verifyToken })
        expect(ClerkExpressRequireAuth).toBe("require-auth-middleware")
    })

    it("calls next when the progress token verifies", async () => {
        verifyToken.mockResolvedValue({ sub: "user-1" })
        const req = { query: { token: "valid-token" } } as any
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any
        const next = vi.fn()

        await authenticateProgress(req, res, next)

        expect(verifyToken).toHaveBeenCalledWith("valid-token", {
            jwtKey: "clerk-jwt",
            authorizedParties: ["http://localhost:3000", "https://visual-ai.app"],
        })
        expect(next).toHaveBeenCalledTimes(1)
        expect(res.status).not.toHaveBeenCalled()
    })

    it("returns 401 when token verification fails", async () => {
        const error = new Error("invalid token")
        verifyToken.mockRejectedValue(error)
        const req = { query: { token: "bad-token" } } as any
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any
        const next = vi.fn()

        await authenticateProgress(req, res, next)

        expect(mockLogger.error).toHaveBeenCalledWith({ err: error }, "Token verification failed")
        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" })
        expect(next).not.toHaveBeenCalled()
    })
})
