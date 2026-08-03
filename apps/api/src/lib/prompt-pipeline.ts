import { enhancePrompt, shouldEnhance } from "./prompt-enhancer.js"
import { checkPromptSafety, PromptModerationError } from "./prompt-moderation.js"
import { getModelDefinition, getStylePreset } from "@visual-ai/shared"
import type { EnhanceMode, ModelKey } from "@visual-ai/shared"

const STYLE_CLAUSE_PREFIX = "Style:"

/**
 * Attach style descriptors as a separate rendering clause rather than extending the
 * scene's comma list. Comma-joined tags carry the same weight as the user's subjects,
 * so image models render them as content — a landscape prompt with portrait descriptors
 * grew a person. A sentence boundary plus an explicit label scopes them to "how", not "what".
 */
function applyStyleClause(prompt: string, suffix: string): string {
    const scene = prompt.replace(/[\s,;.]+$/, "")
    return `${scene}. ${STYLE_CLAUSE_PREFIX} ${suffix}.`
}

/**
 * Prepares a prompt for generation by applying moderation, enhancement, and style transformations.
 *
 * Order of operations:
 * 1. Classify the raw prompt for safety — throws PromptModerationError if flagged unsafe
 * 2. Check if model has native enhancement hook — if so, skip local enhancement
 * 3. Apply enhancement based on mode:
 *    - 'on': always enhance
 *    - 'off' or absent: never enhance
 *    - 'auto': enhance only if shouldEnhance(prompt) is true
 *    When a style is selected, the enhancer integrates it into the rewrite.
 * 4. If enhancement did NOT run (off, auto-long, native, or LLM failure), apply
 *    the style by appending the preset's promptSuffix as a scoped style clause
 *
 * Errors during enhancement are caught, logged with context, and fall back to
 * the original prompt (with or without style). Moderation rejection is the one
 * case that intentionally throws — callers should catch PromptModerationError
 * and surface `reason` to the user instead of running the generation job.
 *
 * @param params - The preparation parameters
 * @param params.prompt - The input prompt
 * @param params.styleId - Optional style preset id (e.g. 'dynamic', 'photography')
 * @param params.enhanceMode - Enhancement mode: 'on', 'off', or 'auto'
 * @param params.modelKey - The model key for registry lookup
 * @returns Promise resolving to the prepared prompt (trimmed)
 * @throws PromptModerationError if the prompt is classified as unsafe
 */
export async function preparePrompt({
    prompt,
    styleId,
    enhanceMode,
    modelKey,
}: {
    prompt: string
    styleId?: string
    enhanceMode?: EnhanceMode
    modelKey: ModelKey
}): Promise<string> {
    let workingPrompt = prompt.trim()

    // Resolve the style preset once; used by both the enhancer and the suffix fallback
    let stylePreset
    if (styleId && styleId !== "none") {
        try {
            stylePreset = getStylePreset(styleId)
        } catch (error) {
            // Log the error but don't throw — proceed with the prompt as-is
            console.error(`[prompt-pipeline] Style lookup failed for styleId ${styleId}`, {
                prompt: workingPrompt,
                error: error instanceof Error ? error.message : String(error),
            })
        }
    }

    const moderation = await checkPromptSafety(workingPrompt)
    if (!moderation.safe) {
        throw new PromptModerationError(
            moderation.reason ?? "This prompt may violate our content guidelines.",
        )
    }

    // Check if the model has native prompt enhancement
    let hasNativeEnhancement = false
    try {
        const modelDef = getModelDefinition(modelKey)
        hasNativeEnhancement = !!modelDef.fields.promptEnhance
    } catch {
        // If model lookup fails, proceed without native enhancement check
    }

    // Apply enhancement if applicable
    if (!hasNativeEnhancement) {
        // Determine if we should enhance based on mode
        const shouldDoEnhance =
            enhanceMode === "on" || (enhanceMode === "auto" && shouldEnhance(workingPrompt))

        if (shouldDoEnhance) {
            try {
                const enhanced = await enhancePrompt(workingPrompt, stylePreset)
                if (enhanced) {
                    // The enhancer integrated the style into the rewrite — skip the suffix append
                    return enhanced.trim()
                } else {
                    console.error(
                        `[prompt-pipeline] Enhancement returned empty result for model ${modelKey}`,
                        { originalPrompt: prompt, enhanceMode },
                    )
                }
            } catch (error) {
                // Log the error but don't throw — fall back to original prompt
                console.error(`[prompt-pipeline] Enhancement failed for model ${modelKey}`, {
                    originalPrompt: prompt,
                    enhanceMode,
                    error: error instanceof Error ? error.message : String(error),
                })
                // workingPrompt stays as-is (or styled version below)
            }
        }
    }

    // Enhancement didn't run — apply the style via its descriptor suffix instead
    if (stylePreset?.promptSuffix) {
        workingPrompt = applyStyleClause(workingPrompt, stylePreset.promptSuffix)
    }

    return workingPrompt.trim()
}
