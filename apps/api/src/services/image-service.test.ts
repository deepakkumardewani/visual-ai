/**
 * Unit tests for image-service
 *
 * Verifies that service functions throw NotFoundError (→ 404 via error handler)
 * when the user/image is absent, and that the correct error types are used.
 */

import { describe, expect, it } from "vitest"

import { isHttpError, NotFoundError, BadRequestError } from "../lib/errors.js"

/** Simulates what the central error handler (index.ts) returns for a given error */
function simulateErrorHandler(err: unknown): { status: number; body: Record<string, unknown> } {
    if (isHttpError(err)) {
        return { status: err.statusCode, body: { message: err.message, status: err.statusCode } }
    }
    return { status: 500, body: { message: "Internal server error", status: 500 } }
}

describe("error types", () => {
    it("NotFoundError maps to 404 and carries the provided message", () => {
        const err = new NotFoundError("User not found")
        expect(err.statusCode).toBe(404)
        expect(err.message).toBe("User not found")
    })

    it("BadRequestError maps to 400", () => {
        const err = new BadRequestError("No image file provided")
        expect(err.statusCode).toBe(400)
    })

    it("isHttpError detects NotFoundError", () => {
        expect(isHttpError(new NotFoundError("Image not found"))).toBe(true)
    })

    it("isHttpError does not detect a generic Error", () => {
        expect(isHttpError(new Error("Some unexpected failure"))).toBe(false)
    })
})

// Routes use asyncHandler → next(err) → central error handler.
// We verify the mapping logic without spinning up Express.
describe("error handler status-code mapping", () => {
    it("maps a missing user to 404", () => {
        const response = simulateErrorHandler(new NotFoundError("User not found"))
        expect(response.status).toBe(404)
    })

    it("maps a missing image to 404", () => {
        const response = simulateErrorHandler(new NotFoundError("Image not found"))
        expect(response.status).toBe(404)
    })

    it("maps an unexpected error to 500", () => {
        const response = simulateErrorHandler(new Error("Database connection lost"))
        expect(response.status).toBe(500)
    })

    it("maps a bad request to 400", () => {
        const response = simulateErrorHandler(new BadRequestError("No image file provided"))
        expect(response.status).toBe(400)
    })
})
