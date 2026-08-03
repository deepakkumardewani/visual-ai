/**
 * Unit tests for user-service
 * Tests username generation logic and error handling
 */

import { describe, expect, it } from "vitest"

import { NotFoundError } from "../lib/errors.js"
import { generateUsername } from "./user-service.js"

describe("generateUsername", () => {
    it("combines first and last name with the id suffix", () => {
        expect(generateUsername("user123abc", "John", "Doe")).toBe("john_doe_123abc")
    })

    it("falls back to first name only when last name is absent", () => {
        expect(generateUsername("user123abc", "John", undefined)).toBe("john_123abc")
    })

    it("falls back to the id when no name is provided", () => {
        expect(generateUsername("user123abc", undefined, undefined)).toBe("123abc")
    })

    it("falls back to the id when names are empty strings", () => {
        expect(generateUsername("user123abc", "", "")).toBe("123abc")
    })

    it("falls back to the id when only the last name is provided", () => {
        expect(generateUsername("user123abc", undefined, "Doe")).toBe("123abc")
    })
})

describe("NotFoundError", () => {
    it("has the correct status code and message", () => {
        const error = new NotFoundError("User not found")
        expect(error.statusCode).toBe(404)
        expect(error.message).toBe("User not found")
    })
})
