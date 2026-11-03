import { describe, expect, it } from "vitest"

import { NORMALIZED_EVENT_TYPE, SUBSCRIPTION_EVENT_TYPE } from "../constants.js"
import {
    isDodoSubscriptionEvent,
    mapDodoSubscriptionEvent,
    mapDodoWebhookEvent,
} from "./eventMapper.js"

describe("mapDodoWebhookEvent", () => {
    it("maps payment.succeeded with metadata and amount fields", () => {
        const result = mapDodoWebhookEvent(
            {
                type: "payment.succeeded",
                timestamp: "2026-03-15T10:00:00.000Z",
                business_id: "biz_1",
                data: {
                    payment_id: "pay_abc",
                    total_amount: 13_000,
                    currency: "INR",
                    checkout_session_id: "cks_1",
                    payment_method: "card",
                    metadata: { userId: "user_1", packId: "pack_200" },
                },
            } as never,
            "wh_msg_1",
        )

        expect(result).toMatchObject({
            providerEventId: "wh_msg_1",
            type: NORMALIZED_EVENT_TYPE.PAYMENT_SUCCEEDED,
            providerPaymentId: "pay_abc",
            userId: "user_1",
            packId: "pack_200",
            amountMinor: 13_000,
            currency: "INR",
            providerSessionId: "cks_1",
            paymentMethod: "card",
        })
    })

    it("maps payment.failed", () => {
        const result = mapDodoWebhookEvent(
            {
                type: "payment.failed",
                timestamp: "2026-03-15T10:00:00.000Z",
                business_id: "biz_1",
                data: {
                    payment_id: "pay_fail",
                    total_amount: 13_000,
                    currency: "INR",
                    metadata: { userId: "user_1", packId: "pack_200" },
                },
            } as never,
            "wh_msg_2",
        )

        expect(result?.type).toBe(NORMALIZED_EVENT_TYPE.PAYMENT_FAILED)
    })

    it("returns null for unknown event types", () => {
        expect(
            mapDodoWebhookEvent(
                {
                    type: "subscription.active",
                    timestamp: "2026-03-15T10:00:00.000Z",
                    business_id: "biz_1",
                    data: { payment_id: "pay_x" },
                } as never,
                "wh_msg_3",
            ),
        ).toBeNull()
    })

    it("returns null when payment_id is missing", () => {
        expect(
            mapDodoWebhookEvent(
                {
                    type: "payment.succeeded",
                    timestamp: "2026-03-15T10:00:00.000Z",
                    business_id: "biz_1",
                    data: { total_amount: 13_000, currency: "INR" },
                } as never,
                "wh_no_pay",
            ),
        ).toBeNull()
    })

    it("returns null when total_amount is not a finite number", () => {
        expect(
            mapDodoWebhookEvent(
                {
                    type: "payment.succeeded",
                    timestamp: "2026-03-15T10:00:00.000Z",
                    business_id: "biz_1",
                    data: {
                        payment_id: "pay_bad_amt",
                        total_amount: "not-a-number",
                        currency: "INR",
                    },
                } as never,
                "wh_bad_amt",
            ),
        ).toBeNull()
    })

    it("coerces string total_amount and defaults currency when absent", () => {
        const result = mapDodoWebhookEvent(
            {
                type: "payment.succeeded",
                business_id: "biz_1",
                data: {
                    payment_id: "pay_str_amt",
                    total_amount: "13000",
                    metadata: { userId: "user_1", packId: "pack_200" },
                },
            } as never,
            "wh_str",
        )

        expect(result).toMatchObject({
            amountMinor: 13_000,
            currency: "INR",
            userId: "user_1",
        })
    })

    it("ignores invalid metadata and empty string metadata values", () => {
        const result = mapDodoWebhookEvent(
            {
                type: "payment.succeeded",
                timestamp: "2026-03-15T10:00:00.000Z",
                business_id: "biz_1",
                data: {
                    payment_id: "pay_meta",
                    total_amount: 13_000,
                    metadata: "not-an-object",
                },
            } as never,
            "wh_meta",
        )

        expect(result?.userId).toBeNull()
        expect(result?.packId).toBeNull()

        const emptyStrings = mapDodoWebhookEvent(
            {
                type: "payment.succeeded",
                business_id: "biz_1",
                data: {
                    payment_id: "pay_empty_meta",
                    total_amount: 13_000,
                    metadata: { userId: "", packId: 42 },
                },
            } as never,
            "wh_empty_meta",
        )
        expect(emptyStrings?.userId).toBeNull()
        expect(emptyStrings?.packId).toBeNull()
    })
})

