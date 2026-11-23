import { v2 as cloudinary } from "cloudinary"

import { isFakeCloudinaryId } from "../lib/fake-cloudinary.js"
import { createLogger } from "../lib/logger.js"
import { FeatureType, IImageObject } from "../types/index.js"

const logger = createLogger("cloudinary-service")

/**
 * Deletes all Cloudinary resources for a user by user ID prefix
 * @param userId - The user ID prefix
 */
export async function deleteCloudinaryUserData(userId: string) {
    logger.debug({ userId }, "Deleting Cloudinary user data")
    try {
        const result = await cloudinary.api.delete_resources_by_prefix(`${userId}/`)
        logger.debug({ result }, "Cloudinary deletion result")
    } catch (error) {
        logger.error({ err: error }, "Error deleting Cloudinary data")
    }
}

/**
 * Deletes Cloudinary resources by an array of public IDs
 * Errors are logged but not re-thrown — Cloudinary deletion failures are non-fatal
 * @param publicIds - Array of Cloudinary public IDs to delete
 */
export async function deleteImagesByPublicIds(publicIds: string[]): Promise<void> {
    if (publicIds.length === 0) return
    try {
        await cloudinary.api.delete_resources(publicIds)
    } catch (error) {
        logger.error({ err: error }, "Error deleting images from Cloudinary")
    }
}

/**
 * Derives the Cloudinary public IDs from an image object and deletes them.
 * Handles both IMAGE (aiImagePublicId) and enhancement features
 * (originalPublicId + enhancedPublicId).
 * @param imageObject - The image history entry to delete
 */
export async function deleteImageByObject(imageObject: IImageObject): Promise<void> {
    const publicIds: string[] = []

    for (const img of imageObject.images) {
        if (imageObject.featureType === FeatureType.IMAGE) {
            if (img.aiImagePublicId) publicIds.push(img.aiImagePublicId)
        } else {
            if (img.originalPublicId) publicIds.push(img.originalPublicId)
            if (img.enhancedPublicId) publicIds.push(img.enhancedPublicId)
        }
    }

    await deleteImagesByPublicIds(publicIds)
}

/**
 * Deletes audio/video resources, which Cloudinary files under resource_type "video".
 * Errors are logged and not re-thrown, like the image helpers: an orphaned file must not
 * block removing the user's record.
 */
export async function deleteMediaByPublicIds(allPublicIds: string[]): Promise<void> {
    // Fake e2e assets have nothing to delete on the real account.
    const publicIds = allPublicIds.filter((id) => !isFakeCloudinaryId(id))
    if (publicIds.length === 0) return
    try {
        await cloudinary.api.delete_resources(publicIds, { resource_type: "video" })
    } catch (error) {
        logger.error({ err: error }, "Error deleting media from Cloudinary")
    }
}
