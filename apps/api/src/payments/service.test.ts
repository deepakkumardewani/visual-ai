import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../config/env.js", () => ({
    env: {
        PAYMENT_RETURN_URL: "https://visual-ai.app/checkout/return",
        LOG_LEVEL: "info",
        NODE_ENV: "test",
    },
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

const mockProvider = vi.hoisted(() => ({
    name: "dodo" as const,
    createCheckout: vi.fn(),
    getSessionStatus: vi.fn(),
    verifyAndParseWebhook: vi.fn(),
}))

vi.mock("./providerFactory.js", () => ({
    getPaymentProvider: () => mockProvider,
}))

const Payment = vi.hoisted(() => ({
    create: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
}))

vi.mock("../models/user.js", () => ({
    UserModel: { exists: vi.fn(), updateOne: vi.fn() },
}))

vi.mock("../models/payment.js", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../models/payment.js")>()
    return {
        ...actual,
        PaymentModel: Payment,
    }
})

vi.mock("moment", () => ({
    default: () => ({
        format: () => "03/15/2026",
    }),
}))

import { CREDIT_PACKS } from "@visual-ai/shared"

import { CHECKOUT_SESSION_STATUS, PAYMENT_STATUS } from "./constants.js"
import { ProviderApiError, UnknownPackError } from "./errors.js"
import { createCheckout, getCheckoutSessionStatus, listPaymentsForUser } from "./service.js"

describe("createCheckout", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockProvider.createCheckout.mockResolvedValue({
            checkoutUrl: "https://pay.example/checkout",
            sessionId: "cks_test_1",
        })
        Payment.create.mockResolvedValue({})
    })

    it("throws UnknownPackError for an unknown pack id", async () => {
        await expect(createCheckout("user_1", "pack_not_real")).rejects.toBeInstanceOf(
            UnknownPackError,
        )
        expect(mockProvider.createCheckout).not.toHaveBeenCalled()
    })

    it("passes catalog pack terms to the provider, not client-supplied price or credits", async () => {
        await createCheckout("user_1", "pack_200", "buyer@example.com")

        expect(mockProvider.createCheckout).toHaveBeenCalledWith({
            userId: "user_1",
            pack: CREDIT_PACKS[0],
            email: "buyer@example.com",
            returnUrl: "https://visual-ai.app/checkout/return",
        })
        const callArg = mockProvider.createCheckout.mock.calls[0]![0]
        expect(callArg.pack.credits).toBe(200)
        expect(callArg.pack.priceMinor).toBe(13_000)
    })

    it("persists a pending payment row and returns checkout details", async () => {
        const result = await createCheckout("user_1", "pack_200")

        expect(result).toEqual({
            checkoutUrl: "https://pay.example/checkout",
            sessionId: "cks_test_1",
        })
        expect(Payment.create).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: "user_1",
                provider: "dodo",
                providerSessionId: "cks_test_1",
                packId: "pack_200",
                credits: 200,
                currency: "INR",
                amount: 130,
                status: PAYMENT_STATUS.PENDING,
                transactionId: "cks_test_1",
                paymentMethod: "other",
                description: "200 credits",
                humanReadableDate: "03/15/2026",
            }),
        )
    })

    it("rethrows ProviderApiError from the provider", async () => {
        const providerError = new ProviderApiError("provider down")
        mockProvider.createCheckout.mockRejectedValue(providerError)

        await expect(createCheckout("user_1", "pack_200")).rejects.toBe(providerError)
    })

    it("wraps non-ProviderApiError failures as ProviderApiError", async () => {
        mockProvider.createCheckout.mockRejectedValue(new Error("timeout"))

        await expect(createCheckout("user_1", "pack_200")).rejects.toMatchObject({
            name: "ProviderApiError",
            message: "timeout",
        })
    })

    it("wraps non-Error rejections with a generic ProviderApiError message", async () => {
        mockProvider.createCheckout.mockRejectedValue(null)

        await expect(createCheckout("user_1", "pack_200")).rejects.toMatchObject({
            name: "ProviderApiError",
            message: "Payment provider request failed",
        })
    })
})

describe("listPaymentsForUser", () => {
    it("queries payments sorted by newest first", async () => {
        const sort = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([{ id: "p1" }]) })
        Payment.find.mockReturnValue({ sort })

        const rows = await listPaymentsForUser("user_9")

        expect(Payment.find).toHaveBeenCalledWith({ userId: "user_9" })
        expect(sort).toHaveBeenCalledWith({ createdAt: -1 })
        expect(rows).toEqual([{ id: "p1" }])
    })
})

