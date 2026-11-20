import { describe, expect, it } from "vitest"

import { freeUsersFilter, isPro, proUsersFilter, type PlanSubject } from "./isPro.js"

const NOW = new Date("2026-06-15T12:00:00.000Z")
const FUTURE = new Date("2026-07-15T12:00:00.000Z")
const PAST = new Date("2026-05-15T12:00:00.000Z")

const proWith = (
    status: NonNullable<PlanSubject["subscription"]>["status"],
    currentPeriodEnd?: Date | null,
): PlanSubject => ({ plan: "pro", subscription: { status, currentPeriodEnd } })

describe("isPro", () => {
    it("is false for null and undefined users", () => {
        expect(isPro(null, NOW)).toBe(false)
        expect(isPro(undefined, NOW)).toBe(false)
    })

    it("is false for a legacy doc without plan fields", () => {
        expect(isPro({}, NOW)).toBe(false)
    })

    it("is false for a free user even with an active subscription", () => {
        expect(isPro({ plan: "free", subscription: { status: "active" } }, NOW)).toBe(false)
    })

    it("is false for a null plan", () => {
        expect(isPro({ plan: null }, NOW)).toBe(false)
    })

    it("is false for a pro plan with a missing subscription", () => {
        expect(isPro({ plan: "pro" }, NOW)).toBe(false)
        expect(isPro({ plan: "pro", subscription: null }, NOW)).toBe(false)
    })

    it("is false for a pro plan with no subscription status", () => {
        expect(isPro(proWith(null, FUTURE), NOW)).toBe(false)
        expect(isPro({ plan: "pro", subscription: {} }, NOW)).toBe(false)
    })

    it("is true for an active subscription regardless of period end", () => {
        expect(isPro(proWith("active", PAST), NOW)).toBe(true)
        expect(isPro(proWith("active"), NOW)).toBe(true)
    })

    it("is false for an expired subscription even with a future period end", () => {
        expect(isPro(proWith("expired", FUTURE), NOW)).toBe(false)
    })

    it("keeps past_due pro before the period end", () => {
        expect(isPro(proWith("past_due", FUTURE), NOW)).toBe(true)
    })

    it("drops past_due pro after the period end", () => {
        expect(isPro(proWith("past_due", PAST), NOW)).toBe(false)
    })

    it("treats now equal to the period end as no longer pro", () => {
        expect(isPro(proWith("past_due", new Date(NOW.getTime())), NOW)).toBe(false)
    })

    it("stays pro one millisecond before the period end", () => {
        expect(isPro(proWith("past_due", new Date(NOW.getTime() + 1)), NOW)).toBe(true)
    })

    it("keeps a cancelled subscription pro until its future period end", () => {
        expect(isPro(proWith("cancelled", FUTURE), NOW)).toBe(true)
    })

    it("drops a cancelled subscription after its period end", () => {
        expect(isPro(proWith("cancelled", PAST), NOW)).toBe(false)
    })

    it("is false for past_due or cancelled without a period end", () => {
        expect(isPro(proWith("past_due"), NOW)).toBe(false)
        expect(isPro(proWith("cancelled", null), NOW)).toBe(false)
    })

    it("defaults now to the real clock", () => {
        const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        const longPast = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        expect(isPro(proWith("cancelled", farFuture))).toBe(true)
        expect(isPro(proWith("cancelled", longPast))).toBe(false)
    })
})

type Doc = Record<string, unknown>
type Condition = Record<string, unknown>

const readPath = (doc: Doc, path: string): unknown =>
    path.split(".").reduce<unknown>((acc, key) => (acc as Doc | undefined)?.[key], doc)

// Minimal Mongo matcher covering only the operators the filters use ($or, $nor, $in, $gt, equality).
function matchesField(value: unknown, expected: unknown): boolean {
    if (expected instanceof Object && !(expected instanceof Date)) {
        const ops = expected as { $in?: unknown[]; $gt?: Date }
        if (ops.$in) return ops.$in.includes(value)
        if (ops.$gt) return value instanceof Date && value.getTime() > ops.$gt.getTime()
    }
    return value === expected
}

function matches(doc: Doc, filter: Condition): boolean {
    return Object.entries(filter).every(([key, expected]) => {
        if (key === "$or") return (expected as Condition[]).some((sub) => matches(doc, sub))
        if (key === "$nor") return !(expected as Condition[]).some((sub) => matches(doc, sub))
        return matchesField(readPath(doc, key), expected)
    })
}

describe("proUsersFilter / freeUsersFilter parity with isPro", () => {
    const fixtures: Record<string, PlanSubject> = {
        active: proWith("active", FUTURE),
        activePastEnd: proWith("active", PAST),
        pastDueInPeriod: proWith("past_due", FUTURE),
        pastDueOutOfPeriod: proWith("past_due", PAST),
        pastDueNoEnd: proWith("past_due"),
        cancelledInPeriod: proWith("cancelled", FUTURE),
        cancelledOutOfPeriod: proWith("cancelled", PAST),
        cancelledNoEnd: proWith("cancelled", null),
        expired: proWith("expired", FUTURE),
        proNoSubscription: { plan: "pro" },
        proNoStatus: { plan: "pro", subscription: {} },
        legacyNoPlanFields: {},
        free: { plan: "free" },
        freeWithActiveSub: { plan: "free", subscription: { status: "active" } },
    }

    it.each(Object.entries(fixtures))("pro filter agrees with isPro for %s", (_name, user) => {
        expect(matches(user as Doc, proUsersFilter(NOW))).toBe(isPro(user, NOW))
    })

    it.each(Object.entries(fixtures))("free filter is the complement for %s", (_name, user) => {
        expect(matches(user as Doc, freeUsersFilter(NOW))).toBe(!isPro(user, NOW))
    })

    it("treats now equal to the period end as outside the paid period in both", () => {
        const user = proWith("cancelled", new Date(NOW.getTime()))
        expect(matches(user as Doc, proUsersFilter(NOW))).toBe(false)
        expect(isPro(user, NOW)).toBe(false)
    })

    it("builds the exact pro filter shape", () => {
        expect(proUsersFilter(NOW)).toEqual({
            plan: "pro",
            $or: [
                { "subscription.status": "active" },
                {
                    "subscription.status": { $in: ["past_due", "cancelled"] },
                    "subscription.currentPeriodEnd": { $gt: NOW },
                },
            ],
        })
        expect(freeUsersFilter(NOW)).toEqual({ $nor: [proUsersFilter(NOW)] })
    })

    it("defaults now to the real clock", () => {
        const before = Date.now()
        const bound = (proUsersFilter().$or[1]?.["subscription.currentPeriodEnd"] as { $gt: Date })
            .$gt
        expect(bound.getTime()).toBeGreaterThanOrEqual(before)
        expect(freeUsersFilter().$nor).toHaveLength(1)
    })
})
