import { describe, expect, it } from "vitest"

import {
    averageRating,
    buildFeedbackDigest,
    DIGEST_MAX_IDEAS,
    getDigestWindows,
    type DigestFeedbackItem,
} from "./digest.js"

const NOW = new Date("2026-06-15T09:00:00.000Z")
const windows = getDigestWindows(NOW)
const adminUrl = "https://app.test/admin/feedback"

const item = (overrides: Partial<DigestFeedbackItem> = {}): DigestFeedbackItem => ({
    type: "rating",
    rating: 4,
    message: "",
    testimonialConsent: false,
    ...overrides,
})

describe("getDigestWindows", () => {
    it("returns two adjacent 7-day windows ending now", () => {
        expect(windows.current.to).toEqual(NOW)
        expect(windows.current.from.toISOString()).toBe("2026-06-08T09:00:00.000Z")
        expect(windows.previous.to).toEqual(windows.current.from)
        expect(windows.previous.from.toISOString()).toBe("2026-06-01T09:00:00.000Z")
    })
})

describe("averageRating", () => {
    it("ignores items without ratings and returns null when none", () => {
        expect(averageRating([{ rating: 2 }, { rating: 4 }, { rating: null }, {}])).toBe(3)
        expect(averageRating([{}])).toBeNull()
    })
})

describe("buildFeedbackDigest", () => {
    it("counts by type, omitting empty types", () => {
        const data = buildFeedbackDigest({
            current: [item(), item(), item({ type: "bug", rating: null })],
            previous: [],
            windows,
            adminUrl,
        })
        expect(data.totalCount).toBe(3)
        expect(data.countByType).toEqual({ rating: 2, bug: 1 })
        expect(data.adminUrl).toBe(adminUrl)
    })

    it("computes the trend against the previous window", () => {
        const up = buildFeedbackDigest({
            current: [item({ rating: 5 })],
            previous: [item({ rating: 4 })],
            windows,
            adminUrl,
        })
        expect(up.ratingTrend).toBe("up")
        expect(up.ratingDelta).toBe(1)

        const down = buildFeedbackDigest({
            current: [item({ rating: 3 })],
            previous: [item({ rating: 4 })],
            windows,
            adminUrl,
        })
        expect(down.ratingTrend).toBe("down")

        const flat = buildFeedbackDigest({
            current: [item({ rating: 4 })],
            previous: [item({ rating: 4 })],
            windows,
            adminUrl,
        })
        expect(flat.ratingTrend).toBe("flat")
    })

    it("has no trend without a previous rating or without current ratings", () => {
        const noPrev = buildFeedbackDigest({ current: [item()], previous: [], windows, adminUrl })
        expect(noPrev.ratingTrend).toBeNull()
        const noCurrent = buildFeedbackDigest({
            current: [],
            previous: [item()],
            windows,
            adminUrl,
        })
        expect(noCurrent.avgRating).toBeNull()
        expect(noCurrent.ratingTrend).toBeNull()
        expect(noCurrent.totalCount).toBe(0)
    })

    it("lists new ideas, capped, skipping blank ones", () => {
        const ideas = Array.from({ length: DIGEST_MAX_IDEAS + 3 }, (_, i) =>
            item({ type: "idea", rating: null, message: `idea ${i}` }),
        )
        const data = buildFeedbackDigest({
            current: [item({ type: "idea", rating: null, message: "  " }), ...ideas],
            previous: [],
            windows,
            adminUrl,
        })
        expect(data.newIdeas).toHaveLength(DIGEST_MAX_IDEAS)
        expect(data.newIdeas[0]?.message).toBe("idea 0")
    })

    it("includes only consented, high-rated, non-empty quotes", () => {
        const data = buildFeedbackDigest({
            current: [
                item({ message: "Love it", testimonialConsent: true, displayName: " Sam " }),
                item({ message: "Anon love", testimonialConsent: true }),
                item({ message: "No consent", testimonialConsent: false }),
                item({ message: "Meh", testimonialConsent: true, rating: 2 }),
                item({ message: "  ", testimonialConsent: true }),
            ],
            previous: [],
            windows,
            adminUrl,
        })
        expect(data.quotes).toEqual([
            { quote: "Love it", displayName: "Sam" },
            { quote: "Anon love", displayName: "Anonymous" },
        ])
    })
})
