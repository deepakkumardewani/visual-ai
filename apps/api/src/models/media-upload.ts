import mongoose from "mongoose"

const Schema = mongoose.Schema

export const MEDIA_UPLOAD_TTL_HOURS = 24
export const MEDIA_UPLOAD_TTL_MS = MEDIA_UPLOAD_TTL_HOURS * 60 * 60 * 1000

/**
 * Mongo's TTL monitor deletes a row this long after expiresAt. The hourly sweep in cronJobs
 * must see an expired row first to remove its Cloudinary file; the TTL index is only the
 * safety net that stops rows piling up if the sweep keeps failing.
 */
export const MEDIA_UPLOAD_TTL_GRACE_SECONDS = 6 * 60 * 60

const MediaUploadSchema = new Schema({
    userId: { type: String, required: true },
    purpose: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    mime: { type: String, required: true },
    bytes: { type: Number, required: true },
    // Read from the Cloudinary response, never from the client.
    durationSec: { type: Number },
    width: { type: Number },
    height: { type: Number },
    sha256: { type: String, required: true },
    consumedAt: { type: Date },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + MEDIA_UPLOAD_TTL_MS),
    },
})

MediaUploadSchema.index({ expiresAt: 1 }, { expireAfterSeconds: MEDIA_UPLOAD_TTL_GRACE_SECONDS })
MediaUploadSchema.index({ userId: 1, purpose: 1 })

export const MediaUploadModel = mongoose.model("MediaUpload", MediaUploadSchema)
