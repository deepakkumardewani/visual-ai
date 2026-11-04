import { CREDIT_PACKS } from "@visual-ai/shared"
import { afterEach, describe, expect, it, vi } from "vitest"

import { buildPrices } from "./prices.js"

const RATES = { USD: 1, INR: 80, EUR: 0.9, JPY: 150 }
const PRO_USD_MINOR = 500

describe("buildPrices", () => {
    it("returns the contract shape with one entry per credit pack", () => {
        const result = buildPrices("IN", RATES)

        expect(Object.keys(result).sort()).toEqual(
            ["country", "currency", "isEstimate", "packs", "pro"].sort(),
        )
        expect(result.isEstimate).toBe(true)
        expect(result.packs.map((p) => p.id)).toEqual(CREDIT_PACKS.map((p) => p.id))
    })

    it("converts Pro and packs into the local currency when a rate exists", () => {
        const result = buildPrices("IN", RATES)

        expect(result.country).toBe("IN")
        expect(result.currency).toBe("INR")
        // $5 * 80 INR/USD = 400 INR = 40000 paise
        expect(result.pro).toEqual({ amountMinor: 40_000, currency: "INR" })
        // INR to INR is the identity via the USD table
        expect(result.packs[0]).toEqual({ id: "pack_200", amountMinor: 13_000, currency: "INR" })
    })

    it("respects zero-decimal currencies", () => {
        const result = buildPrices("JP", RATES)

        // $5 * 150 = 750 JPY, no minor digits
        expect(result.pro).toEqual({ amountMinor: 750, currency: "JPY" })
    })

    it("falls back to all-USD entries using the last-known 83 INR/USD when FX is unavailable", () => {
        const result = buildPrices("IN", undefined)

        expect(result.currency).toBe("USD")
        expect(result.pro).toEqual({ amountMinor: PRO_USD_MINOR, currency: "USD" })
        expect(result.packs.every((p) => p.currency === "USD")).toBe(true)
        // INR 130 / 83 = $1.566 -> 157 cents; 290 / 83 = 3.494 -> 349; 500 / 83 = 6.024 -> 602; 900 / 83 = 10.843 -> 1084
        expect(result.packs.map((p) => p.amountMinor)).toEqual([157, 349, 602, 1084])
    })

    it("falls back to USD when the target currency has no rate", () => {
        const result = buildPrices("GB", RATES)

        expect(result.currency).toBe("USD")
        expect(result.pro).toEqual({ amountMinor: PRO_USD_MINOR, currency: "USD" })
    })

    it("uses USD and a null country when the country is unknown", () => {
        const result = buildPrices(undefined, RATES)

        expect(result.country).toBeNull()
        expect(result.currency).toBe("USD")
        // INR 130.00 / 80 = $1.625 -> 163 cents (rounded)
        expect(result.packs[0]).toEqual({ id: "pack_200", amountMinor: 163, currency: "USD" })
    })

    it("converts packs to USD at the fallback rate when only the INR rate is missing", () => {
        const result = buildPrices("US", { USD: 1 })

        expect(result.currency).toBe("USD")
        expect(result.packs[0]).toEqual({ id: "pack_200", amountMinor: 157, currency: "USD" })
    })

    it.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY])(
        "treats an unusable INR rate (%s) as missing and uses the fallback rate",
        (inr) => {
            const result = buildPrices("US", { USD: 1, INR: inr })

            expect(result.packs.every((p) => p.currency === "USD")).toBe(true)
            expect(result.packs[0]?.amountMinor).toBe(157)
        },
    )

    describe("when no FX path exists", () => {
        afterEach(() => {
            vi.doUnmock("@visual-ai/shared")
            vi.resetModules()
        })

        it("throws instead of returning a partial response", async () => {
            vi.resetModules()
            vi.doMock("@visual-ai/shared", async (importOriginal) => ({
                ...(await importOriginal<typeof import("@visual-ai/shared")>()),
                // Defensive guard: the 1-unit currency probe succeeds, the real conversion does not.
                convertMinor: (amount: number) => (amount === 1 ? 1 : undefined),
            }))
            const { buildPrices: isolatedBuildPrices } = await import("./prices.js")

            expect(() => isolatedBuildPrices("US", RATES)).toThrow("No FX path from USD to USD")
        })
    })
})
