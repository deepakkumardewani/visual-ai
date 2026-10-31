import { UserModel } from "../../models/user.js"
import type { PendingBatch } from "./batching.js"

export interface UserCandidate {
    userId: string
    email?: string | null
    firstName?: string | null
    emailOptOut?: boolean | null
    announcements?: {
        v2?: { sentAt?: Date | null; pendingKey?: string | null; pendingAt?: Date | null } | null
    } | null
}

export interface Recipient {
    userId: string
    email: string
    /** Empty string means "no usable name"; the template falls back to its greeting. */
    firstName: string
}

// Deliberately loose: Resend validates strictly, this only drops empty/garbled values.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isDeliverableEmail(email: string | null | undefined): email is string {
    return typeof email === "string" && EMAIL_PATTERN.test(email.trim())
}

const addressKey = (email: string): string => email.trim().toLowerCase()

function isExcluded(user: UserCandidate): boolean {
    const v2 = user.announcements?.v2
    return Boolean(user.emailOptOut || v2?.sentAt || v2?.pendingKey)
}

/**
 * Pure eligibility filter over ALL users (in stable order): drops opted-out, already-sent, reserved-for-replay (pending) and
 * undeliverable users, and keeps only the first user per (case-insensitive) email.
 */
export function selectRecipients(users: readonly UserCandidate[]): Recipient[] {
    // Sent/opted-out/pending users claim their address up front, regardless of _id order, so a
    // second account sharing it is never mailed.
    const claimed = new Set<string>(
        users.filter(isExcluded).flatMap((user) => (user.email ? [addressKey(user.email)] : [])),
    )
    const recipients: Recipient[] = []
    for (const user of users) {
        if (!isDeliverableEmail(user.email) || isExcluded(user)) {
            continue
        }
        const key = addressKey(user.email)
        if (claimed.has(key)) {
            continue
        }
        claimed.add(key)
        recipients.push({
            userId: user.userId,
            email: user.email.trim(),
            firstName: user.firstName?.trim() ?? "",
        })
    }
    return recipients
}

/**
 * Loads every user with an email (not only unsent ones) so address dedupe sees already-mailed
 * accounts. Stable _id order keeps reruns and batch idempotency keys deterministic.
 */
export async function loadEligibleRecipients(): Promise<Recipient[]> {
    const users = await UserModel.find({ email: { $nin: ["", null] } })
        .select(
            "userId email firstName emailOptOut announcements.v2.sentAt announcements.v2.pendingKey",
        )
        .sort({ _id: 1 })
        .lean<UserCandidate[]>()
    return selectRecipients(users)
}

/** Oldest reservation time; unknown (undefined) if any member lacks one, so the batch reads as stale. */
function oldestReservation(times: readonly (Date | null | undefined)[]): Date | undefined {
    const known = times.filter((time): time is Date => Boolean(time))
    if (known.length !== times.length) return undefined
    return known.reduce((oldest, time) => (time < oldest ? time : oldest))
}

/** Groups reserved-but-unsent users by their reservation key, keeping each batch's member order. */
export function groupPendingBatches(users: readonly UserCandidate[]): PendingBatch<Recipient>[] {
    const byKey = new Map<string, { items: Recipient[]; times: (Date | null | undefined)[] }>()
    for (const user of users) {
        const v2 = user.announcements?.v2
        if (!v2?.pendingKey || v2.sentAt || !isDeliverableEmail(user.email)) {
            continue
        }
        const batch = byKey.get(v2.pendingKey) ?? { items: [], times: [] }
        batch.items.push({
            userId: user.userId,
            email: user.email.trim(),
            firstName: user.firstName?.trim() ?? "",
        })
        batch.times.push(v2.pendingAt)
        byKey.set(v2.pendingKey, batch)
    }
    return [...byKey].map(([key, { items, times }]) => {
        const reservedAt = oldestReservation(times)
        return { key, items, ...(reservedAt ? { reservedAt } : {}) }
    })
}

/**
 * Batches reserved by an earlier run that may or may not have been delivered. Deliberately ignores
 * emailOptOut: the replay must match the original payload and key exactly, and Resend dedupes it.
 */
export async function loadPendingBatches(): Promise<PendingBatch<Recipient>[]> {
    const users = await UserModel.find({
        "announcements.v2.pendingKey": { $exists: true, $ne: null },
    })
        .select(
            "userId email firstName announcements.v2.sentAt announcements.v2.pendingKey announcements.v2.pendingAt",
        )
        .sort({ _id: 1 })
        .lean<UserCandidate[]>()
    return groupPendingBatches(users)
}
