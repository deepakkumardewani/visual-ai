import type { Prediction } from "replicate"

import { createLogger } from "../lib/logger.js"
import { replicate } from "../lib/replicate.js"
import { ImageModel as Image } from "../models/image.js"
import { UserModel as User } from "../models/user.js"
import { RedisService } from "../services/redis-service.js"
import {
    type AIImageInput,
    type Body,
    type ColorizeInput,
    FeatureType,
    type IImageObject,
    type JobStatus,
    type Props,
    type ReviveInput,
    type UpscaleInput,
} from "../types/index.js"
import { getImageDetails, uploadToCloudinary } from "../utils/cloudinary.js"
import { calculateCreditCost } from "../utils/credit-calculator.js"
import { MODEL_IDS } from "../utils/constants.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ModelType = `${string}/${string}` | `${string}/${string}:${string}`

interface GenerationParams {
    model: ModelType
    // Specific input types lack an index signature; any is appropriate here
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input: Record<string, any>
    jobId: string
    userId: string
    featureType: FeatureType
    filePath?: string
    fileName?: string
    modelName?: string
    aspectRatio?: string
    prompt?: string
    imageType?: string
    creditCost: number
    /** Builds the data payload for Cloudinary upload, given the raw model output and stored imageId */
    buildCloudinaryPayload: (output: string | string[], imageId: unknown) => Record<string, unknown>
}

/** Minimal interface used to set job status — allows injection in tests */
export interface JobStatusSetter {
    setStatus: (jobId: string, status: JobStatus) => Promise<void>
}

/** Injectable services — defaults to real implementations; override in tests */
export interface GenerationServices {
    jobStatus: JobStatusSetter
}

// Re-export so consumers can import calculateCreditCost from one place
export { calculateCreditCost }

// ---------------------------------------------------------------------------
// Internal DB / status helpers
// ---------------------------------------------------------------------------

const logger = createLogger("generation-service")

async function buildImageObject(
    userId: string,
    output: string | string[],
    featureType: FeatureType,
    filePath?: string,
    prompt = "",
    aspectRatio = "",
    modelName = "",
): Promise<IImageObject> {
    const outputArray = Array.isArray(output) ? output : [output]

    const imagePromises = outputArray.map(async (imageUrl) => {
        const { width, height, format, bytes } = await getImageDetails(imageUrl)
        const base = {
            name: "",
            aspectRatio,
            resolution: `${width}x${height}`,
            width,
            height,
            format,
            bytes,
        }

        if (featureType === FeatureType.IMAGE) {
            return { ...base, aiImageUrl: imageUrl, aiImagePublicId: "" }
        }
        return {
            ...base,
            originalImageUrl: filePath ?? "",
            enhancedImageUrl: imageUrl,
            originalPublicId: "",
            enhancedPublicId: "",
        }
    })

    const images = await Promise.all(imagePromises)
    const imageObj: IImageObject = { userId, prompt, featureType, images }
    if (featureType === FeatureType.IMAGE) imageObj.modelName = modelName
    return imageObj
}

async function storeImageInDB(image: IImageObject, userId: string): Promise<IImageObject> {
    const newImage = new Image(image)
    const user = await User.findOneAndUpdate(
        { userId },
        { $push: { history: newImage } },
        { new: true },
    )
    if (!user) logger.error({ userId }, "User not found when storing image")
    return newImage.toObject() as IImageObject
}

async function updateAndGetUserCredits(userId: string, amount: number): Promise<number> {
    const user = await User.findOneAndUpdate(
        { userId },
        { $inc: { credits: -amount } },
        { new: true },
    )
    const credits = user?.credits ?? 0
    logger.debug({ userId, credits }, "User credits after deduction")
    if (!user) logger.error({ userId }, "User not found when updating credits")
    return credits
}

async function finalizeJob(
    jobId: string,
    userId: string,
    imageId: string | undefined,
    jobStatus: JobStatusSetter,
): Promise<void> {
    const user = await User.findOne({ userId })
    const image = user?.history.find((img) => img._id?.toString() === imageId) as IImageObject
    await jobStatus.setStatus(jobId, { status: "completed", image, userCreditsRemaining: null })
}

// ---------------------------------------------------------------------------
// Shared job core
// ---------------------------------------------------------------------------

/**
 * Runs a generation job end-to-end:
 *   model run → store in DB → deduct credits → upload to Cloudinary → complete
 *
 * On failure, sets job status to "error" and re-throws nothing (fire-and-forget).
 */
async function runGenerationJob(
    params: GenerationParams,
    services: GenerationServices = { jobStatus: new RedisService() },
): Promise<void> {
    const {
        model,
        input,
        jobId,
        userId,
        featureType,
        filePath,
        modelName,
        aspectRatio,
        prompt,
        creditCost,
        buildCloudinaryPayload,
    } = params
    const { jobStatus } = services

    try {
        const output = (await replicate.run(
            model as `${string}/${string}`,
            { input },
            (p: Prediction) => {
                logger.debug({ status: p.status }, "Replicate prediction progress")
            },
        )) as string[] | string

        if (!output) {
            logger.error({ model, userId }, "Model returned no output")
            return
        }

        const imageObj = await buildImageObject(
            userId,
            output,
            featureType,
            filePath,
            prompt,
            aspectRatio,
            modelName,
        )
        const newImage = await storeImageInDB(imageObj, userId)
        const credits = await updateAndGetUserCredits(userId, creditCost)

        await jobStatus.setStatus(jobId, {
            status: "processing",
            image: newImage,
            userCreditsRemaining: credits,
        })

        const cloudinaryData = buildCloudinaryPayload(output, newImage._id)
        await uploadToCloudinary(cloudinaryData)
        await finalizeJob(jobId, userId, newImage._id?.toString(), jobStatus)
    } catch (error) {
        logger.error({ err: error, userId, jobId }, "Generation job failed")
        await jobStatus.setStatus(jobId, {
            status: "error",
            image: undefined,
            userCreditsRemaining: null,
        })
    }
}

