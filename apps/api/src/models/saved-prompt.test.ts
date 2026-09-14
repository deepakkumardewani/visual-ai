import { describe, expect, it } from "vitest"

import { SavedPromptModel } from "./saved-prompt.js"

describe("SavedPromptModel schema", () => {
    it("registers the SavedPrompt model", () => {
        expect(SavedPromptModel.modelName).toBe("SavedPrompt")
    })

    it("enables timestamps", () => {
        expect(SavedPromptModel.schema.get("timestamps")).toBe(true)
    })

    it("requires indexed userId", () => {
        const userId = SavedPromptModel.schema.path("userId")
        expect(userId.isRequired).toBe(true)
        expect(userId.options.index).toBe(true)
    })

    it("requires name with maxlength 80", () => {
        const name = SavedPromptModel.schema.path("name")
        expect(name.isRequired).toBe(true)
        expect(name.options.maxlength).toBe(80)
    })

    it("requires prompt with maxlength 2000", () => {
        const prompt = SavedPromptModel.schema.path("prompt")
        expect(prompt.isRequired).toBe(true)
        expect(prompt.options.maxlength).toBe(2000)
    })

    it("defaults optional modelId to undefined", () => {
        const modelId = SavedPromptModel.schema.path("modelId")
        expect(modelId.isRequired).toBe(false)
        expect(modelId.options.default).toBeUndefined()
    })

    it("indexes userId with createdAt descending", () => {
        const indexes = SavedPromptModel.schema.indexes()
        const compound = indexes.some(([fields]) => fields.userId === 1 && fields.createdAt === -1)
        expect(compound).toBe(true)
    })
})
