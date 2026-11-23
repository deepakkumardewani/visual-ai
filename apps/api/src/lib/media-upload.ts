import cloudinary from "cloudinary"
import { createHash } from "node:crypto"
import { createReadStream } from "node:fs"
import { open, unlink } from "node:fs/promises"

import {
    MAX_IMAGE_BYTES,
    MAX_TOOL_VIDEO_BYTES,
    MAX_VIDEO_AUDIO_BYTES,
    VOICE_SAMPLE_MAX_BYTES,
    WAN_FIRST_FRAME_MAX_BYTES,
} from "@visual-ai/shared"

import { MediaUploadModel } from "../models/media-upload.js"
import { buildMediaFolder, uploadMediaToCloudinary } from "../utils/cloudinary.js"
import type { MediaUploadResult } from "../utils/cloudinary.js"
import { isE2eUser } from "./e2e-user.js"
import { BadRequestError, HttpError } from "./errors.js"
import { fakeMediaUpload, isFakeCloudinaryId } from "./fake-cloudinary.js"
import { createLogger } from "./logger.js"

const logger = createLogger("media-upload")

const BYTES_PER_MB = 1024 * 1024
const SNIFF_HEAD_BYTES = 16
const UPLOAD_FOLDER = "uploads"
const PAYLOAD_TOO_LARGE = 413

export type SniffedMime =
    | "audio/mpeg"
    | "audio/wav"
    | "audio/mp4"
    | "audio/flac"
    | "video/mp4"
    | "video/quicktime"
    | "video/webm"
    | "image/png"
    | "image/jpeg"
    | "image/webp"
    | "image/bmp"

export type UploadKind = "audio" | "image" | "video"

export interface UploadPurposeSpec {
    kind: UploadKind
    mimes: readonly SniffedMime[]
    /** Largest accepted file in bytes (inclusive). */
    maxBytes: number
}

export const UPLOAD_PURPOSES = {
    // The shared limit is "strictly smaller than", so the largest accepted size is one byte less.
    "voice-sample": {
        kind: "audio",
        mimes: ["audio/mpeg", "audio/mp4", "audio/wav"],
        maxBytes: VOICE_SAMPLE_MAX_BYTES - 1,
    },
    "video-audio": {
        kind: "audio",
        mimes: ["audio/flac", "audio/mpeg", "audio/wav"],
        maxBytes: MAX_VIDEO_AUDIO_BYTES,
    },
    "video-image": {
        kind: "image",
        mimes: ["image/jpeg", "image/png", "image/webp", "image/bmp"],
        maxBytes: WAN_FIRST_FRAME_MAX_BYTES,
    },
    "tool-image": {
        kind: "image",
        mimes: ["image/jpeg", "image/png", "image/webp"],
        maxBytes: MAX_IMAGE_BYTES,
    },
    "tool-video": {
        kind: "video",
        mimes: ["video/mp4", "video/quicktime", "video/webm"],
        maxBytes: MAX_TOOL_VIDEO_BYTES,
    },
} as const satisfies Record<string, UploadPurposeSpec>

export type UploadPurpose = keyof typeof UPLOAD_PURPOSES

export interface MediaUploadDto {
    uploadId: string
    url: string
    mime: SniffedMime
    bytes: number
    durationSec?: number
    width?: number
    height?: number
}

export function isUploadPurpose(value: unknown): value is UploadPurpose {
    return typeof value === "string" && Object.hasOwn(UPLOAD_PURPOSES, value)
}

export function parseUploadPurpose(value: unknown): UploadPurpose {
    if (!isUploadPurpose(value)) throw new BadRequestError("purpose: unknown upload purpose")
    return value
}

/** Largest file any purpose of this kind accepts; the multer hard limit for the kind. */
export function maxBytesForKind(kind: UploadKind): number {
    return Math.max(
        ...Object.values<UploadPurposeSpec>(UPLOAD_PURPOSES)
            .filter((spec) => spec.kind === kind)
            .map((spec) => spec.maxBytes),
    )
}

export function uploadTooLargeError(purpose: UploadPurpose): HttpError {
    const limitMb = Math.round(UPLOAD_PURPOSES[purpose].maxBytes / BYTES_PER_MB)
    return new HttpError(PAYLOAD_TOO_LARGE, `File must be under ${limitMb} MB`)
}

function startsWith(head: Uint8Array, signature: readonly number[], offset = 0): boolean {
    return signature.every((byte, index) => head[offset + index] === byte)
}

function asciiAt(head: Uint8Array, offset: number, text: string): boolean {
    return startsWith(
        head,
        [...text].map((char) => char.charCodeAt(0)),
        offset,
    )
}

function isMp3(head: Uint8Array): boolean {
    if (asciiAt(head, 0, "ID3")) return true
    // MPEG frame sync (11 set bits) with a non-reserved layer.
    const second = head[1] ?? 0
    const layer = (second >> 1) & 0b11
    return head[0] === 0xff && (second & 0xe0) === 0xe0 && layer !== 0
}

function sniffFtyp(head: Uint8Array): SniffedMime | null {
    if (!asciiAt(head, 4, "ftyp")) return null
    if (asciiAt(head, 8, "qt  ")) return "video/quicktime"
    if (asciiAt(head, 8, "M4A ") || asciiAt(head, 8, "M4B ")) return "audio/mp4"
    return "video/mp4"
}

