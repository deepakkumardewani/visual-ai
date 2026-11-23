import { findModelByReplicateId, getModelKind } from "@visual-ai/shared"
import type { ModelDefinition } from "@visual-ai/shared"
import Replicate, { type Prediction } from "replicate"

import { env } from "../config/env.js"
import { isE2eUser } from "./e2e-user.js"
import { createLogger } from "./logger.js"

const logger = createLogger("replicate")

/** Stable placeholder served to e2e users; same shape as real flux output (array of URLs). */
export const FAKE_REPLICATE_OUTPUT_URL = "https://fake-replicate.invalid/e2e-output.png"

/** Media fakes use the same reserved .invalid host so they can never resolve to a real asset. */
export const FAKE_REPLICATE_AUDIO_URL = "https://fake-replicate.invalid/e2e-output.mp3"
export const FAKE_REPLICATE_VIDEO_URL = "https://fake-replicate.invalid/e2e-output.mp4"
export const FAKE_REPLICATE_TRANSCRIPT_URL = "https://fake-replicate.invalid/e2e-transcript.srt"
export const FAKE_VOICE_ID = "e2e-fake-voice-id"

/**
 * Picks the fixture for a model by registry kind, then key where one kind has several output
 * shapes. Unknown models fall back to the image fixture, the pre-media behaviour.
 */
function fakeOutputFor(model: string): unknown {
    const definition: ModelDefinition | undefined = findModelByReplicateId(model)
    if (!definition) return [FAKE_REPLICATE_OUTPUT_URL]
    switch (getModelKind(definition)) {
        case "song":
        case "music":
            return FAKE_REPLICATE_AUDIO_URL
        case "tts":
            return definition.key === "MINIMAX_VOICE_CLONE"
                ? FAKE_VOICE_ID
                : FAKE_REPLICATE_AUDIO_URL
        case "video":
            return FAKE_REPLICATE_VIDEO_URL
        case "tool":
            return fakeToolOutputFor(definition.key)
        default:
            return [FAKE_REPLICATE_OUTPUT_URL]
    }
}

function fakeToolOutputFor(key: ModelDefinition["key"]): unknown {
    if (key === "AUTOCAPTION") return [FAKE_REPLICATE_VIDEO_URL, FAKE_REPLICATE_TRANSCRIPT_URL]
    if (key === "VIDEO_WATERMARK") return FAKE_REPLICATE_VIDEO_URL
    return [FAKE_REPLICATE_OUTPUT_URL]
}

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
    if (isE2eUser(userId)) {
        logger.warn(`fake Replicate for e2e user ${userId} model=${model}`)
        return fakeOutputFor(model)
    }
    return replicate.run(model, { input }, onProgress)
}

// Re-export pure model-input helpers so callers can import from one place
export { buildModelInput, getModelReplicateId } from "./model-input.js"
export type { UserGenerationParams } from "./model-input.js"
