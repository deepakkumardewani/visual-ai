import { randomUUID } from "node:crypto"

import type { MediaUploadResult } from "../utils/cloudinary.js"

/** Reserved .invalid host so a fake asset can never resolve to a real one. */
const FAKE_CLOUDINARY_ORIGIN = "https://fake-cloudinary.invalid"
const FAKE_PUBLIC_ID_PREFIX = "e2e-fake/"

/** Stable fixture values; the real flow reads these from Cloudinary's response. */
export const FAKE_UPLOAD_DURATION_SEC = 5
export const FAKE_IMAGE_SIZE_PX = 64

const FAKE_FORMATS: Record<FakeUploadKind, string> = {
    audio: "mp3",
    image: "png",
    raw: "srt",
    video: "mp4",
}

export type FakeUploadKind = "audio" | "image" | "raw" | "video"

/** True for ids minted by fakeMediaUpload, so delete paths can skip the real Cloudinary API. */
export function isFakeCloudinaryId(publicId: string): boolean {
    return publicId.startsWith(FAKE_PUBLIC_ID_PREFIX)
}

/** Stand-in for a Cloudinary upload result; no network call is made. */
export function fakeMediaUpload(kind: FakeUploadKind, bytes = 0): MediaUploadResult {
    const publicId = `${FAKE_PUBLIC_ID_PREFIX}${randomUUID()}`
    const isImage = kind === "image"
    const hasDuration = kind === "audio" || kind === "video"
    return {
        url: `${FAKE_CLOUDINARY_ORIGIN}/${publicId}`,
        publicId,
        format: FAKE_FORMATS[kind],
        bytes,
        durationSec: hasDuration ? FAKE_UPLOAD_DURATION_SEC : undefined,
        width: isImage ? FAKE_IMAGE_SIZE_PX : undefined,
        height: isImage ? FAKE_IMAGE_SIZE_PX : undefined,
    }
}
