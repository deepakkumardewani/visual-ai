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
        expect((status as unknown as { enumValues: string[] }).enumValues).toEqual([
            "pending",
            "completed",
            "failed",
        ])
        expect(status.options.default).toBe("pending")
    })

    it("restricts paymentMethod to legacy and Dodo values", () => {
        const paymentMethod = PaymentSchema.path("paymentMethod")
        expect((paymentMethod as unknown as { enumValues: string[] }).enumValues).toEqual([
            "credit_card",
            "paypal",
            "stripe",
            "card",
            "upi",
            "other",
        ])
        expect(paymentMethod.isRequired).toBe(true)
        expect(paymentMethod.options.default).toBe("")
    })

    it("defaults provider to razorpay for legacy-shaped rows", () => {
        const provider = PaymentSchema.path("provider")
        expect((provider as unknown as { enumValues: string[] }).enumValues).toEqual([
            "razorpay",
            "dodo",
        ])
        expect(provider.options.default).toBe("razorpay")
    })

    it("defaults currency to INR", () => {
        expect(PaymentSchema.path("currency").options.default).toBe("INR")
    })

    it("rejects an invalid provider value", () => {
        const doc = new PaymentModel({
            userId: "user_1",
            transactionId: "pay_bad",
            provider: "stripe",
            amount: 1,
            paymentMethod: "other",
            humanReadableDate: "01/01/2026",
        })
        const error = doc.validateSync()
        expect(error?.errors.provider).toBeDefined()
    })

    it("validates a legacy row without an explicit provider", () => {
        const doc = new PaymentModel({
            userId: "user_legacy",
            transactionId: "pay_legacy",
            amount: 130,
            paymentMethod: "upi",
            humanReadableDate: "01/01/2026",
        })
        const error = doc.validateSync()
        expect(error).toBeUndefined()
        expect(doc.provider).toBe("razorpay")
    })

    it("validates a Dodo-shaped payment document", () => {
        const doc = new PaymentModel({
            userId: "user_1",
            transactionId: "pay_123",
            provider: "dodo",
            providerSessionId: "cks_1",
            providerPaymentId: "pay_123",
            packId: "pack_200",
            credits: 200,
            currency: "INR",
            amount: 130,
            paymentMethod: "upi",
            status: "completed",
            humanReadableDate: "01/01/2026",
        })
        const error = doc.validateSync()
        expect(error).toBeUndefined()
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
