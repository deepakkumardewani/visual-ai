import { beforeEach, describe, expect, it, vi } from "vitest"

const { generateText, deepseek, anthropic, mockLogger } = vi.hoisted(() => ({
    generateText: vi.fn(),
    deepseek: vi.fn(() => "deepseek-model"),
    anthropic: vi.fn(() => "anthropic-model"),
    mockLogger: { error: vi.fn(), info: vi.fn() },
}))

vi.mock("ai", () => ({
    generateText: (...args: unknown[]) => generateText(...args),
}))

vi.mock("@ai-sdk/deepseek", () => ({
    deepseek: (...args: unknown[]) => deepseek(...args),
}))

vi.mock("@ai-sdk/anthropic", () => ({
    anthropic: (...args: unknown[]) => anthropic(...args),
}))

vi.mock("../config/env.js", () => ({
    env: {
        ENHANCE_MODEL: "deepseek-chat",
        DESCRIBE_MODEL: "claude-sonnet-4-5",
    },
}))

vi.mock("./logger.js", () => ({
    createLogger: () => mockLogger,
}))

import {
    describeImageFromBuffer,
    generateRandomPrompt,
    improveUserPrompt,
} from "./prompt-actions.js"

describe("prompt-actions", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useRealTimers()
        deepseek.mockReturnValue("deepseek-model")
        anthropic.mockReturnValue("anthropic-model")
    })

    describe("improveUserPrompt", () => {
        it("returns the trimmed enhanced prompt", async () => {
            generateText.mockResolvedValue({
                text: "  a vivid sunset over the ocean  ",
                finishReason: "stop",
                usage: { tokens: 10 },
            })

            const result = await improveUserPrompt("sunset")

            expect(deepseek).toHaveBeenCalledWith("deepseek-chat")
            expect(generateText).toHaveBeenCalledWith(
                expect.objectContaining({
                    model: "deepseek-model",
                    prompt: "sunset",
                    temperature: 0.7,
                    maxOutputTokens: 800,
                }),
            )
            expect(result).toBe("a vivid sunset over the ocean")
        })

        it("throws when the completion is empty", async () => {
            generateText.mockResolvedValue({
                text: "   ",
                finishReason: "stop",
                usage: { tokens: 0 },
            })

            await expect(improveUserPrompt("sunset")).rejects.toThrow(
                "Empty completion from improve prompt",
            )
            expect(mockLogger.error).toHaveBeenCalledWith(
                { finishReason: "stop", usage: { tokens: 0 } },
                "Empty completion from DeepSeek (improve)",
            )
        })

        it("throws when the improve call times out", async () => {
            vi.useFakeTimers()
            generateText.mockImplementation(() => new Promise(() => {}))

            const pending = improveUserPrompt("sunset")
            const assertion = expect(pending).rejects.toThrow("Prompt improve timeout")
            await vi.advanceTimersByTimeAsync(8000)
            await assertion
        })
    })

    describe("generateRandomPrompt", () => {
        it("returns a trimmed random prompt", async () => {
            generateText.mockResolvedValue({
                text: "  a neon diner at midnight  ",
                finishReason: "stop",
                usage: {},
            })

            const result = await generateRandomPrompt()

            expect(generateText).toHaveBeenCalledWith(
                expect.objectContaining({
                    temperature: 1.0,
                    prompt: "Generate one fresh creative image-generation prompt.",
                }),
            )
            expect(result).toBe("a neon diner at midnight")
        })

        it("throws when the random completion is empty", async () => {
            generateText.mockResolvedValue({
                text: "",
                finishReason: "length",
                usage: {},
            })

            await expect(generateRandomPrompt()).rejects.toThrow(
                "Empty completion from random prompt",
            )
            expect(mockLogger.error).toHaveBeenCalledWith(
                { finishReason: "length", usage: {} },
                "Empty completion from DeepSeek (random)",
            )
        })

        it("throws when the random call times out", async () => {
            vi.useFakeTimers()
            generateText.mockImplementation(() => new Promise(() => {}))

            const pending = generateRandomPrompt()
            const assertion = expect(pending).rejects.toThrow("Random prompt timeout")
            await vi.advanceTimersByTimeAsync(8000)
            await assertion
        })
    })

    describe("describeImageFromBuffer", () => {
        it("sends the image buffer with the original image mime type", async () => {
            generateText.mockResolvedValue({
                text: "a red bicycle on cobblestones",
                finishReason: "stop",
                usage: {},
            })
            const buffer = Buffer.from("image-bytes")

            const result = await describeImageFromBuffer(buffer, "image/png")

            expect(anthropic).toHaveBeenCalledWith("claude-sonnet-4-5")
            expect(generateText).toHaveBeenCalledWith(
                expect.objectContaining({
                    model: "anthropic-model",
                    messages: [
                        expect.objectContaining({
                            content: expect.arrayContaining([
                                expect.objectContaining({
                                    type: "file",
                                    data: buffer,
                                    mediaType: "image/png",
                                }),
                            ]),
                        }),
                    ],
                }),
            )
            expect(result).toBe("a red bicycle on cobblestones")
        })

        it("falls back to image/jpeg when the mime type is not an image", async () => {
            generateText.mockResolvedValue({
                text: "a landscape",
                finishReason: "stop",
                usage: {},
            })

            await describeImageFromBuffer(Buffer.from("x"), "application/octet-stream")

            const call = generateText.mock.calls[0][0]
            expect(call.messages[0].content[0].mediaType).toBe("image/jpeg")
        })

        it("throws when the describe completion is empty", async () => {
            generateText.mockResolvedValue({
                text: " ",
                finishReason: "stop",
                usage: { tokens: 1 },
            })

            await expect(describeImageFromBuffer(Buffer.from("x"), "image/jpeg")).rejects.toThrow(
                "Empty completion from describe image",
            )
            expect(mockLogger.error).toHaveBeenCalledWith(
                { finishReason: "stop", usage: { tokens: 1 } },
                "Empty completion from Anthropic (describe)",
            )
        })

        it("throws when the describe call times out", async () => {
            vi.useFakeTimers()
            generateText.mockImplementation(() => new Promise(() => {}))

            const pending = describeImageFromBuffer(Buffer.from("x"), "image/jpeg")
            const assertion = expect(pending).rejects.toThrow("Image describe timeout")
            await vi.advanceTimersByTimeAsync(15000)
            await assertion
        })
    })
})
