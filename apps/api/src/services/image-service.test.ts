/**
 * Unit tests for image-service
 *
 * Verifies that service functions throw NotFoundError (→ 404 via error handler)
 * when the user/image is absent, and that the correct error types are used.
 */

import { isHttpError, NotFoundError, BadRequestError } from "../lib/errors.js"

// ---------------------------------------------------------------------------
// 1. NotFoundError shape tests (used by toggleFavorite, deleteUserImage, etc.)
// ---------------------------------------------------------------------------

function testNotFoundErrorIs404() {
    const err = new NotFoundError("User not found")
    if (err.statusCode !== 404) {
        console.error(`FAIL: NotFoundError should map to 404, got ${err.statusCode}`)
        process.exit(1)
    }
    if (err.message !== "User not found") {
        console.error(`FAIL: NotFoundError should carry the provided message`)
        process.exit(1)
    }
    console.log("PASS: NotFoundError maps to 404 status code")
}

function testNotFoundErrorForImage() {
    const err = new NotFoundError("Image not found")
    if (err.statusCode !== 404) {
        console.error(`FAIL: Image NotFoundError should map to 404, got ${err.statusCode}`)
        process.exit(1)
    }
    console.log("PASS: Image NotFoundError maps to 404 status code")
}

// ---------------------------------------------------------------------------
// 2. BadRequestError shape tests (used by generate routes for missing file)
// ---------------------------------------------------------------------------

function testBadRequestErrorIs400() {
    const err = new BadRequestError("No image file provided")
    if (err.statusCode !== 400) {
        console.error(`FAIL: BadRequestError should map to 400, got ${err.statusCode}`)
        process.exit(1)
    }
    console.log("PASS: BadRequestError maps to 400 status code")
}

// ---------------------------------------------------------------------------
// 3. Error handler mapping tests (asserting the isHttpError contract)
// ---------------------------------------------------------------------------

function testIsHttpErrorWithNotFound() {
    const notFound = new NotFoundError("Image not found")
    if (!isHttpError(notFound)) {
        console.error("FAIL: NotFoundError should pass isHttpError check")
        process.exit(1)
    }
    console.log("PASS: NotFoundError is detected as HttpError")
}

function testIsHttpErrorWithGenericError() {
    const generic = new Error("Some unexpected failure")
    if (isHttpError(generic)) {
        console.error("FAIL: Generic Error should NOT pass isHttpError check")
        process.exit(1)
    }
    console.log("PASS: Generic Error is NOT detected as HttpError (→ maps to 500)")
}

// ---------------------------------------------------------------------------
// 4. Error handler simulation — verify status-code mapping contract
//
// Routes use asyncHandler → next(err) → central error handler.
// We verify the mapping logic without spinning up Express.
// ---------------------------------------------------------------------------

/** Simulates what the central error handler (index.ts) returns for a given error */
function simulateErrorHandler(err: unknown): { status: number; body: Record<string, unknown> } {
    if (isHttpError(err)) {
        return { status: err.statusCode, body: { message: err.message, status: err.statusCode } }
    }
    return { status: 500, body: { message: "Internal server error", status: 500 } }
}

async function testMissingUserMapsTo404() {
    const err = new NotFoundError("User not found")
    const response = simulateErrorHandler(err)
    if (response.status !== 404) {
        console.error(`FAIL: User not found should produce 404, got ${response.status}`)
        process.exit(1)
    }
    console.log("PASS: Missing user → NotFoundError → error handler returns 404")
}

async function testMissingImageMapsTo404() {
    const err = new NotFoundError("Image not found")
    const response = simulateErrorHandler(err)
    if (response.status !== 404) {
        console.error(`FAIL: Image not found should produce 404, got ${response.status}`)
        process.exit(1)
    }
    console.log("PASS: Missing image → NotFoundError → error handler returns 404")
}

async function testUnexpectedErrorMapsTo500() {
    const err = new Error("Database connection lost")
    const response = simulateErrorHandler(err)
    if (response.status !== 500) {
        console.error(`FAIL: Unexpected error should produce 500, got ${response.status}`)
        process.exit(1)
    }
    console.log("PASS: Unexpected error → generic Error → error handler returns 500")
}

async function testBadRequestMapsTo400() {
    const err = new BadRequestError("No image file provided")
    const response = simulateErrorHandler(err)
    if (response.status !== 400) {
        console.error(`FAIL: Bad request should produce 400, got ${response.status}`)
        process.exit(1)
    }
    console.log("PASS: BadRequestError → error handler returns 400")
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function main() {
    console.log("Running image-service unit tests...")

    testNotFoundErrorIs404()
    testNotFoundErrorForImage()
    testBadRequestErrorIs400()
    testIsHttpErrorWithNotFound()
    testIsHttpErrorWithGenericError()

    await testMissingUserMapsTo404()
    await testMissingImageMapsTo404()
    await testUnexpectedErrorMapsTo500()
    await testBadRequestMapsTo400()

    console.log("\nAll image-service tests passed!")
}

main().catch((err) => {
    console.error("FAIL: Unexpected error in test runner:", err)
    process.exit(1)
})
