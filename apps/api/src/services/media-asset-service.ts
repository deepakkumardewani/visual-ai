import mongoose from "mongoose"

import { FeatureType, HISTORY_CAP, PLAN } from "@visual-ai/shared"
import type { MediaAssetDto, MediaAssetListResponse, MediaAssetType } from "@visual-ai/shared"

import { isE2eUser } from "../lib/e2e-user.js"
import { HttpError, NotFoundError } from "../lib/errors.js"
import { fakeMediaUpload } from "../lib/fake-cloudinary.js"
import { createLogger } from "../lib/logger.js"
import { MediaAssetModel } from "../models/media-asset.js"
import { UserModel as User } from "../models/user.js"
import { buildMediaFolder, uploadMediaToCloudinary } from "../utils/cloudinary.js"
import type { MediaUploadResult } from "../utils/cloudinary.js"
import { deleteMediaByPublicIds } from "./cloudinary-service.js"
import { resolveUserIsPro } from "./generation-service.js"

const logger = createLogger("media-asset-service")

export const HISTORY_FULL_CODE = "HISTORY_FULL"
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 50
const TITLE_MAX_CHARS = 60
const CURSOR_SEPARATOR = "_"
const VIDEO_FEATURES: ReadonlySet<string> = new Set([
    FeatureType.VIDEO,
    FeatureType.WATERMARK_VIDEO,
    FeatureType.AUTOCAPTION,
])
const IMAGE_FEATURES: ReadonlySet<string> = new Set([FeatureType.WATERMARK_IMAGE])
const TRANSCRIPT_FOLDER_SUFFIX = "transcripts"

export interface PersistAssetArgs {
    userId: string
    jobId: string
    modelKey: string
    featureType: FeatureType
    prompt: string
    outputUrl: string
    /** Second output of a tool (the autocaption transcript); copied off the expiring provider URL. */
    transcriptUrl?: string
    creditsCharged: number
    /** Model input snapshot; the caller guarantees it holds no secrets. */
    params?: Record<string, unknown>
}

export interface ListAssetsOptions {
    type?: MediaAssetType
    cursor?: string
    limit?: number
}

type AssetDoc = InstanceType<typeof MediaAssetModel>

function mediaTypeOf(feature: string): MediaAssetType {
    if (VIDEO_FEATURES.has(feature)) return "video"
    return IMAGE_FEATURES.has(feature) ? "image" : "audio"
}

/** Cloudinary files audio and video under "video"; pictures stay "image". */
function resourceTypeOf(type: MediaAssetType): "image" | "video" {
    return type === "image" ? "image" : "video"
}

/** Maps a row to the client shape; the stored publicId and params stay server-side. */
export function toMediaAssetDto(doc: AssetDoc): MediaAssetDto {
    return {
        id: doc._id.toString(),
        type: doc.type,
        feature: doc.feature as FeatureType,
        modelKey: doc.modelKey,
        title: doc.title,
        url: doc.url,
        format: doc.format ?? undefined,
        bytes: doc.bytes ?? undefined,
        durationSec: doc.durationSec ?? undefined,
        width: doc.width ?? undefined,
        height: doc.height ?? undefined,
        posterUrl: doc.posterUrl ?? undefined,
        transcriptUrl: doc.transcriptUrl ?? undefined,
        prompt: doc.prompt || undefined,
        lyrics: doc.lyrics ?? undefined,
        parentId: doc.parentId?.toString(),
        creditsCharged: doc.creditsCharged,
        saved: doc.saved,
        createdAt: doc.createdAt.toISOString(),
    }
}

const CLOUDINARY_UPLOAD_SEGMENT = "/upload/"
/** Cloudinary transformation that renders the first frame of a video. */
const POSTER_FRAME_TRANSFORM = "so_0"
const FILE_EXTENSION_PATTERN = /\.[a-z0-9]+$/i

/** Still image of a stored video's first frame; same asset id, jpg extension. */
export function videoPosterUrl(videoUrl: string): string {
    const still = videoUrl.replace(FILE_EXTENSION_PATTERN, "")
    const withFrame = still.replace(
        CLOUDINARY_UPLOAD_SEGMENT,
        `${CLOUDINARY_UPLOAD_SEGMENT}${POSTER_FRAME_TRANSFORM}/`,
    )
    return `${withFrame}.jpg`
}

