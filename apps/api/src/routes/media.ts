import { Router } from "express"
import type { NextFunction, Request, Response } from "express"
import multer from "multer"

import {
    AutocaptionRequestSchema,
    ImageWatermarkRequestSchema,
    MAX_VERSION_FILE_BYTES,
    MusicRequestSchema,
    SongRequestSchema,
    SpeechRequestSchema,
    VideoRequestSchema,
    VideoWatermarkRequestSchema,
} from "@visual-ai/shared"
import type { MediaAssetType, MediaModelKey } from "@visual-ai/shared"
import type { ZodType } from "zod"

import { asyncHandler } from "../lib/async-handler.js"
import { BadRequestError, UnauthorizedError } from "../lib/errors.js"
import { validateMediaParams } from "../lib/media-input.js"
import {
    createMediaUpload,
    parseUploadPurpose,
    removeTempFile,
    sniffMime,
    UPLOAD_PURPOSES,
} from "../lib/media-upload.js"
import type { UploadPurpose } from "../lib/media-upload.js"
import { checkPromptSafety } from "../lib/prompt-moderation.js"
import { requireAuth } from "../middlewares/clerk.js"
import { mapUploadError, UPLOAD_BY_KIND } from "../middlewares/multer.js"
import { uploadRateLimiter } from "../middlewares/rate-limit.js"
import { resolveUserIsPro } from "../services/generation-service.js"
import { enqueueGeneration } from "../queue/generation-queue.js"
import type { MediaJobBody, MediaJobKind } from "../queue/generation-queue.js"
import {
    createVersion,
    deleteMediaAsset,
    getMediaAsset,
    listMediaAssets,
} from "../services/media-asset-service.js"
import {
    getAutocaptionCreditCost,
    getAvailableCredits,
    getImageWatermarkCreditCost,
    getMusicCreditCost,
    getSongCreditCost,
    getSpeechCreditCost,
    getVideoCreditCost,
    getVideoWatermarkCreditCost,
    resolveToolUpload,
    resolveVideoAttachments,
    hasExistingJob,
    SONG_MODEL_KEY,
} from "../services/media-service.js"

export const mediaRoutes = Router()

const PROMPT_REJECTED_CODE = "PROMPT_REJECTED"
const PROMPT_REJECTED_MESSAGE = "This text can't be used. Try rephrasing it."
const INSUFFICIENT_CREDITS_CODE = "INSUFFICIENT_CREDITS"

const MEDIA_TYPES: readonly MediaAssetType[] = ["audio", "video", "image"]
const MEDIA_MIME_PATTERN = /^(audio|video)\//
/** Enough leading bytes for every signature sniffMime checks. */
const SNIFF_HEAD_BYTES = 16

/** Exported edits only; content sniffing and per-type limits arrive with the upload middleware. */
const versionUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_VERSION_FILE_BYTES },
    fileFilter: (_req, file, cb) => {
        if (!MEDIA_MIME_PATTERN.test(file.mimetype)) {
            cb(new BadRequestError("file: only audio or video files are allowed"))
            return
        }
        cb(null, true)
    },
})

/** The client MIME is spoofable, so the file's magic bytes decide whether it is audio or video. */
function assertAudioOrVideo(buffer: Buffer) {
    const mime = sniffMime(Uint8Array.from(buffer.subarray(0, SNIFF_HEAD_BYTES)))
    if (!mime || !MEDIA_MIME_PATTERN.test(mime)) {
        throw new BadRequestError("file: unsupported or unrecognized file type")
    }
}

/** Mirrors acceptResponse in routes/generate.ts so the web handles both identically. */
function acceptResponse(res: Response) {
    res.status(202).json({
        message: "Processing started",
        status: "processing",
    })
}

/** The only trusted identity: the verified session. A body userId is never read. */
function sessionUserId(req: Request): string {
    const userId = req.auth?.userId
    if (!userId) throw new UnauthorizedError()
    return userId
}

/** Parses a request body, naming the first offending field so the client can show it inline. */
function parseBody<T>(schema: ZodType<T>, body: unknown): T {
    const parsed = schema.safeParse(body)
    if (parsed.success) return parsed.data
    const [issue] = parsed.error.issues
    throw new BadRequestError(
        `${issue?.path.join(".") || "body"}: ${issue?.message ?? "invalid request"}`,
    )
}

interface QueueMediaJobArgs {
    userId: string
    kind: MediaJobKind
    body: MediaJobBody
    /** Credits the job will cost, computed server-side. */
    required: number
}

/**
 * The tail every media route shares: reject with 402 when the user cannot afford the job,
 * accept a repeated jobId without a second paid run, otherwise enqueue it.
 */
