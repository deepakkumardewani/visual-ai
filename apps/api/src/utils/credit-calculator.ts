import { FeatureType } from "../types/index.js"

// Credit cost constants
const IMAGE_CREDIT_COST = 1
const PRO_CREDIT_COST = 1
const FREE_CREDIT_COST = 3

/**
 * Returns the credit cost for a generation job.
 * Pure function — no side effects, safe to import in tests without env deps.
 *
 * IMAGE always costs 1 credit regardless of plan.
 * All image-transform features (upscale, colorize, revive, remove_bg) cost 1 for pro users
 * and FREE_CREDIT_COST (3) for free users.
 */
export function calculateCreditCost(featureType: FeatureType, isPro: boolean): number {
    if (featureType === FeatureType.IMAGE) return IMAGE_CREDIT_COST
    return isPro ? PRO_CREDIT_COST : FREE_CREDIT_COST
}
