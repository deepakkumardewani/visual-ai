import { describe, expect, it } from "vitest"

import { MODEL_REGISTRY, type ModelKind } from "@visual-ai/shared"

import { buildMediaInput, validateMediaParams } from "./media-input.js"

describe("buildMediaInput", () => {
    it("maps Lyria fields to prompt, negative_prompt and seed only, never a duration", () => {
        const input = buildMediaInput("LYRIA_2", "music", {
            prompt: "calm piano",
            negativePrompt: "drums",
            seed: 7,
        })

        expect(input).toEqual({ prompt: "calm piano", negative_prompt: "drums", seed: 7 })
        expect(Object.keys(input)).not.toContain("duration")
    })

    it("omits optional fields that were not provided", () => {
        expect(buildMediaInput("LYRIA_2", "music", { prompt: "calm piano" })).toEqual({
            prompt: "calm piano",
        })
    })

    it("keeps falsy but defined values such as seed 0", () => {
        expect(buildMediaInput("LYRIA_2", "music", { prompt: "x", seed: 0 })).toEqual({
            prompt: "x",
            seed: 0,
        })
    })

    it("never forwards fields the model does not declare", () => {
        const input = buildMediaInput("LYRIA_2", "music", {
            prompt: "x",
            durationSec: 99,
            credits: 0,
        })

        expect(input).toEqual({ prompt: "x" })
    })

    it("always sends the alwaysSend keys, defaulting to an empty string", () => {
        const input = buildMediaInput("VIDEO_WATERMARK", "tool", { video: "https://v/x.mp4" })

        expect(input).toEqual({ video: "https://v/x.mp4", watermark: "" })
    })

    it("keeps a user value for an alwaysSend key instead of overwriting it", () => {
        const input = buildMediaInput("VIDEO_WATERMARK", "tool", {
            video: "https://v/x.mp4",
            watermarkText: "mine",
        })

        expect(input.watermark).toBe("mine")
    })

    it("applies fixed send values and strips neverSend keys", () => {
        const input = buildMediaInput("P_VIDEO", "video", { prompt: "a cat" })

        expect(input.disable_safety_filter).toBe(false)
        expect(input).not.toHaveProperty("no_op")
    })

    it("does not let user input override a fixed send value", () => {
        const input = buildMediaInput("P_VIDEO", "video", {
            prompt: "a cat",
            disable_safety_filter: true,
        })

        expect(input.disable_safety_filter).toBe(false)
    })

    it("maps song style and lyrics to Minimax inputs and never sends audio_format", () => {
        const input = buildMediaInput("MINIMAX_MUSIC_26", "song", {
            stylePrompt: "upbeat indie pop",
            lyrics: "[Verse]\nHello there",
            audioFormat: "wav",
        })

        expect(input).toEqual({ prompt: "upbeat indie pop", lyrics: "[Verse]\nHello there" })
    })

    it("rejects an unknown modelKey", () => {
        expect(() => buildMediaInput("NOPE", "music", {})).toThrow('modelKey: unknown model "NOPE"')
    })

    it("rejects a prototype-chain key as an unknown model", () => {
        expect(() => buildMediaInput("toString", "music", {})).toThrow("unknown model")
    })

    it("rejects a modelKey of another kind", () => {
        expect(() => buildMediaInput("MINIMAX_MUSIC_26", "music", {})).toThrow(
            'modelKey: "MINIMAX_MUSIC_26" is not a music model',
        )
    })

    it("rejects an image model, which has no media config", () => {
        const imageKey = Object.values(MODEL_REGISTRY).find((entry) => !entry.media)?.key
        expect(imageKey).toBeDefined()

        expect(() => buildMediaInput(imageKey as string, "music", {})).toThrow(
            "is not a music model",
        )
    })

    it("sends no fixed-input violations for any registry media model", () => {
        const mediaEntries = Object.values(MODEL_REGISTRY).filter((entry) => entry.media)
        expect(mediaEntries.length).toBeGreaterThan(0)

        for (const entry of mediaEntries) {
            const { fixedInputs } = entry.media!
            const input = buildMediaInput(entry.key, entry.kind as ModelKind, {})

            for (const key of fixedInputs.neverSend ?? []) expect(input).not.toHaveProperty(key)
            for (const [key, value] of Object.entries(fixedInputs.send ?? {})) {
                expect(input[key]).toBe(value)
            }
            for (const key of fixedInputs.alwaysSend ?? []) expect(input).toHaveProperty(key)
        }
    })
})

describe("validateMediaParams", () => {
    it("accepts declared fields and the jobId/modelKey envelope", () => {
        expect(() =>
            validateMediaParams("LYRIA_2", "music", {
                jobId: "j1",
                modelKey: "LYRIA_2",
                prompt: "x",
                seed: 1,
            }),
        ).not.toThrow()
    })

    it("accepts an empty parameter set", () => {
        expect(() => validateMediaParams("LYRIA_2", "music", {})).not.toThrow()
    })

    it("rejects an unsupported field with a field-level message", () => {
        expect(() => validateMediaParams("LYRIA_2", "music", { durationSec: 10 })).toThrow(
            'durationSec: not supported by model "LYRIA_2". Remove it from the request.',
        )
    })

    it("rejects an unknown modelKey with a 400", () => {
        expect(() => validateMediaParams("NOPE", "music", {})).toThrow(
            expect.objectContaining({ statusCode: 400, name: "BadRequestError" }),
        )
    })

    it("rejects a cross-kind modelKey", () => {
        expect(() => validateMediaParams("LYRIA_2", "song", {})).toThrow(
            'modelKey: "LYRIA_2" is not a song model',
        )
    })
})
