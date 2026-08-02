import { describe, it, expect, vi } from "vitest"
import { shouldEnhance, AUTO_ENHANCE_WORD_THRESHOLD } from "./prompt-enhancer.js"

// Mock the ai module to avoid actual API calls
vi.mock("ai", () => ({
    generateText: vi.fn(),
}))

vi.mock("@ai-sdk/deepseek", () => ({
    deepseek: vi.fn(() => ({})), // Return a mock model
}))

describe("prompt-enhancer", () => {
    describe("shouldEnhance", () => {
        it("should return false for empty prompt", () => {
            expect(shouldEnhance("")).toBe(false)
        })

        it("should return false for whitespace-only prompt", () => {
            expect(shouldEnhance("   ")).toBe(false)
            expect(shouldEnhance("\t\n")).toBe(false)
        })

        it("should return true for prompt with fewer than threshold words", () => {
            // Create a prompt with exactly threshold - 1 words
            const wordsUnderThreshold = Array(AUTO_ENHANCE_WORD_THRESHOLD - 1)
                .fill("word")
                .join(" ")
            expect(shouldEnhance(wordsUnderThreshold)).toBe(true)
        })

        it("should return false for prompt at exactly threshold words", () => {
            // Create a prompt with exactly threshold words
            const wordsAtThreshold = Array(AUTO_ENHANCE_WORD_THRESHOLD).fill("word").join(" ")
            expect(shouldEnhance(wordsAtThreshold)).toBe(false)
        })

        it("should return false for prompt with more than threshold words", () => {
            // Create a prompt with more than threshold words
            const wordsAboveThreshold = Array(AUTO_ENHANCE_WORD_THRESHOLD + 5)
                .fill("word")
                .join(" ")
            expect(shouldEnhance(wordsAboveThreshold)).toBe(false)
        })

        it("should handle single word", () => {
            expect(shouldEnhance("cat")).toBe(true)
        })

        it("should count words correctly with multiple spaces", () => {
            // "word   word   word" should count as 3 words
            expect(shouldEnhance("word   word   word")).toBe(true) // 3 words < 12
        })

        it("should count words correctly with tabs and newlines", () => {
            expect(shouldEnhance("word\tword\nword")).toBe(true) // 3 words < 12
        })
    })

    describe("AUTO_ENHANCE_WORD_THRESHOLD", () => {
        it("should be 12", () => {
            expect(AUTO_ENHANCE_WORD_THRESHOLD).toBe(12)
        })
    })
})
