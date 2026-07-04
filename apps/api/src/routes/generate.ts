import { Router } from "express"
import { Request, Response } from "express"

import {
    processColorization,
    processImage,
    processRevive,
    processUpscale,
} from "../helpers/generateRouteHelpers.js"
import { ClerkExpressRequireAuth } from "../middlewares/clerk.js"
import { upload } from "../middlewares/multer.js"
import { RedisService } from "../services/redis-service.js"
import { Props } from "../types"

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
        console.log("connection closed")
        clearInterval(interval)
        await jobStatusService.deleteStatus(jobId)
        res.end()
    }

    res.on("close", cleanup)
})

// AI Image Generation Endpoint
// Generates AI images based on text prompts
generateRoute.post(
    "/generate/image",
    // @ts-ignore
    ClerkExpressRequireAuth({}),
    async (req: Request, res: Response) => {
        const { body } = req
        // Start processing in the background
        try {
            void processImage(body)
        } catch (error) {
            console.error("Background processing error:", error)
        }

        // Return immediately
        return res.status(202).json({
            message: "Processing started",
            status: "processing",
        })
    },
)

// Update the upscale endpoint
generateRoute.post(
    "/generate/upscale/image",
    // @ts-ignore
    ClerkExpressRequireAuth({}),
    upload.single("image"),
    async (req: Request, res: Response) => {
        try {
            const { body } = req

            if (!req.file?.path) {
                return res.status(400).json({ error: "No image file provided" })
            }

            // Start processing in the background
            try {
                const props: Props = {
                    body,
                    filePath: req.file.path,
                    fileName: req.file.filename,
                }
                void processUpscale(props)
            } catch (error) {
                console.error("Background processing error:", error)
            }

            // Return immediately
            return res.status(202).json({
                message: "Processing started",
                status: "processing",
            })
        } catch (error) {
            console.error("error", error)
            return res.status(500).send(error)
        }
    },
)

// Update the revive endpoint
generateRoute.post(
    "/generate/revive/image",
    // @ts-ignore
    ClerkExpressRequireAuth({}),
    upload.single("image"),
    async (req: Request, res: Response) => {
        try {
            const { body } = req

            if (!req.file?.path) {
                return res.status(400).json({ error: "No image file provided" })
            }

            // Start processing in the background
            try {
                const props: Props = {
                    body,
                    filePath: req.file.path,
                    fileName: req.file.filename,
                }
                void processRevive(props)
            } catch (error) {
                console.error("Background processing error:", error)
            }

            // Return immediately
            return res.status(202).json({
                message: "Processing started",
                status: "processing",
            })
        } catch (error) {
            console.error("error", error)
            return res.status(500).send(error)
        }
    },
)

// Update the colorize endpoint
generateRoute.post(
    "/generate/colorize/image",
    // @ts-ignore
    ClerkExpressRequireAuth({}),
    upload.single("image"),
    async (req, res) => {
        try {
            const { body } = req

            if (!req.file?.path) {
                return res.status(400).json({ error: "No image file provided" })
            }
            // Start processing in the background
            try {
                const props: Props = {
                    body,
                    filePath: req.file.path,
                    fileName: req.file.filename,
                }
                void processColorization(props)
            } catch (error) {
                console.error("Background processing error:", error)
            }

            // Return immediately
            return res.status(202).json({
                message: "Processing started",
                status: "processing",
            })
        } catch (error) {
            console.error("error", error)
            return res.status(500).send(error)
        }
    },
)
