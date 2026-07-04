import cloudinary from "cloudinary"
import probe from "probe-image-size"
import sharp from "sharp"

import { UserModel as User } from "../models/user.js"
import type { IImage, IImageObject } from "../types/index.js"

const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const COMPRESSION_QUALITY = 80

async function compressImage(imageUrl: string): Promise<Buffer> {
    const response = await fetch(imageUrl)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Get initial image info
    // const metadata = await sharp(buffer).metadata()

    // Start with original quality
    let quality = COMPRESSION_QUALITY
    let compressedBuffer = await sharp(buffer).jpeg({ quality }).toBuffer()

    // Gradually reduce quality until file size is under limit
    while (compressedBuffer.length > MAX_FILE_SIZE_BYTES && quality > 10) {
        quality -= 10
        compressedBuffer = await sharp(buffer).jpeg({ quality }).toBuffer()
    }

    return compressedBuffer
}

export async function uploadToCloudinary(data: any) {
    try {
        const {
            imageUrl,
            userId,
            prompt,
            type,
            imageType,
            modelName,
            imageId,
            aspectRatio = "",
            originalPublicId = "",
        } = data
        const basePath = `private/development/uploads/${userId}`
        let image: IImageObject

        if (Array.isArray(imageUrl) && imageUrl.length > 1) {
            const uploadPromises = imageUrl.map(async (url) => {
                let imageString = url
                const imageDetails = await getImageDetails(url)
                if (imageDetails.bytes > MAX_FILE_SIZE_BYTES) {
                    const compressedBuffer = await compressImage(url)
                    imageString = `data:image/jpeg;base64,${compressedBuffer.toString("base64")}`
                }
                return cloudinary.v2.uploader.upload(imageString, {
                    folder: `${basePath}/${type}`,
                })
            })
            const results = await Promise.all(uploadPromises)
            image = {
                userId,
                prompt,
                featureType: type,
                imageType,
                modelName,
                isFavorite: false,
                images: results.map(
                    (result): IImage => ({
                        aiImageUrl: result.secure_url,
                        name: result.original_filename,
                        aiImagePublicId: result.public_id,
                        resolution: `${result.width}x${result.height}`,
                        width: result.width,
                        height: result.height,
                        format: result.format,
                        bytes: result.bytes,
                        aspectRatio,
                    }),
                ),
            }

            // Add DB update for multiple images
            if (imageId) {
                const updateOperations = image.images.map((img, index) => ({
                    [`history.$.images.${index}.aiImageUrl`]: img.aiImageUrl,
                    [`history.$.images.${index}.aiImagePublicId`]:
                        img.aiImagePublicId,
                }))

                const mergedUpdates = updateOperations.reduce(
                    (acc, curr) => ({ ...acc, ...curr }),
                    {},
                )

                await User.updateOne(
                    {
                        userId,
                        "history._id": imageId,
                    },
                    {
                        $set: mergedUpdates,
                    },
                )
            }
        } else {
            const imageDetails = await getImageDetails(imageUrl)
            let imageString = imageUrl
            if (imageDetails.bytes > MAX_FILE_SIZE_BYTES) {
                const compressedBuffer = await compressImage(imageUrl)
                imageString = `data:image/jpeg;base64,${compressedBuffer.toString("base64")}`
            }
            const result = await cloudinary.v2.uploader.upload(imageString, {
                folder: `${basePath}/${type}`,
            })

            const {
                secure_url,
                public_id,
                width,
                height,
                format,
                bytes,
                original_filename,
            } = result
            image = {
                userId,
                prompt,
                featureType: type,
                imageType,
                images: [],
                isFavorite: false,
            }

            image["images"] = [
                {
                    name: original_filename,
                    resolution: `${width}x${height}`,
                    width,
                    height,
                    format,
                    bytes,
                    aspectRatio,
                },
            ]

            if (data.type === "image" && image.images[0]) {
                image.images[0].aiImageUrl = secure_url
                image.images[0].aiImagePublicId = public_id
                image.modelName = modelName

                await User.updateOne(
                    {
                        userId,
                        "history._id": imageId,
                    },
                    {
                        $set: {
                            "history.$.images.0.aiImageUrl": secure_url,
                            "history.$.images.0.aiImagePublicId":
                                result.public_id,
                            "history.$.images.0.aspectRatio": aspectRatio,
                        },
                    },
                )
            }
            if (
                data.type === "upscale" ||
                data.type === "colorize" ||
                data.type === "revive"
            ) {
                if (image.images[0]) {
                    image.images[0].originalImageUrl = data.original
                    image.images[0].enhancedImageUrl = secure_url
                    image.images[0].originalPublicId = originalPublicId
                    image.images[0].enhancedPublicId = public_id
                }
                await User.updateOne(
                    {
                        userId,
                        "history._id": imageId,
                    },
                    {
                        $set: {
                            "history.$.images.0.originalImageUrl":
                                data.original,
                            "history.$.images.0.enhancedImageUrl":
                                result.secure_url,
                            "history.$.images.0.originalPublicId":
                                originalPublicId,
                            "history.$.images.0.enhancedPublicId":
                                result.public_id,
                            "history.$.images.0.aspectRatio": aspectRatio,
                        },
                    },
                )
            }
        }
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error)
        throw error // Re-throw the error to be handled by the caller
    }
}

export async function getImageDetails(url: string) {
    try {
        const result = await probe(url)
        return {
            width: result.width,
            height: result.height,
            format: result.type,
            bytes: result.length,
        }
    } catch (error) {
        console.error("Error getting image details:", error)
        throw error
    }
}
