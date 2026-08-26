import { FeatureType } from "../types/index.js"
import type { ModelKey } from "@visual-ai/shared"
import { getCreditCost } from "@visual-ai/shared"

/**
 * Returns the integer credit cost for a generation or utility job.
 * Pure function — no side effects, safe to import in tests without env deps.
 *
 * All costs are now unified via the shared getCreditCost function:
 * - IMAGE/generation: 1 credit (budget/standard), 4-5 (premium)
 * - Utilities: 2 credits, premium upscalers: 4 credits
 */
export function calculateCreditCost(featureType: FeatureType, modelKey?: ModelKey): number {
    // Generation images
    if (featureType === FeatureType.IMAGE) {
        // Default generation cost is 1 credit for most models
        // Use modelKey if provided, otherwise return default
        if (modelKey) {
            return getCreditCost(modelKey)
        }
        return 1 // Default for unspecified generation
    }

    // Utility model — must have modelKey
    if (!modelKey) {
        throw new Error("modelKey is required for utility operations")
    }

    return getCreditCost(modelKey)
}
