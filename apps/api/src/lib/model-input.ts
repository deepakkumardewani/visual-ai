import { MODEL_REGISTRY } from "@visual-ai/shared"
import type { ModelKey } from "@visual-ai/shared"

import { BadRequestError } from "./errors.js"

/** User-supplied generation parameters — only the fields common to all generation models. */
export interface UserGenerationParams {
    prompt?: string
    aspectRatio?: string
    outputFormat?: string
    outputQuality?: number
    numOfOutputs?: number
}

/**
 * Validates that the user-supplied params do not include fields unsupported by the selected model.
 * Throws a BadRequestError (400) if an unsupported param is provided with a non-default value.
 */
export function validateModelParams(modelKey: ModelKey, userParams: UserGenerationParams): void {
    const entry = MODEL_REGISTRY[modelKey]
    if (!entry) throw new BadRequestError(`Unknown model key: "${modelKey}"`)

    const { fields } = entry

    if (userParams.aspectRatio !== undefined && !fields.aspectRatio) {
        throw new BadRequestError(
            `Model "${modelKey}" does not support aspectRatio. Remove this parameter from the request.`,
        )
    }
    if (userParams.outputQuality !== undefined && !fields.outputQuality) {
        throw new BadRequestError(
            `Model "${modelKey}" does not support outputQuality. Remove this parameter from the request.`,
        )
    }
    if (
        userParams.numOfOutputs !== undefined &&
        userParams.numOfOutputs > 1 &&
        !fields.numOutputs
    ) {
        throw new BadRequestError(
            `Model "${modelKey}" does not support multiple outputs (numOfOutputs > 1). Remove this parameter from the request.`,
        )
    }
}

/**
 * Builds the Replicate input object for a given model key.
 * Reads supported fields from the registry — unknown or unsupported params are silently dropped.
 * Maps `inputKey` variants (e.g. `num_outputs`, `max_images`) automatically.
 */
export function buildModelInput(
    modelKey: ModelKey,
    userParams: UserGenerationParams,
): Record<string, unknown> {
    const entry = MODEL_REGISTRY[modelKey]
    if (!entry) throw new Error(`buildModelInput: unknown model key "${modelKey}"`)

    const { fields } = entry
    const input: Record<string, unknown> = {}

    if (fields.prompt) {
        input.prompt = userParams.prompt ?? ""
    }
    if (fields.aspectRatio) {
        input.aspect_ratio = userParams.aspectRatio ?? ""
    }
    if (fields.outputFormat) {
        input.output_format = userParams.outputFormat ?? ""
    }
    if (fields.outputQuality) {
        input.output_quality = userParams.outputQuality ?? 0
    }
    if (fields.numOutputs) {
        // Map to the model-specific input key (num_outputs / max_images / number_of_images)
        input[fields.numOutputs.inputKey] = userParams.numOfOutputs ?? 1
    }

    return input
}

/**
 * Returns the Replicate model identifier string for a registry key.
 * Throws if the key is not found in the registry.
 */
export function getModelReplicateId(modelKey: ModelKey): string {
    const entry = MODEL_REGISTRY[modelKey]
    if (!entry) throw new Error(`getModelReplicateId: unknown model key "${modelKey}"`)
    return entry.replicateId
}
