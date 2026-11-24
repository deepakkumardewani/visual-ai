import type { Prediction } from "replicate"
import { Types } from "mongoose"

import { getMediaCreditCost, getVideoBillableSeconds, MODEL_REGISTRY } from "@visual-ai/shared"
import type {
    MediaAssetDto,
    MediaCostInput,
    MediaModelKey,
    NoChargeReason,
} from "@visual-ai/shared"

import { updateAndGetUserCredits } from "../lib/credit-deduction.js"
import { BadRequestError } from "../lib/errors.js"
import { createLogger, shortId } from "../lib/logger.js"
import { buildMediaInput } from "../lib/media-input.js"
import { deleteUploadedFile } from "../lib/media-upload.js"
import type { UploadPurpose } from "../lib/media-upload.js"
import { isContentSafetyError } from "../lib/prompt-moderation.js"
import { runReplicate } from "../lib/replicate.js"
import { MediaAssetModel } from "../models/media-asset.js"
import { MediaUploadModel } from "../models/media-upload.js"
import { UserModel as User } from "../models/user.js"
import { generationQueue, type MediaJobBody } from "../queue/generation-queue.js"
import {
    copyMediaAssetToCloudinary,
    discardMediaAsset,
    persistMediaAsset,
} from "./media-asset-service.js"
import type { PersistAssetArgs } from "./media-asset-service.js"
import { RedisService } from "./redis-service.js"
import { FeatureType, type JobStatus } from "../types/index.js"

const logger = createLogger("media-service")

/** Request fields that route the job; everything else is a model parameter. */
const NON_MODEL_FIELDS: ReadonlySet<string> = new Set(["jobId", "userId", "modelKey"])

const TIMEOUT_PATTERN = /timeout|timed out/i
const CANCEL_PATTERN = /cancel/i

const CONTENT_SAFETY_MESSAGE =
    "Your text or the generated audio was flagged as sensitive. Please try different wording."
const DEDUCTION_FAILED_MESSAGE = "Insufficient credits"

export interface JobStatusSetter {
    setStatus: (jobId: string, status: JobStatus) => Promise<void>
}

/** Injectable collaborators; defaults are the real ones, tests override them. */
export interface MediaJobServices {
    jobStatus: JobStatusSetter
    deductCredits: (userId: string, amount: number) => Promise<number>
    /** Stores the MediaAsset row, or returns the asset unsaved when the history cap is reached. */
    persistAsset: (args: PersistAssetArgs) => Promise<MediaAssetDto>
    /** Removes a persisted row whose deduction was rejected; omitted by tests that have no database. */
    discardAsset?: (asset: MediaAssetDto, userId: string) => Promise<void>
    /** Copies a saved asset's output to Cloudinary and returns it with the permanent URL. */
    copyToCloudinary: (asset: MediaAssetDto, userId: string) => Promise<MediaAssetDto>
}

export interface MediaJobParams {
    jobId: string
    userId: string
    modelKey: MediaModelKey
    featureType: FeatureType
    input: Record<string, unknown>
    prompt: string
    creditCost: number
}

const defaultServices: MediaJobServices = {
    jobStatus: new RedisService(),
    deductCredits: updateAndGetUserCredits,
    persistAsset: persistMediaAsset,
    discardAsset: discardMediaAsset,
    copyToCloudinary: copyMediaAssetToCloudinary,
}

/** The server-side billable quantity of a music job, derived from the model's pricing unit. */
export function getMusicCostInput(modelKey: MediaModelKey): MediaCostInput {
    const unit = MODEL_REGISTRY[modelKey]?.media?.pricing.unit
    if (unit === "file") return { kind: "file" }
    if (unit === "run") return { kind: "run" }
    throw new BadRequestError(`modelKey: "${modelKey}" has no music pricing`)
}

export function getMusicCreditCost(modelKey: MediaModelKey): number {
    return getMediaCreditCost(modelKey, getMusicCostInput(modelKey))
}

export async function getAvailableCredits(userId: string): Promise<number> {
    const user = await User.findOne({ userId }, { credits: 1, dailyCredits: 1 })
    return (user?.dailyCredits ?? 0) + (user?.credits ?? 0)
}

/**
 * Looks up an already-queued or already-persisted job so a repeated jobId never enqueues a
 * second paid run. BullMQ forgets completed jobs after an hour, so the unique-indexed
 * MediaAsset row is the durable record. A jobId owned by another user is rejected rather than disclosed.
 */
export async function hasExistingJob(jobId: string, userId: string): Promise<boolean> {
    const existing = await generationQueue.getJob(jobId)
    if (!existing) return MediaAssetModel.exists({ jobId }).then(Boolean)
    const owner = (existing.data as { body?: { userId?: string } }).body?.userId
    if (owner !== userId) throw new BadRequestError("jobId: already in use")
    return true
}

