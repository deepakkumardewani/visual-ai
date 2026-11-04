import type { Request } from "express"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}))

import { IP_LOOKUP_URL, resolveCountry } from "./geo.js"

const fetchMock = vi.fn()

function makeReq(headers: Record<string, string | string[] | undefined>, ip?: string): Request {
    return { headers, ip } as unknown as Request
}

describe("resolveCountry", () => {
    beforeEach(() => {
        fetchMock.mockReset()
        vi.stubGlobal("fetch", fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it("uses the geo header and skips the IP lookup", async () => {
        const country = await resolveCountry(makeReq({ "cf-ipcountry": "in" }, "1.2.3.4"))

        expect(country).toBe("IN")
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it("checks later headers when earlier ones are missing or malformed", async () => {
        const country = await resolveCountry(
            makeReq({ "cf-ipcountry": "XX1", "x-vercel-ip-country": "de" }),
        )

        expect(country).toBe("DE")
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it("takes the first value of an array header", async () => {
        const country = await resolveCountry(makeReq({ "cloudfront-viewer-country": ["fr", "es"] }))

        expect(country).toBe("FR")
    })

    it("falls back to the IP lookup when no header yields a country", async () => {
        fetchMock.mockResolvedValue({ ok: true, text: async () => "gb\n" })

        const country = await resolveCountry(makeReq({}, "::1"))

        expect(country).toBe("GB")
        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(fetchMock.mock.calls[0][0]).toBe(`${IP_LOOKUP_URL}/%3A%3A1/country/`)
    })

    it("returns undefined without a lookup when there is no header and no IP", async () => {
        expect(await resolveCountry(makeReq({}))).toBeUndefined()
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it("returns undefined when the lookup responds non-OK", async () => {
        fetchMock.mockResolvedValue({ ok: false, text: async () => "US" })

        expect(await resolveCountry(makeReq({}, "1.2.3.4"))).toBeUndefined()
    })

    it("returns undefined when the lookup body is not a country code", async () => {
        fetchMock.mockResolvedValue({ ok: true, text: async () => "Undefined" })

        expect(await resolveCountry(makeReq({}, "1.2.3.4"))).toBeUndefined()
    })

    it("returns undefined when the lookup throws", async () => {
        fetchMock.mockRejectedValue(new Error("timeout"))

        expect(await resolveCountry(makeReq({}, "1.2.3.4"))).toBeUndefined()
    })
})
