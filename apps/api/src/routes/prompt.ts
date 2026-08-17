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
import { ClerkExpressRequireAuth } from "../middlewares/clerk.js"
import { memoryUpload } from "../middlewares/multer.js"

const logger = createLogger("prompt-route")

export const promptRoutes = Router()

promptRoutes.post(
    "/prompt/improve",
    // @ts-ignore
    ClerkExpressRequireAuth({}),
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
    ClerkExpressRequireAuth({}),
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
    ClerkExpressRequireAuth({}),
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
