import type { Request } from "express"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
    env: { NODE_ENV: "test", DEV_COUNTRY_OVERRIDE: undefined as string | undefined },
    warn: vi.fn(),
}))

vi.mock("../config/env.js", () => ({ env: mocks.env }))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: mocks.warn, error: vi.fn() }),
}))

import { IP_LOOKUP_URL, resolveCountry } from "./geo.js"

const fetchMock = vi.fn()

function makeReq(headers: Record<string, string | string[] | undefined>, ip?: string): Request {
    return { headers, ip } as unknown as Request
}

describe("resolveCountry", () => {
    beforeEach(() => {
        fetchMock.mockReset()
        mocks.warn.mockReset()
        mocks.env.NODE_ENV = "test"
        mocks.env.DEV_COUNTRY_OVERRIDE = undefined
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

    describe("dev/test country override", () => {
        const ENVS = ["development", "test"]

        it.each(ENVS)("query beats env var, header and IP in %s", async (nodeEnv) => {
            mocks.env.NODE_ENV = nodeEnv
            mocks.env.DEV_COUNTRY_OVERRIDE = "DE"

            const country = await resolveCountry(makeReq({ "cf-ipcountry": "FR" }, "1.2.3.4"), "in")

            expect(country).toBe("IN")
            expect(fetchMock).not.toHaveBeenCalled()
        })

        it.each(ENVS)("env var beats header and IP in %s", async (nodeEnv) => {
            mocks.env.NODE_ENV = nodeEnv
            mocks.env.DEV_COUNTRY_OVERRIDE = "DE"

            const country = await resolveCountry(makeReq({ "cf-ipcountry": "FR" }, "1.2.3.4"))

            expect(country).toBe("DE")
            expect(fetchMock).not.toHaveBeenCalled()
        })

        it("header beats IP when there is no override", async () => {
            const country = await resolveCountry(makeReq({ "cf-ipcountry": "IN" }, "1.2.3.4"))

            expect(country).toBe("IN")
            expect(fetchMock).not.toHaveBeenCalled()
        })

        it.each(["production", "staging"])(
            "ignores query and env var in %s and uses the header",
            async (nodeEnv) => {
                mocks.env.NODE_ENV = nodeEnv
                mocks.env.DEV_COUNTRY_OVERRIDE = "DE"

                const country = await resolveCountry(makeReq({ "cf-ipcountry": "FR" }), "IN")

                expect(country).toBe("FR")
            },
        )

        it.each(["production", "staging"])(
            "ignores the override in %s and falls back to the mocked IP lookup",
            async (nodeEnv) => {
                mocks.env.NODE_ENV = nodeEnv
                mocks.env.DEV_COUNTRY_OVERRIDE = "DE"
                fetchMock.mockResolvedValue({ ok: true, text: async () => "GB" })

                const country = await resolveCountry(makeReq({}, "1.2.3.4"), "IN")

                expect(country).toBe("GB")
                expect(fetchMock).toHaveBeenCalledTimes(1)
            },
        )

        it("ignores an invalid ZZ query, logs it, and falls through to the env var", async () => {
            mocks.env.DEV_COUNTRY_OVERRIDE = "DE"

            const country = await resolveCountry(makeReq({ "cf-ipcountry": "FR" }), "ZZ")

            expect(country).toBe("DE")
            expect(mocks.warn).toHaveBeenCalledWith(
                { source: "query", value: "ZZ" },
                "Ignoring invalid country override",
            )
        })

        it("ignores an invalid ZZ env var, logs it, and uses the header", async () => {
            mocks.env.DEV_COUNTRY_OVERRIDE = "ZZ"

            const country = await resolveCountry(makeReq({ "cf-ipcountry": "FR" }))

            expect(country).toBe("FR")
            expect(mocks.warn).toHaveBeenCalledWith(
                { source: "DEV_COUNTRY_OVERRIDE", value: "ZZ" },
                "Ignoring invalid country override",
            )
        })

        it.each([["1"], [["IN", "US"]], [42]])(
            "ignores a malformed query value %j and logs it",
            async (query) => {
                const country = await resolveCountry(makeReq({ "cf-ipcountry": "FR" }), query)

                expect(country).toBe("FR")
                expect(mocks.warn).toHaveBeenCalledTimes(1)
            },
        )

        it.each([undefined, ""])("treats query %j as absent without logging", async (query) => {
            const country = await resolveCountry(makeReq({ "cf-ipcountry": "FR" }), query)

            expect(country).toBe("FR")
            expect(mocks.warn).not.toHaveBeenCalled()
        })
    })
})
