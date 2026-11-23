import { MODEL_REGISTRY, MUSIC_STUDIO_MODEL_KEYS } from "@visual-ai/shared"
import type { MediaModelConfig, ModelKind } from "@visual-ai/shared"

import { BadRequestError } from "./errors.js"

/** Request fields that route or identify the job; they never become Replicate inputs. */
const ENVELOPE_FIELDS: ReadonlySet<string> = new Set(["jobId", "modelKey"])

/** The Music studio shares its models with Song (Minimax 2.6 as an instrumental), so it also accepts those. */
function isServedAs(modelKey: string, modelKind: ModelKind | undefined, kind: ModelKind): boolean {
    if (modelKind === kind) return true
    return kind === "music" && (MUSIC_STUDIO_MODEL_KEYS as readonly string[]).includes(modelKey)
}

/** Music-studio `prompt` is Minimax's `stylePrompt`; every other field name is the registry's own. */
const PROMPT_FIELD = "prompt"
const STYLE_PROMPT_FIELD = "stylePrompt"

function resolveField(inputs: MediaModelConfig["inputs"], field: string): string {
    const aliased =
        field === PROMPT_FIELD &&
        !Object.hasOwn(inputs, PROMPT_FIELD) &&
        Object.hasOwn(inputs, STYLE_PROMPT_FIELD)
    return aliased ? STYLE_PROMPT_FIELD : field
}

function getMediaConfig(modelKey: string, kind: ModelKind): MediaModelConfig {
    const entry = Object.hasOwn(MODEL_REGISTRY, modelKey)
        ? MODEL_REGISTRY[modelKey as keyof typeof MODEL_REGISTRY]
        : undefined
    if (!entry) throw new BadRequestError(`modelKey: unknown model "${modelKey}"`)
    if (!entry.media || !isServedAs(modelKey, entry.kind, kind)) {
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
        if (ENVELOPE_FIELDS.has(field) || Object.hasOwn(inputs, resolveField(inputs, field))) {
            continue
        }
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

    for (const [field, value] of Object.entries(params)) {
        const declaredField = resolveField(inputs, field)
        const declared = Object.hasOwn(inputs, declaredField) ? inputs[declaredField] : undefined
        if (!declared || value === undefined) continue
        input[declared.inputKey] = value
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
