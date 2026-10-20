import { beforeEach, describe, expect, it, vi } from "vitest"

import { CREDIT_PACKS } from "@visual-ai/shared"

import { NORMALIZED_EVENT_TYPE, PAYMENT_STATUS } from "./constants.js"
import type { ParsedWebhookEvent } from "./dodo/eventMapper.js"

const logger = vi.hoisted(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => logger,
}))

const User = vi.hoisted(() => ({
    exists: vi.fn(),
    updateOne: vi.fn(),
}))

const Payment = vi.hoisted(() => ({
    updateOne: vi.fn(),
}))

vi.mock("../models/user.js", () => ({
    UserModel: User,
}))

vi.mock("../models/payment.js", () => ({
    PaymentModel: Payment,
}))

import { applyEvent } from "./service.js"

const pack200 = CREDIT_PACKS[0]!

function completedPaymentGuardFilter(userId: string, paymentId: string) {
    return {
        userId,
        payments: {
            $not: {
                $elemMatch: {
                    providerPaymentId: paymentId,
                    status: PAYMENT_STATUS.COMPLETED,
                },
            },
        },
    }
}

function noExistingPaymentGuardFilter(userId: string, paymentId: string) {
    return {
        userId,
        payments: {
            $not: {
                $elemMatch: {
                    providerPaymentId: paymentId,
                },
            },
        },
    }
}

function baseEvent(overrides: Partial<ParsedWebhookEvent> = {}): ParsedWebhookEvent {
    return {
        providerEventId: "wh_evt_1",
        type: NORMALIZED_EVENT_TYPE.PAYMENT_SUCCEEDED,
        providerPaymentId: "pay_1",
        userId: "user_1",
        packId: "pack_200",
        amountMinor: pack200.priceMinor,
        currency: pack200.currency,
        occurredAt: new Date("2026-03-15T10:00:00.000Z"),
        providerSessionId: "cks_pending_1",
        paymentMethod: "card",
        ...overrides,
    }
}

