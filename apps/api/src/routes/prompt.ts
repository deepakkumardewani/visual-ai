import { LyricsRequestSchema } from "@visual-ai/shared"
import { Router } from "express"
import { Request, Response } from "express"

import { asyncHandler } from "../lib/async-handler.js"
import { BadRequestError, HttpError } from "../lib/errors.js"
import { createLogger } from "../lib/logger.js"
import {
    describeImageFromBuffer,
    generateRandomPrompt,
    improveUserPrompt,
} from "../lib/prompt-actions.js"
import {
    LYRICS_REJECTED_MESSAGE,
    LyricsRejectedError,
    generateLyrics,
} from "../lib/lyrics-generator.js"
import { requireAuth } from "../middlewares/clerk.js"
import { memoryUpload } from "../middlewares/multer.js"
import { lyricsRateLimiter } from "../middlewares/rate-limit.js"

const logger = createLogger("prompt-route")

const LYRICS_REJECTED_CODE = "PROMPT_REJECTED"

export const promptRoutes = Router()

promptRoutes.post(
    "/prompt/improve",
    // @ts-ignore
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
        const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : ""
        if (!prompt) {
            throw new BadRequestError("Prompt is required")
        }

        try {
            const text = await improveUserPrompt(prompt)
            res.json({ text })
        } catch (error) {
            logger.error({ err: error }, "Failed to improve prompt")
            throw new HttpError(502, "Failed to improve prompt")
        }
    }),
)

promptRoutes.post(
    "/prompt/random",
    // @ts-ignore
    requireAuth,
    asyncHandler(async (_req: Request, res: Response) => {
        try {
            const text = await generateRandomPrompt()
            res.json({ text })
        } catch (error) {
            logger.error({ err: error }, "Failed to generate random prompt")
            throw new HttpError(502, "Failed to generate random prompt")
        }
    }),
)

promptRoutes.post(
    "/prompt/describe",
    // @ts-ignore
    requireAuth,
    memoryUpload.single("image"),
    asyncHandler(async (req: Request, res: Response) => {
        if (!req.file?.buffer) {
            throw new BadRequestError("No image file provided")
        }

        try {
            const text = await describeImageFromBuffer(req.file.buffer, req.file.mimetype)
            res.json({ text })
        } catch (error) {
            logger.error({ err: error }, "Failed to describe image")
            throw new HttpError(502, "Failed to describe image")
        }
    }),
)

// Free to the user: no credit check or deduction. Rate limit runs after auth so it keys by user.
promptRoutes.post(
    "/prompt/lyrics",
    // @ts-ignore
    requireAuth,
    lyricsRateLimiter,
    asyncHandler(async (req: Request, res: Response) => {
        const parsed = LyricsRequestSchema.safeParse(req.body)
        if (!parsed.success) {
            const issue = parsed.error.issues[0]
            throw new BadRequestError(
                `${issue?.path.join(".") || "body"}: ${issue?.message ?? "invalid request"}`,
            )
        }

        try {
            const lyrics = await generateLyrics({
                userId: req.auth!.userId!,
                request: parsed.data,
            })
            res.json({ lyrics })
        } catch (error) {
            if (error instanceof LyricsRejectedError) {
                res.status(422).json({ code: LYRICS_REJECTED_CODE, error: LYRICS_REJECTED_MESSAGE })
                return
            }
            throw error
        }
    }),
)
