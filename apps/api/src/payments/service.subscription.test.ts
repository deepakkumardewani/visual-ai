import { PLAN, SUBSCRIPTION_STATUS } from "@visual-ai/shared"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PAYMENTS_MESSAGES, SUBSCRIPTION_EVENT_TYPE } from "./constants.js"
import type { NormalizedSubscriptionEvent } from "./types.js"

vi.mock("../config/env.js", () => ({
    env: {
        PAYMENT_RETURN_URL: "https://visual-ai.app/checkout/return",
        LOG_LEVEL: "info",
        NODE_ENV: "test",
    },
}))

const logger = vi.hoisted(() => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => logger,
}))

const mockProvider = vi.hoisted(() => ({
    name: "dodo" as const,
    createSubscriptionCheckout: vi.fn(),
}))

vi.mock("./providerFactory.js", () => ({
    getPaymentProvider: () => mockProvider,
}))

const User = vi.hoisted(() => ({
    findOne: vi.fn(),
    updateOne: vi.fn(),
}))

vi.mock("../models/user.js", () => ({ UserModel: User }))
vi.mock("../models/payment.js", () => ({ PaymentModel: {} }))

import { applyEvent, createSubscriptionCheckout } from "./service.js"

const FUTURE = new Date("2999-01-01T00:00:00.000Z")
const PAST = new Date("2000-01-01T00:00:00.000Z")

function mockStoredUser(user: unknown) {
    const lean = vi.fn().mockResolvedValue(user)
    const select = vi.fn().mockReturnValue({ lean })
    User.findOne.mockReturnValue({ select })
    return { select }
}

describe("createSubscriptionCheckout", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockProvider.createSubscriptionCheckout.mockResolvedValue({
            checkoutUrl: "https://pay.example/sub",
            sessionId: "cks_sub_1",
        })
    })

    it("creates a checkout for a free user and passes the return URL", async () => {
        const { select } = mockStoredUser({ plan: PLAN.FREE })

        const result = await createSubscriptionCheckout("user_1", "a@b.com")

        expect(result).toEqual({ checkoutUrl: "https://pay.example/sub", sessionId: "cks_sub_1" })
        expect(User.findOne).toHaveBeenCalledWith({ userId: "user_1" })
        expect(select).toHaveBeenCalledWith("plan subscription")
        expect(mockProvider.createSubscriptionCheckout).toHaveBeenCalledWith({
            userId: "user_1",
            email: "a@b.com",
            returnUrl: "https://visual-ai.app/checkout/return",
        })
    })

    it("creates a checkout when the user record does not exist", async () => {
        mockStoredUser(null)
        await expect(createSubscriptionCheckout("ghost")).resolves.toMatchObject({
            sessionId: "cks_sub_1",
        })
    })

    it("rejects with AlreadySubscribedError for an active, non-cancelling Pro user", async () => {
        mockStoredUser({
            plan: PLAN.PRO,
            subscription: {
                status: SUBSCRIPTION_STATUS.ACTIVE,
                cancelAtPeriodEnd: false,
                currentPeriodEnd: FUTURE,
            },
        })

        await expect(createSubscriptionCheckout("user_1")).rejects.toMatchObject({
            name: "AlreadySubscribedError",
            message: PAYMENTS_MESSAGES.ALREADY_SUBSCRIBED,
        })
        expect(mockProvider.createSubscriptionCheckout).not.toHaveBeenCalled()
    })

    it("allows resubscribing when the active subscription is set to cancel", async () => {
        mockStoredUser({
            plan: PLAN.PRO,
            subscription: {
                status: SUBSCRIPTION_STATUS.ACTIVE,
                cancelAtPeriodEnd: true,
                currentPeriodEnd: FUTURE,
            },
        })
        await expect(createSubscriptionCheckout("user_1")).resolves.toBeDefined()
    })

    it("allows resubscribing after a cancelled subscription", async () => {
        mockStoredUser({
            plan: PLAN.PRO,
            subscription: {
                status: SUBSCRIPTION_STATUS.CANCELLED,
                cancelAtPeriodEnd: true,
                currentPeriodEnd: FUTURE,
            },
        })
        await expect(createSubscriptionCheckout("user_1")).resolves.toBeDefined()
    })

    it("allows resubscribing after the subscription expired", async () => {
        mockStoredUser({
            plan: PLAN.FREE,
            subscription: { status: SUBSCRIPTION_STATUS.EXPIRED, currentPeriodEnd: PAST },
        })
        await expect(createSubscriptionCheckout("user_1")).resolves.toBeDefined()
    })

    it("wraps provider failures as sanitized ProviderApiError", async () => {
        mockStoredUser({ plan: PLAN.FREE })
        mockProvider.createSubscriptionCheckout.mockRejectedValue(new Error("down sk_live_abc"))

        await expect(createSubscriptionCheckout("user_1")).rejects.toMatchObject({
            name: "ProviderApiError",
            message: "down [redacted]",
        })
    })

    it("does not swallow a failing user lookup", async () => {
        const lean = vi.fn().mockRejectedValue(new Error("mongo offline"))
        User.findOne.mockReturnValue({ select: () => ({ lean }) })

        await expect(createSubscriptionCheckout("user_1")).rejects.toThrow("mongo offline")
        expect(mockProvider.createSubscriptionCheckout).not.toHaveBeenCalled()
    })
})

