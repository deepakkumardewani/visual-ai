import Replicate, { type Prediction } from "replicate"

import { ImageModel as Image } from "../models/image.js"
import { UserModel as User } from "../models/user.js"
import { RedisService } from "../services/redis-service.js"
import {
    AIImageInput,
    Body,
    ColorizeInput,
    FeatureType,
    IImageObject,
    Props,
    ReviveInput,
    UpscaleInput,
} from "../types/index.js"
import { getImageDetails, uploadToCloudinary } from "../utils/cloudinary.js"
import { MODEL_IDS } from "../utils/constants.js"

const jobStatusService = new RedisService()

// Initialize Replicate AI client
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
})

// Global object to track job status for different users
// let jobStatus: Record<string, JobStatus | undefined> = {}
type ModelType = `${string}/${string}` | `${string}/${string}:${string}`

export async function processImage(body: Body): Promise<void> {
    const {
        userId,
        jobId,
        modelId,
        modelName,
        imageType,
        prompt,
        numOfOutputs,
        outputQuality,
        aspectRatio,
        outputFormat,
    } = body

    let input: AIImageInput

    const model = MODEL_IDS[modelId as keyof typeof MODEL_IDS] as ModelType
    input = {
        prompt: prompt || "",
        output_quality: outputQuality || 0,
        aspect_ratio: aspectRatio || "",
        output_format: outputFormat || "",
    }

    if (model !== MODEL_IDS.FLUX_1_1_PRO && model !== MODEL_IDS.FLUX_PRO) {
        input.num_outputs = numOfOutputs
    }

    try {
        const output = (await replicate.run(
            model,
            { input },
            (prediction: Prediction) => {
                console.log("Image Progress:", prediction.status)
            },
        )) as string[] | string

        if (output) {
            const obj = {
                userId,
                output,
                prompt,
                featureType: FeatureType.IMAGE,
                aspectRatio,
                modelName,
            }
            const image = await getImageObject(obj)
            const newImage = await storeImageInDB(image, userId)
            const creditsToDeduct = 1
            const credits = await updateAndGetUserCredits(
                userId,
                creditsToDeduct,
            )

            await jobStatusService.setStatus(jobId, {
                status: "processing",
                image: newImage,
                userCreditsRemaining: credits,
            })

            const imgUrl = Array.isArray(output)
                ? output.length > 1
                    ? output
                    : output[0]
                : output
            const data = {
                type: FeatureType.IMAGE,
                imageUrl: imgUrl,
                imageType,
                userId,
                prompt,
                modelName,
                aspectRatio,
                imageId: newImage._id,
            }
            await uploadToCloudinary(data)
            await completeJob(jobId, userId, newImage._id?.toString())
        } else {
            console.error("error", "Error generating image")
        }
    } catch (error) {
        console.error("error", error)
        await jobStatusService.setStatus(jobId, {
            status: "error",
            image: undefined,
            userCreditsRemaining: null,
        })
    }
}

export async function processUpscale(props: Props): Promise<void> {
    const { body, filePath, fileName } = props
    const {
        userId,
        jobId,
        prompt,
        creativity,
        scale,
        negativePrompt,
        outputFormat,
    } = body
    try {
        const defaultPrompt =
            "masterpiece, best quality, highres, <lora:more_details:0.5> <lora:SDXLrender_v2.0:1>"
        const defaultNegativePrompt =
            "(worst quality, low quality, normal quality:2) JuggernautNegative-neg"

        const input: UpscaleInput = {
            image: filePath || "",
            prompt: prompt !== "" ? prompt || "" : defaultPrompt,
            creativity: Number(creativity),
            scale_factor: Number(scale),
            negative_prompt:
                negativePrompt !== ""
                    ? negativePrompt || ""
                    : defaultNegativePrompt,
            output_format: outputFormat || "",
        }

        const model = MODEL_IDS.UPSCALE_IMAGE as ModelType
        const output = (await replicate.run(
            model,
            { input },
            (prediction: Prediction) => {
                console.log("Upscale Progress:", prediction.status)
            },
        )) as string[]

        if (output) {
            const obj = {
                userId,
                output,
                prompt,
                filePath,
                featureType: "upscale",
            }
            const user = await User.findOne({ userId })
            const image = await getImageObject(obj)
            const newImage = await storeImageInDB(image, userId)
            const creditsToDeduct = user?.isPro ? 1 : 3
            const credits = await updateAndGetUserCredits(
                userId,
                creditsToDeduct,
            )
            await jobStatusService.setStatus(jobId, {
                status: "processing",
                image: newImage,
                userCreditsRemaining: credits,
            })
            const data = {
                type: "upscale",
                original: filePath,
                imageUrl: output[0],
                originalPublicId: fileName,
                userId,
                prompt,
                imageId: newImage._id,
            }

            await uploadToCloudinary(data)
            await completeJob(jobId, userId, newImage._id?.toString())
        }
    } catch (error) {
        console.error("Upscale processing error:", error)
        await jobStatusService.setStatus(jobId, {
            status: "error",
            image: undefined,
            userCreditsRemaining: null,
        })
    }
}

