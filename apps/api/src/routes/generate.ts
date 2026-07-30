import { Router } from "express"
import { Request, Response } from "express"

import { asyncHandler } from "../lib/async-handler.js"
import { BadRequestError } from "../lib/errors.js"
import { createLogger } from "../lib/logger.js"
import {
    processColorize,
    processImage,
    processRemoveBg,
    processRevive,
    processUpscale,
} from "../services/generation-service.js"
import { ClerkExpressRequireAuth } from "../middlewares/clerk.js"
import { upload } from "../middlewares/multer.js"
import { RedisService } from "../services/redis-service.js"
import { Props } from "../types"

const logger = createLogger("generate-route")

const jobStatusService = new RedisService()

export const generateRoute = Router()

// Real-time Progress Tracking Endpoint
// Provides SSE (Server-Sent Events) for tracking upscale job progress
generateRoute.get("/progress", async (req: Request, res: Response) => {
    const jobId = req.query.jobId as string

    // Set headers for SSE
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "Content-Encoding": "none",
    })

    await jobStatusService.setStatus(jobId, {
        status: "processing",
        image: undefined,
        userCreditsRemaining: null,
    })

    // Send initial status
    const status = await jobStatusService.getStatus(jobId)
    if (status) {
        res.write(`data: ${JSON.stringify(status)}\n\n`)
    }

    const interval = setInterval(async () => {
        const status = await jobStatusService.getStatus(jobId)
        if (status) {
            res.write(`data: ${JSON.stringify(status)}\n\n`)
        }

        if (
            status?.image &&
            status?.userCreditsRemaining !== null &&
            (status?.status === "completed" || status?.status === "error")
        ) {
            res.write(`data: ${JSON.stringify(status)}\n\n`)
        }
    }, 1000)

    const cleanup = async () => {
        logger.debug("Connection closed")
        clearInterval(interval)
        await jobStatusService.deleteStatus(jobId)
        res.end()
    }

    res.on("close", cleanup)
})

// AI Image Generation Endpoint
// Fire-and-forget: starts background job, returns 202 immediately
generateRoute.post(
    "/generate/image",
    // @ts-ignore
    ClerkExpressRequireAuth({}),
    asyncHandler(async (req: Request, res: Response) => {
        void processImage(req.body)
        res.status(202).json({
            message: "Processing started",
            status: "processing",
        })
    }),
)

// Upscale Endpoint
// Fire-and-forget: uploads image, starts background job, returns 202
generateRoute.post(
    "/generate/upscale/image",
    // @ts-ignore
    ClerkExpressRequireAuth({}),
    upload.single("image"),
    asyncHandler(async (req: Request, res: Response) => {
        if (!req.file?.path) {
            throw new BadRequestError("No image file provided")
        }

        const props: Props = {
            body: req.body,
            filePath: req.file.path,
            fileName: req.file.filename,
        }
        void processUpscale(props)

        res.status(202).json({
            message: "Processing started",
            status: "processing",
        })
    }),
)

// Revive Endpoint
// Fire-and-forget: uploads image, starts background job, returns 202
generateRoute.post(
    "/generate/revive/image",
    // @ts-ignore
    ClerkExpressRequireAuth({}),
    upload.single("image"),
    asyncHandler(async (req: Request, res: Response) => {
        if (!req.file?.path) {
            throw new BadRequestError("No image file provided")
        }

        const props: Props = {
            body: req.body,
            filePath: req.file.path,
            fileName: req.file.filename,
        }
        void processRevive(props)

        res.status(202).json({
            message: "Processing started",
            status: "processing",
        })
    }),
)

// Colorize Endpoint
// Fire-and-forget: uploads image, starts background job, returns 202
generateRoute.post(
    "/generate/colorize/image",
    // @ts-ignore
    ClerkExpressRequireAuth({}),
    upload.single("image"),
    asyncHandler(async (req: Request, res: Response) => {
        if (!req.file?.path) {
            throw new BadRequestError("No image file provided")
        }

        const props: Props = {
            body: req.body,
            filePath: req.file.path,
            fileName: req.file.filename,
        }
        void processColorize(props)

        res.status(202).json({
            message: "Processing started",
            status: "processing",
        })
    }),
)

// Remove Background Endpoint
// Fire-and-forget: uploads image, starts background job, returns 202
generateRoute.post(
    "/generate/remove-bg/image",
    // @ts-ignore
    ClerkExpressRequireAuth({}),
    upload.single("image"),
    asyncHandler(async (req: Request, res: Response) => {
        if (!req.file?.path) {
            throw new BadRequestError("No image file provided")
        }

        const props: Props = {
            body: req.body,
            filePath: req.file.path,
            fileName: req.file.filename,
        }
        void processRemoveBg(props)

        res.status(202).json({
            message: "Processing started",
            status: "processing",
        })
    }),
)
