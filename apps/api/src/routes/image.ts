import { v2 as cloudinary } from "cloudinary"
import { Router } from "express"
import { Request, Response } from "express"

import { UserModel as User } from "../models/user.js"
import { IImageObject } from "../types/index.js"

export const imageRoutes = Router()

imageRoutes.put("/image/favorite", async (req: Request, res: Response) => {
    const { imageId, userId } = req.body
    const filter = { userId }
    try {
        const user = await User.findOne(filter)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        const imageIndex = user.history.findIndex((img) => img._id?.toString() === imageId)

        if (imageIndex === -1) {
            return res.status(404).json({ message: "Image not found" })
        }

        await User.findOneAndUpdate(
            filter,
            {
                $set: {
                    [`history.${imageIndex}.isFavorite`]: !user.history?.[imageIndex]?.isFavorite,
                },
            },
            { new: true },
        )
        return res.status(200).json({
            success: true,
            isFavorite: !user.history?.[imageIndex]?.isFavorite,
        })
    } catch (error) {
        console.error("Error marking image as favorite:", error)
        return res.status(500).json({ message: "Server error" })
    }
})

imageRoutes.delete("/image/delete", async (req: Request, res: Response) => {
    const { image, userId } = req.body
    const filter = { userId }

    try {
        const user = await User.findOne(filter)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        // Find the image in user's history
        const imageObject = user.history.find(
            (img) => img._id?.toString() === image._id,
        ) as IImageObject
        if (!imageObject) {
            return res.status(404).json({ message: "Image not found" })
        }

        await deleteImageFromCloudinary(imageObject)

        // Remove image from user's history
        await User.findOneAndUpdate(
            filter,
            { $pull: { history: { _id: image._id } } },
            { new: true },
        )
        return res.status(200).json({
            success: true,
            image,
            message: "Image deleted successfully",
        })
    } catch (error) {
        console.error("Error deleting image:", error)
        return res.status(500).json({ message: "Server error" })
    }
})

imageRoutes.delete("/image/delete/bulk", async (req: Request, res: Response) => {
    const { publicIds, userId, imageIds } = req.body
    const filter = { userId }

    try {
        const user = await User.findOne(filter)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        await deleteImagesFromCloudinary(publicIds)

        // console.log("imageIds", imageIds)
        // Remove image from user's history
        await User.findOneAndUpdate(
            filter,
            { $pull: { history: { _id: { $in: imageIds } } } },
            { new: true },
        )

        return res.status(200).json({
            success: true,
            message: "Images deleted successfully",
        })
    } catch (error) {
        console.error("Error deleting image:", error)
        return res.status(500).json({ message: "Server error" })
    }
})

async function deleteImagesFromCloudinary(publicIds: string[]) {
    try {
        // console.log("publicIds", publicIds)
        await cloudinary.api.delete_resources(publicIds)
    } catch (cloudinaryError) {
        console.error("Error deleting from Cloudinary:", cloudinaryError)
    }
}

async function deleteImageFromCloudinary(imageObject: IImageObject) {
    let publicIds: string[] = []
    // Delete images from Cloudinary
    for (const img of imageObject.images) {
        if (imageObject.featureType === "image") {
            publicIds.push(img.aiImagePublicId ?? "")
        } else {
            publicIds.push(img.originalPublicId ?? "")
            publicIds.push(img.enhancedPublicId ?? "")
        }
        try {
            await cloudinary.api.delete_resources(publicIds)
        } catch (cloudinaryError) {
            console.error("Error deleting from Cloudinary:", cloudinaryError)
        }
    }
}