export async function processRevive(props: Props): Promise<void> {
    const { body, filePath, fileName } = props
    const { userId, jobId } = body
    try {
        const input: ReviveInput = {
            img: filePath || "",
        }

        const model = MODEL_IDS.REVIVE as ModelType
        const output = (await replicate.run(
            model,
            { input },
            (prediction: Prediction) => {
                console.log("Revive Progress:", prediction.status)
            },
        )) as string[]

        if (output) {
            const obj = {
                userId,
                output,
                filePath,
                featureType: "revive",
            }
            const user = await User.findOne({ userId })
            const image = await getImageObject(obj)
            const newImage = await storeImageInDB(image, userId)
            const creditsToDeduct = user?.isPro ? 1 : 3
            const credits = await updateAndGetUserCredits(
                userId,
                creditsToDeduct,
            )

            await jobStatusService.setStatus(jobId, {
                status: "processing",
                image: newImage,
                userCreditsRemaining: credits,
            })

            const data = {
                type: "revive",
                original: filePath,
                imageUrl: output,
                originalPublicId: fileName,
                userId,
                prompt: "",
                imageId: newImage._id,
            }

            await uploadToCloudinary(data)
            await completeJob(jobId, userId, newImage._id?.toString())
        }
    } catch (error) {
        console.error("Revive processing error:", error)
        await jobStatusService.setStatus(jobId, {
            status: "error",
            image: undefined,
            userCreditsRemaining: null,
        })
    }
}
export async function processColorization(props: Props): Promise<void> {
    const { body, filePath, fileName } = props
    const { userId, jobId, modelId } = body
    try {
        const input: ColorizeInput = {
            image: filePath || "",
        }
        const model = MODEL_IDS[modelId as keyof typeof MODEL_IDS] as ModelType

        const output = (await replicate.run(
            model,
            { input },
            (prediction: Prediction) => {
                console.log("Colorize Progress:", prediction.status)
            },
        )) as string[]

        if (output) {
            const obj = {
                userId,
                output,
                filePath,
                featureType: "colorize",
            }
            const user = await User.findOne({ userId })
            const image = await getImageObject(obj)
            const newImage = await storeImageInDB(image, userId)
            const creditsToDeduct = user?.isPro ? 1 : 3
            const credits = await updateAndGetUserCredits(
                userId,
                creditsToDeduct,
            )

            await jobStatusService.setStatus(jobId, {
                status: "processing",
                image: newImage,
                userCreditsRemaining: credits,
            })
            const data = {
                type: "colorize",
                original: filePath,
                imageUrl: output,
                originalPublicId: fileName,
                userId,
                prompt: "",
                imageId: newImage._id,
            }
            await uploadToCloudinary(data)
            await completeJob(jobId, userId, newImage._id?.toString())
        }
    } catch (error) {
        console.error("Colorization processing error:", error)
        await jobStatusService.setStatus(jobId, {
            status: "error",
            image: undefined,
            userCreditsRemaining: null,
        })
    }
}
async function completeJob(jobId: string, userId: string, imageId?: string) {
    const user = await User.findOne({ userId })
    const image = user?.history.find(
        (img) => img._id?.toString() === imageId,
    ) as IImageObject
    await jobStatusService.setStatus(jobId, {
        status: "completed",
        image,
        userCreditsRemaining: null,
    })
}

async function getImageObject(object: any) {
    const {
        userId,
        filePath,
        output,
        featureType,
        prompt = "",
        aspectRatio = "",
        modelName = "",
    } = object

    const image: IImageObject = {
        userId,
        prompt,
        featureType,
        images: [],
    }

    // Handle array of images
    const outputArray = Array.isArray(output) ? output : [output]
    const imagePromises = outputArray.map(async (imageUrl) => {
        const imageDetails = await getImageDetails(imageUrl)
        const { width, height, format, bytes } = imageDetails

        const imageData = {
            name: "",
            aspectRatio,
            resolution: `${width}x${height}`,
            width,
            height,
            format,
            bytes,
        }

        if (featureType === FeatureType.IMAGE) {
            return {
                ...imageData,
                aiImageUrl: imageUrl,
                aiImagePublicId: "",
            }
        }

        if (
            featureType === FeatureType.UPSCALE ||
            featureType === FeatureType.COLORIZE ||
            featureType === FeatureType.REVIVE
        ) {
            return {
                ...imageData,
                originalImageUrl: filePath,
                enhancedImageUrl: imageUrl,
                originalPublicId: "",
                enhancedPublicId: "",
            }
        }

        return imageData
    })

    image.images = await Promise.all(imagePromises)
    if (featureType === FeatureType.IMAGE) {
        image.modelName = modelName
    }

    return image
}

async function storeImageInDB(
    image: IImageObject,
    userId: string,
): Promise<IImageObject> {
    const newImage = new Image(image)
    const user = await User.findOneAndUpdate(
        { userId },
        { $push: { history: newImage } },
        { new: true },
    )
    if (!user) {
        console.error("User not found")
    }
    return newImage.toObject()
}

async function updateAndGetUserCredits(userId: string, amount: number) {
    const filter = { userId }
    const user = await User.findOneAndUpdate(
        filter,
        {
            $inc: { credits: -amount },
        },
        { new: true },
    )
    console.log("====user===", userId, user?.credits)
    if (user) {
        return user.credits
    }
    console.error("====user not found===")
    return 0
}
