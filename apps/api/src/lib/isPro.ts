import { PLAN, SUBSCRIPTION_STATUS, type Plan, type SubscriptionStatus } from "@visual-ai/shared"

export interface PlanSubject {
    plan?: Plan | null
    subscription?: {
        status?: SubscriptionStatus | null
        currentPeriodEnd?: Date | null
    } | null
}

/**
 * Single source of truth for Pro entitlement; perks must call this, never read `user.plan`.
 * Legacy docs without plan fields resolve to free. Pro is kept until the paid period ends
 * for past_due and cancelled subscriptions (period end itself is already expired).
 */
export function isPro(user: PlanSubject | null | undefined, now: Date = new Date()): boolean {
    if (user?.plan !== PLAN.PRO) return false

    const { status, currentPeriodEnd } = user.subscription ?? {}
    if (!status) return false
    if (status === SUBSCRIPTION_STATUS.ACTIVE) return true
    if (status === SUBSCRIPTION_STATUS.EXPIRED) return false

    return !!currentPeriodEnd && currentPeriodEnd.getTime() > now.getTime()
}

/**
 * Mongo query equivalent of `isPro`, for bulk updates (daily reset). It must mirror `isPro`
 * exactly: if one changes without the other, users get the wrong daily allowance.
 */
export function proUsersFilter(now: Date = new Date()) {
    return {
        plan: PLAN.PRO,
        $or: [
            { "subscription.status": SUBSCRIPTION_STATUS.ACTIVE },
            {
                "subscription.status": {
                    $in: [SUBSCRIPTION_STATUS.PAST_DUE, SUBSCRIPTION_STATUS.CANCELLED],
                },
                "subscription.currentPeriodEnd": { $gt: now },
            },
        ],
    }
}

/** Complement of `proUsersFilter`; legacy users without plan fields match here (count as Free). */
export function freeUsersFilter(now: Date = new Date()) {
    return { $nor: [proUsersFilter(now)] }
}
