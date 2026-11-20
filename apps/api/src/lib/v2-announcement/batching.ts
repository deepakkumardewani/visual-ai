import { createHash } from "node:crypto"

export const MAX_BATCH_SIZE = 100
export const DEFAULT_DAILY_CAP = 100
// Resend allows ~2 requests/s per team.
export const THROTTLE_MS = 500
export const MAX_RETRIES = 4
export const BACKOFF_BASE_MS = 1000
// Resend forgets idempotency keys after ~24h. Past this (safely shorter) age a replay could be
// treated as a brand-new send, so it is never done automatically.
export const PENDING_REPLAY_RETENTION_MS = 20 * 60 * 60 * 1000

const HTTP_TOO_MANY_REQUESTS = 429
const HTTP_SERVER_ERROR = 500
const IDEMPOTENCY_HASH_LENGTH = 32

export type Sleep = (ms: number) => Promise<void>

export const realSleep: Sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Thrown by senders for API failures; `statusCode` drives the retry decision. */
export class SendError extends Error {
    constructor(
        message: string,
        readonly statusCode?: number,
    ) {
        super(message)
        this.name = "SendError"
    }
}

export function chunk<T>(items: readonly T[], size: number = MAX_BATCH_SIZE): T[][] {
    if (!Number.isInteger(size) || size < 1) {
        throw new RangeError(`chunk size must be a positive integer, got ${size}`)
    }
    const chunks: T[][] = []
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size))
    }
    return chunks
}

export function batchIdempotencyKey(userIds: readonly string[]): string {
    const digest = createHash("sha256")
        .update([...userIds].sort().join(","))
        .digest("hex")
        .slice(0, IDEMPOTENCY_HASH_LENGTH)
    return `v2-announce-${digest}`
}

function isRetryable(error: unknown): boolean {
    if (!(error instanceof SendError) || error.statusCode === undefined) {
        return false
    }
    return error.statusCode === HTTP_TOO_MANY_REQUESTS || error.statusCode >= HTTP_SERVER_ERROR
}

/** Retries 429/5xx with exponential backoff; anything else surfaces immediately. */
export async function withBackoff<T>(fn: () => Promise<T>, sleep: Sleep = realSleep): Promise<T> {
    for (let attempt = 0; ; attempt++) {
        try {
            return await fn()
        } catch (error) {
            if (attempt >= MAX_RETRIES || !isRetryable(error)) {
                throw error
            }
            await sleep(BACKOFF_BASE_MS * 2 ** attempt)
        }
    }
}

export interface BatchItem {
    userId: string
}

export interface SendFailure {
    userId: string
    reason: string
}

export interface SendSummary {
    sent: string[]
    failed: SendFailure[]
}

export interface SentEntry<T extends BatchItem> {
    item: T
    providerId: string
}

/** A batch already handed to (or about to be handed to) Resend, with the key it was sent under. */
export interface PendingBatch<T extends BatchItem> {
    key: string
    items: T[]
    /** Oldest reservation time among the members; absent means unknown, treated as stale. */
    reservedAt?: Date
}

/** Splits reserved batches into those Resend can still dedupe and those it may no longer know. */
export function partitionPendingByAge<T extends BatchItem>(
    batches: readonly PendingBatch<T>[],
    now: Date,
): { replayable: PendingBatch<T>[]; stale: PendingBatch<T>[] } {
    const replayable: PendingBatch<T>[] = []
    const stale: PendingBatch<T>[] = []
    for (const batch of batches) {
        const age = batch.reservedAt ? now.getTime() - batch.reservedAt.getTime() : Infinity
        ;(age <= PENDING_REPLAY_RETENTION_MS ? replayable : stale).push(batch)
    }
    return { replayable, stale }
}

export interface SendDeps<T extends BatchItem> {
    /** Returns one provider id per item, in order. */
    sendBatch: (batch: T[], idempotencyKey: string) => Promise<string[]>
    /**
     * Durably records the batch (key + members) BEFORE Resend is called. After a crash the next run
     * replays exactly this batch under exactly this key, independent of who is eligible or which
     * flags are passed by then, so Resend dedupes and nobody is mailed twice.
     */
    reserveBatch: (batch: T[], idempotencyKey: string) => Promise<void>
    /** Persists the whole accepted batch in ONE write and clears its pending reservation. */
    markBatchSent: (sent: SentEntry<T>[]) => Promise<void>
    sleep?: Sleep
    onBatchDone?: (summary: SendSummary) => void
}

function describe(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
}

function failBatch<T extends BatchItem>(batch: T[], reason: string, summary: SendSummary): void {
    batch.forEach((item) => summary.failed.push({ userId: item.userId, reason }))
}

async function sendOneBatch<T extends BatchItem>(
    { key, items: batch }: PendingBatch<T>,
    deps: SendDeps<T>,
    summary: SendSummary,
): Promise<void> {
    let ids: string[]
    try {
        ids = await withBackoff(() => deps.sendBatch(batch, key), deps.sleep)
    } catch (error) {
        // The reservation stays: a later run replays this batch under the same key.
        failBatch(batch, describe(error), summary)
        return
    }
    const sent: SentEntry<T>[] = []
    for (const [index, item] of batch.entries()) {
        const providerId = ids[index]
        if (providerId) {
            sent.push({ item, providerId })
        } else {
            summary.failed.push({
                userId: item.userId,
                reason: "provider returned no id",
            })
        }
    }
    if (sent.length === 0) return
    try {
        await deps.markBatchSent(sent)
        sent.forEach(({ item }) => summary.sent.push(item.userId))
    } catch (error) {
        // Mail is out but unrecorded; the reservation makes the next run replay the same key.
        failBatch(
            sent.map(({ item }) => item),
            `sent but not recorded: ${describe(error)}`,
            summary,
        )
    }
}

/** Builds fresh batches and reserves each one durably before it may be sent. */
async function reserveFresh<T extends BatchItem>(
    batch: T[],
    deps: SendDeps<T>,
    summary: SendSummary,
): Promise<PendingBatch<T> | null> {
    const key = batchIdempotencyKey(batch.map((item) => item.userId))
    try {
        await deps.reserveBatch(batch, key)
    } catch (error) {
        failBatch(batch, `not sent, could not reserve batch: ${describe(error)}`, summary)
        return null
    }
    return { key, items: batch }
}

/**
 * Replays previously reserved batches first (same members, same key), then sends `items` in fresh
 * reserved batches of <=100, throttled. Failed items are reported, never marked.
 */
export async function sendInBatches<T extends BatchItem>(
    items: readonly T[],
    deps: SendDeps<T>,
    pending: readonly PendingBatch<T>[] = [],
): Promise<SendSummary> {
    const sleep = deps.sleep ?? realSleep
    const summary: SendSummary = { sent: [], failed: [] }
    const steps: Array<() => Promise<PendingBatch<T> | null>> = [
        ...pending.map((batch) => async () => batch),
        ...chunk(items).map((batch) => () => reserveFresh(batch, deps, summary)),
    ]
    for (const [index, prepare] of steps.entries()) {
        if (index > 0) {
            await sleep(THROTTLE_MS)
        }
        const ready = await prepare()
        if (ready) await sendOneBatch(ready, deps, summary)
        deps.onBatchDone?.(summary)
    }
    return summary
}
