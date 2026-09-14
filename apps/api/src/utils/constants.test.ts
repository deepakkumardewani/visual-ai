import { beforeEach, describe, expect, it, vi } from "vitest"

import { RAZORPAY_PRODUCTS } from "./constants.js"

describe("RAZORPAY_PRODUCTS", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("exports five credit products in INR", () => {
        expect(RAZORPAY_PRODUCTS).toHaveLength(5)
        expect(RAZORPAY_PRODUCTS.every((product) => product.currency === "INR")).toBe(true)
    })

    it("includes single-purchase packs with expected credits and prices", () => {
        expect(RAZORPAY_PRODUCTS[0]).toEqual({
            id: 1,
            type: "single",
            credits: 200,
            price: 130,
            description: "200 credits",
            currency: "INR",
        })
        expect(RAZORPAY_PRODUCTS[3]).toMatchObject({
            id: 4,
            credits: 2000,
            price: 900,
            savings: "30%",
        })
    })

    it("includes a monthly pack without a savings field", () => {
        const monthly = RAZORPAY_PRODUCTS.find((product) => product.type === "monthly")

        expect(monthly).toEqual({
            id: 5,
            type: "monthly",
            credits: 300,
            price: 100,
            description: "300 credits",
            currency: "INR",
        })
        expect(monthly).not.toHaveProperty("savings")
    })
})
