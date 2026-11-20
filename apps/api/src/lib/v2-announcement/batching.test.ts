import { describe, expect, it, vi } from "vitest"

import {
    BACKOFF_BASE_MS,
    batchIdempotencyKey,
    chunk,
    MAX_BATCH_SIZE,
    MAX_RETRIES,
    partitionPendingByAge,
    PENDING_REPLAY_RETENTION_MS,
    realSleep,
    SendError,
    sendInBatches,
    THROTTLE_MS,
    withBackoff,
    type SendSummary,
} from "./batching.js"

const items = (n: number) => Array.from({ length: n }, (_, i) => ({ userId: `u${i}` }))

describe("chunk", () => {
    it("returns no chunks for an empty list", () => {
        expect(chunk([])).toEqual([])
    })

    it("splits into the default size of 100", () => {
        const sizes = chunk(Array.from({ length: 250 }, (_, i) => i)).map((c) => c.length)
        expect(sizes).toEqual([MAX_BATCH_SIZE, MAX_BATCH_SIZE, 50])
    })

    it("honours a custom size", () => {
        expect(chunk([1, 2, 3], 2)).toEqual([[1, 2], [3]])
    })

    it.each([0, -1, 1.5, Number.NaN])("rejects invalid size %s", (size) => {
        expect(() => chunk([1], size)).toThrow(RangeError)
    })
})

describe("batchIdempotencyKey", () => {
    it("is stable regardless of input order", () => {
        expect(batchIdempotencyKey(["b", "a", "c"])).toBe(batchIdempotencyKey(["c", "a", "b"]))
    })

    it("differs for different user sets", () => {
        expect(batchIdempotencyKey(["a"])).not.toBe(batchIdempotencyKey(["a", "b"]))
    })

    it("has the expected prefix and a 32-char digest, without mutating input", () => {
        const ids = ["z", "a"]
        expect(batchIdempotencyKey(ids)).toMatch(/^v2-announce-[0-9a-f]{32}$/)
        expect(ids).toEqual(["z", "a"])
    })
})

describe("realSleep", () => {
    it("resolves after the timer fires", async () => {
        vi.useFakeTimers()
        try {
            const done = vi.fn()
            const pending = realSleep(1000).then(done)
            await vi.advanceTimersByTimeAsync(999)
            expect(done).not.toHaveBeenCalled()
            await vi.advanceTimersByTimeAsync(1)
            await pending
            expect(done).toHaveBeenCalledOnce()
        } finally {
            vi.useRealTimers()
        }
    })
})

describe("SendError", () => {
    it("carries name and status code", () => {
        const error = new SendError("boom", 429)
        expect(error).toBeInstanceOf(Error)
        expect(error.name).toBe("SendError")
        expect(error.statusCode).toBe(429)
    })
})

describe("withBackoff", () => {
    it("returns the result without sleeping on success", async () => {
        const sleep = vi.fn()
        await expect(withBackoff(async () => "ok", sleep)).resolves.toBe("ok")
        expect(sleep).not.toHaveBeenCalled()
    })

    it.each([429, 500, 503])("retries %i with exponential delays then succeeds", async (code) => {
        const sleep = vi.fn().mockResolvedValue(undefined)
        const fn = vi
            .fn()
            .mockRejectedValueOnce(new SendError("x", code))
            .mockRejectedValueOnce(new SendError("x", code))
            .mockResolvedValue("ok")

        await expect(withBackoff(fn, sleep)).resolves.toBe("ok")
        expect(sleep.mock.calls.map((c) => c[0])).toEqual([BACKOFF_BASE_MS, BACKOFF_BASE_MS * 2])
    })

    it("gives up after MAX_RETRIES retries and throws the last error", async () => {
        const sleep = vi.fn().mockResolvedValue(undefined)
        const fn = vi.fn().mockRejectedValue(new SendError("down", 503))

        await expect(withBackoff(fn, sleep)).rejects.toThrow("down")
        expect(fn).toHaveBeenCalledTimes(MAX_RETRIES + 1)
        expect(sleep).toHaveBeenCalledTimes(MAX_RETRIES)
    })

    it.each([
        ["4xx", new SendError("bad", 422)],
        ["no status", new SendError("bad")],
        ["non-SendError", new Error("bad")],
    ])("does not retry %s", async (_label, error) => {
        const sleep = vi.fn()
        const fn = vi.fn().mockRejectedValue(error)

        await expect(withBackoff(fn, sleep)).rejects.toBe(error)
        expect(fn).toHaveBeenCalledOnce()
        expect(sleep).not.toHaveBeenCalled()
    })

    it("defaults to the real sleep", async () => {
        vi.useFakeTimers()
        try {
            const fn = vi
                .fn()
                .mockRejectedValueOnce(new SendError("x", 429))
                .mockResolvedValue("ok")
            const pending = withBackoff(fn)
            await vi.advanceTimersByTimeAsync(BACKOFF_BASE_MS)
            await expect(pending).resolves.toBe("ok")
        } finally {
            vi.useRealTimers()
        }
    })
})