async function queueMediaJob(res: Response, args: QueueMediaJobArgs): Promise<void> {
    const { userId, kind, body, required } = args
    const available = await getAvailableCredits(userId)
    if (available < required) {
        res.status(402).json({ code: INSUFFICIENT_CREDITS_CODE, required, available })
        return
    }
    if (await hasExistingJob(body.jobId, userId)) {
        acceptResponse(res)
        return
    }
    await enqueueGeneration({ kind, body, isPro: await resolveUserIsPro(userId) })
    acceptResponse(res)
}

mediaRoutes.post(
    "/generate/audio/music",
    // @ts-ignore
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
        const userId = sessionUserId(req)

        const data = parseBody(MusicRequestSchema, req.body)
        const { jobId, modelKey, ...params } = data
        validateMediaParams(modelKey, "music", params)

        const mediaKey = modelKey as MediaModelKey
        const required = getMusicCreditCost(mediaKey)

        const textToCheck = [params.prompt, params.negativePrompt].filter(Boolean).join("\n")
        const safety = await checkPromptSafety(textToCheck)
        if (!safety.safe) {
            res.status(422).json({ code: PROMPT_REJECTED_CODE, error: PROMPT_REJECTED_MESSAGE })
            return
        }

        await queueMediaJob(res, {
            userId,
            kind: "music",
            body: { ...params, jobId, modelKey: mediaKey, userId },
            required,
        })
    }),
)

mediaRoutes.post(
    "/generate/audio/song",
    // @ts-ignore
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
        const userId = sessionUserId(req)

        const data = parseBody(SongRequestSchema, req.body)
        const { jobId, prompt, lyrics } = data
        const params = { stylePrompt: prompt, lyrics }
        validateMediaParams(SONG_MODEL_KEY, "song", params)

        const required = getSongCreditCost()

        const safety = await checkPromptSafety([prompt, lyrics].join("\n"))
        if (!safety.safe) {
            res.status(422).json({ code: PROMPT_REJECTED_CODE, error: PROMPT_REJECTED_MESSAGE })
            return
        }

        await queueMediaJob(res, {
            userId,
            kind: "song",
            body: { ...params, jobId, modelKey: SONG_MODEL_KEY, userId },
            required,
        })
    }),
)

mediaRoutes.post(
    "/generate/audio/speech",
    // @ts-ignore
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
        const userId = sessionUserId(req)

        const data = parseBody(SpeechRequestSchema, req.body)
        const { jobId, modelKey, ...params } = data
        validateMediaParams(modelKey, "tts", params)

        const mediaKey = modelKey as MediaModelKey
        // Quantity comes from the submitted text, never from a client-sent count or cost.
        const required = getSpeechCreditCost(mediaKey, params.text)

        const safety = await checkPromptSafety(params.text)
        if (!safety.safe) {
            res.status(422).json({ code: PROMPT_REJECTED_CODE, error: PROMPT_REJECTED_MESSAGE })
            return
        }

        await queueMediaJob(res, {
            userId,
            kind: "speech",
            body: { ...params, jobId, modelKey: mediaKey, userId },
            required,
        })
    }),
)

mediaRoutes.post(
    "/generate/video",
    // @ts-ignore
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
        const userId = sessionUserId(req)

        const data = parseBody(VideoRequestSchema, req.body)
        const { jobId, modelKey, imageUploadId, audioUploadId, ...params } = data
        validateMediaParams(modelKey, "video", params)

        // Duration for billing comes from the stored audio file, never from the client.
        const attachments = await resolveVideoAttachments(userId, {
            imageUploadId,
            audioUploadId,
        })
        const mediaKey = modelKey as MediaModelKey
        const required = getVideoCreditCost(mediaKey, {
            ...params,
            audioDurationSec: attachments.audioDurationSec,
        })

        const safety = await checkPromptSafety(params.prompt)
        if (!safety.safe) {
            res.status(422).json({ code: PROMPT_REJECTED_CODE, error: PROMPT_REJECTED_MESSAGE })
            return
        }

        await queueMediaJob(res, {
            userId,
            kind: "video",
            body: { ...params, imageUploadId, audioUploadId, jobId, modelKey: mediaKey, userId },
            required,
        })
    }),
)

/** A tool's input file is named by upload id; its URL and (for video) duration come from storage. */
mediaRoutes.post(
    "/generate/tools/image-watermark",
    // @ts-ignore
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
        const userId = sessionUserId(req)
        const data = parseBody(ImageWatermarkRequestSchema, req.body)
        await resolveToolUpload(userId, data.uploadId, "image")

        await queueMediaJob(res, {
            userId,
            kind: "image-watermark",
            body: { ...data, modelKey: "IMAGE_WATERMARK", userId },
            required: getImageWatermarkCreditCost(),
        })
    }),
)

