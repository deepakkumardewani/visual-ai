import { describe, expect, it } from "vitest"

import { CollectionModel, CollectionSchema } from "./collection.js"

describe("CollectionSchema", () => {
    it("requires indexed userId", () => {
        const userId = CollectionSchema.path("userId")
        expect(userId.isRequired).toBe(true)
        expect(userId.options.index).toBe(true)
    })

    it("requires trimmed name between 1 and 60 characters", () => {
        const name = CollectionSchema.path("name")
        expect(name.isRequired).toBe(true)
        expect(name.options.trim).toBe(true)
        expect(name.options.minlength).toBe(1)
        expect(name.options.maxlength).toBe(60)
    })

    it("defaults imageIds to an empty array", () => {
        expect(CollectionSchema.path("imageIds").options.default).toEqual([])
    })

    it("enables timestamps", () => {
        expect(CollectionSchema.get("timestamps")).toBe(true)
    })

    it("indexes userId with name", () => {
        const indexes = CollectionSchema.indexes()
        const compound = indexes.some(([fields]) => fields.userId === 1 && fields.name === 1)
        expect(compound).toBe(true)
    })
})

describe("CollectionModel", () => {
    it("registers the Collection model", () => {
        expect(CollectionModel.modelName).toBe("Collection")
        expect(CollectionModel.schema.path("userId")).toBeDefined()
        expect(CollectionModel.schema.path("name")).toBeDefined()
    })
})
