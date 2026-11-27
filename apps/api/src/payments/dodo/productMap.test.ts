import { describe, expect, it, vi } from "vitest"

import { CREDIT_PACKS, PACK_CURRENCIES } from "@visual-ai/shared"

const mockEnv = vi.hoisted(() => {
    const env: Record<string, string> = { DODO_PRODUCT_ID_PRO: "pdt_env_pro" }
    for (const credits of [300, 700, 1600, 4500]) {
        for (const currency of ["USD", "INR"]) {
            env[`DODO_PRODUCT_ID_PACK_${credits}_${currency}`] = `pdt_${credits}_${currency}`
        }
    }
    return env
})

vi.mock("../../config/env.js", () => ({
    env: mockEnv,
}))

import { getDodoProductIdForPack, getDodoProductIdForPro } from "./productMap.js"

describe("getDodoProductIdForPack", () => {
    it("maps every pack and currency to its own env product id", () => {
        for (const pack of CREDIT_PACKS) {
            for (const currency of PACK_CURRENCIES) {
                expect(getDodoProductIdForPack(pack.id, currency)).toBe(
                    `pdt_${pack.credits}_${currency}`,
                )
            }
        }
    })

    it("never falls back to the other currency's product", () => {
        mockEnv.DODO_PRODUCT_ID_PACK_300_INR = ""
        try {
            expect(() => getDodoProductIdForPack("pack_300", "INR")).toThrow(
                "Missing Dodo product id for pack pack_300 in INR",
            )
            expect(getDodoProductIdForPack("pack_300", "USD")).toBe("pdt_300_USD")
        } finally {
            mockEnv.DODO_PRODUCT_ID_PACK_300_INR = "pdt_300_INR"
        }
    })
})

describe("getDodoProductIdForPro", () => {
    it("returns the env-mapped Pro product id", () => {
        expect(getDodoProductIdForPro()).toBe("pdt_env_pro")
    })

    it("throws when the Pro product id is missing", () => {
        mockEnv.DODO_PRODUCT_ID_PRO = ""
        try {
            expect(() => getDodoProductIdForPro()).toThrow(
                "Missing Dodo product id for Pro subscription",
            )
        } finally {
            mockEnv.DODO_PRODUCT_ID_PRO = "pdt_env_pro"
        }
    })
})