mediaRoutes.post(
    "/generate/tools/video-watermark",
    // @ts-ignore
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
        const userId = sessionUserId(req)
        const data = parseBody(VideoWatermarkRequestSchema, req.body)
        await resolveToolUpload(userId, data.uploadId, "video")

        await queueMediaJob(res, {
            userId,
            kind: "video-watermark",
            body: { ...data, modelKey: "VIDEO_WATERMARK", userId },
            required: getVideoWatermarkCreditCost(),
        })
    }),
)

mediaRoutes.post(
    "/generate/tools/autocaption",
    // @ts-ignore
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
        const userId = sessionUserId(req)
        const data = parseBody(AutocaptionRequestSchema, req.body)
        const video = await resolveToolUpload(userId, data.uploadId, "video")

        await queueMediaJob(res, {
            userId,
            kind: "autocaption",
            body: { ...data, modelKey: "AUTOCAPTION", userId },
            // Billed from the stored duration, never from the client.
            required: getAutocaptionCreditCost(video.durationSec ?? 0),
        })
    }),
)

function parseListQuery(req: Request) {
    const { type, cursor, limit } = req.query
    if (type !== undefined && !MEDIA_TYPES.includes(type as MediaAssetType)) {
        throw new BadRequestError("type: must be audio, video or image")
    }
    const parsedLimit = limit === undefined ? undefined : Number(limit)
    if (parsedLimit !== undefined && !Number.isInteger(parsedLimit)) {
        throw new BadRequestError("limit: must be an integer")
    }
    return {
        type: type as MediaAssetType | undefined,
        cursor: typeof cursor === "string" && cursor ? cursor : undefined,
        limit: parsedLimit,
    }
}

mediaRoutes.get(
    "/media/assets",
    // @ts-ignore
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
        res.json(await listMediaAssets(sessionUserId(req), parseListQuery(req)))
    }),
)

mediaRoutes.get(
    "/media/assets/:id",
    // @ts-ignore
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
        res.json(await getMediaAsset(sessionUserId(req), String(req.params.id)))
    }),
)

mediaRoutes.delete(
    "/media/assets/:id",
    // @ts-ignore
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
        await deleteMediaAsset(sessionUserId(req), String(req.params.id))
        res.status(204).end()
    }),
)

mediaRoutes.post(
    "/media/assets/:id/versions",
    // @ts-ignore
    requireAuth,
    versionUpload.single("file"),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = sessionUserId(req)
        if (!req.file) throw new BadRequestError("file: required")
        assertAudioOrVideo(req.file.buffer)
        res.status(201).json(await createVersion(userId, String(req.params.id), req.file.buffer))
    }),
)

const UPLOAD_FILE_FIELD = "file"

/**
 * The purpose arrives as the `purpose` query parameter because multer must pick its limits
 * (and memory vs disk storage) before the multipart body is read. A `purpose` form field,
 * when sent, must agree with it.
 */
function parseUpload(req: Request, res: Response, next: NextFunction) {
    let purpose: UploadPurpose
    try {
        purpose = parseUploadPurpose(req.query.purpose)
    } catch (err) {
        next(err)
        return
    }
    const handler = UPLOAD_BY_KIND[UPLOAD_PURPOSES[purpose].kind].single(UPLOAD_FILE_FIELD)
    handler(req, res, (err?: unknown) => {
        if (err) {
            next(mapUploadError(err, purpose))
            return
        }
        const claimed = req.body?.purpose
        if (claimed === undefined || claimed === purpose) {
            next()
            return
        }
        // The route handler's finally never runs on this path, so free the spooled file here.
        void removeTempFile(req.file).then(() => next(mismatchedPurposeError()))
    })
}

function mismatchedPurposeError() {
    return new BadRequestError("purpose: does not match the upload request")
}

mediaRoutes.post(
    "/media/uploads",
    // @ts-ignore
    requireAuth,
    uploadRateLimiter,
    parseUpload,
    asyncHandler(async (req: Request, res: Response) => {
        const userId = sessionUserId(req)
        try {
            if (!req.file) throw new BadRequestError("file: required")
            const purpose = parseUploadPurpose(req.query.purpose)
            res.status(201).json(await createMediaUpload({ userId, purpose, file: req.file }))
        } finally {
            await removeTempFile(req.file)
        }
    }),
)