describe("sendInBatches", () => {
    const okDeps = () => ({
        sendBatch: vi.fn(async (batch: { userId: string }[], _key: string) =>
            batch.map((b) => `id-${b.userId}`),
        ),
        reserveBatch: vi.fn().mockResolvedValue(undefined),
        markBatchSent: vi.fn().mockResolvedValue(undefined),
        sleep: vi.fn().mockResolvedValue(undefined),
    })

    it("does nothing for no items", async () => {
        const deps = okDeps()
        await expect(sendInBatches([], deps)).resolves.toEqual({
            sent: [],
            failed: [],
        })
        expect(deps.sendBatch).not.toHaveBeenCalled()
    })

    it("sends 250 items as 100/100/50, throttling between batches only", async () => {
        const deps = okDeps()
        const summary = await sendInBatches(items(250), deps)

        expect(deps.sendBatch.mock.calls.map((c) => c[0].length)).toEqual([100, 100, 50])
        expect(deps.sleep.mock.calls).toEqual([[THROTTLE_MS], [THROTTLE_MS]])
        expect(summary.sent).toHaveLength(250)
        expect(summary.failed).toEqual([])
        expect(deps.markBatchSent).toHaveBeenCalledTimes(3)
        expect(deps.markBatchSent.mock.calls[0]![0]).toHaveLength(100)
        expect(deps.markBatchSent).toHaveBeenCalledWith(
            expect.arrayContaining([{ item: { userId: "u7" }, providerId: "id-u7" }]),
        )
    })

    it("uses a stable idempotency key per batch across reruns", async () => {
        const first = okDeps()
        const second = okDeps()
        await sendInBatches(items(3), first)
        await sendInBatches(items(3), second)

        expect(first.sendBatch.mock.calls[0]![1]).toBe(second.sendBatch.mock.calls[0]![1])
        expect(first.sendBatch.mock.calls[0]![1]).toBe(batchIdempotencyKey(["u0", "u1", "u2"]))
    })

    it("fails the whole batch when the provider keeps erroring, and does not mark anyone", async () => {
        const deps = okDeps()
        deps.sendBatch.mockRejectedValue(new SendError("down", 500))

        const summary = await sendInBatches(items(2), deps)

        expect(summary.sent).toEqual([])
        expect(summary.failed).toEqual([
            { userId: "u0", reason: "down" },
            { userId: "u1", reason: "down" },
        ])
        expect(deps.markBatchSent).not.toHaveBeenCalled()
    })

    it("stringifies non-Error throwables", async () => {
        const deps = okDeps()
        deps.sendBatch.mockRejectedValue("weird")

        const summary = await sendInBatches(items(1), deps)

        expect(summary.failed).toEqual([{ userId: "u0", reason: "weird" }])
    })

    it("recovers from a transient 429 within a batch", async () => {
        const deps = okDeps()
        deps.sendBatch.mockRejectedValueOnce(new SendError("slow down", 429))

        const summary = await sendInBatches(items(1), deps)

        expect(summary.sent).toEqual(["u0"])
        expect(deps.sleep).toHaveBeenCalledWith(BACKOFF_BASE_MS)
    })

    it("reports a missing provider id as a failure and continues with the rest", async () => {
        const deps = okDeps()
        deps.sendBatch.mockResolvedValue(["id-a", ""])

        const summary = await sendInBatches(items(3), deps)

        expect(summary.sent).toEqual(["u0"])
        expect(summary.failed).toEqual([
            { userId: "u1", reason: "provider returned no id" },
            { userId: "u2", reason: "provider returned no id" },
        ])
    })

    it("reports the batch as sent-but-unrecorded when the bulk mark fails", async () => {
        const deps = okDeps()
        deps.markBatchSent.mockRejectedValueOnce(new Error("mongo down"))

        const summary = await sendInBatches(items(2), deps)

        expect(summary.failed).toEqual([
            { userId: "u0", reason: "sent but not recorded: mongo down" },
            { userId: "u1", reason: "sent but not recorded: mongo down" },
        ])
        expect(summary.sent).toEqual([])
    })

    it("continues to later batches after a failed batch", async () => {
        const deps = okDeps()
        deps.sendBatch.mockRejectedValueOnce(new SendError("bad", 400))

        const summary = await sendInBatches(items(101), deps)

        expect(summary.failed).toHaveLength(100)
        expect(summary.sent).toEqual(["u100"])
    })

    it("calls onBatchDone after each batch with the running summary", async () => {
        const deps = okDeps()
        const seen: number[] = []
        const onBatchDone = (s: SendSummary) => seen.push(s.sent.length)

        await sendInBatches(items(150), { ...deps, onBatchDone })

        expect(seen).toEqual([100, 150])
    })

    it("falls back to the real sleep for throttling when none is injected", async () => {
        vi.useFakeTimers()
        try {
            const { sleep: _unused, ...deps } = okDeps()
            const pending = sendInBatches(items(101), deps)
            await vi.advanceTimersByTimeAsync(THROTTLE_MS)
            const summary = await pending
            expect(summary.sent).toHaveLength(101)
        } finally {
            vi.useRealTimers()
        }
    })

    it("reserves each fresh batch under its key before sending it", async () => {
        const order: string[] = []
        const deps = okDeps()
        deps.reserveBatch.mockImplementation(async () => void order.push("reserve"))
        deps.sendBatch.mockImplementation(async (batch) => {
            order.push("send")
            return batch.map((b) => `id-${b.userId}`)
        })

        await sendInBatches(items(2), deps)

        expect(order).toEqual(["reserve", "send"])
        expect(deps.reserveBatch).toHaveBeenCalledWith(items(2), batchIdempotencyKey(["u0", "u1"]))
    })

    it("does not send a batch it failed to reserve", async () => {
        const deps = okDeps()
        deps.reserveBatch.mockRejectedValue(new Error("mongo down"))

        const summary = await sendInBatches(items(2), deps)

        expect(deps.sendBatch).not.toHaveBeenCalled()
        expect(summary.failed.map((f) => f.reason)).toEqual([
            "not sent, could not reserve batch: mongo down",
            "not sent, could not reserve batch: mongo down",
        ])
    })

    it("replays pending batches first under their stored key without re-reserving", async () => {
        const deps = okDeps()
        const pending = [{ key: "stored-key", items: items(2) }]

        const summary = await sendInBatches([{ userId: "fresh" }], deps, pending)

        expect(deps.sendBatch.mock.calls.map((c) => [c[0].map((b) => b.userId), c[1]])).toEqual([
            [["u0", "u1"], "stored-key"],
            [["fresh"], batchIdempotencyKey(["fresh"])],
        ])
        expect(deps.reserveBatch).toHaveBeenCalledOnce()
        expect(summary.sent).toEqual(["u0", "u1", "fresh"])
        expect(deps.sleep).toHaveBeenCalledWith(THROTTLE_MS)
    })
})

describe("partitionPendingByAge", () => {
    const now = new Date(Date.UTC(2026, 0, 2))
    const batch = (key: string, reservedAt?: Date) => ({
        key,
        items: [{ userId: key }],
        ...(reservedAt ? { reservedAt } : {}),
    })

    it("keeps batches within retention (boundary inclusive) replayable", () => {
        const edge = new Date(now.getTime() - PENDING_REPLAY_RETENTION_MS)
        const { replayable, stale } = partitionPendingByAge(
            [batch("new", now), batch("edge", edge)],
            now,
        )
        expect(replayable.map((b) => b.key)).toEqual(["new", "edge"])
        expect(stale).toEqual([])
    })

    it("marks older and untimed batches stale", () => {
        const old = new Date(now.getTime() - PENDING_REPLAY_RETENTION_MS - 1)
        const { replayable, stale } = partitionPendingByAge([batch("old", old), batch("none")], now)
        expect(replayable).toEqual([])
        expect(stale.map((b) => b.key)).toEqual(["old", "none"])
    })

    it("retention stays below Resend's ~24h key lifetime", () => {
        expect(PENDING_REPLAY_RETENTION_MS).toBeLessThan(24 * 60 * 60 * 1000)
    })
})