describe("applyEvent", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        User.exists.mockResolvedValue({ _id: "mongo_user" })
        User.updateOne.mockResolvedValue({ modifiedCount: 1 })
        Payment.updateOne.mockResolvedValue({ modifiedCount: 1 })
    })

    it("grants pack credits on payment.succeeded", async () => {
        await applyEvent(baseEvent())

        expect(User.updateOne).toHaveBeenCalledOnce()
        const [, update] = User.updateOne.mock.calls[0]!
        expect(update.$inc).toEqual({ credits: pack200.credits })
        expect(Payment.updateOne).toHaveBeenCalledWith(
            { providerSessionId: "cks_pending_1", userId: "user_1" },
            expect.objectContaining({
                $set: expect.objectContaining({
                    status: PAYMENT_STATUS.COMPLETED,
                    providerPaymentId: "pay_1",
                }),
            }),
        )
    })

    it("grants each pack exactly its catalog credits", async () => {
        for (const pack of CREDIT_PACKS) {
            vi.clearAllMocks()
            User.updateOne.mockResolvedValue({ modifiedCount: 1 })
            await applyEvent(
                baseEvent({
                    packId: pack.id,
                    amountMinor: pack.priceMinor,
                    providerPaymentId: `pay_${pack.id}`,
                }),
            )
            expect(User.updateOne.mock.calls[0]![1].$inc).toEqual({ credits: pack.credits })
        }
    })

    it("ignores duplicate delivery for the same payment id", async () => {
        User.updateOne.mockResolvedValue({ modifiedCount: 0 })
        await applyEvent(baseEvent())
        expect(logger.info).toHaveBeenCalledWith(
            expect.objectContaining({ paymentId: "pay_1" }),
            "Duplicate webhook delivery ignored",
        )
    })

    it("grants once under concurrent delivery", async () => {
        let grants = 0
        User.updateOne.mockImplementation(async (filter, update) => {
            expect(filter).toEqual(completedPaymentGuardFilter("user_1", "pay_1"))
            expect(update).toMatchObject({
                $push: { payments: expect.any(Object) },
                $inc: { credits: pack200.credits },
            })
            if (grants === 0) {
                grants += 1
                return { modifiedCount: 1 }
            }
            return { modifiedCount: 0 }
        })

        const deliveries = Array.from({ length: 10 }, () => applyEvent(baseEvent()))
        await Promise.all(deliveries)
        expect(User.updateOne).toHaveBeenCalledTimes(10)
        expect(grants).toBe(1)
    })

    it("treats a new webhook id with the same payment id as duplicate", async () => {
        User.updateOne.mockResolvedValueOnce({ modifiedCount: 1 })
        await applyEvent(baseEvent({ providerEventId: "wh_a" }))
        User.updateOne.mockResolvedValueOnce({ modifiedCount: 0 })
        await applyEvent(baseEvent({ providerEventId: "wh_b" }))
        expect(User.updateOne).toHaveBeenCalledTimes(2)
        for (const [filter, update] of User.updateOne.mock.calls) {
            expect(filter).toEqual(completedPaymentGuardFilter("user_1", "pay_1"))
            expect(update).toMatchObject({
                $push: { payments: expect.any(Object) },
                $inc: { credits: pack200.credits },
            })
        }
    })

    it("withholds credits and logs error when amount or currency mismatches", async () => {
        await applyEvent(baseEvent({ amountMinor: 1 }))
        expect(User.updateOne.mock.calls[0]![1]).not.toHaveProperty("$inc")
        expect(logger.error).toHaveBeenCalledWith(
            expect.objectContaining({ paymentId: "pay_1", webhookId: "wh_evt_1" }),
            "Webhook amount or currency mismatch",
        )
    })

    it("records payment.failed without granting credits", async () => {
        await applyEvent(
            baseEvent({
                type: NORMALIZED_EVENT_TYPE.PAYMENT_FAILED,
            }),
        )
        const [filter, update] = User.updateOne.mock.calls[0]!
        expect(filter).toEqual(noExistingPaymentGuardFilter("user_1", "pay_1"))
        expect(update.$inc).toBeUndefined()
        expect(update.$push.payments.status).toBe(PAYMENT_STATUS.FAILED)
    })

    it("grants after a prior failed record for the same payment id", async () => {
        User.updateOne.mockResolvedValueOnce({ modifiedCount: 1 })
        await applyEvent(
            baseEvent({
                type: NORMALIZED_EVENT_TYPE.PAYMENT_FAILED,
                providerEventId: "wh_failed",
            }),
        )
        User.updateOne.mockResolvedValueOnce({ modifiedCount: 1 })
        await applyEvent(
            baseEvent({
                type: NORMALIZED_EVENT_TYPE.PAYMENT_SUCCEEDED,
                providerEventId: "wh_success",
            }),
        )
        expect(User.updateOne.mock.calls[1]![1].$inc).toEqual({ credits: pack200.credits })
    })

    it("does not revoke credits when succeeded is followed by failed", async () => {
        User.updateOne.mockResolvedValueOnce({ modifiedCount: 1 })
        await applyEvent(baseEvent({ type: NORMALIZED_EVENT_TYPE.PAYMENT_SUCCEEDED }))
        User.updateOne.mockResolvedValueOnce({ modifiedCount: 0 })
        await applyEvent(
            baseEvent({
                type: NORMALIZED_EVENT_TYPE.PAYMENT_FAILED,
                providerEventId: "wh_late_fail",
            }),
        )
        expect(User.updateOne.mock.calls[1]![1].$inc).toBeUndefined()
    })

    it("returns without throwing when metadata user is missing", async () => {
        await applyEvent(baseEvent({ userId: null }))
        expect(User.exists).not.toHaveBeenCalled()
        expect(logger.warn).toHaveBeenCalled()
    })

    it("returns without throwing when the user does not exist", async () => {
        User.exists.mockResolvedValue(null)
        await applyEvent(baseEvent())
        expect(User.updateOne).not.toHaveBeenCalled()
    })

    it("throws on transient database errors so the router can return 500", async () => {
        User.updateOne.mockRejectedValue(new Error("mongo unavailable"))
        await expect(applyEvent(baseEvent())).rejects.toThrow("mongo unavailable")
    })

    it("logs webhookId, paymentId, and userId without signature material", async () => {
        await applyEvent(baseEvent())
        const logPayload = logger.info.mock.calls[0]?.[0] ?? logger.warn.mock.calls[0]?.[0]
        expect(logPayload).toMatchObject({
            webhookId: "wh_evt_1",
            paymentId: "pay_1",
            userId: "user_1",
        })
        expect(JSON.stringify(logPayload)).not.toMatch(/webhook-signature|whsec_/i)
    })

    it("returns early when packId metadata is missing", async () => {
        await applyEvent(baseEvent({ packId: null }))
        expect(User.updateOne).not.toHaveBeenCalled()
        expect(logger.warn).toHaveBeenCalledWith(
            expect.objectContaining({ reason: "missing_pack_id" }),
            "Webhook missing packId",
        )
    })

    it("returns early when packId is unknown in the catalog", async () => {
        await applyEvent(baseEvent({ packId: "pack_does_not_exist" }))
        expect(User.updateOne).not.toHaveBeenCalled()
        expect(logger.error).toHaveBeenCalledWith(
            expect.objectContaining({ reason: "unknown_pack", packId: "pack_does_not_exist" }),
            "Unknown pack",
        )
    })

    it("maps payment methods to upi, card, or other on embedded records", async () => {
        for (const [method, expected] of [
            ["UPI_intent", "upi"],
            ["visa_card", "card"],
            ["netbanking", "other"],
            [null, "other"],
        ] as const) {
            vi.clearAllMocks()
            User.updateOne.mockResolvedValue({ modifiedCount: 1 })
            await applyEvent(
                baseEvent({ paymentMethod: method, providerPaymentId: `pay_${method}` }),
            )
            const push = User.updateOne.mock.calls[0]![1].$push.payments
            expect(push.paymentMethod).toBe(expected)
        }
    })

    it("upserts checkout row by payment id when session id is absent", async () => {
        await applyEvent(
            baseEvent({
                providerSessionId: null,
                providerPaymentId: "pay_no_session",
            }),
        )

        expect(Payment.updateOne).toHaveBeenCalledWith(
            { providerPaymentId: "pay_no_session", userId: "user_1" },
            expect.objectContaining({
                $set: expect.objectContaining({ status: PAYMENT_STATUS.COMPLETED }),
            }),
            { upsert: true },
        )
    })

    it("skips checkout sync on failed amount mismatch when user update is duplicate", async () => {
        let recorded = false
        User.updateOne.mockImplementation(async (filter, update) => {
            expect(filter).toEqual(noExistingPaymentGuardFilter("user_1", "pay_1"))
            expect(update.$push.payments.status).toBe(PAYMENT_STATUS.FAILED)
            if (!recorded) {
                recorded = true
                return { modifiedCount: 1 }
            }
            return { modifiedCount: 0 }
        })
        await applyEvent(baseEvent({ amountMinor: 99 }))
        await applyEvent(baseEvent({ amountMinor: 99, providerEventId: "wh_mismatch_dup" }))
        expect(Payment.updateOne).toHaveBeenCalledTimes(1)
    })

    it("skips checkout sync when payment.failed is a duplicate delivery", async () => {
        let recorded = false
        User.updateOne.mockImplementation(async (filter, update) => {
            expect(filter).toEqual(noExistingPaymentGuardFilter("user_1", "pay_1"))
            expect(update.$push.payments.status).toBe(PAYMENT_STATUS.FAILED)
            if (!recorded) {
                recorded = true
                return { modifiedCount: 1 }
            }
            return { modifiedCount: 0 }
        })
        await applyEvent(
            baseEvent({
                type: NORMALIZED_EVENT_TYPE.PAYMENT_FAILED,
                providerEventId: "wh_dup_fail_a",
            }),
        )
        await applyEvent(
            baseEvent({
                type: NORMALIZED_EVENT_TYPE.PAYMENT_FAILED,
                providerEventId: "wh_dup_fail_b",
            }),
        )
        expect(Payment.updateOne).toHaveBeenCalledTimes(1)
    })

    it("withholds credits when currency mismatches catalog", async () => {
        await applyEvent(baseEvent({ currency: "USD" }))
        expect(User.updateOne.mock.calls[0]![1]).not.toHaveProperty("$inc")
    })

    it("ignores normalized event types that are neither succeeded nor failed", async () => {
        await applyEvent(
            baseEvent({
                type: "payment.refunded" as typeof NORMALIZED_EVENT_TYPE.PAYMENT_SUCCEEDED,
            }),
        )
        expect(User.updateOne).not.toHaveBeenCalled()
    })
})