function assertObjectId(id: string): void {
    if (!mongoose.isValidObjectId(id)) throw new NotFoundError("Asset not found")
}

/** Images (embedded in the user) and media assets share one history cap (G3). */
export async function countUserHistory(userId: string): Promise<number> {
    const [user, mediaCount] = await Promise.all([
        User.findOne({ userId }, { history: 1 }).lean(),
        MediaAssetModel.countDocuments({ userId }),
    ])
    return (user?.history?.length ?? 0) + mediaCount
}

async function isHistoryFull(userId: string): Promise<boolean> {
    const cap = HISTORY_CAP[(await resolveUserIsPro(userId)) ? PLAN.PRO : PLAN.FREE]
    return (await countUserHistory(userId)) >= cap
}

/**
 * Stores the job's asset, or returns it unsaved at the provider URL when the history is full.
 * The row keeps the provider URL until copyMediaAssetToCloudinary swaps in the permanent one.
 */
export async function persistMediaAsset(args: PersistAssetArgs): Promise<MediaAssetDto> {
    const {
        userId,
        jobId,
        modelKey,
        featureType,
        prompt,
        outputUrl,
        transcriptUrl,
        creditsCharged,
        params,
    } = args
    const base = {
        type: mediaTypeOf(featureType),
        feature: featureType,
        modelKey,
        title: prompt.slice(0, TITLE_MAX_CHARS),
        url: outputUrl,
        transcriptUrl,
        prompt,
        creditsCharged,
    }
    if (await isHistoryFull(userId)) {
        logger.info({ userId }, "Media asset not saved: history cap reached")
        return { ...base, id: jobId, saved: false }
    }
    const doc = await MediaAssetModel.create({ ...base, userId, jobId, params, saved: true })
    return toMediaAssetDto(doc)
}

/** The transcript is a text file, so it is filed as a Cloudinary "raw" resource. */
async function copyTranscript(
    sourceUrl: string,
    userId: string,
    folder: string,
): Promise<MediaUploadResult> {
    if (isE2eUser(userId)) return fakeMediaUpload("raw")
    return uploadMediaToCloudinary(sourceUrl, `${folder}/${TRANSCRIPT_FOLDER_SUFFIX}`, "raw")
}

/**
 * Copies a saved asset's provider output to Cloudinary and updates the row.
 * On failure the row is removed so the expiring provider URL never reaches the user's library.
 */
export async function copyMediaAssetToCloudinary(
    asset: MediaAssetDto,
    userId: string,
): Promise<MediaAssetDto> {
    if (!asset.saved) return asset
    try {
        // E2E users never reach real Cloudinary.
        const resourceType = resourceTypeOf(asset.type)
        const folder = buildMediaFolder(userId, asset.feature)
        const uploaded = isE2eUser(userId)
            ? fakeMediaUpload(asset.type)
            : await uploadMediaToCloudinary(asset.url, folder, resourceType)
        const transcript = asset.transcriptUrl
            ? await copyTranscript(asset.transcriptUrl, userId, folder)
            : undefined
        const doc = await MediaAssetModel.findOneAndUpdate(
            { _id: asset.id, userId },
            {
                url: uploaded.url,
                publicId: uploaded.publicId,
                resourceType,
                format: uploaded.format,
                bytes: uploaded.bytes,
                durationSec: uploaded.durationSec,
                width: uploaded.width,
                height: uploaded.height,
                transcriptUrl: transcript?.url,
                transcriptPublicId: transcript?.publicId,
                posterUrl: asset.type === "video" ? videoPosterUrl(uploaded.url) : undefined,
            },
            { new: true },
        )
        if (!doc) throw new NotFoundError("Asset not found")
        return toMediaAssetDto(doc)
    } catch (error) {
        await MediaAssetModel.deleteOne({ _id: asset.id, userId })
        throw error
    }
}

/** Drops the row of an asset that was never paid for, so no unpaid library entry survives. */
export async function discardMediaAsset(asset: MediaAssetDto, userId: string): Promise<void> {
    if (!asset.saved) return
    await MediaAssetModel.deleteOne({ _id: asset.id, userId })
}

function encodeCursor(doc: AssetDoc): string {
    return Buffer.from(
        `${doc.createdAt.getTime()}${CURSOR_SEPARATOR}${doc._id.toString()}`,
    ).toString("base64url")
}

