import mongoose from "mongoose"

const Schema = mongoose.Schema

export const CollectionSchema = new Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 60,
        },
        imageIds: {
            type: [String],
            default: [],
        },
    },
    { timestamps: true },
)

CollectionSchema.index({ userId: 1, name: 1 })

export const CollectionModel = mongoose.model("Collection", CollectionSchema)
