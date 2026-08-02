import mongoose from "mongoose"

import { FeatureType, type ExploreFeedItem, type ExploreFeedResponse } from "@visual-ai/shared"

import { env } from "../config/env.js"
import { BadRequestError, NotFoundError } from "../lib/errors.js"
import { createLogger } from "../lib/logger.js"
import { UserModel as User } from "../models/user.js"

const logger = createLogger("explore-service")

const DEFAULT_LIMIT = 24
const MAX_LIMIT = 48

type ExploreFeedParams = {
    excludeUserId: string
    limit?: number
    cursor?: string | null
}

type CursorParts = {
    createdAt: Date
    id: mongoose.Types.ObjectId
}

const IMAGE_FEATURE_TYPES = [FeatureType.IMAGE, "IMAGE", "Image"]

const EXPLORE_ITEM_PROJECT = {
    _id: 0,
    id: { $toString: "$history._id" },
    prompt: "$history.prompt",
    modelName: { $ifNull: ["$history.modelName", ""] },
    createdAt: "$history.createdAt",
    aspectRatio: {
        $ifNull: [{ $arrayElemAt: ["$history.images.aspectRatio", 0] }, "1:1"],
    },
    aiImagePublicId: { $arrayElemAt: ["$history.images.aiImagePublicId", 0] },
    aiImageUrl: { $arrayElemAt: ["$history.images.aiImageUrl", 0] },
    authorUserId: "$userId",
    author: {
        $let: {
            vars: {
                trimmedFull: { $trim: { input: { $ifNull: ["$fullName", ""] } } },
                joinedName: {
                    $trim: {
                        input: {
                            $concat: [
                                { $ifNull: ["$firstName", ""] },
                                " ",
                                { $ifNull: ["$lastName", ""] },
                            ],
                        },
                    },
                },
                trimmedUser: { $trim: { input: { $ifNull: ["$userName", ""] } } },
            },
            in: {
                $cond: [
                    { $ne: ["$$trimmedFull", ""] },
                    "$$trimmedFull",
                    {
                        $cond: [
                            { $ne: ["$$joinedName", ""] },
                            "$$joinedName",
                            {
                                $cond: [{ $ne: ["$$trimmedUser", ""] }, "$$trimmedUser", "Creator"],
                            },
                        ],
                    },
                ],
            },
        },
    },
} as const

function parseLimit(limit?: number): number {
    if (limit == null || Number.isNaN(limit)) return DEFAULT_LIMIT
    return Math.min(Math.max(1, Math.floor(limit)), MAX_LIMIT)
}

function encodeCursor(createdAt: Date | string, id: string): string {
    const iso =
        createdAt instanceof Date ? createdAt.toISOString() : new Date(createdAt).toISOString()
    return `${iso}_${id}`
}

function parseCursor(cursor: string): CursorParts {
    const separator = cursor.lastIndexOf("_")
    if (separator <= 0) {
        throw new BadRequestError("Invalid cursor")
    }
    const iso = cursor.slice(0, separator)
    const id = cursor.slice(separator + 1)
    const createdAt = new Date(iso)
    if (Number.isNaN(createdAt.getTime()) || !mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError("Invalid cursor")
    }
    return { createdAt, id: new mongoose.Types.ObjectId(id) }
}

function buildImageUrl(publicId?: string, fallbackUrl?: string): string {
    if (publicId) {
        return `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/q_auto,f_auto/${publicId}`
    }
    return fallbackUrl ?? ""
}

function mapExploreRow(row: Record<string, unknown>): ExploreFeedItem | null {
    const imageUrl = buildImageUrl(
        row.aiImagePublicId as string | undefined,
        row.aiImageUrl as string | undefined,
    )
    if (!imageUrl) return null
    const createdAt =
        row.createdAt instanceof Date
            ? row.createdAt.toISOString()
            : new Date(row.createdAt as string).toISOString()
    return {
        id: row.id as string,
        imageUrl,
        aspectRatio: (row.aspectRatio as string) || "1:1",
        prompt: (row.prompt as string) || "",
        modelName: (row.modelName as string) || "",
        author: (row.author as string) || "Creator",
        authorUserId: row.authorUserId as string,
        createdAt,
    }
}

/**
 * Lists other users' completed IMAGE generations for the Explore feed.
 * Returns only the first image of each generation.
 */
export async function getExploreFeed({
    excludeUserId,
    limit,
    cursor,
}: ExploreFeedParams): Promise<ExploreFeedResponse> {
    if (!excludeUserId?.trim()) {
        throw new BadRequestError("excludeUserId is required")
    }

    const pageSize = parseLimit(limit)
    const match: Record<string, unknown> = {
        userId: { $ne: excludeUserId },
        "history.featureType": { $in: IMAGE_FEATURE_TYPES },
        "history.images.0": { $exists: true },
    }

    if (cursor) {
        const { createdAt, id } = parseCursor(cursor)
        match.$or = [
            { "history.createdAt": { $lt: createdAt } },
            {
                "history.createdAt": createdAt,
                "history._id": { $lt: id },
            },
        ]
    }

    const rows = await User.aggregate([
        { $unwind: "$history" },
        { $match: match },
        { $sort: { "history.createdAt": -1, "history._id": -1 } },
        { $limit: pageSize + 1 },
        { $project: EXPLORE_ITEM_PROJECT },
    ])

    const hasMore = rows.length > pageSize
    const page = hasMore ? rows.slice(0, pageSize) : rows

    const items: ExploreFeedItem[] = page
        .map((row) => mapExploreRow(row as Record<string, unknown>))
        .filter((item): item is ExploreFeedItem => item != null)

    const last = items[items.length - 1]
    const nextCursor = hasMore && last ? encodeCursor(last.createdAt, last.id) : null

    logger.debug(
        { excludeUserId, count: items.length, hasMore: Boolean(nextCursor) },
        "Fetched explore feed page",
    )

    return { items, nextCursor }
}

/**
 * Fetches a single Explore item by history id (for deep links / refresh).
 */
export async function getExploreItemById(id: string): Promise<ExploreFeedItem> {
    if (!id?.trim() || !mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError("Invalid item id")
    }

    const rows = await User.aggregate([
        { $unwind: "$history" },
        {
            $match: {
                "history._id": new mongoose.Types.ObjectId(id),
                "history.featureType": { $in: IMAGE_FEATURE_TYPES },
                "history.images.0": { $exists: true },
            },
        },
        { $limit: 1 },
        { $project: EXPLORE_ITEM_PROJECT },
    ])

    const row = rows[0]
    if (!row) {
        throw new NotFoundError("Explore item not found")
    }

    const item = mapExploreRow(row as Record<string, unknown>)
    if (!item) {
        throw new NotFoundError("Explore item not found")
    }

    logger.debug({ id }, "Fetched explore item by id")
    return item
}
