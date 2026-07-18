import { createLogger } from "../lib/logger.js"
import { NotFoundError } from "../lib/errors.js"
import { UserModel as User } from "../models/user.js"
import { IImageObject } from "../types/index.js"
import { deleteImageByObject, deleteImagesByPublicIds } from "./cloudinary-service.js"

const logger = createLogger("image-service")

/**
 * Toggles the favorite status of a specific image in a user's history.
 * @returns The new isFavorite boolean
 * @throws NotFoundError if user or image is not found
 */
export async function toggleImageFavorite(
    userId: string,
    imageId: string,
): Promise<{ isFavorite: boolean }> {
    const user = await User.findOne({ userId })
    if (!user) throw new NotFoundError("User not found")

    const imageIndex = user.history.findIndex((img) => img._id?.toString() === imageId)
    if (imageIndex === -1) throw new NotFoundError("Image not found")

    const newFavoriteState = !user.history[imageIndex]?.isFavorite

    await User.findOneAndUpdate(
        { userId },
        { $set: { [`history.${imageIndex}.isFavorite`]: newFavoriteState } },
        { new: true },
    )

    logger.debug({ userId, imageId, isFavorite: newFavoriteState }, "Toggled image favorite")
    return { isFavorite: newFavoriteState }
}

/**
 * Deletes a single image from Cloudinary and removes it from the user's history.
 * @throws NotFoundError if user or image is not found
 */
export async function deleteUserImage(userId: string, imageId: string): Promise<void> {
    const user = await User.findOne({ userId })
    if (!user) throw new NotFoundError("User not found")

    const imageObject = user.history.find((img) => img._id?.toString() === imageId) as IImageObject

    if (!imageObject) throw new NotFoundError("Image not found")

    await deleteImageByObject(imageObject)

    await User.findOneAndUpdate({ userId }, { $pull: { history: { _id: imageId } } }, { new: true })

    logger.debug({ userId, imageId }, "Deleted user image")
}

/**
 * Bulk-deletes images from Cloudinary and removes them from the user's history.
 * @throws NotFoundError if user is not found
 */
export async function deleteBulkUserImages(
    userId: string,
    publicIds: string[],
    imageIds: string[],
): Promise<void> {
    const user = await User.findOne({ userId })
    if (!user) throw new NotFoundError("User not found")

    await deleteImagesByPublicIds(publicIds)

    await User.findOneAndUpdate(
        { userId },
        { $pull: { history: { _id: { $in: imageIds } } } },
        { new: true },
    )

    logger.debug({ userId, count: imageIds.length }, "Bulk deleted user images")
}
