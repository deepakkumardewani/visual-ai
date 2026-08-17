import { describe, it, expect } from "vitest"
import { buildModelInput, validateModelParams } from "./model-input.js"
import type { UserGenerationParams } from "./model-input.js"

describe("buildModelInput — per-model payload assertions", () => {
    describe("upscaler models", () => {
        it("Real-ESRGAN with scale 4 produces { image, scale: 4 } — numeric", () => {
            const params: UserGenerationParams = {
                imageUrl: "https://example.com/image.jpg",
                scale: 4,
            }
            const payload = buildModelInput("UPSCALE_REAL_ESRGAN", params)
            expect(payload.image).toBe("https://example.com/image.jpg")
            expect(payload.scale).toBe(4)
            expect(typeof payload.scale).toBe("number")
        })

        it('Pruna with scale 4 produces { image, factor: 4, upscale_mode: "factor" }', () => {
            const params: UserGenerationParams = {
                imageUrl: "https://example.com/image.jpg",
                scale: 4,
            }
            const payload = buildModelInput("UPSCALE_PRUNA", params)
            expect(payload.image).toBe("https://example.com/image.jpg")
            expect(payload.factor).toBe(4)
            expect(typeof payload.factor).toBe("number")
            expect(payload.upscale_mode).toBe("factor")
        })

        it('Google Upscaler with scale 4 produces { image, upscale_factor: "x4" } — string', () => {
            const params: UserGenerationParams = {
                imageUrl: "https://example.com/image.jpg",
                scale: 4,
            }
            const payload = buildModelInput("UPSCALE_GOOGLE", params)
            expect(payload.image).toBe("https://example.com/image.jpg")
            expect(payload.upscale_factor).toBe("x4")
            expect(typeof payload.upscale_factor).toBe("string")
        })

        it("Clarity Pro with scale 4 produces { image, scale_factor: 4 } — numeric", () => {
            const params: UserGenerationParams = {
                imageUrl: "https://example.com/image.jpg",
                scale: 4,
            }
            const payload = buildModelInput("UPSCALE_CLARITY_PRO", params)
            expect(payload.image).toBe("https://example.com/image.jpg")
            expect(payload.scale_factor).toBe(4)
            expect(typeof payload.scale_factor).toBe("number")
        })

        it('Topaz with scale 4 produces { image, upscale_factor: "4x" } — string', () => {
            const params: UserGenerationParams = {
                imageUrl: "https://example.com/image.jpg",
                scale: 4,
            }
            const payload = buildModelInput("UPSCALE_TOPAZ", params)
            expect(payload.image).toBe("https://example.com/image.jpg")
            expect(payload.upscale_factor).toBe("4x")
            expect(typeof payload.upscale_factor).toBe("string")
        })

        it("Recraft with no scale produces { image } — no scale key", () => {
            const params: UserGenerationParams = {
                imageUrl: "https://example.com/image.jpg",
            }
            const payload = buildModelInput("UPSCALE_RECRAFT", params)
            expect(payload.image).toBe("https://example.com/image.jpg")
            expect(payload.scale).toBeUndefined()
            expect(payload.upscale_factor).toBeUndefined()
            expect(payload.scale_factor).toBeUndefined()
            expect(Object.keys(payload)).toEqual(["image"])
        })
    })

    describe("existing generation models (backward compatibility)", () => {
        it("FLUX_BASIC payload unchanged from before this phase", () => {
            const params: UserGenerationParams = {
                prompt: "a cat",
                aspectRatio: "16:9",
                outputFormat: "png",
            }
            const payload = buildModelInput("FLUX_BASIC", params)
            // Payload includes all declared fields with defaults
            expect(payload.prompt).toBe("a cat")
            expect(payload.aspect_ratio).toBe("16:9")
            expect(payload.output_format).toBe("png")
            // Should NOT include any scale-related keys
            expect(payload.scale).toBeUndefined()
            expect(payload.factor).toBeUndefined()
            expect(payload.upscale_factor).toBeUndefined()
            expect(payload.scale_factor).toBeUndefined()
        })

        it("UPSCALE_IMAGE (legacy upscaler) produces { prompt, image }", () => {
            const params: UserGenerationParams = {
                prompt: "enhance quality",
                imageUrl: "https://example.com/image.jpg",
            }
            const payload = buildModelInput("UPSCALE_IMAGE", params)
            expect(payload.prompt).toBe("enhance quality")
            expect(payload.image).toBe("https://example.com/image.jpg")
        })
    })
})

