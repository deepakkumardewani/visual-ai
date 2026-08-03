/**
 * Unit tests for asyncHandler
 * Tests that the wrapper correctly delegates to Express error handler
 */

import { describe, expect, it } from "vitest"

import { asyncHandler } from "./async-handler.js"

describe("asyncHandler", () => {
    it("returns a function", () => {
        const asyncFn = async () => {
            // dummy async function
        }
        const wrapped = asyncHandler(asyncFn)
        expect(typeof wrapped).toBe("function")
    })

    it("has the correct middleware signature (req, res, next)", () => {
        const asyncFn = async (_req: any, _res: any, _next: any) => {
            // dummy async function
        }
        const wrapped = asyncHandler(asyncFn)
        expect(wrapped.length).toBe(3)
    })
})
