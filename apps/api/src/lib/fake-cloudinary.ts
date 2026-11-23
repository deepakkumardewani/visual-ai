import { randomUUID } from "node:crypto"

import type { MediaUploadResult } from "../utils/cloudinary.js"

/** Reserved .invalid host so a fake asset can never resolve to a real one. */
const FAKE_CLOUDINARY_ORIGIN = "https://fake-cloudinary.invalid"
const FAKE_PUBLIC_ID_PREFIX = "e2e-fake/"

/** Stable fixture values; the real flow reads these from Cloudinary's response. */
export const FAKE_UPLOAD_DURATION_SEC = 5
export const FAKE_IMAGE_SIZE_PX = 64

export type FakeUploadKind = "audio" | "image" | "video"

/** True for ids minted by fakeMediaUpload, so delete paths can skip the real Cloudinary API. */
export function isFakeCloudinaryId(publicId: string): boolean {
    return publicId.startsWith(FAKE_PUBLIC_ID_PREFIX)
}

/** Stand-in for a Cloudinary upload result; no network call is made. */
export function fakeMediaUpload(kind: FakeUploadKind, bytes = 0): MediaUploadResult {
    const publicId = `${FAKE_PUBLIC_ID_PREFIX}${randomUUID()}`
    const isImage = kind === "image"
    return {
        url: `${FAKE_CLOUDINARY_ORIGIN}/${publicId}`,
        publicId,
        format: isImage ? "png" : kind === "audio" ? "mp3" : "mp4",
        bytes,
        durationSec: isImage ? undefined : FAKE_UPLOAD_DURATION_SEC,
        width: isImage ? FAKE_IMAGE_SIZE_PX : undefined,
        height: isImage ? FAKE_IMAGE_SIZE_PX : undefined,
    }
}