function classifyFailure(message: string): NoChargeReason {
    if (isContentSafetyError(message)) return "CONTENT_SAFETY"
    if (TIMEOUT_PATTERN.test(message)) return "TIMEOUT"
    if (CANCEL_PATTERN.test(message)) return "CANCELED"
    return "FAILED"
}

// Only remote https output may reach Cloudinary; a bare string would be read as a local path.
const HTTPS_URL_PATTERN = /^https:\/\//i

/** Replicate returns a URL, or a list of them; the first is the primary output. */
function firstOutputUrl(output: unknown): string | undefined {
    const first = Array.isArray(output) ? output[0] : output
    return typeof first === "string" && HTTPS_URL_PATTERN.test(first) ? first : undefined
}

async function reportNoCharge(
    jobStatus: JobStatusSetter,
    jobId: string,
    reason: NoChargeReason,
    message?: string,
): Promise<void> {
    await jobStatus.setStatus(jobId, {
        status: "error",
        image: undefined,
        userCreditsRemaining: null,
        noCharge: true,
        reason,
        message,
    })
}

/**
 * Runs a media job in the same order as runGenerationJob (SPEC R-INF-6):
 *   Replicate run -> persist record -> deduct once -> copy to Cloudinary -> complete.
 * Anything that fails before the deduction charges nothing; a failed deduction delivers no asset.
 */
export async function runMediaJob(
    params: MediaJobParams,
    services: MediaJobServices = defaultServices,
): Promise<void> {
    const { jobId, userId, modelKey, input, creditCost } = params
    const { jobStatus } = services
    const jid = shortId(jobId)
    const startedAt = Date.now()
    const elapsed = () => `${((Date.now() - startedAt) / 1000).toFixed(1)}s`

    logger.info(`media started  job=${jid} model=${modelKey} cost=${creditCost}`)

    let output: unknown
    try {
        await jobStatus.setStatus(jobId, {
            status: "processing",
            image: undefined,
            userCreditsRemaining: null,
            stage: "composing",
        })
        output = await runReplicate({
            userId,
            model: MODEL_REGISTRY[modelKey].replicateId as `${string}/${string}`,
            input,
            onProgress: (p: Prediction) => logger.debug(`media progress job=${jid} ${p.status}`),
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        const reason = classifyFailure(message)
        logger.error({ err: error }, `media failed   job=${jid} reason=${reason} +${elapsed()}`)
        await reportNoCharge(
            jobStatus,
            jobId,
            reason,
            reason === "CONTENT_SAFETY" ? CONTENT_SAFETY_MESSAGE : undefined,
        )
        return
    }

    const outputUrl = firstOutputUrl(output)
    if (!outputUrl) {
        logger.error(`media failed   job=${jid} reason=no_output +${elapsed()}`)
        await reportNoCharge(jobStatus, jobId, "FAILED")
        return
    }

    const settled = await settleJob(params, outputUrl, services)
    if (!settled.ok) {
        logger.error({ err: settled.error }, `media failed   job=${jid} stage=settle +${elapsed()}`)
        if (settled.charged) {
            await jobStatus.setStatus(jobId, {
                status: "error",
                image: undefined,
                userCreditsRemaining: null,
            })
            return
        }
        await reportNoCharge(jobStatus, jobId, "FAILED", settled.message)
        return
    }
    logger.info(`media done     job=${jid} credits=${settled.credits} +${elapsed()}`)
}

type SettleResult =
    | { ok: true; credits: number }
    | { ok: false; error: unknown; message?: string; charged?: boolean }

/**
 * Persist, deduct once, copy, complete. A rejected deduction ends in error with no asset
 * delivered; the Replicate cost is absorbed, matching the image flow.
 */
async function settleJob(
    params: MediaJobParams,
    outputUrl: string,
    services: MediaJobServices,
): Promise<SettleResult> {
    const { jobId, userId, modelKey, featureType, prompt, creditCost, input } = params
    const { jobStatus } = services

    let persisted: MediaAssetDto
    try {
        persisted = await services.persistAsset({
            userId,
            jobId,
            modelKey,
            featureType,
            prompt,
            outputUrl,
            creditsCharged: creditCost,
            params: input,
        })
    } catch (error) {
        return { ok: false, error }
    }

    let credits: number
    try {
        credits = await services.deductCredits(userId, creditCost)
    } catch (error) {
        await services.discardAsset?.(persisted, userId)
        return { ok: false, error, message: DEDUCTION_FAILED_MESSAGE }
    }

    try {
        await jobStatus.setStatus(jobId, {
            status: "processing",
            image: undefined,
            userCreditsRemaining: credits,
            stage: "saving",
        })
        const asset = await services.copyToCloudinary(persisted, userId)
        await jobStatus.setStatus(jobId, {
            status: "completed",
            image: undefined,
            userCreditsRemaining: credits,
            assetId: asset.id,
            asset,
            credits: creditCost,
        })
    } catch (error) {
        // Already deducted, so this must not be reported as free.
        return { ok: false, error, charged: true }
    }
    return { ok: true, credits }
}

/** Splits the queued body into model parameters (userId, jobId and modelKey never reach Replicate). */
function modelParamsOf(body: MediaJobBody): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(body).filter(([field]) => !NON_MODEL_FIELDS.has(field)),
    )
}

