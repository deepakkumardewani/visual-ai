import { Router } from "express"
import { Request, Response } from "express"

import { asyncHandler } from "../lib/async-handler.js"
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
