import { SONG_LYRICS_LIMITS } from "@visual-ai/shared"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const envState = vi.hoisted(() => ({
    E2E_USER_IDS: [] as string[],
    ENHANCE_MODEL: "test-model",
}))
const loggerState = vi.hoisted(() => ({ warn: vi.fn(), error: vi.fn() }))
const aiState = vi.hoisted(() => ({ generateText: vi.fn() }))
const safetyState = vi.hoisted(() => ({ checkPromptSafety: vi.fn() }))
const deepseekState = vi.hoisted(() => ({ deepseek: vi.fn((id: string) => ({ deepseekId: id })) }))

vi.mock("../config/env.js", () => ({ env: envState }))
vi.mock("./logger.js", () => ({
    createLogger: () => ({ ...loggerState, info: vi.fn(), debug: vi.fn() }),
}))
vi.mock("./prompt-moderation.js", () => safetyState)
vi.mock("@ai-sdk/deepseek", () => deepseekState)
vi.mock("ai", () => ({
    generateText: aiState.generateText,
    Output: { object: (config: unknown) => ({ kind: "object", config }) },
}))

const {
    generateLyrics,
    formatLyrics,
    clampToLineBoundary,
    FAKE_LYRICS,
    LyricsRejectedError,
    LYRICS_TIMEOUT_MS,
    LYRICS_TIMEOUT_MESSAGE,
    LYRICS_REJECTED_MESSAGE,
} = await import("./lyrics-generator.js")

const MAX = SONG_LYRICS_LIMITS.max
const HEADER = "[Verse]\n".length
const FAKE_MODEL = { fake: true } as never
const FULL = { mode: "full", theme: "a road trip" } as const
const GENERATED = {
    sections: [
        { section: " Verse ", lines: [" line one ", "", "line two"] },
        { section: "Empty", lines: ["  ", ""] },
        { section: "Chorus", lines: ["sing along"] },
    ],
}
const GENERATED_TEXT = "[Verse]\nline one\nline two\n\n[Chorus]\nsing along"

function modelReturns(sections: unknown) {
    aiState.generateText.mockResolvedValue({ output: sections })
}

describe("formatLyrics", () => {
    it("renders tagged blocks, trimming lines and skipping blank sections", () => {
        expect(formatLyrics(GENERATED)).toBe(GENERATED_TEXT)
    })

    it("returns an empty string when there are no sections", () => {
        expect(formatLyrics({ sections: [] })).toBe("")
    })
})

describe("clampToLineBoundary", () => {
    it("returns text unchanged at exactly the limit", () => {
        const text = "a".repeat(10)
        expect(clampToLineBoundary(text, 10)).toBe(text)
    })

    it("drops the whole last line when one character over the limit", () => {
        const text = `${"a".repeat(5)}\n${"b".repeat(4)}`
        expect(text.length).toBe(10)
        expect(clampToLineBoundary(text, 9)).toBe("aaaaa")
    })

    it("never ends mid-line and keeps lines that fit", () => {
        const result = clampToLineBoundary("one\ntwo\nthree\nfour", 12)
        expect(result).toBe("one\ntwo")
    })

    it("returns an empty string when even the first line is too long", () => {
        expect(clampToLineBoundary("x".repeat(20), 5)).toBe("")
    })
})