export async function processMusic(body: MediaJobBody, services?: MediaJobServices): Promise<void> {
    const modelKey = body.modelKey as MediaModelKey
    const params = modelParamsOf(body)
    return runMediaJob(
        {
            jobId: body.jobId,
            userId: body.userId,
            modelKey,
            featureType: FeatureType.MUSIC,
            input: buildMediaInput(modelKey, "music", params),
            prompt: typeof params.prompt === "string" ? params.prompt : "",
            // Recomputed here: the queued payload carries no trusted cost.
            creditCost: getMusicCreditCost(modelKey),
        },
        services,
    )
}

/** Song studio always renders with Minimax Music 2.6; the client never picks the model. */
export const SONG_MODEL_KEY: MediaModelKey = "MINIMAX_MUSIC_26"

export function getSongCreditCost(): number {
    return getMediaCreditCost(SONG_MODEL_KEY, { kind: "file" })
}

export async function processSong(body: MediaJobBody, services?: MediaJobServices): Promise<void> {
    const params = modelParamsOf(body)
    return runMediaJob(
        {
            jobId: body.jobId,
            userId: body.userId,
            modelKey: SONG_MODEL_KEY,
            featureType: FeatureType.SONG,
            input: buildMediaInput(SONG_MODEL_KEY, "song", params),
            prompt: typeof params.stylePrompt === "string" ? params.stylePrompt : "",
            // Recomputed here: the queued payload carries no trusted cost.
            creditCost: getSongCreditCost(),
        },
        services,
    )
}

/**
 * The billable quantity of a speech job: the length of the final serialized text. Computed here,
 * never read from the client; Minimax tokens are billed as characters (assumption A4).
 */
export function getSpeechCharCount(text: string): number {
    return text.length
}

export function getSpeechCreditCost(modelKey: MediaModelKey, text: string): number {
    return getMediaCreditCost(modelKey, { kind: "chars", chars: getSpeechCharCount(text) })
}

export async function processSpeech(
    body: MediaJobBody,
    services?: MediaJobServices,
): Promise<void> {
    const modelKey = body.modelKey as MediaModelKey
    const params = modelParamsOf(body)
    const text = typeof params.text === "string" ? params.text : ""
    return runMediaJob(
        {
            jobId: body.jobId,
            userId: body.userId,
            modelKey,
            featureType: FeatureType.SPEECH,
            input: buildMediaInput(modelKey, "tts", params),
            prompt: text,
            // Recomputed here: the queued payload carries no trusted cost.
            creditCost: getSpeechCreditCost(modelKey, text),
        },
        services,
    )
}

/** The upload purposes a video job's image and audio attachments must have been stored under. */
const VIDEO_IMAGE_PURPOSE: UploadPurpose = "video-image"
const VIDEO_AUDIO_PURPOSE: UploadPurpose = "video-audio"

export interface VideoUploadIds {
    imageUploadId?: string
    audioUploadId?: string
}

export interface VideoAttachments {
    imageUrl?: string
    audioUrl?: string
    /** Stored duration of the audio file (read from Cloudinary at upload), never a client value. */
    audioDurationSec?: number
}

interface StoredUpload {
    _id: unknown
    url: string
    publicId: string
    mime: string
    durationSec?: number | null
}

/** Only the owner's own, unexpired upload of the expected purpose may be attached. */
async function findOwnedUpload(
    uploadId: string,
    userId: string,
    purpose: UploadPurpose,
    field: string,
): Promise<StoredUpload> {
    const row = Types.ObjectId.isValid(uploadId)
        ? await MediaUploadModel.findOne({
              _id: uploadId,
              userId,
              purpose,
              expiresAt: { $gt: new Date() },
          }).lean()
        : null
    if (!row) throw new BadRequestError(`${field}: upload not found or expired`)
    return row
}

