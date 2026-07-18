import { Router } from "express"
import { Request, Response } from "express"

import { createLogger } from "../lib/logger.js"
import { healthCheckService } from "../services/health-check-service.js"

const logger = createLogger("healthcheck-route")

export const healthCheckRoute = Router()

healthCheckRoute.get("/healthcheck", async (req: Request, res: Response) => {
    try {
        const healthStatus = await healthCheckService.performHealthCheck()

        const statusCode = healthStatus.status === "healthy" ? 200 : 503
        return res.status(statusCode).json(healthStatus)
    } catch (error) {
        logger.error({ err: error }, "Healthcheck failed")
        return res.status(500).json({
            status: "unhealthy",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date(),
        })
    }
})
