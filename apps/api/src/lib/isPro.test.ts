import { describe, expect, it } from "vitest"

import { isPro, type PlanSubject } from "./isPro.js"

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
