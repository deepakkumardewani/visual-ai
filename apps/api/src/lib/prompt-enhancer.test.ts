import { describe, it, expect, vi, beforeEach } from "vitest"
import { generateText } from "ai"
import { shouldEnhance, AUTO_ENHANCE_WORD_THRESHOLD, enhancePrompt } from "./prompt-enhancer.js"

// Mock the ai module to avoid actual API calls
vi.mock("ai", () => ({
    generateText: vi.fn(),
}))

vi.mock("@ai-sdk/deepseek", () => ({
    deepseek: vi.fn(() => ({})), // Return a mock model
}))

const mockGenerateText = vi.mocked(generateText)

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

    describe("enhancePrompt", () => {
        beforeEach(() => {
            vi.clearAllMocks()
        })

        it("should return the trimmed enhanced text", async () => {
            mockGenerateText.mockResolvedValueOnce({
                text: "  a fluffy orange cat  ",
                finishReason: "stop",
                usage: { totalTokens: 42 },
            } as never)

            const result = await enhancePrompt("cat")
            expect(result).toBe("a fluffy orange cat")
        })

        it("should include the style directive in the system prompt when a style is passed", async () => {
            mockGenerateText.mockResolvedValueOnce({
                text: "a cinematic cat",
                finishReason: "stop",
                usage: { totalTokens: 42 },
            } as never)

            const style = {
                id: "cinematic",
                label: "Cinematic",
                promptSuffix: "cinematic film still, dramatic lighting",
                styleDescription: "a cinematic film still with dramatic lighting",
            }
            await enhancePrompt("cat", style)

            const call = mockGenerateText.mock.calls[0]?.[0] as { system: string }
            expect(call.system).toContain('"Cinematic" style')
            expect(call.system).toContain(style.styleDescription)
            // Raw descriptor tags must not be re-emitted — the model reads them as content
            expect(call.system).not.toContain(style.promptSuffix)
            expect(call.system).toContain("do not add new subjects to suit the style")
        })

        it("should forbid introducing subjects absent from the original prompt", async () => {
            mockGenerateText.mockResolvedValueOnce({
                text: "a cat",
                finishReason: "stop",
                usage: { totalTokens: 42 },
            } as never)

            await enhancePrompt("cat")

            const call = mockGenerateText.mock.calls[0]?.[0] as { system: string }
            expect(call.system).toContain("Never introduce a person, character, animal, or object")
        })

        it("should use the base system prompt when no style is passed", async () => {
            mockGenerateText.mockResolvedValueOnce({
                text: "a cat",
                finishReason: "stop",
                usage: { totalTokens: 42 },
            } as never)

            await enhancePrompt("cat")

            const call = mockGenerateText.mock.calls[0]?.[0] as { system: string }
            expect(call.system).not.toContain("Style requirement")
        })

        it("should log diagnostics and return empty string when completion is empty", async () => {
            const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
            mockGenerateText.mockResolvedValueOnce({
                text: "",
                finishReason: "length",
                usage: { totalTokens: 800 },
            } as never)

            const result = await enhancePrompt("cat")

            expect(result).toBe("")
            expect(errorSpy).toHaveBeenCalledWith(
                "[prompt-enhancer] Empty completion from DeepSeek",
                expect.objectContaining({ finishReason: "length" }),
            )
            errorSpy.mockRestore()
        })
    })
})
