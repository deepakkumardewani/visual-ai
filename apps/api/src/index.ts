import { NextFunction, Request, Response } from "express"

import { app } from "./app.js"
import { env } from "./config/env.js"
import { redisClient } from "./config/redis.js"
import { isHttpError } from "./lib/errors.js"
import { logger } from "./lib/logger.js"
import { startGenerationWorker } from "./queue/generation-worker.js"

// Central error-handler middleware with correct status codes
// eslint-disable-next-line no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error({ err, stack: err.stack, path: req.path, method: req.method }, "Request error")

    if (isHttpError(err)) {
        return res.status(err.statusCode).json({
            message: err.message,
            status: err.statusCode,
        })
    }

    res.status(500).json({
        message: "Internal server error",
        status: 500,
    })
})

/* catch 404 and forward to error handler */
app.use((_: Request, res: Response) => {
    res.status(404).json({
        message: "404 - Not Found",
    })
})

const generationWorker = startGenerationWorker()

/* Graceful shutdown — close worker (wait for active jobs), then Redis */
async function shutdown(signal: string) {
    logger.info(`${signal} signal received`)
    await generationWorker.close()
    await redisClient.quit()
    process.exit(0)
}

process.on("SIGTERM", () => void shutdown("SIGTERM"))
process.on("SIGINT", () => void shutdown("SIGINT"))

app.listen(env.APP_PORT, () => {
    logger.info(`API running at ${env.APP_SERVER}:${env.APP_PORT}`)
})
