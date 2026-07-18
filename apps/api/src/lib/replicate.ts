import Replicate from "replicate"

import { env } from "../config/env.js"

/**
 * Singleton Replicate client.
 * Centralised here so routes and services share one authenticated instance.
 */
export const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN })
