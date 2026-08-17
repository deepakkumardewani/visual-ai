import {
    CreateCollectionSchema,
    RenameCollectionSchema,
    CollectionMembershipSchema,
    DeleteCollectionSchema,
    ListCollectionsQuerySchema,
} from "@visual-ai/shared"
import type { CollectionDto, CollectionListItem } from "@visual-ai/shared"

import { createLogger } from "../lib/logger.js"
import { BadRequestError, ForbiddenError, NotFoundError } from "../lib/errors.js"
import { CollectionModel } from "../models/collection.js"
import { UserModel as User } from "../models/user.js"

const logger = createLogger("collection-service")
const COVER_LIMIT = 4

function toDto(doc: {
    _id: { toString(): string }
    userId: string
    name: string
    imageIds: string[]
    createdAt?: Date
    updatedAt?: Date
}): CollectionDto {
    return {
        id: doc._id.toString(),
        userId: doc.userId,
        name: doc.name,
        imageIds: doc.imageIds ?? [],
        createdAt: doc.createdAt?.toISOString(),
        updatedAt: doc.updatedAt?.toISOString(),
    }
}

function toListItem(doc: {
    _id: { toString(): string }
    userId: string
    name: string
    imageIds: string[]
    createdAt?: Date
    updatedAt?: Date
}): CollectionListItem {
    const imageIds = doc.imageIds ?? []
    return {
        ...toDto(doc),
        count: imageIds.length,
        coverImageIds: imageIds.slice(0, COVER_LIMIT),
    }
}

async function assertOwnedCollection(collectionId: string, userId: string) {
    const collection = await CollectionModel.findById(collectionId)
    if (!collection) throw new NotFoundError("Collection not found")
    if (collection.userId !== userId)
        throw new ForbiddenError("Not allowed to modify this collection")
    return collection
}

async function assertImageIdsOwnedByUser(userId: string, imageIds: string[]) {
    const user = await User.findOne({ userId }).select("history._id")
    if (!user) throw new NotFoundError("User not found")

    const owned = new Set(
        (user.history ?? []).map((img) => img._id?.toString()).filter(Boolean) as string[],
    )
    const missing = imageIds.filter((id) => !owned.has(id))
    if (missing.length > 0) {
        throw new BadRequestError("One or more images do not belong to this user")
    }
}

export async function listCollections(userId: string): Promise<CollectionListItem[]> {
    const parsed = ListCollectionsQuerySchema.safeParse({ userId })
    if (!parsed.success) {
        throw new BadRequestError(parsed.error.issues[0]?.message ?? "Invalid query")
    }

    const docs = await CollectionModel.find({ userId: parsed.data.userId }).sort({ updatedAt: -1 })
    return docs.map(toListItem)
}

export async function createCollection(userId: string, name: string): Promise<CollectionDto> {
    const parsed = CreateCollectionSchema.safeParse({ userId, name })
    if (!parsed.success) {
        throw new BadRequestError(parsed.error.issues[0]?.message ?? "Invalid request")
    }

    const user = await User.findOne({ userId: parsed.data.userId }).select("_id")
    if (!user) throw new NotFoundError("User not found")

    const doc = await CollectionModel.create({
        userId: parsed.data.userId,
        name: parsed.data.name,
        imageIds: [],
    })

    logger.debug({ userId, collectionId: doc._id.toString() }, "Created collection")
    return toDto(doc)
}

export async function renameCollection(
    collectionId: string,
    userId: string,
    name: string,
): Promise<CollectionDto> {
    const parsed = RenameCollectionSchema.safeParse({ userId, name })
    if (!parsed.success) {
        throw new BadRequestError(parsed.error.issues[0]?.message ?? "Invalid request")
    }

    const collection = await assertOwnedCollection(collectionId, parsed.data.userId)
    collection.name = parsed.data.name
    await collection.save()

    logger.debug({ userId, collectionId }, "Renamed collection")
    return toDto(collection)
}

export async function deleteCollection(collectionId: string, userId: string): Promise<void> {
    const parsed = DeleteCollectionSchema.safeParse({ userId })
    if (!parsed.success) {
        throw new BadRequestError(parsed.error.issues[0]?.message ?? "Invalid request")
    }

    await assertOwnedCollection(collectionId, parsed.data.userId)
    await CollectionModel.deleteOne({ _id: collectionId, userId: parsed.data.userId })
    logger.debug({ userId, collectionId }, "Deleted collection")
}

export async function addImagesToCollection(
    collectionId: string,
    userId: string,
    imageIds: string[],
): Promise<CollectionDto> {
    const parsed = CollectionMembershipSchema.safeParse({ userId, imageIds })
    if (!parsed.success) {
        throw new BadRequestError(parsed.error.issues[0]?.message ?? "Invalid request")
    }

    await assertOwnedCollection(collectionId, parsed.data.userId)
    await assertImageIdsOwnedByUser(parsed.data.userId, parsed.data.imageIds)

    const updated = await CollectionModel.findOneAndUpdate(
        { _id: collectionId, userId: parsed.data.userId },
        { $addToSet: { imageIds: { $each: parsed.data.imageIds } } },
        { new: true },
    )
    if (!updated) throw new NotFoundError("Collection not found")

    logger.debug(
        { userId, collectionId, count: parsed.data.imageIds.length },
        "Added images to collection",
    )
    return toDto(updated)
}

export async function removeImagesFromCollection(
    collectionId: string,
    userId: string,
    imageIds: string[],
): Promise<CollectionDto> {
    const parsed = CollectionMembershipSchema.safeParse({ userId, imageIds })
    if (!parsed.success) {
        throw new BadRequestError(parsed.error.issues[0]?.message ?? "Invalid request")
    }

    await assertOwnedCollection(collectionId, parsed.data.userId)

    const updated = await CollectionModel.findOneAndUpdate(
        { _id: collectionId, userId: parsed.data.userId },
        { $pull: { imageIds: { $in: parsed.data.imageIds } } },
        { new: true },
    )
    if (!updated) throw new NotFoundError("Collection not found")

    logger.debug(
        { userId, collectionId, count: parsed.data.imageIds.length },
        "Removed images from collection",
    )
    return toDto(updated)
}
