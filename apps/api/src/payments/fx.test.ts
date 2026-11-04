import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const redisMock = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }))

vi.mock("../config/redis.js", () => ({ redisClient: redisMock }))
vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}))

import {
    FX_CACHE_KEY,
    FX_MAX_AGE_MS,
    FX_REFRESH_AFTER_MS,
    FX_SOURCE_URL,
    getFxRates,
} from "./fx.js"

const NOW = 1_800_000_000_000
const CACHED_RATES = { INR: 80 }
const FRESH_RATES = { INR: 85 }
const fetchMock = vi.fn()

function snapshotAged(ageMs: number): string {
    return JSON.stringify({ rates: CACHED_RATES, fetchedAt: NOW - ageMs })
}

function okResponse(body: unknown) {
    return { ok: true, status: 200, json: async () => body }
}

describe("getFxRates", () => {
    beforeEach(() => {
        redisMock.get.mockReset().mockResolvedValue(null)
        redisMock.set.mockReset().mockResolvedValue("OK")
        fetchMock.mockReset()
        vi.stubGlobal("fetch", fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it("returns cached rates without fetching when the snapshot is fresh", async () => {
        redisMock.get.mockResolvedValue(snapshotAged(FX_REFRESH_AFTER_MS - 1))

        expect(await getFxRates(NOW)).toEqual(CACHED_RATES)
        expect(redisMock.get).toHaveBeenCalledWith(FX_CACHE_KEY)
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it("fetches, stores and returns fresh rates on a cache miss", async () => {
        fetchMock.mockResolvedValue(okResponse({ rates: FRESH_RATES }))

        expect(await getFxRates(NOW)).toEqual(FRESH_RATES)
        expect(fetchMock.mock.calls[0][0]).toBe(FX_SOURCE_URL)
        const [key, value, mode, ttl] = redisMock.set.mock.calls[0]
        expect(key).toBe(FX_CACHE_KEY)
        expect(JSON.parse(value)).toEqual({ rates: FRESH_RATES, fetchedAt: NOW })
        expect(mode).toBe("EX")
        expect(ttl).toBeGreaterThan(0)
    })

    it("refreshes a snapshot older than the refresh window", async () => {
        redisMock.get.mockResolvedValue(snapshotAged(FX_REFRESH_AFTER_MS))
        fetchMock.mockResolvedValue(okResponse({ rates: FRESH_RATES }))

        expect(await getFxRates(NOW)).toEqual(FRESH_RATES)
    })

    it("serves a stale-but-usable snapshot when the refresh fails", async () => {
        redisMock.get.mockResolvedValue(snapshotAged(FX_MAX_AGE_MS - 1))
        fetchMock.mockRejectedValue(new Error("network"))

        expect(await getFxRates(NOW)).toEqual(CACHED_RATES)
        expect(redisMock.set).not.toHaveBeenCalled()
    })

    it("returns undefined when the snapshot is older than the max age and refresh fails", async () => {
        redisMock.get.mockResolvedValue(snapshotAged(FX_MAX_AGE_MS))
        fetchMock.mockRejectedValue(new Error("network"))

        expect(await getFxRates(NOW)).toBeUndefined()
    })

    it("returns undefined on a cache miss when the source is down", async () => {
        fetchMock.mockRejectedValue(new Error("network"))

        expect(await getFxRates(NOW)).toBeUndefined()
    })

    it("treats a non-OK source response as a failed refresh", async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) })

        expect(await getFxRates(NOW)).toBeUndefined()
        expect(redisMock.set).not.toHaveBeenCalled()
    })

    it("treats a source response without rates as a failed refresh", async () => {
        fetchMock.mockResolvedValue(okResponse({ result: "error" }))

        expect(await getFxRates(NOW)).toBeUndefined()
        expect(redisMock.set).not.toHaveBeenCalled()
    })

    it("still fetches when the cache read throws", async () => {
        redisMock.get.mockRejectedValue(new Error("redis down"))
        fetchMock.mockResolvedValue(okResponse({ rates: FRESH_RATES }))

        expect(await getFxRates(NOW)).toEqual(FRESH_RATES)
    })

    it("still returns fresh rates when the cache write throws", async () => {
        redisMock.set.mockRejectedValue(new Error("redis down"))
        fetchMock.mockResolvedValue(okResponse({ rates: FRESH_RATES }))

        expect(await getFxRates(NOW)).toEqual(FRESH_RATES)
    })

    it("defaults to the current clock when no timestamp is given", async () => {
        vi.useFakeTimers()
        vi.setSystemTime(NOW)
        try {
            fetchMock.mockResolvedValue(okResponse({ rates: FRESH_RATES }))

            await getFxRates()

            expect(JSON.parse(redisMock.set.mock.calls[0][1]).fetchedAt).toBe(NOW)
        } finally {
            vi.useRealTimers()
        }
    })
})
