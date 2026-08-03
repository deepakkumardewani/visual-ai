import { describe, it, expect, vi, beforeEach } from "vitest"
import { preparePrompt } from "./prompt-pipeline.js"

const {
    mockEnhancePrompt,
    mockShouldEnhance,
    mockGetStylePreset,
    mockGetModelDefinition,
    mockCheckPromptSafety,
} = vi.hoisted(() => {
    const mockEnhancePrompt = vi.fn(async (prompt: string) => `enhanced: ${prompt}`)
    const mockShouldEnhance = vi.fn((prompt: string) => prompt.split(/\s+/).length < 12)
    const mockCheckPromptSafety = vi.fn(
        async (): Promise<{ safe: boolean; reason?: string }> => ({ safe: true }),
    )

    const mockGetStylePreset = vi.fn((id: string) => {
        const presets: Record<string, { id: string; label: string; promptSuffix: string }> = {
            none: { id: "none", label: "None", promptSuffix: "" },
            dynamic: {
                id: "dynamic",
                label: "Dynamic",
                promptSuffix: "dynamic composition, energetic",
            },
            photography: {
                id: "photography",
                label: "Photography",
                promptSuffix: "professional photography",
            },
        }
        const preset = presets[id]
        if (!preset) {
            throw new Error(`Unknown style id: ${id}`)
        }
        return preset
    })

    const mockGetModelDefinition = vi.fn((key: string) => {
        const models: Record<
            string,
            {
                key: string
                label: string
                fields: { prompt: true; promptEnhance?: { inputKey: string } }
            }
        > = {
            FLUX_BASIC: {
                key: "FLUX_BASIC",
                label: "Flux Basic",
                fields: { prompt: true },
            },
            GROK_IMAGINE: {
                key: "GROK_IMAGINE",
                label: "Grok Imagine",
                fields: { prompt: true, promptEnhance: { inputKey: "enhance_prompt" } },
            },
        }
        const model = models[key]
        if (!model) {
            throw new Error(`Unknown model: ${key}`)
        }
        return model
    })

    return {
        mockEnhancePrompt,
        mockShouldEnhance,
        mockGetStylePreset,
        mockGetModelDefinition,
        mockCheckPromptSafety,
    }
})

vi.mock("./prompt-enhancer.js", () => ({
    enhancePrompt: mockEnhancePrompt,
    shouldEnhance: mockShouldEnhance,
}))

vi.mock("./prompt-moderation.js", () => ({
    checkPromptSafety: mockCheckPromptSafety,
    PromptModerationError: class PromptModerationError extends Error {
        constructor(public readonly reason: string) {
            super(`Prompt rejected by moderation: ${reason}`)
            this.name = "PromptModerationError"
        }
    },
}))

vi.mock("@visual-ai/shared", () => ({
    getStylePreset: mockGetStylePreset,
    getModelDefinition: mockGetModelDefinition,
}))

