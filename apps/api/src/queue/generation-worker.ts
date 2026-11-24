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
import { processMusic, processSong, processSpeech } from "../services/media-service.js"
import { RedisService } from "../services/redis-service.js"
import { GENERATION_QUEUE_NAME, type GenerationJobData } from "./generation-queue.js"
import { getJobId } from "./job-id.js"

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
        case "music":
            await processMusic(data.body)
            return
        case "song":
            await processSong(data.body)
            return
        case "speech":
            await processSpeech(data.body)
            return
        case "video":
        case "image-watermark":
        case "video-watermark":
        case "autocaption":
        case "voice-clone":
            // Media processors land with runMediaJob (later Phase 0 tasks); fail loudly rather than drop the job.
            throw new Error(`No processor registered for media job kind: ${data.kind}`)
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

        const jobId = getJobId(job.data)

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