describe("getCheckoutSessionStatus", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("throws NotFoundError when the session does not exist", async () => {
        Payment.findOne.mockResolvedValue(null)

        await expect(getCheckoutSessionStatus("user_1", "cks_missing")).rejects.toMatchObject({
            name: "NotFoundError",
            statusCode: 404,
            message: "Checkout session not found",
        })
    })

    it("throws NotFoundError when the session belongs to another user", async () => {
        Payment.findOne.mockResolvedValue({
            userId: "other_user",
            status: PAYMENT_STATUS.PENDING,
        })

        await expect(getCheckoutSessionStatus("user_1", "cks_1")).rejects.toMatchObject({
            name: "NotFoundError",
            statusCode: 404,
            message: "Checkout session not found",
        })
    })

    it("returns succeeded status with credits from a completed database row", async () => {
        Payment.findOne.mockResolvedValue({
            userId: "user_1",
            status: PAYMENT_STATUS.COMPLETED,
            credits: 450,
        })

        const result = await getCheckoutSessionStatus("user_1", "cks_done")
        expect(result).toEqual({
            status: CHECKOUT_SESSION_STATUS.SUCCEEDED,
            credits: 450,
        })
        expect(mockProvider.getSessionStatus).not.toHaveBeenCalled()
    })

    it("omits credits on succeeded database rows when credits are null", async () => {
        Payment.findOne.mockResolvedValue({
            userId: "user_1",
            status: PAYMENT_STATUS.COMPLETED,
            credits: null,
        })

        const result = await getCheckoutSessionStatus("user_1", "cks_done")
        expect(result).toEqual({ status: CHECKOUT_SESSION_STATUS.SUCCEEDED })
    })

    it("returns failed status from a failed database row", async () => {
        Payment.findOne.mockResolvedValue({
            userId: "user_1",
            status: PAYMENT_STATUS.FAILED,
        })

        const result = await getCheckoutSessionStatus("user_1", "cks_fail")
        expect(result).toEqual({ status: CHECKOUT_SESSION_STATUS.FAILED })
    })

    it("polls the provider when the database row is still pending", async () => {
        Payment.findOne.mockResolvedValue({
            userId: "user_1",
            status: PAYMENT_STATUS.PENDING,
            credits: 200,
        })
        mockProvider.getSessionStatus.mockResolvedValue({
            paymentId: "pay_1",
            status: PAYMENT_STATUS.COMPLETED,
        })

        const result = await getCheckoutSessionStatus("user_1", "cks_pending")
        expect(mockProvider.getSessionStatus).toHaveBeenCalledWith("cks_pending")
        expect(result).toEqual({
            status: CHECKOUT_SESSION_STATUS.SUCCEEDED,
            credits: 200,
        })
    })

    it("omits credits when provider completion has null credits on the row", async () => {
        Payment.findOne.mockResolvedValue({
            userId: "user_1",
            status: PAYMENT_STATUS.PENDING,
            credits: null,
        })
        mockProvider.getSessionStatus.mockResolvedValue({
            paymentId: "pay_1",
            status: PAYMENT_STATUS.COMPLETED,
        })

        const result = await getCheckoutSessionStatus("user_1", "cks_pending")
        expect(result).toEqual({ status: CHECKOUT_SESSION_STATUS.SUCCEEDED })
    })

    it("returns failed when the provider reports failure", async () => {
        Payment.findOne.mockResolvedValue({
            userId: "user_1",
            status: PAYMENT_STATUS.PENDING,
        })
        mockProvider.getSessionStatus.mockResolvedValue({
            paymentId: null,
            status: PAYMENT_STATUS.FAILED,
        })

        const result = await getCheckoutSessionStatus("user_1", "cks_pending")
        expect(result).toEqual({ status: CHECKOUT_SESSION_STATUS.FAILED })
    })

    it("returns pending when the provider still reports pending", async () => {
        Payment.findOne.mockResolvedValue({
            userId: "user_1",
            status: PAYMENT_STATUS.PENDING,
        })
        mockProvider.getSessionStatus.mockResolvedValue({
            paymentId: null,
            status: PAYMENT_STATUS.PENDING,
        })

        const result = await getCheckoutSessionStatus("user_1", "cks_pending")
        expect(result).toEqual({ status: CHECKOUT_SESSION_STATUS.PENDING })
    })

    it("rethrows ProviderApiError from provider polling", async () => {
        Payment.findOne.mockResolvedValue({
            userId: "user_1",
            status: PAYMENT_STATUS.PENDING,
        })
        const providerError = new ProviderApiError("status unavailable")
        mockProvider.getSessionStatus.mockRejectedValue(providerError)

        await expect(getCheckoutSessionStatus("user_1", "cks_pending")).rejects.toBe(providerError)
    })

    it("wraps non-ProviderApiError polling failures", async () => {
        Payment.findOne.mockResolvedValue({
            userId: "user_1",
            status: PAYMENT_STATUS.PENDING,
        })
        mockProvider.getSessionStatus.mockRejectedValue(new Error("network"))

        await expect(getCheckoutSessionStatus("user_1", "cks_pending")).rejects.toMatchObject({
            name: "ProviderApiError",
            message: "network",
        })
    })

    it("wraps non-Error polling rejections with a generic ProviderApiError message", async () => {
        Payment.findOne.mockResolvedValue({
            userId: "user_1",
            status: PAYMENT_STATUS.PENDING,
        })
        mockProvider.getSessionStatus.mockRejectedValue(undefined)

        await expect(getCheckoutSessionStatus("user_1", "cks_pending")).rejects.toMatchObject({
            name: "ProviderApiError",
            message: "Payment provider request failed",
        })
    })

    it("returns pending when database status is unrecognized", async () => {
        Payment.findOne.mockResolvedValue({
            userId: "user_1",
            status: "orphaned",
        })
        mockProvider.getSessionStatus.mockResolvedValue({
            paymentId: null,
            status: PAYMENT_STATUS.PENDING,
        })

        const result = await getCheckoutSessionStatus("user_1", "cks_weird")
        expect(result).toEqual({ status: CHECKOUT_SESSION_STATUS.PENDING })
    })
})
