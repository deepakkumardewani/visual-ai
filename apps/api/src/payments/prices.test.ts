import { describe, expect, it } from "vitest"

import { CREDIT_PACKS } from "@visual-ai/shared"

import { buildPrices } from "./prices.js"

const PRO_USD = { amountMinor: 500, currency: "USD" }

describe("buildPrices", () => {
    it("returns one entry per credit pack, in catalog order", () => {
        const prices = buildPrices("US")
        expect(prices.packs.map((pack) => pack.id)).toEqual(CREDIT_PACKS.map((pack) => pack.id))
    })

    it("prices India in fixed INR, not an FX conversion", () => {
        const prices = buildPrices("IN")
        expect(prices).toEqual({
            country: "IN",
            currency: "INR",
            pro: PRO_USD,
            packs: [
                { id: "pack_300", amountMinor: 24_900, currency: "INR" },
                { id: "pack_700", amountMinor: 54_900, currency: "INR" },
                { id: "pack_1600", amountMinor: 114_900, currency: "INR" },
                { id: "pack_4500", amountMinor: 299_900, currency: "INR" },
            ],
        })
    })

    it.each(["US", "JP", "DE", "GB"])("prices %s in plain USD", (country) => {
        const prices = buildPrices(country)
        expect(prices.currency).toBe("USD")
        expect(prices.packs.map((pack) => pack.amountMinor)).toEqual([500, 1_000, 2_000, 5_000])
        expect(prices.packs.every((pack) => pack.currency === "USD")).toBe(true)
    })

    it("uses USD and a null country when the country is unknown", () => {
        const prices = buildPrices(undefined)
        expect(prices.country).toBeNull()
        expect(prices.currency).toBe("USD")
    })

    it("keeps Pro at $5 for every country", () => {
        expect(buildPrices("IN").pro).toEqual(PRO_USD)
        expect(buildPrices("US").pro).toEqual(PRO_USD)
    })
})