function sniffRiff(head: Uint8Array): SniffedMime | null {
    if (!asciiAt(head, 0, "RIFF")) return null
    if (asciiAt(head, 8, "WAVE")) return "audio/wav"
    if (asciiAt(head, 8, "WEBP")) return "image/webp"
    return null
}

function isBmp(head: Uint8Array): boolean {
    // "BM" plus the four reserved header bytes, which are always zero.
    return asciiAt(head, 0, "BM") && startsWith(head, [0, 0, 0, 0], 6)
}

/** Identifies a file by its magic bytes. The file name and client MIME are never consulted. */
export function sniffMime(head: Uint8Array): SniffedMime | null {
    if (head.length < 4) return null
    if (isMp3(head)) return "audio/mpeg"
    if (asciiAt(head, 0, "fLaC")) return "audio/flac"
    if (startsWith(head, [0x1a, 0x45, 0xdf, 0xa3])) return "video/webm"
    if (startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png"
    if (startsWith(head, [0xff, 0xd8, 0xff])) return "image/jpeg"
    if (isBmp(head)) return "image/bmp"
    return sniffRiff(head) ?? sniffFtyp(head)
}

/** A zero-copy Uint8Array view; the Buffer typings in this workspace are not assignable to it. */
function bytesOf(buffer: Buffer): Uint8Array {
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
}

async function readHead(file: Express.Multer.File): Promise<Uint8Array> {
    if (file.buffer) return bytesOf(file.buffer).subarray(0, SNIFF_HEAD_BYTES)
    const handle = await open(file.path, "r")
    try {
        const head = new Uint8Array(SNIFF_HEAD_BYTES)
        const { bytesRead } = await handle.read(head, 0, SNIFF_HEAD_BYTES, 0)
        return head.subarray(0, bytesRead)
    } finally {
        await handle.close()
    }
}

async function sha256Of(file: Express.Multer.File): Promise<string> {
    const hash = createHash("sha256")
    if (file.buffer) return hash.update(bytesOf(file.buffer)).digest("hex")
    for await (const chunk of createReadStream(file.path)) hash.update(chunk)
    return hash.digest("hex")
}

function uploadImageBuffer(buffer: Buffer, folder: string): Promise<MediaUploadResult> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
            { folder, resource_type: "image" },
            (error, result) => {
                if (error || !result) {
                    reject(error ?? new Error("Cloudinary returned no upload result"))
                    return
                }
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                    format: result.format,
                    bytes: result.bytes,
                    width: result.width,
                    height: result.height,
                })
            },
        )
        stream.end(buffer)
    })
}

function uploadFile(
    file: Express.Multer.File,
    kind: UploadKind,
    folder: string,
): Promise<MediaUploadResult> {
    if (kind === "image") return uploadImageBuffer(file.buffer, folder)
    return uploadMediaToCloudinary(file.buffer ?? file.path, folder)
}

function resourceTypeOf(mime: string): "image" | "video" {
    return mime.startsWith("image/") ? "image" : "video"
}

/** Throws on failure so callers (the sweep) can keep the row and retry. */
export async function deleteUploadedFile(upload: { publicId: string; mime: string }) {
    if (isFakeCloudinaryId(upload.publicId)) return
    await cloudinary.v2.api.delete_resources([upload.publicId], {
        resource_type: resourceTypeOf(upload.mime),
    })
}

export async function removeTempFile(file: Express.Multer.File | undefined): Promise<void> {
    if (!file?.path) return
    try {
        await unlink(file.path)
    } catch (err) {
        logger.error({ err, path: file.path }, "Failed to remove temporary upload file")
    }
}

async function assertAcceptable(file: Express.Multer.File, purpose: UploadPurpose) {
    const spec: UploadPurposeSpec = UPLOAD_PURPOSES[purpose]
    if (file.size > spec.maxBytes) throw uploadTooLargeError(purpose)
    const mime = sniffMime(await readHead(file))
    if (!mime) throw new BadRequestError("file: unsupported or unrecognized file type")
    if (!spec.mimes.includes(mime)) {
        throw new BadRequestError(`file: this file type is not allowed for ${purpose}`)
    }
    return mime
}

/**
 * Validates the file by content, stores it on Cloudinary and records it for the user.
 * Duration and dimensions come from the Cloudinary response; nothing client-supplied is trusted.
 */
export async function createMediaUpload(input: {
    userId: string
    purpose: UploadPurpose
    file: Express.Multer.File
}): Promise<MediaUploadDto> {
    const { userId, purpose, file } = input
    const mime = await assertAcceptable(file, purpose)
    const kind = UPLOAD_PURPOSES[purpose].kind
    // E2E users never reach real Cloudinary.
    const stored = isE2eUser(userId)
        ? fakeMediaUpload(kind, file.size)
        : await uploadFile(file, kind, buildMediaFolder(userId, UPLOAD_FOLDER))
    try {
        const row = await MediaUploadModel.create({
            userId,
            purpose,
            url: stored.url,
            publicId: stored.publicId,
            mime,
            bytes: stored.bytes,
            durationSec: stored.durationSec,
            width: stored.width,
            height: stored.height,
            sha256: await sha256Of(file),
        })
        return {
            uploadId: String(row._id),
            url: stored.url,
            mime,
            bytes: stored.bytes,
            durationSec: stored.durationSec,
            width: stored.width,
            height: stored.height,
        }
    } catch (err) {
        await deleteUploadedFile({ publicId: stored.publicId, mime }).catch((cleanupErr) =>
            logger.error({ err: cleanupErr }, "Failed to remove orphaned upload"),
        )
        throw err
    }
}
