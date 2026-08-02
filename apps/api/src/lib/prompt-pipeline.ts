import { enhancePrompt, shouldEnhance } from "./prompt-enhancer.js"
import { getModelDefinition, getStylePreset } from "@visual-ai/shared"
import type { EnhanceMode, ModelKey } from "@visual-ai/shared"

/**
 * Prepares a prompt for generation by applying enhancement and style transformations.
 *
 * Order of operations:
 * 1. Check if model has native enhancement hook — if so, skip local enhancement
 * 2. Apply enhancement based on mode:
 *    - 'on': always enhance
 *    - 'off' or absent: never enhance
 *    - 'auto': enhance only if shouldEnhance(prompt) is true
 * 3. Apply style suffix by appending the preset's promptSuffix (comma-joined)
 *
 * Errors during enhancement are caught, logged with context, and fall back to
 * the original prompt (with or without style). The pipeline never throws —
 * the generation path always receives a valid prompt.
 *
 * @param params - The preparation parameters
 * @param params.prompt - The input prompt
 * @param params.styleId - Optional style preset id (e.g. 'dynamic', 'photography')
 * @param params.enhanceMode - Enhancement mode: 'on', 'off', or 'auto'
 * @param params.modelKey - The model key for registry lookup
 * @returns Promise resolving to the prepared prompt (trimmed)
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
                workingPrompt = await enhancePrompt(workingPrompt)
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

    // Apply style suffix
    if (styleId && styleId !== "none") {
        try {
            const stylePreset = getStylePreset(styleId)
            if (stylePreset.promptSuffix) {
                // Append style suffix with comma separation for clarity
                workingPrompt = `${workingPrompt}, ${stylePreset.promptSuffix}`
            }
        } catch (error) {
            // Log the error but don't throw — proceed with the prompt as-is
            console.error(`[prompt-pipeline] Style lookup failed for styleId ${styleId}`, {
                prompt: workingPrompt,
                error: error instanceof Error ? error.message : String(error),
            })
        }
    }

    return workingPrompt.trim()
}
