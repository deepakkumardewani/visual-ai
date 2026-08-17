import mongoose from "mongoose"

const Schema = mongoose.Schema

const SavedPromptSchema = new Schema(
    {
        userId: { type: String, required: true, index: true },
        name: { type: String, required: true, maxlength: 80 },
        prompt: { type: String, required: true, maxlength: 2000 },
        modelId: { type: String, required: false, default: undefined },
    },
    { timestamps: true },
)

SavedPromptSchema.index({ userId: 1, createdAt: -1 })

export const SavedPromptModel = mongoose.model("SavedPrompt", SavedPromptSchema)
