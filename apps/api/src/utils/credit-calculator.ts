import { FeatureType } from "../types/index.js"
import type { ModelKey } from "@visual-ai/shared"
import { MODEL_REGISTRY, TIER_CREDIT_COST } from "@visual-ai/shared"

// Credit cost constants
const IMAGE_CREDIT_COST = 1
const PRO_CREDIT_COST = 1
const FREE_CREDIT_COST = 3

/**
 * Returns the credit cost for a generation or utility job.
 * Pure function — no side effects, safe to import in tests without env deps.
 *
 * IMAGE always costs 1 credit regardless of plan.
 * All image-transform features (upscale, colorize, revive, remove_bg) cost 1 for pro users
 * and FREE_CREDIT_COST (3) for free users.
 *
 * When modelKey is provided, uses tier-based pricing from TIER_CREDIT_COST.
 * When modelKey is omitted, returns exactly today's flat cost for backward compatibility.
 */
export function calculateCreditCost(
    featureType: FeatureType,
    isPro: boolean,
    modelKey?: ModelKey,
): number {
    // Generation images always cost 1 credit
    if (featureType === FeatureType.IMAGE) return IMAGE_CREDIT_COST

    // If no model key, use legacy flat cost (backward compatibility)
    if (!modelKey) return isPro ? PRO_CREDIT_COST : FREE_CREDIT_COST

    // Tier-based pricing for utility models
    const model = MODEL_REGISTRY[modelKey]
    if (!model) {
        // Fallback to legacy cost if model not found
        return isPro ? PRO_CREDIT_COST : FREE_CREDIT_COST
    }

    const plan = isPro ? "pro" : "free"
    return TIER_CREDIT_COST[model.tier][plan]
}