// ---------------------------------------------------------------------------
// Feature definitions — thin wrappers over runGenerationJob
// ---------------------------------------------------------------------------

const DEFAULT_UPSCALE_PROMPT =
    "masterpiece, best quality, highres, <lora:more_details:0.5> <lora:SDXLrender_v2.0:1>"
const DEFAULT_NEGATIVE_PROMPT =
    "(worst quality, low quality, normal quality:2) JuggernautNegative-neg"

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

    const model = MODEL_IDS[modelId as keyof typeof MODEL_IDS] as ModelType
    const input: AIImageInput = {
        prompt: prompt ?? "",
        output_quality: outputQuality ?? 0,
        aspect_ratio: aspectRatio ?? "",
        output_format: outputFormat ?? "",
    }

    // FLUX_PRO and FLUX_1_1_PRO do not support num_outputs (T5 constraint)
    if (model !== MODEL_IDS.FLUX_1_1_PRO && model !== MODEL_IDS.FLUX_PRO) {
        input.num_outputs = numOfOutputs
    }

    return runGenerationJob({
        model,
        input,
        jobId,
        userId: userId ?? "",
        featureType: FeatureType.IMAGE,
        modelName,
        aspectRatio,
        prompt,
        imageType,
        creditCost: calculateCreditCost(FeatureType.IMAGE, false),
        buildCloudinaryPayload: (output, imageId) => {
            // Multiple outputs → pass array; single → unwrap
            const imageUrl =
                Array.isArray(output) && output.length > 1
                    ? output
                    : Array.isArray(output)
                      ? output[0]
                      : output
            return {
                type: FeatureType.IMAGE,
                imageUrl,
                imageType,
                userId,
                prompt,
                modelName,
                aspectRatio,
                imageId,
            }
        },
    })
}

export async function processUpscale(props: Props): Promise<void> {
    const { body, filePath, fileName } = props
    const { userId, jobId, prompt, creativity, scale, negativePrompt, outputFormat } = body

    const user = await User.findOne({ userId })
    const creditCost = calculateCreditCost(FeatureType.UPSCALE, user?.isPro ?? false)

    const input: UpscaleInput = {
        image: filePath,
        prompt: prompt !== "" ? (prompt ?? "") : DEFAULT_UPSCALE_PROMPT,
        creativity: Number(creativity),
        scale_factor: Number(scale),
        negative_prompt: negativePrompt !== "" ? (negativePrompt ?? "") : DEFAULT_NEGATIVE_PROMPT,
        output_format: outputFormat ?? "",
    }

    return runGenerationJob({
        model: MODEL_IDS.UPSCALE_IMAGE as ModelType,
        input,
        jobId,
        userId: userId ?? "",
        featureType: FeatureType.UPSCALE,
        filePath,
        fileName,
        prompt,
        creditCost,
        buildCloudinaryPayload: (output, imageId) => ({
            type: FeatureType.UPSCALE,
            original: filePath,
            imageUrl: Array.isArray(output) ? output[0] : output,
            originalPublicId: fileName,
            userId,
            prompt,
            imageId,
        }),
    })
}

export async function processRevive(props: Props): Promise<void> {
    const { body, filePath, fileName } = props
    const { userId, jobId } = body

    const user = await User.findOne({ userId })
    const creditCost = calculateCreditCost(FeatureType.REVIVE, user?.isPro ?? false)

    const input: ReviveInput = { img: filePath }

    return runGenerationJob({
        model: MODEL_IDS.REVIVE as ModelType,
        input,
        jobId,
        userId: userId ?? "",
        featureType: FeatureType.REVIVE,
        filePath,
        fileName,
        creditCost,
        buildCloudinaryPayload: (output, imageId) => ({
            type: FeatureType.REVIVE,
            original: filePath,
            imageUrl: output,
            originalPublicId: fileName,
            userId,
            prompt: "",
            imageId,
        }),
    })
}

export async function processColorize(props: Props): Promise<void> {
    const { body, filePath, fileName } = props
    const { userId, jobId, modelId } = body

    const user = await User.findOne({ userId })
    const creditCost = calculateCreditCost(FeatureType.COLORIZE, user?.isPro ?? false)

    const model = MODEL_IDS[modelId as keyof typeof MODEL_IDS] as ModelType
    const input: ColorizeInput = { image: filePath }

    return runGenerationJob({
        model,
        input,
        jobId,
        userId: userId ?? "",
        featureType: FeatureType.COLORIZE,
        filePath,
        fileName,
        creditCost,
        buildCloudinaryPayload: (output, imageId) => ({
            type: FeatureType.COLORIZE,
            original: filePath,
            imageUrl: output,
            originalPublicId: fileName,
            userId,
            prompt: "",
            imageId,
        }),
    })
}

// Re-export runGenerationJob so tests can inject services
export { runGenerationJob }
