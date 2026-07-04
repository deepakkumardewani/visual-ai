import { Router } from "express"
import { Request, Response } from "express"

import { healthCheckService } from "../services/health-check-service.js"

export const healthCheckRoute = Router()

healthCheckRoute.get("/healthcheck", async (req: Request, res: Response) => {
    try {
        const healthStatus = await healthCheckService.performHealthCheck()

        const statusCode = healthStatus.status === "healthy" ? 200 : 503
        return res.status(statusCode).json(healthStatus)
    } catch (error) {
        console.error("Healthcheck failed:", error)
        return res.status(500).json({
            status: "unhealthy",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date(),
        })
    }
})
