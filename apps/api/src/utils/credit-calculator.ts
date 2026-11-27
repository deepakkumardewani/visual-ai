import { FeatureType } from "../types/index.js"
import type { ModelKey } from "@visual-ai/shared"
import { getCreditCost, MIN_CREDIT_COST } from "@visual-ai/shared"

/**
 * Returns the integer credit cost for a generation or utility job.
 * Pure function — no side effects, safe to import in tests without env deps.
 *
 * Every cost comes from the shared getCreditCost, which derives credits from the
 * model's registry price (1 credit ≈ USD_PER_CREDIT of Replicate cost).
 */
export function calculateCreditCost(featureType: FeatureType, modelKey?: ModelKey): number {
    // Generation images
    if (featureType === FeatureType.IMAGE) {
        // Without a model the run is priced at the floor; callers always pass one in practice.
        if (modelKey) {
            return getCreditCost(modelKey)
        }
        return MIN_CREDIT_COST
    }

    // Utility model — must have modelKey
    if (!modelKey) {
        throw new Error("modelKey is required for utility operations")
    }

    return getCreditCost(modelKey)
}