describe("generateLyrics", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        envState.E2E_USER_IDS = []
        safetyState.checkPromptSafety.mockResolvedValue({ safe: true })
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    describe("e2e fake branch", () => {
        it("returns the fixed fake sections without calling the model", async () => {
            envState.E2E_USER_IDS = ["user_e2e"]
            const result = await generateLyrics({ userId: "user_e2e", request: FULL })
            expect(result).toBe(formatLyrics(FAKE_LYRICS))
            expect(result).toContain("[Verse]")
            expect(result).toContain("[Chorus]")
            expect(aiState.generateText).not.toHaveBeenCalled()
            expect(safetyState.checkPromptSafety).not.toHaveBeenCalled()
            expect(loggerState.warn).toHaveBeenCalledTimes(1)
        })

        it("never treats an empty userId as an e2e user", async () => {
            envState.E2E_USER_IDS = [""]
            modelReturns(GENERATED)
            const result = await generateLyrics({
                userId: "",
                request: FULL,
                model: FAKE_MODEL,
            })
            expect(result).toBe(GENERATED_TEXT)
            expect(loggerState.warn).not.toHaveBeenCalled()
        })
    })

    describe("modes", () => {
        it("full mode sends the theme and returns formatted lyrics", async () => {
            modelReturns(GENERATED)
            const result = await generateLyrics({
                userId: "u1",
                request: FULL,
                model: FAKE_MODEL,
            })
            expect(result).toBe(GENERATED_TEXT)
            const call = aiState.generateText.mock.calls[0][0]
            expect(call.prompt).toBe("a road trip")
            expect(call.model).toBe(FAKE_MODEL)
            expect(call.system).toContain("Write complete song lyrics")
        })

        it("section mode with a theme prefixes the theme to the section", async () => {
            modelReturns(GENERATED)
            await generateLyrics({
                userId: "u1",
                request: { mode: "section", section: "[Verse]\nold line", theme: "rain" },
                model: FAKE_MODEL,
            })
            const call = aiState.generateText.mock.calls[0][0]
            expect(call.prompt).toBe("Theme: rain\n\nSection:\n[Verse]\nold line")
            expect(call.system).toContain("Rewrite only the single section")
        })

        it("section mode without a theme sends only the section", async () => {
            modelReturns(GENERATED)
            await generateLyrics({
                userId: "u1",
                request: { mode: "section", section: "[Verse]\nold line" },
                model: FAKE_MODEL,
            })
            expect(aiState.generateText.mock.calls[0][0].prompt).toBe("[Verse]\nold line")
        })

        it("condense mode sends the lyrics and skips the input safety check", async () => {
            modelReturns(GENERATED)
            await generateLyrics({
                userId: "u1",
                request: { mode: "condense", lyrics: "long lyrics" },
                model: FAKE_MODEL,
            })
            const call = aiState.generateText.mock.calls[0][0]
            expect(call.prompt).toBe("long lyrics")
            expect(call.system).toContain("Shorten the user's lyrics")
            // Only the output is checked for condense.
            expect(safetyState.checkPromptSafety).toHaveBeenCalledTimes(1)
            expect(safetyState.checkPromptSafety).toHaveBeenCalledWith(GENERATED_TEXT)
        })

        it("uses the configured DeepSeek model when none is injected", async () => {
            modelReturns(GENERATED)
            await generateLyrics({ userId: "u1", request: FULL })
            expect(deepseekState.deepseek).toHaveBeenCalledWith("test-model")
            expect(aiState.generateText.mock.calls[0][0].model).toEqual({
                deepseekId: "test-model",
            })
        })
    })

    describe("length clamp", () => {
        function sectionOfLines(count: number, lineLength: number) {
            return {
                sections: [
                    {
                        section: "Verse",
                        lines: Array.from({ length: count }, () => "x".repeat(lineLength)),
                    },
                ],
            }
        }

        it("keeps output at exactly the limit", async () => {
            const firstLength = 1000
            modelReturns({
                sections: [
                    {
                        section: "Verse",
                        lines: [
                            "x".repeat(firstLength),
                            "x".repeat(MAX - HEADER - firstLength - 1),
                        ],
                    },
                ],
            })
            const result = await generateLyrics({
                userId: "u1",
                request: FULL,
                model: FAKE_MODEL,
            })
            expect(result.length).toBe(MAX)
        })

        it("drops the last whole line when one character over the limit", async () => {
            const firstLength = 1000
            modelReturns({
                sections: [
                    {
                        section: "Verse",
                        lines: ["x".repeat(firstLength), "x".repeat(MAX - HEADER - firstLength)],
                    },
                ],
            })
            const result = await generateLyrics({
                userId: "u1",
                request: FULL,
                model: FAKE_MODEL,
            })
            expect(result.length).toBeLessThanOrEqual(MAX)
            expect(result).toBe(`[Verse]\n${"x".repeat(1000)}`)
        })

        it("clamps long output to the limit without ending mid-line", async () => {
            modelReturns(sectionOfLines(100, 100))
            const result = await generateLyrics({
                userId: "u1",
                request: FULL,
                model: FAKE_MODEL,
            })
            expect(result.length).toBeLessThanOrEqual(MAX)
            expect(
                result
                    .split("\n")
                    .slice(1)
                    .every((line) => line.length === 100),
            ).toBe(true)
        })
    })

    describe("failures", () => {
        it("throws LyricsRejectedError for unsafe input and never calls the model", async () => {
            safetyState.checkPromptSafety.mockResolvedValue({ safe: false })
            const error = await generateLyrics({
                userId: "u1",
                request: FULL,
                model: FAKE_MODEL,
            }).catch((e: unknown) => e)
            expect(error).toBeInstanceOf(LyricsRejectedError)
            expect((error as Error).message).toBe(LYRICS_REJECTED_MESSAGE)
            expect(aiState.generateText).not.toHaveBeenCalled()
        })

        it("throws LyricsRejectedError for unsafe output and does not return it", async () => {
            modelReturns(GENERATED)
            safetyState.checkPromptSafety
                .mockResolvedValueOnce({ safe: true })
                .mockResolvedValueOnce({ safe: false })
            await expect(
                generateLyrics({ userId: "u1", request: FULL, model: FAKE_MODEL }),
            ).rejects.toBeInstanceOf(LyricsRejectedError)
        })

        it("maps a model error to a 502 and logs without the lyrics text", async () => {
            aiState.generateText.mockRejectedValue(new Error("provider down"))
            await expect(
                generateLyrics({ userId: "u1", request: FULL, model: FAKE_MODEL }),
            ).rejects.toMatchObject({
                statusCode: 502,
                message: "Couldn't write lyrics. Try again.",
            })
            expect(loggerState.error).toHaveBeenCalledTimes(1)
            expect(JSON.stringify(loggerState.error.mock.calls[0])).not.toContain("a road trip")
        })

        it("logs only name, status and message for an AI SDK error carrying lyrics", async () => {
            const sdkError = Object.assign(new Error("Bad request"), {
                name: "AI_APICallError",
                statusCode: 400,
                requestBodyValues: { prompt: "a road trip" },
                text: "raw model output",
            })
            aiState.generateText.mockRejectedValue(sdkError)
            await expect(
                generateLyrics({ userId: "u1", request: FULL, model: FAKE_MODEL }),
            ).rejects.toMatchObject({ statusCode: 502 })
            const [fields] = loggerState.error.mock.calls[0]
            expect(fields).toEqual({
                mode: "full",
                errName: "AI_APICallError",
                statusCode: 400,
                message: "Bad request",
            })
            expect(JSON.stringify(fields)).not.toMatch(/a road trip|raw model output/)
        })

        it("throws 502 when the model returns only blank lines", async () => {
            modelReturns({ sections: [{ section: "Verse", lines: [" ", ""] }] })
            await expect(
                generateLyrics({ userId: "u1", request: FULL, model: FAKE_MODEL }),
            ).rejects.toMatchObject({ statusCode: 502 })
        })

        it("rethrows an HttpError from the model unchanged", async () => {
            const { HttpError } = await import("./errors.js")
            const original = new HttpError(503, "busy")
            aiState.generateText.mockRejectedValue(original)
            await expect(
                generateLyrics({ userId: "u1", request: FULL, model: FAKE_MODEL }),
            ).rejects.toBe(original)
            expect(loggerState.error).not.toHaveBeenCalled()
        })

        it("returns 504 and aborts when the model is slower than the timeout", async () => {
            vi.useFakeTimers()
            let signal: AbortSignal | undefined
            aiState.generateText.mockImplementation((args: { abortSignal: AbortSignal }) => {
                signal = args.abortSignal
                return new Promise(() => {})
            })
            const pending = generateLyrics({
                userId: "u1",
                request: FULL,
                model: FAKE_MODEL,
            }).catch((e: unknown) => e)
            await vi.advanceTimersByTimeAsync(LYRICS_TIMEOUT_MS)
            const error = await pending
            expect(error).toMatchObject({ statusCode: 504, message: LYRICS_TIMEOUT_MESSAGE })
            expect(signal?.aborted).toBe(true)
        })

        it("does not time out when the model answers in time", async () => {
            vi.useFakeTimers()
            modelReturns(GENERATED)
            const result = await generateLyrics({
                userId: "u1",
                request: FULL,
                model: FAKE_MODEL,
            })
            expect(result).toBe(GENERATED_TEXT)
            expect(vi.getTimerCount()).toBe(0)
        })
    })
})
