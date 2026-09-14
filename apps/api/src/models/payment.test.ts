import { describe, expect, it } from "vitest"

import { PaymentModel, PaymentSchema } from "./payment.js"

describe("PaymentSchema", () => {
    it("requires transactionId", () => {
        expect(PaymentSchema.path("transactionId").isRequired).toBe(true)
    })

    it("defaults amount to 0", () => {
        expect(PaymentSchema.path("amount").isRequired).toBe(true)
        expect(PaymentSchema.path("amount").options.default).toBe(0)
    })

    it("defaults description to Credit Purchase", () => {
        expect(PaymentSchema.path("description").options.default).toBe("Credit Purchase")
    })

    it("restricts status to pending, completed, and failed", () => {
        const status = PaymentSchema.path("status")
        expect(status.enumValues).toEqual(["pending", "completed", "failed"])
        expect(status.options.default).toBe("pending")
    })

    it("restricts paymentMethod to card, paypal, and stripe", () => {
        const paymentMethod = PaymentSchema.path("paymentMethod")
        expect(paymentMethod.enumValues).toEqual(["credit_card", "paypal", "stripe"])
        expect(paymentMethod.isRequired).toBe(true)
        expect(paymentMethod.options.default).toBe("")
    })

    it("defaults createdAt to Date.now", () => {
        expect(PaymentSchema.path("createdAt").options.default).toBe(Date.now)
    })

    it("requires humanReadableDate with a default formatter", () => {
        const humanReadableDate = PaymentSchema.path("humanReadableDate")
        expect(humanReadableDate.isRequired).toBe(true)
        expect(humanReadableDate.options.default).toBeDefined()
    })
})

describe("PaymentModel", () => {
    it("registers the Payment model against PaymentSchema", () => {
        expect(PaymentModel.modelName).toBe("Payment")
        expect(PaymentModel.schema.path("transactionId")).toBeDefined()
        expect(PaymentModel.schema.path("amount")).toBeDefined()
    })
})
