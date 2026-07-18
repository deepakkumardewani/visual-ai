/**
 * Unit tests for user-service
 * Tests username generation logic and error handling
 */

import { NotFoundError } from "../lib/errors.js"
import { generateUsername } from "./user-service.js"

// Test 1: generateUsername with full name (first + last)
function testGenerateUsernameFullName() {
    try {
        const username = generateUsername("user123abc", "John", "Doe")
        if (username !== "john_doe_123abc") {
            console.error(`FAIL: Expected 'john_doe_123abc', got '${username}'`)
            process.exit(1)
        }
        console.log("PASS: generateUsername with first and last name")
    } catch (err) {
        console.error("FAIL: Test execution error:", err)
        process.exit(1)
    }
}

// Test 2: generateUsername with only first name
function testGenerateUsernameFirstNameOnly() {
    try {
        const username = generateUsername("user123abc", "John", undefined)
        if (username !== "john_123abc") {
            console.error(`FAIL: Expected 'john_123abc', got '${username}'`)
            process.exit(1)
        }
        console.log("PASS: generateUsername with first name only")
    } catch (err) {
        console.error("FAIL: Test execution error:", err)
        process.exit(1)
    }
}

// Test 3: generateUsername with no name (fallback to ID)
function testGenerateUsernameNoName() {
    try {
        const username = generateUsername("user123abc", undefined, undefined)
        if (username !== "123abc") {
            console.error(`FAIL: Expected '123abc', got '${username}'`)
            process.exit(1)
        }
        console.log("PASS: generateUsername fallback to ID")
    } catch (err) {
        console.error("FAIL: Test execution error:", err)
        process.exit(1)
    }
}

// Test 4: generateUsername with empty strings (fallback to ID)
function testGenerateUsernameEmptyStrings() {
    try {
        const username = generateUsername("user123abc", "", "")
        if (username !== "123abc") {
            console.error(`FAIL: Expected '123abc', got '${username}'`)
            process.exit(1)
        }
        console.log("PASS: generateUsername fallback on empty strings")
    } catch (err) {
        console.error("FAIL: Test execution error:", err)
        process.exit(1)
    }
}

// Test 5: generateUsername with only last name (should only use firstName logic)
function testGenerateUsernameLastNameOnly() {
    try {
        const username = generateUsername("user123abc", undefined, "Doe")
        // With undefined firstName, it should fallback to ID only
        if (username !== "123abc") {
            console.error(`FAIL: Expected '123abc', got '${username}'`)
            process.exit(1)
        }
        console.log("PASS: generateUsername with last name only falls back to ID")
    } catch (err) {
        console.error("FAIL: Test execution error:", err)
        process.exit(1)
    }
}

// Test 6: NotFoundError has correct status code
function testNotFoundErrorStatusCode() {
    try {
        const error = new NotFoundError("User not found")
        if (error.statusCode !== 404) {
            console.error(`FAIL: NotFoundError should have statusCode 404, got ${error.statusCode}`)
            process.exit(1)
        }
        if (error.message !== "User not found") {
            console.error(`FAIL: NotFoundError should have correct message`)
            process.exit(1)
        }
        console.log("PASS: NotFoundError has correct status code and message")
    } catch (err) {
        console.error("FAIL: Test execution error:", err)
        process.exit(1)
    }
}

// Run all tests
console.log("Running user-service unit tests...")
testGenerateUsernameFullName()
testGenerateUsernameFirstNameOnly()
testGenerateUsernameNoName()
testGenerateUsernameEmptyStrings()
testGenerateUsernameLastNameOnly()
testNotFoundErrorStatusCode()
console.log("\nAll user-service tests passed!")
