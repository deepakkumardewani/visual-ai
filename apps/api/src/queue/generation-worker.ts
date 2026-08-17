import { Worker, type Job } from "bullmq"

import { env } from "../config/env.js"
import { createRedisClient } from "../config/redis.js"
import { createLogger } from "../lib/logger.js"
import {
    processColorize,
    processImage,
    processRemoveBg,
    processRevive,
    processUpscale,
} from "../services/generation-service.js"
import { RedisService } from "../services/redis-service.js"
import { GENERATION_QUEUE_NAME, type GenerationJobData } from "./generation-queue.js"

const logger = createLogger("generation-worker")

async function processGenerationJob(job: Job<GenerationJobData>): Promise<void> {
    const { data } = job
    switch (data.kind) {
        case "image":
            await processImage(data.body)
            return
        case "upscale":
            await processUpscale(data.props)
            return
        case "revive":
            await processRevive(data.props)
            return
        case "colorize":
            await processColorize(data.props)
            return
        case "remove-bg":
            await processRemoveBg(data.props)
            return
        default: {
            const _exhaustive: never = data
            throw new Error(`Unknown generation job kind: ${JSON.stringify(_exhaustive)}`)
        }
    }
}

export function startGenerationWorker(): Worker<GenerationJobData> {
    const connection = createRedisClient({ maxRetriesPerRequest: null })

    const worker = new Worker<GenerationJobData>(GENERATION_QUEUE_NAME, processGenerationJob, {
        connection,
        concurrency: env.GENERATION_CONCURRENCY,
    })

    worker.on("failed", async (job, err) => {
        if (!job) return

        const maxAttempts = job.opts.attempts ?? 1
        if (job.attemptsMade < maxAttempts) return

        const jobId = job.data.kind === "image" ? job.data.body.jobId : job.data.props.body.jobId

        try {
            await new RedisService().setStatus(jobId, {
                status: "error",
                image: undefined,
                userCreditsRemaining: null,
            })
        } catch (setErr) {
            logger.error({ err: setErr, jobId }, "Failed to write error job status")
        }

        logger.error(
            { err, jobId, kind: job.data.kind, attemptsMade: job.attemptsMade },
            "Generation job failed after final attempt",
        )
    })

    worker.on("error", (err) => {
        logger.error({ err }, "Generation worker error")
    })

    logger.info({ concurrency: env.GENERATION_CONCURRENCY }, "Generation worker started")

    return worker
}