describe("prompt-pipeline", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockCheckPromptSafety.mockResolvedValue({ safe: true })
    })

    describe("preparePrompt", () => {
        it("should throw PromptModerationError when prompt is flagged unsafe", async () => {
            mockCheckPromptSafety.mockResolvedValueOnce({
                safe: false,
                reason: "Depicts graphic violence.",
            })

            await expect(
                preparePrompt({ prompt: "a cat", modelKey: "FLUX_BASIC" }),
            ).rejects.toThrow("Depicts graphic violence.")
            expect(mockEnhancePrompt).not.toHaveBeenCalled()
        })

        it("should proceed normally when prompt is classified safe", async () => {
            const result = await preparePrompt({
                prompt: "a cat",
                modelKey: "FLUX_BASIC",
            })
            expect(mockCheckPromptSafety).toHaveBeenCalledWith("a cat")
            expect(result).toBe("a cat")
        })

        it("should return trimmed prompt when no enhancement or style applied", async () => {
            const result = await preparePrompt({
                prompt: "  a cat  ",
                modelKey: "FLUX_BASIC",
            })
            expect(result).toBe("a cat")
        })

        it("should enhance prompt when enhanceMode is 'on'", async () => {
            const result = await preparePrompt({
                prompt: "cat",
                enhanceMode: "on",
                modelKey: "FLUX_BASIC",
            })
            expect(mockEnhancePrompt).toHaveBeenCalledWith("cat", undefined)
            expect(result).toBe("enhanced: cat")
        })

        it("should not enhance when enhanceMode is 'off'", async () => {
            const result = await preparePrompt({
                prompt: "cat",
                enhanceMode: "off",
                modelKey: "FLUX_BASIC",
            })
            expect(mockEnhancePrompt).not.toHaveBeenCalled()
            expect(result).toBe("cat")
        })

        it("should enhance in auto mode when shouldEnhance returns true", async () => {
            const result = await preparePrompt({
                prompt: "cat",
                enhanceMode: "auto",
                modelKey: "FLUX_BASIC",
            })
            expect(mockShouldEnhance).toHaveBeenCalledWith("cat")
            expect(mockEnhancePrompt).toHaveBeenCalledWith("cat", undefined)
            expect(result).toBe("enhanced: cat")
        })

        it("should not enhance in auto mode when shouldEnhance returns false", async () => {
            const longPrompt = Array(12).fill("word").join(" ")
            const result = await preparePrompt({
                prompt: longPrompt,
                enhanceMode: "auto",
                modelKey: "FLUX_BASIC",
            })
            expect(mockEnhancePrompt).not.toHaveBeenCalled()
            expect(result).toBe(longPrompt)
        })

        it("should skip enhancement if model has native promptEnhance", async () => {
            const result = await preparePrompt({
                prompt: "cat",
                enhanceMode: "on",
                modelKey: "GROK_IMAGINE",
            })
            expect(mockEnhancePrompt).not.toHaveBeenCalled()
            expect(result).toBe("cat")
        })

        it("should apply style suffix when styleId is provided", async () => {
            const result = await preparePrompt({
                prompt: "a cat",
                styleId: "dynamic",
                modelKey: "FLUX_BASIC",
            })
            expect(result).toBe("a cat. Style: dynamic composition, energetic.")
        })

        it("should not double the sentence break when the prompt already ends in punctuation", async () => {
            const result = await preparePrompt({
                prompt: "a cat on a roof.",
                styleId: "dynamic",
                modelKey: "FLUX_BASIC",
            })
            expect(result).toBe("a cat on a roof. Style: dynamic composition, energetic.")
        })

        it("should not apply style suffix for 'none' style", async () => {
            const result = await preparePrompt({
                prompt: "a cat",
                styleId: "none",
                modelKey: "FLUX_BASIC",
            })
            expect(result).toBe("a cat")
        })

        it("should pass the style preset to the enhancer and skip the suffix append", async () => {
            const result = await preparePrompt({
                prompt: "cat",
                styleId: "photography",
                enhanceMode: "on",
                modelKey: "FLUX_BASIC",
            })
            expect(mockEnhancePrompt).toHaveBeenCalledWith(
                "cat",
                expect.objectContaining({ id: "photography" }),
            )
            expect(result).toBe("enhanced: cat")
        })

        it("should fall back to original prompt on enhancement error", async () => {
            mockEnhancePrompt.mockRejectedValueOnce(new Error("API error"))

            const result = await preparePrompt({
                prompt: "cat",
                enhanceMode: "on",
                modelKey: "FLUX_BASIC",
            })
            expect(result).toBe("cat")
        })

        it("should apply style suffix when enhancement errors", async () => {
            mockEnhancePrompt.mockRejectedValueOnce(new Error("API error"))

            const result = await preparePrompt({
                prompt: "cat",
                enhanceMode: "on",
                styleId: "photography",
                modelKey: "FLUX_BASIC",
            })
            expect(result).toBe("cat. Style: professional photography.")
        })

        it("should fall back to original prompt when enhancement returns empty string", async () => {
            mockEnhancePrompt.mockResolvedValueOnce("")

            const result = await preparePrompt({
                prompt: "cat",
                enhanceMode: "on",
                modelKey: "FLUX_BASIC",
            })
            expect(result).toBe("cat")
        })

        it("should apply style when enhancement returns empty string", async () => {
            mockEnhancePrompt.mockResolvedValueOnce("")

            const result = await preparePrompt({
                prompt: "cat",
                enhanceMode: "on",
                styleId: "photography",
                modelKey: "FLUX_BASIC",
            })
            expect(result).toBe("cat. Style: professional photography.")
        })

        it("should apply style even if enhancement fails", async () => {
            mockEnhancePrompt.mockRejectedValueOnce(new Error("API error"))

            const result = await preparePrompt({
                prompt: "cat",
                enhanceMode: "on",
                styleId: "dynamic",
                modelKey: "FLUX_BASIC",
            })
            expect(result).toBe("cat. Style: dynamic composition, energetic.")
        })

        it("should handle missing styleId gracefully", async () => {
            const result = await preparePrompt({
                prompt: "cat",
                styleId: "unknown_style",
                modelKey: "FLUX_BASIC",
            })
            // Falls back to the prompt without style
            expect(result).toBe("cat")
        })

        it("should handle missing modelKey gracefully", async () => {
            mockGetModelDefinition.mockRejectedValueOnce(new Error("Unknown model"))

            const result = await preparePrompt({
                prompt: "cat",
                enhanceMode: "off",
                styleId: "dynamic",
                modelKey: "FLUX_BASIC",
            })
            // Should still apply style even if model lookup fails
            expect(result).toBe("cat. Style: dynamic composition, energetic.")
        })

        it("should trim whitespace from final result", async () => {
            mockEnhancePrompt.mockResolvedValueOnce("  enhanced: cat  ")

            const result = await preparePrompt({
                prompt: "cat",
                enhanceMode: "on",
                modelKey: "FLUX_BASIC",
            })
            expect(result).toBe("enhanced: cat")
        })
    })
})