function cursorFilter(cursor: string): Record<string, unknown> {
    const [ms, id] = Buffer.from(cursor, "base64url").toString().split(CURSOR_SEPARATOR)
    const createdAt = new Date(Number(ms))
    if (Number.isNaN(createdAt.getTime()) || !id || !mongoose.isValidObjectId(id)) {
        throw new HttpError(400, "cursor: invalid")
    }
    return {
        $or: [{ createdAt: { $lt: createdAt } }, { createdAt, _id: { $lt: id } }],
    }
}

/** Newest first; the (createdAt, _id) cursor is stable while rows are added or removed. */
export async function listMediaAssets(
    userId: string,
    { type, cursor, limit = DEFAULT_PAGE_SIZE }: ListAssetsOptions = {},
): Promise<MediaAssetListResponse> {
    const pageSize = Math.min(Math.max(limit, 1), MAX_PAGE_SIZE)
    const docs = await MediaAssetModel.find({
        userId,
        ...(type ? { type } : {}),
        ...(cursor ? cursorFilter(cursor) : {}),
    })
        .sort({ createdAt: -1, _id: -1 })
        .limit(pageSize + 1)
    const page = docs.slice(0, pageSize)
    const last = page[page.length - 1]
    return {
        items: page.map(toMediaAssetDto),
        nextCursor: docs.length > pageSize && last ? encodeCursor(last) : null,
    }
}

/** Another user's id is indistinguishable from a missing one (404, never 403). */
export async function getMediaAsset(userId: string, id: string): Promise<MediaAssetDto> {
    return toMediaAssetDto(await findOwnedAsset(userId, id))
}

async function findOwnedAsset(userId: string, id: string): Promise<AssetDoc> {
    assertObjectId(id)
    const doc = await MediaAssetModel.findOne({ _id: id, userId })
    if (!doc) throw new NotFoundError("Asset not found")
    return doc
}

/**
 * Saves an exported edit as a new asset that points at its parent. It costs nothing and
 * counts toward the history cap, so a full history rejects it before any upload.
 */
export async function createVersion(
    userId: string,
    parentId: string,
    file: Buffer,
): Promise<MediaAssetDto> {
    const parent = await findOwnedAsset(userId, parentId)
    if (await isHistoryFull(userId)) {
        throw new HttpError(409, HISTORY_FULL_CODE)
    }
    const uploaded = await uploadMediaToCloudinary(file, buildMediaFolder(userId, parent.feature))
    const doc = await MediaAssetModel.create({
        userId,
        type: parent.type,
        feature: parent.feature,
        modelKey: parent.modelKey,
        title: parent.title,
        prompt: parent.prompt,
        lyrics: parent.lyrics,
        parentId: parent._id,
        url: uploaded.url,
        publicId: uploaded.publicId,
        resourceType: "video",
        format: uploaded.format,
        bytes: uploaded.bytes,
        durationSec: uploaded.durationSec,
        creditsCharged: 0,
        saved: true,
    })
    return toMediaAssetDto(doc)
}

/** The asset plus every version derived from it, found breadth-first and scoped to the user. */
async function collectWithDescendants(userId: string, root: AssetDoc): Promise<AssetDoc[]> {
    const all = [root]
    let frontier = [root._id]
    while (frontier.length > 0) {
        const children = await MediaAssetModel.find({ userId, parentId: { $in: frontier } })
        all.push(...children)
        frontier = children.map((child) => child._id)
    }
    return all
}

/** Removes the asset, its versions and their Cloudinary files, each under its own resource_type. */
export async function deleteMediaAsset(userId: string, id: string): Promise<void> {
    const root = await findOwnedAsset(userId, id)
    const assets = await collectWithDescendants(userId, root)
    const publicIdsOf = (resourceType: "image" | "video") =>
        assets
            .filter((a) => (a.resourceType ?? "video") === resourceType)
            .map((a) => a.publicId)
            .filter(Boolean)
    await Promise.all([
        deleteMediaByPublicIds(publicIdsOf("video"), "video"),
        deleteMediaByPublicIds(publicIdsOf("image"), "image"),
        deleteMediaByPublicIds(
            assets
                .map((a) => a.transcriptPublicId)
                .filter((publicId): publicId is string => !!publicId),
            "raw",
        ),
    ])
    await MediaAssetModel.deleteMany({ userId, _id: { $in: assets.map((a) => a._id) } })
}
