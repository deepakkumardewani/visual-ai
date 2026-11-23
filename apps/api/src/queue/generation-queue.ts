import { QUEUE_PRIORITY } from "@visual-ai/shared"
import type { ModelKey } from "@visual-ai/shared"
import { Queue } from "bullmq"

import { env } from "../config/env.js"
import { createRedisClient } from "../config/redis.js"
import { BadRequestError } from "../lib/errors.js"
import { createLogger } from "../lib/logger.js"
import { RedisService } from "../services/redis-service.js"
import type { Body, Props } from "../types/index.js"
import { getJobId } from "./job-id.js"

const logger = createLogger("generation-queue")

export const MEDIA_JOB_KINDS = [
    "song",
    "music",
    "speech",
    "video",
    "image-watermark",
    "video-watermark",
    "autocaption",
    "voice-clone",
] as const

export type MediaJobKind = (typeof MEDIA_JOB_KINDS)[number]

/** Common envelope of every media job; `userId` is server-stamped, never read from the client. */
export interface MediaJobBody {
    jobId: string
    userId: string
    modelKey: ModelKey
    [param: string]: unknown
}

/** `isPro` is resolved once at enqueue time and drives queue priority. */
export type GenerationJobData = { isPro: boolean } & (
    | { kind: "image"; body: Body }
    | { kind: "upscale" | "revive" | "colorize" | "remove-bg"; props: Props }
    | { kind: MediaJobKind; body: MediaJobBody }
)

export const GENERATION_QUEUE_NAME = `${env.QUEUE_PREFIX}-generation`

export const queueConnection = createRedisClient({ maxRetriesPerRequest: null })

export const generationQueue = new Queue<GenerationJobData>(GENERATION_QUEUE_NAME, {
    connection: queueConnection,
    defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 86400 },
    },
})

export async function enqueueGeneration(data: GenerationJobData): Promise<void> {
    const jobId = getJobId(data)
    if (!jobId) {
        throw new BadRequestError("jobId is required")
    }

    await new RedisService().setStatus(jobId, {
        status: "processing",
        image: undefined,
        userCreditsRemaining: null,
    })

    await generationQueue.add(data.kind, data, {
        jobId,
        priority: data.isPro ? QUEUE_PRIORITY.PRO : QUEUE_PRIORITY.FREE,
    })
    logger.info({ jobId, kind: data.kind }, "Generation job enqueued")
}
