import {
    FEEDBACK_FIRST_SESSION_HOURS,
    FEEDBACK_GENERATION_THRESHOLD,
    FEEDBACK_PROMPT_COOLDOWN_DAYS,
    type FeedbackTrigger,
} from "@visual-ai/shared"

const MS_PER_HOUR = 60 * 60 * 1000
const MS_PER_DAY = 24 * MS_PER_HOUR

export interface EligibilityInput {
    trigger: FeedbackTrigger
    now: Date
    accountCreatedAt: Date
    successfulGenerations: number
    lastPromptedAt: Date | null
}

/** There is no session concept, so "first session" means a very recent account. */
export function isFirstSession(accountCreatedAt: Date, now: Date): boolean {
    return now.getTime() - accountCreatedAt.getTime() < FEEDBACK_FIRST_SESSION_HOURS * MS_PER_HOUR
}

export function isInCooldown(lastPromptedAt: Date | null, now: Date): boolean {
    if (!lastPromptedAt) return false
    return now.getTime() - lastPromptedAt.getTime() < FEEDBACK_PROMPT_COOLDOWN_DAYS * MS_PER_DAY
}

function hasEnoughActivity(trigger: FeedbackTrigger, successfulGenerations: number): boolean {
    if (trigger === "download") return true
    return successfulGenerations >= FEEDBACK_GENERATION_THRESHOLD
}

export function isFeedbackEligible(input: EligibilityInput): boolean {
    if (isFirstSession(input.accountCreatedAt, input.now)) return false
    if (!hasEnoughActivity(input.trigger, input.successfulGenerations)) return false
    return !isInCooldown(input.lastPromptedAt, input.now)
}
