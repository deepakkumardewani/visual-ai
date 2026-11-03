import { NotFoundError } from "../lib/errors.js"
import { isPro } from "../lib/isPro.js"
import { UserModel as User } from "../models/user.js"

const CLOUDINARY_HOST = "res.cloudinary.com"
const IMAGE_UPLOAD_SEGMENT = "/image/upload/"
/** Free-tier download derivative: capped at 2048px wide, auto quality and format. */
export const FREE_DOWNLOAD_TRANSFORM = "q_auto,f_auto,w_2048,c_limit"

/** Inserts the free-tier transformation; non-Cloudinary or malformed URLs are returned unchanged. */
export function toFreeDownloadUrl(url: string): string {
    if (!url.includes(CLOUDINARY_HOST) || url.includes(FREE_DOWNLOAD_TRANSFORM)) return url

    const markerIndex = url.indexOf(IMAGE_UPLOAD_SEGMENT)
    if (markerIndex === -1) return url

    const insertAt = markerIndex + IMAGE_UPLOAD_SEGMENT.length
    return `${url.slice(0, insertAt)}${FREE_DOWNLOAD_TRANSFORM}/${url.slice(insertAt)}`
}

interface DownloadableImage {
    aiImageUrl?: string | null
    enhancedImageUrl?: string | null
    originalImageUrl?: string | null
}

function pickSourceUrl(image: DownloadableImage): string {
    return image.aiImageUrl || image.enhancedImageUrl || image.originalImageUrl || ""
}

/**
 * Resolves the download URL for one image of a history entry: the original for Pro users,
 * an optimized derivative for free users. Only the owner's history is searched, so another
 * user's image id is indistinguishable from an unknown one.
 * @throws NotFoundError if the user, image or image index is not found
 */
export async function getImageDownloadUrl(
    userId: string,
    imageId: string,
    imageIndex = 0,
): Promise<string> {
    const user = await User.findOne({ userId }, { plan: 1, subscription: 1, history: 1 })
    if (!user) throw new NotFoundError("Image not found")

    const entry = user.history.find((item) => item._id?.toString() === imageId)
    const sourceUrl = entry?.images[imageIndex] ? pickSourceUrl(entry.images[imageIndex]) : ""
    if (!sourceUrl) throw new NotFoundError("Image not found")

    return isPro(user) ? sourceUrl : toFreeDownloadUrl(sourceUrl)
}