function subscriptionPayload(
    type: string,
    data: Record<string, unknown> = {},
    timestamp: unknown = "2026-04-01T10:00:00.000Z",
) {
    return {
        type,
        timestamp,
        business_id: "biz_1",
        data: {
            subscription_id: "sub_1",
            next_billing_date: "2026-05-01T00:00:00.000Z",
            metadata: { userId: "user_1" },
            ...data,
        },
    } as never
}

describe("isDodoSubscriptionEvent", () => {
    it("is true for subscription.* types", () => {
        expect(isDodoSubscriptionEvent(subscriptionPayload("subscription.active"))).toBe(true)
    })

    it("is false for payment types", () => {
        expect(isDodoSubscriptionEvent(subscriptionPayload("payment.succeeded"))).toBe(false)
    })
})

describe("mapDodoSubscriptionEvent", () => {
    it.each([
        ["subscription.active", SUBSCRIPTION_EVENT_TYPE.ACTIVATED],
        ["subscription.renewed", SUBSCRIPTION_EVENT_TYPE.RENEWED],
        ["subscription.cancelled", SUBSCRIPTION_EVENT_TYPE.CANCELLED],
        ["subscription.failed", SUBSCRIPTION_EVENT_TYPE.PAYMENT_FAILED],
        ["subscription.on_hold", SUBSCRIPTION_EVENT_TYPE.PAYMENT_FAILED],
        ["subscription.past_due", SUBSCRIPTION_EVENT_TYPE.PAYMENT_FAILED],
        ["subscription.expired", SUBSCRIPTION_EVENT_TYPE.EXPIRED],
    ])("maps %s to %s", (dodoType, expected) => {
        const result = mapDodoSubscriptionEvent(subscriptionPayload(dodoType), "wh_1")

        expect(result).toEqual({
            providerEventId: "wh_1",
            type: expected,
            providerSubscriptionId: "sub_1",
            userId: "user_1",
            currentPeriodEnd: new Date("2026-05-01T00:00:00.000Z"),
            occurredAt: new Date("2026-04-01T10:00:00.000Z"),
        })
    })

    it("returns null for an unknown subscription event", () => {
        expect(
            mapDodoSubscriptionEvent(subscriptionPayload("subscription.plan_changed"), "w"),
        ).toBeNull()
    })

    it("returns null when subscription_id is missing", () => {
        const payload = subscriptionPayload("subscription.active", { subscription_id: 42 })
        expect(mapDodoSubscriptionEvent(payload, "w")).toBeNull()
    })

    it.each(["subscription.active", "subscription.renewed"])(
        "returns null for %s without a valid billing date",
        (type) => {
            expect(
                mapDodoSubscriptionEvent(
                    subscriptionPayload(type, { next_billing_date: null }),
                    "w",
                ),
            ).toBeNull()
            expect(
                mapDodoSubscriptionEvent(
                    subscriptionPayload(type, { next_billing_date: "not-a-date" }),
                    "w",
                ),
            ).toBeNull()
        },
    )

    it("keeps a null period end for cancelled and expired events", () => {
        const cancelled = mapDodoSubscriptionEvent(
            subscriptionPayload("subscription.cancelled", { next_billing_date: undefined }),
            "w",
        )
        expect(cancelled).toMatchObject({
            type: SUBSCRIPTION_EVENT_TYPE.CANCELLED,
            currentPeriodEnd: null,
        })
    })

    it("yields a null userId when metadata is absent or has no userId", () => {
        expect(
            mapDodoSubscriptionEvent(
                subscriptionPayload("subscription.active", { metadata: null }),
                "w",
            )?.userId,
        ).toBeNull()
        expect(
            mapDodoSubscriptionEvent(
                subscriptionPayload("subscription.active", { metadata: { userId: "" } }),
                "w",
            )?.userId,
        ).toBeNull()
    })

    it("falls back to the current time when the timestamp is unparseable", () => {
        const before = Date.now()
        const result = mapDodoSubscriptionEvent(
            subscriptionPayload("subscription.active", {}, "garbage"),
            "w",
        )
        expect(result!.occurredAt.getTime()).toBeGreaterThanOrEqual(before)
    })
})
