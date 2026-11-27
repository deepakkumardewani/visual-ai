import type { FeedbackDigestData, RatingTrend } from "@visual-ai/email"
import {
    FEEDBACK_DIGEST_WINDOW_DAYS,
    FEEDBACK_HIGH_RATING_MIN,
    FEEDBACK_TYPES,
    type FeedbackType,
} from "@visual-ai/shared"

export const DIGEST_MAX_IDEAS = 10
export const DIGEST_MAX_QUOTES = 10
const MS_PER_DAY = 24 * 60 * 60 * 1000
const RATING_EPSILON = 0.05

export interface DigestFeedbackItem {
    type: FeedbackType
    rating?: number | null
    message: string
    testimonialConsent: boolean
    displayName?: string | null
}

export interface DigestWindow {
    from: Date
    to: Date
}

export interface DigestWindows {
    current: DigestWindow
    previous: DigestWindow
}

export function getDigestWindows(now: Date): DigestWindows {
    const windowMs = FEEDBACK_DIGEST_WINDOW_DAYS * MS_PER_DAY
    const currentFrom = new Date(now.getTime() - windowMs)
    return {
        current: { from: currentFrom, to: now },
        previous: { from: new Date(currentFrom.getTime() - windowMs), to: currentFrom },
    }
}

export function averageRating(items: Array<Pick<DigestFeedbackItem, "rating">>): number | null {
    const ratings = items.flatMap((item) => (typeof item.rating === "number" ? [item.rating] : []))
    if (ratings.length === 0) return null
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
}

function countByType(items: DigestFeedbackItem[]): Record<string, number> {
    const counts: Record<string, number> = {}
    for (const type of FEEDBACK_TYPES) {
        const count = items.filter((item) => item.type === type).length
        if (count > 0) counts[type] = count
    }
    return counts
}

function trendFor(
    current: number | null,
    previous: number | null,
): { trend: RatingTrend | null; delta: number | null } {
    if (current === null || previous === null) return { trend: null, delta: null }
    const delta = current - previous
    if (Math.abs(delta) < RATING_EPSILON) return { trend: "flat", delta: 0 }
    return { trend: delta > 0 ? "up" : "down", delta }
}

function isQuotable(item: DigestFeedbackItem): boolean {
    return (
        item.testimonialConsent &&
        item.message.trim().length > 0 &&
        (item.rating ?? 0) >= FEEDBACK_HIGH_RATING_MIN
    )
}

function formatDay(date: Date): string {
    return date.toISOString().slice(0, 10)
}

export interface BuildDigestInput {
    current: DigestFeedbackItem[]
    previous: DigestFeedbackItem[]
    windows: DigestWindows
    adminUrl: string
}

/** Pure: turns two windows of feedback into the FeedbackDigest template props. */
export function buildFeedbackDigest(input: BuildDigestInput): FeedbackDigestData {
    const { current, previous, windows, adminUrl } = input
    const avgRating = averageRating(current)
    const { trend, delta } = trendFor(avgRating, averageRating(previous))

    return {
        periodLabel: `${formatDay(windows.current.from)} to ${formatDay(windows.current.to)}`,
        totalCount: current.length,
        countByType: countByType(current),
        avgRating,
        ratingTrend: trend,
        ratingDelta: delta,
        newIdeas: current
            .filter((item) => item.type === "idea" && item.message.trim())
            .slice(0, DIGEST_MAX_IDEAS)
            .map((item) => ({ message: item.message.trim() })),
        quotes: current
            .filter(isQuotable)
            .slice(0, DIGEST_MAX_QUOTES)
            .map((item) => ({
                quote: item.message.trim(),
                displayName: item.displayName?.trim() || "Anonymous",
            })),
        adminUrl,
    }
}