describe("validateModelParams — scale validation", () => {
    describe("invalid: scale sent to model without scale field", () => {
        it("Recraft + scale sent throws error", () => {
            const params: UserGenerationParams = {
                scale: 4,
            }
            expect(() => validateModelParams("UPSCALE_RECRAFT", params)).toThrow(
                /does not support scale/,
            )
        })

        it("FLUX_BASIC + scale sent throws error", () => {
            const params: UserGenerationParams = {
                scale: 4,
            }
            expect(() => validateModelParams("FLUX_BASIC", params)).toThrow(
                /does not support scale/,
            )
        })
    })

    describe("invalid: unsupported scale value", () => {
        it("Google Upscaler with scale 8 (unsupported) throws error", () => {
            const params: UserGenerationParams = {
                scale: 8,
            }
            expect(() => validateModelParams("UPSCALE_GOOGLE", params)).toThrow(
                /does not support scale value 8/,
            )
        })

        it("Real-ESRGAN with scale 3 (unsupported) throws error", () => {
            const params: UserGenerationParams = {
                scale: 3,
            }
            expect(() => validateModelParams("UPSCALE_REAL_ESRGAN", params)).toThrow(
                /does not support scale value 3/,
            )
        })
    })

    describe("valid: supported scale values", () => {
        it("Real-ESRGAN accepts scale 2", () => {
            const params: UserGenerationParams = {
                scale: 2,
            }
            expect(() => validateModelParams("UPSCALE_REAL_ESRGAN", params)).not.toThrow()
        })

        it("Real-ESRGAN accepts scale 4", () => {
            const params: UserGenerationParams = {
                scale: 4,
            }
            expect(() => validateModelParams("UPSCALE_REAL_ESRGAN", params)).not.toThrow()
        })

        it("Pruna accepts scale 2, 4, 8", () => {
            for (const scale of [2, 4, 8]) {
                const params: UserGenerationParams = { scale }
                expect(() => validateModelParams("UPSCALE_PRUNA", params)).not.toThrow()
            }
        })

        it("Clarity Pro accepts scale 2, 4, 8, 16", () => {
            for (const scale of [2, 4, 8, 16]) {
                const params: UserGenerationParams = { scale }
                expect(() => validateModelParams("UPSCALE_CLARITY_PRO", params)).not.toThrow()
            }
        })

        it("Google Upscaler accepts scale 2, 4", () => {
            for (const scale of [2, 4]) {
                const params: UserGenerationParams = { scale }
                expect(() => validateModelParams("UPSCALE_GOOGLE", params)).not.toThrow()
            }
        })

        it("Topaz accepts scale 2, 4, 6", () => {
            for (const scale of [2, 4, 6]) {
                const params: UserGenerationParams = { scale }
                expect(() => validateModelParams("UPSCALE_TOPAZ", params)).not.toThrow()
            }
        })
    })

    describe("edge case: scale omitted (no validation error)", () => {
        it("upscaler without scale in params does not throw", () => {
            const params: UserGenerationParams = {
                imageUrl: "https://example.com/image.jpg",
            }
            expect(() => validateModelParams("UPSCALE_GOOGLE", params)).not.toThrow()
        })

        it("Recraft without scale does not throw", () => {
            const params: UserGenerationParams = {
                imageUrl: "https://example.com/image.jpg",
            }
            expect(() => validateModelParams("UPSCALE_RECRAFT", params)).not.toThrow()
        })
    })
})
