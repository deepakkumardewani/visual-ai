import { STT_MAX_BYTES } from "@visual-ai/shared"
import { Router, type Request, type Response } from "express"
import multer from "multer"
import type { NextFunction } from "express"

import { env } from "../config/env.js"
import { asyncHandler } from "../lib/async-handler.js"
import { BadRequestError, HttpError } from "../lib/errors.js"
import { createLogger } from "../lib/logger.js"
import { requireAuth } from "../middlewares/clerk.js"
import { sttRateLimiter } from "../middlewares/rate-limit.js"

const logger = createLogger("stt-route")
const XAI_STT_URL = "https://api.x.ai/v1/stt"
const XAI_STT_MODEL = "grok-voice-transcribe-2.0"
const UPSTREAM_TIMEOUT_MS = 30_000

function isAllowedAudioMime(mimetype: string): boolean {
    if (mimetype.startsWith("audio/")) {
        return true
    }
    return mimetype === "video/webm"
}

const audioUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: STT_MAX_BYTES },
    fileFilter: (_req, file, cb) => {
        if (!isAllowedAudioMime(file.mimetype)) {
            cb(new Error("INVALID_AUDIO_TYPE"))
            return
        }
        cb(null, true)
    },
})

function handleMulterErrors(err: unknown, _req: Request, res: Response, next: NextFunction) {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ message: "Audio file too large" })
    }
    if (err instanceof Error && err.message === "INVALID_AUDIO_TYPE") {
        return res.status(400).json({ message: "Invalid audio file type" })
    }
    return next(err)
}

export const sttRoute = Router()

sttRoute.post(
    "/stt",
    // @ts-ignore
    requireAuth,
    sttRateLimiter,
    (req, res, next) => {
        audioUpload.single("file")(req, res, (err) => {
            if (err) {
                handleMulterErrors(err, req, res, next)
                return
            }
            next()
        })
    },
    asyncHandler(async (req: Request, res: Response) => {
        if (!env.XAI_API_KEY) {
            throw new HttpError(503, "Speech transcription is not configured")
        }

        if (!req.file?.buffer) {
            throw new BadRequestError("No audio file provided")
        }

        const formData = new FormData()
        formData.append("model", XAI_STT_MODEL)
        const audioBytes = Uint8Array.from(req.file.buffer)
        formData.append(
            "file",
            new Blob([audioBytes], { type: req.file.mimetype }),
            req.file.originalname || "recording.webm",
        )

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

        try {
            const upstream = await fetch(XAI_STT_URL, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${env.XAI_API_KEY}`,
                },
                body: formData,
                signal: controller.signal,
            })

            if (!upstream.ok) {
                logger.error({ status: upstream.status }, "xAI STT upstream error")
                throw new HttpError(502, "Transcription failed")
            }

            const payload = (await upstream.json()) as { text?: string }
            const text = typeof payload.text === "string" ? payload.text.trim() : ""
            res.json({ text })
        } catch (error) {
            if (error instanceof HttpError) {
                throw error
            }
            if (error instanceof Error && error.name === "AbortError") {
                throw new HttpError(502, "Transcription timed out")
            }
            logger.error({ err: error }, "xAI STT request failed")
            throw new HttpError(502, "Transcription failed")
        } finally {
            clearTimeout(timeout)
        }
    }),
)