function subEvent(
    overrides: Partial<NormalizedSubscriptionEvent> = {},
): NormalizedSubscriptionEvent {
    return {
        providerEventId: "wh_sub_1",
        type: SUBSCRIPTION_EVENT_TYPE.ACTIVATED,
        providerSubscriptionId: "sub_1",
        userId: "user_1",
        currentPeriodEnd: new Date("2026-12-01T00:00:00.000Z"),
        occurredAt: new Date("2026-11-01T00:00:00.000Z"),
        ...overrides,
    }
}

const STALE_CLAUSE = {
    $or: [
        { "subscription.lastEventAt": { $exists: false } },
        { "subscription.lastEventAt": { $lt: new Date("2026-11-01T00:00:00.000Z") } },
    ],
}

function owner(subscriptionId: string) {
    return {
        $or: [
            { "subscription.providerSubscriptionId": subscriptionId },
            { "subscription.providerSubscriptionId": { $exists: false } },
        ],
    }
}

describe("applyEvent subscription lifecycle", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        User.updateOne.mockResolvedValue({ modifiedCount: 1 })
    })

    it("activated sets Pro without an owner guard so a new subscription can replace the old", async () => {
        await applyEvent(subEvent())

        expect(User.updateOne).toHaveBeenCalledWith(
            { userId: "user_1", $and: [STALE_CLAUSE] },
            {
                $set: {
                    "subscription.providerSubscriptionId": "sub_1",
                    "subscription.lastEventAt": new Date("2026-11-01T00:00:00.000Z"),
                    plan: "pro",
                    "subscription.status": "active",
                    "subscription.currentPeriodEnd": new Date("2026-12-01T00:00:00.000Z"),
                    "subscription.cancelAtPeriodEnd": false,
                },
            },
        )
        expect(logger.info).toHaveBeenCalledWith(
            expect.objectContaining({ subscriptionId: "sub_1", userId: "user_1" }),
            "Subscription event applied",
        )
    })

    it("renewed extends the period end and is guarded by subscription ownership", async () => {
        await applyEvent(
            subEvent({
                type: SUBSCRIPTION_EVENT_TYPE.RENEWED,
                currentPeriodEnd: new Date("2027-01-01T00:00:00.000Z"),
            }),
        )

        const [filter, update] = User.updateOne.mock.calls[0]!
        expect(filter).toEqual({ userId: "user_1", $and: [owner("sub_1"), STALE_CLAUSE] })
        expect(update.$set).toMatchObject({
            plan: "pro",
            "subscription.status": "active",
            "subscription.currentPeriodEnd": new Date("2027-01-01T00:00:00.000Z"),
            "subscription.cancelAtPeriodEnd": false,
        })
    })

    it("cancelled keeps the plan and period end so Pro lasts until the paid term ends", async () => {
        await applyEvent(subEvent({ type: SUBSCRIPTION_EVENT_TYPE.CANCELLED }))

        const update = User.updateOne.mock.calls[0]![1]
        expect(update.$set).toEqual({
            "subscription.providerSubscriptionId": "sub_1",
            "subscription.lastEventAt": new Date("2026-11-01T00:00:00.000Z"),
            "subscription.status": "cancelled",
            "subscription.cancelAtPeriodEnd": true,
        })
        expect(update.$set).not.toHaveProperty("plan")
        expect(update.$set).not.toHaveProperty("subscription.currentPeriodEnd")
    })

    it("payment_failed marks past_due without changing plan", async () => {
        await applyEvent(subEvent({ type: SUBSCRIPTION_EVENT_TYPE.PAYMENT_FAILED }))

        expect(User.updateOne.mock.calls[0]![1].$set).toEqual({
            "subscription.providerSubscriptionId": "sub_1",
            "subscription.lastEventAt": new Date("2026-11-01T00:00:00.000Z"),
            "subscription.status": "past_due",
        })
    })

    it("expired downgrades to free", async () => {
        await applyEvent(subEvent({ type: SUBSCRIPTION_EVENT_TYPE.EXPIRED }))

        expect(User.updateOne.mock.calls[0]![1].$set).toEqual({
            "subscription.providerSubscriptionId": "sub_1",
            "subscription.lastEventAt": new Date("2026-11-01T00:00:00.000Z"),
            plan: "free",
            "subscription.status": "expired",
            "subscription.cancelAtPeriodEnd": false,
        })
    })

    it("skips the write and warns when the event has no userId", async () => {
        await applyEvent(subEvent({ userId: null }))

        expect(User.updateOne).not.toHaveBeenCalled()
        expect(logger.warn).toHaveBeenCalledWith(
            expect.objectContaining({ reason: "missing_user_id" }),
            "Webhook missing userId",
        )
    })

    it("logs an ignored event when the guards match nothing (stale or duplicate)", async () => {
        User.updateOne.mockResolvedValue({ modifiedCount: 0 })

        await applyEvent(subEvent({ type: SUBSCRIPTION_EVENT_TYPE.RENEWED }))

        expect(logger.info).toHaveBeenCalledWith(
            expect.objectContaining({ type: "subscription.renewed" }),
            "Subscription event ignored (stale, duplicate or no user)",
        )
        expect(logger.info).not.toHaveBeenCalledWith(
            expect.anything(),
            "Subscription event applied",
        )
    })
})
