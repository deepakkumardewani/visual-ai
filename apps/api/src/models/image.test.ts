import { describe, expect, it } from "vitest"

import { ImageModel, ImageObjectSchema } from "./image.js"

describe("ImageObjectSchema", () => {
    it("requires userId, prompt, featureType, and images", () => {
        expect(ImageObjectSchema.path("userId").isRequired).toBe(true)
        expect(ImageObjectSchema.path("prompt").isRequired).toBe(true)
        expect(ImageObjectSchema.path("featureType").isRequired).toBe(true)
        expect(ImageObjectSchema.path("images").isRequired).toBe(true)
    })

    it("defaults optional string fields to empty strings", () => {
        expect(ImageObjectSchema.path("modelName").options.default).toBe("")
        expect(ImageObjectSchema.path("imageType").options.default).toBe("")
    })

    it("defaults isFavorite to false", () => {
        expect(ImageObjectSchema.path("isFavorite").options.default).toBe(false)
    })

    it("defaults createdAt to Date.now", () => {
        expect(ImageObjectSchema.path("createdAt").options.default).toBe(Date.now)
    })

    it("requires humanReadableDate with a default formatter", () => {
        const humanReadableDate = ImageObjectSchema.path("humanReadableDate")
        expect(humanReadableDate.isRequired).toBe(true)
        expect(humanReadableDate.options.default).toBeDefined()
    })

    it("embeds image asset fields with resolution default", () => {
        const images = ImageObjectSchema.path("images")
        const nested = images.schema

        expect(nested.path("name").isRequired).toBe(true)
        expect(nested.path("aiImagePublicId").isRequired).toBe(true)
        expect(nested.path("aiImagePublicId").options.default).toBe("")
        expect(nested.path("originalPublicId").options.default).toBe("")
        expect(nested.path("enhancedPublicId").options.default).toBe("")
        expect(nested.path("resolution").options.default).toBe("1024x1024")
        expect(nested.path("width").isRequired).toBe(true)
        expect(nested.path("height").isRequired).toBe(true)
        expect(nested.path("format").isRequired).toBe(true)
        expect(nested.path("bytes").isRequired).toBe(true)
        expect(nested.path("aspectRatio").isRequired).toBe(true)
    })
})

describe("ImageModel", () => {
    it("registers the Image model against ImageObjectSchema", () => {
        expect(ImageModel.modelName).toBe("Image")
        expect(ImageModel.schema.path("prompt")).toBeDefined()
        expect(ImageModel.schema.path("images")).toBeDefined()
    })
})
