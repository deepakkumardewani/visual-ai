import mongoose from "mongoose"

const Schema = mongoose.Schema

export const MEDIA_ASSET_TYPES = ["audio", "video", "image"] as const
export const MEDIA_RESOURCE_TYPES = ["video", "image"] as const

const MediaAssetSchema = new Schema({
    userId: { type: String, required: true },
    type: { type: String, enum: MEDIA_ASSET_TYPES, required: true },
    feature: { type: String, required: true },
    modelKey: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
    resourceType: { type: String, enum: MEDIA_RESOURCE_TYPES, default: "video" },
    format: { type: String },
    bytes: { type: Number },
    durationSec: { type: Number },
    width: { type: Number },
    height: { type: Number },
    posterUrl: { type: String },
    transcriptUrl: { type: String },
    transcriptPublicId: { type: String },
    prompt: { type: String, default: "" },
    lyrics: { type: String },
    // Snapshot of the model input; never holds secrets.
    params: { type: Schema.Types.Mixed },
    parentId: { type: Schema.Types.ObjectId },
    jobId: { type: String },
    creditsCharged: { type: Number, required: true, default: 0 },
    saved: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
})

MediaAssetSchema.index({ userId: 1, createdAt: -1 })
MediaAssetSchema.index({ jobId: 1 }, { unique: true, sparse: true })
MediaAssetSchema.index({ parentId: 1 })

export const MediaAssetModel = mongoose.model("MediaAsset", MediaAssetSchema)
