import {
    FEEDBACK_FIRST_SESSION_HOURS,
    FEEDBACK_GENERATION_THRESHOLD,
    FEEDBACK_PROMPT_COOLDOWN_DAYS,
} from "@visual-ai/shared"
import { describe, expect, it } from "vitest"

import { isFeedbackEligible, isFirstSession, isInCooldown } from "./eligibility.js"

const MS_PER_HOUR = 60 * 60 * 1000
const MS_PER_DAY = 24 * MS_PER_HOUR
const NOW = new Date("2026-06-15T12:00:00.000Z")
const OLD_ACCOUNT = new Date(NOW.getTime() - 30 * MS_PER_DAY)

const base = {
    trigger: "generation" as const,
    now: NOW,
    accountCreatedAt: OLD_ACCOUNT,
    successfulGenerations: FEEDBACK_GENERATION_THRESHOLD,
    lastPromptedAt: null,
}

describe("isFirstSession", () => {
    it("is true inside the window and false at the boundary", () => {
        const inside = new Date(NOW.getTime() - (FEEDBACK_FIRST_SESSION_HOURS * MS_PER_HOUR - 1))
        const boundary = new Date(NOW.getTime() - FEEDBACK_FIRST_SESSION_HOURS * MS_PER_HOUR)
        expect(isFirstSession(inside, NOW)).toBe(true)
        expect(isFirstSession(boundary, NOW)).toBe(false)
    })
})

describe("isInCooldown", () => {
    it("never prompted means no cooldown", () => {
        expect(isInCooldown(null, NOW)).toBe(false)
    })

    it("is active until the cooldown elapses", () => {
        const justInside = new Date(
            NOW.getTime() - (FEEDBACK_PROMPT_COOLDOWN_DAYS * MS_PER_DAY - 1),
        )
        const boundary = new Date(NOW.getTime() - FEEDBACK_PROMPT_COOLDOWN_DAYS * MS_PER_DAY)
        expect(isInCooldown(justInside, NOW)).toBe(true)
        expect(isInCooldown(boundary, NOW)).toBe(false)
    })
})

describe("isFeedbackEligible", () => {
    it("is eligible at the generation threshold", () => {
        expect(isFeedbackEligible(base)).toBe(true)
    })

    it("is not eligible below the threshold", () => {
        expect(
            isFeedbackEligible({
                ...base,
                successfulGenerations: FEEDBACK_GENERATION_THRESHOLD - 1,
            }),
        ).toBe(false)
    })

    it("download trigger ignores the generation count", () => {
        expect(isFeedbackEligible({ ...base, trigger: "download", successfulGenerations: 0 })).toBe(
            true,
        )
    })

    it("is never eligible in the first session, even for downloads", () => {
        const fresh = new Date(NOW.getTime() - MS_PER_HOUR)
        expect(isFeedbackEligible({ ...base, accountCreatedAt: fresh })).toBe(false)
        expect(isFeedbackEligible({ ...base, trigger: "download", accountCreatedAt: fresh })).toBe(
            false,
        )
    })

    it("respects the cooldown", () => {
        const recent = new Date(NOW.getTime() - MS_PER_DAY)
        const expired = new Date(NOW.getTime() - (FEEDBACK_PROMPT_COOLDOWN_DAYS + 1) * MS_PER_DAY)
        expect(isFeedbackEligible({ ...base, lastPromptedAt: recent })).toBe(false)
        expect(isFeedbackEligible({ ...base, lastPromptedAt: expired })).toBe(true)
    })
})