/** Resolves the attached uploads to their stored URLs and audio length. */
export async function resolveVideoAttachments(
    userId: string,
    ids: VideoUploadIds,
): Promise<VideoAttachments> {
    const [image, audio] = await Promise.all([
        ids.imageUploadId
            ? findOwnedUpload(ids.imageUploadId, userId, VIDEO_IMAGE_PURPOSE, "imageUploadId")
            : undefined,
        ids.audioUploadId
            ? findOwnedUpload(ids.audioUploadId, userId, VIDEO_AUDIO_PURPOSE, "audioUploadId")
            : undefined,
    ])
    // Without a stored length the charge would fall back to the client's duration: refuse instead.
    if (audio && !audio.durationSec) {
        throw new BadRequestError(
            "audioUploadId: the audio length could not be read. Upload it again.",
        )
    }
    return {
        imageUrl: image?.url,
        audioUrl: audio?.url,
        audioDurationSec: audio?.durationSec ?? undefined,
    }
}

export interface VideoCostParams {
    durationSec: number
    resolution: string
    draft?: boolean
    audioDurationSec?: number
}

export function getVideoCreditCost(modelKey: MediaModelKey, params: VideoCostParams): number {
    return getMediaCreditCost(modelKey, {
        kind: "seconds",
        durationSec: getVideoBillableSeconds(params),
        resolution: params.resolution,
        draft: params.draft,
    })
}

/** Attachment ids and the client-side cost inputs never reach Replicate; the URLs replace them. */
const VIDEO_ATTACHMENT_FIELDS: readonly string[] = ["imageUploadId", "audioUploadId"]

function videoParamsOf(body: MediaJobBody): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(modelParamsOf(body)).filter(
            ([field]) => !VIDEO_ATTACHMENT_FIELDS.includes(field),
        ),
    )
}

/** Wraps the job-status sink to learn whether the job reached `completed` (charged and delivered). */
function trackCompletion(services: MediaJobServices): {
    services: MediaJobServices
    completed: () => boolean
} {
    let completed = false
    return {
        completed: () => completed,
        services: {
            ...services,
            jobStatus: {
                setStatus: (jobId, status) => {
                    if (status.status === "completed") completed = true
                    return services.jobStatus.setStatus(jobId, status)
                },
            },
        },
    }
}

/** Attached files are single-use: once the video is delivered they are removed everywhere. */
async function deleteConsumedUploads(userId: string, ids: VideoUploadIds): Promise<void> {
    const uploadIds = [ids.imageUploadId, ids.audioUploadId].filter(
        (id): id is string => typeof id === "string",
    )
    const rows = await MediaUploadModel.find({ _id: { $in: uploadIds }, userId }).lean()
    for (const row of rows) {
        try {
            await deleteUploadedFile(row)
            await MediaUploadModel.deleteOne({ _id: row._id })
        } catch (error) {
            // Left in place: the hourly expired-upload sweep retries it.
            logger.error({ err: error, uploadId: String(row._id) }, "Failed to delete used upload")
        }
    }
}

export async function processVideo(
    body: MediaJobBody,
    services: MediaJobServices = defaultServices,
): Promise<void> {
    const modelKey = body.modelKey as MediaModelKey
    const params = videoParamsOf(body)
    const ids: VideoUploadIds = {
        imageUploadId: typeof body.imageUploadId === "string" ? body.imageUploadId : undefined,
        audioUploadId: typeof body.audioUploadId === "string" ? body.audioUploadId : undefined,
    }
    const attachments = await resolveVideoAttachments(body.userId, ids)
    const costParams: VideoCostParams = {
        durationSec: Number(params.durationSec),
        resolution: String(params.resolution),
        draft: params.draft === true,
        audioDurationSec: attachments.audioDurationSec,
    }
    const tracked = trackCompletion(services)
    await runMediaJob(
        {
            jobId: body.jobId,
            userId: body.userId,
            modelKey,
            featureType: FeatureType.VIDEO,
            input: buildMediaInput(modelKey, "video", {
                ...params,
                // The server-derived length, so the model never runs longer than what was billed.
                durationSec: getVideoBillableSeconds(costParams),
                image: attachments.imageUrl,
                audio: attachments.audioUrl,
            }),
            prompt: typeof params.prompt === "string" ? params.prompt : "",
            // Recomputed here: the queued payload carries no trusted cost.
            creditCost: getVideoCreditCost(modelKey, costParams),
        },
        tracked.services,
    )
    // A draft keeps its files so "Render final" can reuse them; the expired-upload sweep covers the rest.
    if (tracked.completed() && !costParams.draft) await deleteConsumedUploads(body.userId, ids)
}
