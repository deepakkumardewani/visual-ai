import Replicate, { type Prediction } from "replicate"

import { env } from "../config/env.js"
import { createLogger } from "./logger.js"

const logger = createLogger("replicate")

/** Stable placeholder served to e2e users; same shape as real flux output (array of URLs). */
export const FAKE_REPLICATE_OUTPUT_URL = "https://fake-replicate.invalid/e2e-output.png"

/**
 * Singleton Replicate client.
 * Centralised here so routes and services share one authenticated instance.
 */
export const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN })

export interface RunReplicateOptions {
    userId: string
    model: `${string}/${string}`
    input: Record<string, unknown>
    onProgress?: (prediction: Prediction) => void
}

/**
 * Runs a model, except for e2e users, who get a fixture and no network call.
 * The id list is read from env at startup, so changing E2E_USER_IDS requires an API restart.
 * Callers must pass a server-trusted userId (the authenticated Clerk id), never a client value.
 */
export async function runReplicate(options: RunReplicateOptions): Promise<unknown> {
    const { userId, model, input, onProgress } = options
    if (userId && env.E2E_USER_IDS.includes(userId)) {
        logger.warn(`fake Replicate for e2e user ${userId} model=${model}`)
        return [FAKE_REPLICATE_OUTPUT_URL]
    }
    return replicate.run(model, { input }, onProgress)
}

// Re-export pure model-input helpers so callers can import from one place
export { buildModelInput, getModelReplicateId } from "./model-input.js"
export type { UserGenerationParams } from "./model-input.js"
