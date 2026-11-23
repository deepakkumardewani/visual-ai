import { Router } from "express"
import type { NextFunction, Request, Response } from "express"
import multer from "multer"

import { MAX_VERSION_FILE_BYTES, MusicRequestSchema, SongRequestSchema } from "@visual-ai/shared"
import type { MediaAssetType, MediaModelKey } from "@visual-ai/shared"

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
import {
    createVersion,
    deleteMediaAsset,
    getMediaAsset,
    listMediaAssets,
} from "../services/media-asset-service.js"
import {
    getAvailableCredits,
    getMusicCreditCost,
    getSongCreditCost,
    hasExistingJob,
    SONG_MODEL_KEY,
} from "../services/media-service.js"

export const mediaRoutes = Router()

const PROMPT_REJECTED_CODE = "PROMPT_REJECTED"
const PROMPT_REJECTED_MESSAGE = "This text can't be used. Try rephrasing it."
const INSUFFICIENT_CREDITS_CODE = "INSUFFICIENT_CREDITS"

const MEDIA_TYPES: readonly MediaAssetType[] = ["audio", "video"]
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

mediaRoutes.post(
    "/generate/audio/music",
    // @ts-ignore
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
        const userId = sessionUserId(req)

        const parsed = MusicRequestSchema.safeParse(req.body)
        if (!parsed.success) {
            const [issue] = parsed.error.issues
            throw new BadRequestError(
                `${issue?.path.join(".") || "body"}: ${issue?.message ?? "invalid request"}`,
            )
        }
        const { jobId, modelKey, ...params } = parsed.data
        validateMediaParams(modelKey, "music", params)

        const mediaKey = modelKey as MediaModelKey
        const required = getMusicCreditCost(mediaKey)

        const textToCheck = [params.prompt, params.negativePrompt].filter(Boolean).join("\n")
        const safety = await checkPromptSafety(textToCheck)
        if (!safety.safe) {
            res.status(422).json({ code: PROMPT_REJECTED_CODE, error: PROMPT_REJECTED_MESSAGE })
            return
        }

        const available = await getAvailableCredits(userId)
        if (available < required) {
            res.status(402).json({ code: INSUFFICIENT_CREDITS_CODE, required, available })
            return
        }

        if (await hasExistingJob(jobId, userId)) {
            acceptResponse(res)
            return
        }

        await enqueueGeneration({
            kind: "music",
            body: { ...params, jobId, modelKey: mediaKey, userId },
            isPro: await resolveUserIsPro(userId),
        })
        acceptResponse(res)
    }),
)

mediaRoutes.post(
    "/generate/audio/song",
    // @ts-ignore
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
        const userId = sessionUserId(req)

        const parsed = SongRequestSchema.safeParse(req.body)
        if (!parsed.success) {
            const [issue] = parsed.error.issues
            throw new BadRequestError(
                `${issue?.path.join(".") || "body"}: ${issue?.message ?? "invalid request"}`,
            )
        }
        const { jobId, prompt, lyrics } = parsed.data
        const params = { stylePrompt: prompt, lyrics }
        validateMediaParams(SONG_MODEL_KEY, "song", params)

        const required = getSongCreditCost()

        const safety = await checkPromptSafety([prompt, lyrics].join("\n"))
        if (!safety.safe) {
            res.status(422).json({ code: PROMPT_REJECTED_CODE, error: PROMPT_REJECTED_MESSAGE })
            return
        }

        const available = await getAvailableCredits(userId)
        if (available < required) {
            res.status(402).json({ code: INSUFFICIENT_CREDITS_CODE, required, available })
            return
        }

        if (await hasExistingJob(jobId, userId)) {
            acceptResponse(res)
            return
        }

        await enqueueGeneration({
            kind: "song",
            body: { ...params, jobId, modelKey: SONG_MODEL_KEY, userId },
            isPro: await resolveUserIsPro(userId),
        })
        acceptResponse(res)
    }),
)

function parseListQuery(req: Request) {
    const { type, cursor, limit } = req.query
    if (type !== undefined && !MEDIA_TYPES.includes(type as MediaAssetType)) {
        throw new BadRequestError("type: must be audio or video")
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
