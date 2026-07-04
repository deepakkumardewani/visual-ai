import moment from "moment"
import mongoose from "mongoose"

const Schema = mongoose.Schema

const ImageSchema = new Schema({
    name: { type: String, required: true },
    aiImagePublicId: { type: String, required: true, default: "" },
    aiImageUrl: { type: String, required: false },
    originalPublicId: { type: String, required: false, default: "" },
    enhancedPublicId: { type: String, required: false, default: "" },
    originalImageUrl: { type: String, required: false },
    enhancedImageUrl: { type: String, required: false },
    resolution: { type: String, default: "1024x1024" },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    format: { type: String, required: true },
    bytes: { type: Number, required: true },
    aspectRatio: { type: String, required: true },
})
export const ImageObjectSchema = new Schema({
    userId: { type: String, required: true },
    prompt: { type: String, required: true },
    featureType: { type: String, required: true },
    modelName: { type: String, required: false, default: "" },
    imageType: { type: String, required: false, default: "" },
    isFavorite: { type: Boolean, default: false },
    images: { type: [ImageSchema], required: true },
    createdAt: { type: Date, default: Date.now },
    humanReadableDate: {
        type: String,
        required: true,
        default: moment().format("MM/DD/YYYY"),
    },
})

export const ImageModel = mongoose.model("Image", ImageObjectSchema)
