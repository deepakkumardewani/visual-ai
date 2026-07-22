import Replicate from "replicate"

import { env } from "../config/env.js"

/**
 * Singleton Replicate client.
 * Centralised here so routes and services share one authenticated instance.
 */
export const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN })

// Re-export pure model-input helpers so callers can import from one place
export { buildModelInput, getModelReplicateId } from "./model-input.js"
export type { UserGenerationParams } from "./model-input.js"
