import { Router } from "express"
import { Request, Response } from "express"

import { asyncHandler } from "../lib/async-handler.js"
import { BadRequestError, UnauthorizedError } from "../lib/errors.js"
import { getImageDownloadUrl } from "../services/download-service.js"
import {
    toggleImageFavorite,
    deleteUserImage,
    deleteBulkUserImages,
} from "../services/image-service.js"

export const imageRoutes = Router()

imageRoutes.put(
    "/image/favorite",
    asyncHandler(async (req: Request, res: Response) => {
        const { imageId, userId } = req.body
        const { isFavorite } = await toggleImageFavorite(userId, imageId)
        res.status(200).json({ success: true, isFavorite })
    }),
)

imageRoutes.delete(
    "/image/delete",
    asyncHandler(async (req: Request, res: Response) => {
        const { image, userId } = req.body
        await deleteUserImage(userId, image._id)
        res.status(200).json({
            success: true,
            image,
            message: "Image deleted successfully",
        })
    }),
)

imageRoutes.delete(
    "/image/delete/bulk",
    asyncHandler(async (req: Request, res: Response) => {
        const { publicIds, userId, imageIds } = req.body
        await deleteBulkUserImages(userId, publicIds, imageIds)
        res.status(200).json({
            success: true,
            message: "Images deleted successfully",
        })
    }),
)

imageRoutes.get(
    "/images/:imageId/download",
    asyncHandler(async (req: Request, res: Response) => {
        const userId = req.auth?.userId
        if (!userId) throw new UnauthorizedError()

        const imageIndex = Number(req.query.index ?? 0)
        if (!Number.isInteger(imageIndex) || imageIndex < 0) {
            throw new BadRequestError("Invalid image index")
        }

        const url = await getImageDownloadUrl(userId, String(req.params.imageId), imageIndex)
        res.status(200).json({ success: true, url })
    }),
)
