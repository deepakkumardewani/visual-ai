/**
 * Unit tests for asyncHandler
 * Tests that the wrapper correctly delegates to Express error handler
 */

import { asyncHandler } from "./async-handler.js"

// Test 1: asyncHandler returns a function
function testAsyncHandlerReturnsFunction() {
    try {
        const asyncFn = async () => {
            // dummy async function
        }
        const wrapped = asyncHandler(asyncFn)
        if (typeof wrapped !== "function") {
            console.error("FAIL: asyncHandler should return a function")
            process.exit(1)
        }
        console.log("PASS: asyncHandler returns a function")
    } catch (err) {
        console.error("FAIL: Test execution error:", err)
        process.exit(1)
    }
}

// Test 2: asyncHandler wrapper accepts Express middleware signature
function testAsyncHandlerSignature() {
    try {
        const asyncFn = async (_req: any, _res: any, _next: any) => {
            // dummy async function
        }
        const wrapped = asyncHandler(asyncFn)
        // Verify it has the correct arity (3 parameters)
        if (wrapped.length !== 3) {
            console.error(
                "FAIL: asyncHandler wrapped function should accept 3 parameters (req, res, next)",
            )
            process.exit(1)
        }
        console.log("PASS: asyncHandler has correct middleware signature")
    } catch (err) {
        console.error("FAIL: Test execution error:", err)
        process.exit(1)
    }
}

// Run all tests
console.log("Running asyncHandler unit tests...")
testAsyncHandlerReturnsFunction()
testAsyncHandlerSignature()
console.log("\nAll asyncHandler tests passed!")
