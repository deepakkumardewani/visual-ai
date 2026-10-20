import { describe, expect, it } from "vitest"

import { NORMALIZED_EVENT_TYPE } from "../constants.js"
import { mapDodoWebhookEvent } from "./eventMapper.js"

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
