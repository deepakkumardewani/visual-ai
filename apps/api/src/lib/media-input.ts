import { MODEL_REGISTRY } from "@visual-ai/shared"
import type { MediaModelConfig, ModelKind } from "@visual-ai/shared"

import { BadRequestError } from "./errors.js"

/** Request fields that route or identify the job; they never become Replicate inputs. */
const ENVELOPE_FIELDS: ReadonlySet<string> = new Set(["jobId", "modelKey"])

function getMediaConfig(modelKey: string, kind: ModelKind): MediaModelConfig {
    const entry = Object.hasOwn(MODEL_REGISTRY, modelKey)
        ? MODEL_REGISTRY[modelKey as keyof typeof MODEL_REGISTRY]
        : undefined
    if (!entry) throw new BadRequestError(`modelKey: unknown model "${modelKey}"`)
    if (!entry.media || entry.kind !== kind) {
        throw new BadRequestError(`modelKey: "${modelKey}" is not a ${kind} model`)
    }
    return entry.media
}

/**
 * Rejects an unknown or cross-kind modelKey and any field the model does not accept.
 * Errors name the offending field so the client can surface them inline.
 */
export function validateMediaParams(
    modelKey: string,
    kind: ModelKind,
    params: Record<string, unknown>,
): void {
    const { inputs } = getMediaConfig(modelKey, kind)
    for (const field of Object.keys(params)) {
        if (ENVELOPE_FIELDS.has(field) || Object.hasOwn(inputs, field)) continue
        throw new BadRequestError(
            `${field}: not supported by model "${modelKey}". Remove it from the request.`,
        )
    }
}

/**
 * Builds the Replicate input from the registry's field-to-inputKey table (no per-model branches).
 * Fixed inputs are always applied last so user input can never override them.
 */
export function buildMediaInput(
    modelKey: string,
    kind: ModelKind,
    params: Record<string, unknown>,
): Record<string, unknown> {
    const { inputs, fixedInputs } = getMediaConfig(modelKey, kind)
    const input: Record<string, unknown> = {}

    for (const [field, { inputKey }] of Object.entries(inputs)) {
        if (params[field] !== undefined) input[inputKey] = params[field]
    }
    for (const inputKey of fixedInputs.alwaysSend ?? []) {
        input[inputKey] ??= ""
    }
    Object.assign(input, fixedInputs.send)
    for (const inputKey of fixedInputs.neverSend ?? []) {
        delete input[inputKey]
    }
    return input
}
