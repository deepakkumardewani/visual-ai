import { describe, it, expect, vi, beforeEach } from "vitest"
import { generateText } from "ai"
import {
    checkPromptSafety,
    isContentSafetyError,
    PromptModerationError,
} from "./prompt-moderation.js"

vi.mock("ai", () => ({
    generateText: vi.fn(),
    Output: { object: vi.fn(() => ({})) },
}))

vi.mock("@ai-sdk/deepseek", () => ({
    deepseek: vi.fn(() => ({})),
}))

const mockGenerateText = vi.mocked(generateText)

describe("prompt-moderation", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("checkPromptSafety", () => {
        it("should return safe: true without calling the model for an empty prompt", async () => {
            const result = await checkPromptSafety("")
            expect(result).toEqual({ safe: true })
            expect(mockGenerateText).not.toHaveBeenCalled()
        })

        it("should return the model's classification when safe", async () => {
            mockGenerateText.mockResolvedValueOnce({
                output: { safe: true },
            } as never)

            const result = await checkPromptSafety("a cat in a garden")
            expect(result).toEqual({ safe: true })
        })

        it("should return the model's classification when unsafe with a reason", async () => {
            mockGenerateText.mockResolvedValueOnce({
                output: { safe: false, reason: "Depicts graphic violence." },
            } as never)

            const result = await checkPromptSafety("something graphic")
            expect(result).toEqual({ safe: false, reason: "Depicts graphic violence." })
        })

        it("should fail open (safe: true) when the classification call throws", async () => {
            const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
            mockGenerateText.mockRejectedValueOnce(new Error("network error"))

            const result = await checkPromptSafety("a cat")
            expect(result).toEqual({ safe: true })
            expect(errorSpy).toHaveBeenCalled()
            errorSpy.mockRestore()
        })

        it("should reject obvious unsafe terms via keyword pre-check without calling the model", async () => {
            const result = await checkPromptSafety("sex")
            expect(result).toEqual({
                safe: false,
                reason: "This prompt contains explicit or disallowed content.",
            })
            expect(mockGenerateText).not.toHaveBeenCalled()
        })

        it("should reject obvious unsafe terms embedded within a longer prompt", async () => {
            const result = await checkPromptSafety("a naked person on a beach")
            expect(result.safe).toBe(false)
            expect(mockGenerateText).not.toHaveBeenCalled()
        })

        it("should not flag prompts containing unsafe terms only as substrings of other words", async () => {
            mockGenerateText.mockResolvedValueOnce({
                output: { safe: true },
            } as never)

            const result = await checkPromptSafety("a sextant on a ship")
            expect(result).toEqual({ safe: true })
            expect(mockGenerateText).toHaveBeenCalled()
        })
    })

    describe("isContentSafetyError", () => {
        it("should match Replicate's E005 sensitive-content message", () => {
            expect(
                isContentSafetyError(
                    "Prediction failed: The input or output was flagged as sensitive. Please try again with different inputs. (E005)",
                ),
            ).toBe(true)
        })

        it("should match generic NSFW messages", () => {
            expect(isContentSafetyError("NSFW content detected")).toBe(true)
        })

        it("should not match unrelated error messages", () => {
            expect(isContentSafetyError("Connection timed out")).toBe(false)
        })
    })

    describe("PromptModerationError", () => {
        it("should expose the reason and a descriptive message", () => {
            const error = new PromptModerationError("Depicts graphic violence.")
            expect(error.reason).toBe("Depicts graphic violence.")
            expect(error.message).toBe("Prompt rejected by moderation: Depicts graphic violence.")
            expect(error.name).toBe("PromptModerationError")
        })
    })
})
