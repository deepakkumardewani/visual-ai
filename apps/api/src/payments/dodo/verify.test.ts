import crypto from "crypto"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { WEBHOOK_HEADERS } from "../constants.js"
import { InvalidSignatureError } from "../errors.js"
import { NORMALIZED_EVENT_TYPE } from "../constants.js"

const WEBHOOK_SECRET = vi.hoisted(
    () => "whsec_" + Buffer.from("super-secret-webhook-key!!").toString("base64"),
)

const mockEnv = vi.hoisted(() => ({
    DODO_PAYMENTS_API_KEY: "sk_test_placeholder",
    DODO_PAYMENTS_ENVIRONMENT: "test_mode" as const,
    DODO_PAYMENTS_WEBHOOK_KEY: WEBHOOK_SECRET,
    DODO_PRODUCT_ID_PACK_200: "pdt_200",
    DODO_PRODUCT_ID_PACK_450: "pdt_450",
    DODO_PRODUCT_ID_PACK_960: "pdt_960",
    DODO_PRODUCT_ID_PACK_2000: "pdt_2000",
}))

vi.mock("../../config/env.js", () => ({
    env: mockEnv,
}))

import { createDodoPaymentProvider } from "./adapter.js"

function signWebhook(
    body: string,
    secret: string,
    id = "msg_test_1",
    timestamp = Math.floor(Date.now() / 1000).toString(),
) {
    const keyMaterial = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret
    const keyBytes = Buffer.from(keyMaterial, "base64")
    const signedContent = `${id}.${timestamp}.${body}`
    const signature = crypto
        .createHmac("sha256", new Uint8Array(keyBytes))
        .update(signedContent)
        .digest("base64")
    return {
        [WEBHOOK_HEADERS.ID]: id,
        [WEBHOOK_HEADERS.TIMESTAMP]: timestamp,
        [WEBHOOK_HEADERS.SIGNATURE]: `v1,${signature}`,
    }
}

function paymentSucceededPayload(overrides: Record<string, unknown> = {}) {
    return JSON.stringify({
        type: "payment.succeeded",
        timestamp: "2026-03-15T10:00:00.000Z",
        business_id: "biz_1",
        data: {
            payment_id: "pay_verify_1",
            total_amount: 13_000,
            currency: "INR",
            checkout_session_id: "cks_verify",
            payment_method: "card",
            metadata: { userId: "user_verify", packId: "pack_200" },
            ...overrides,
        },
    })
}

describe("verifyAndParseWebhook", () => {
    beforeEach(() => {
        mockEnv.DODO_PAYMENTS_WEBHOOK_KEY = WEBHOOK_SECRET
    })

    it("parses a valid signed payment.succeeded payload", () => {
        const provider = createDodoPaymentProvider()
        const body = paymentSucceededPayload()
        const headers = signWebhook(body, WEBHOOK_SECRET)

        const event = provider.verifyAndParseWebhook(Buffer.from(body), headers)

        expect(event).toMatchObject({
            providerEventId: "msg_test_1",
            type: NORMALIZED_EVENT_TYPE.PAYMENT_SUCCEEDED,
            providerPaymentId: "pay_verify_1",
            userId: "user_verify",
            packId: "pack_200",
            amountMinor: 13_000,
            currency: "INR",
        })
    })

    it("throws InvalidSignatureError when the body is tampered", () => {
        const provider = createDodoPaymentProvider()
        const body = paymentSucceededPayload()
        const headers = signWebhook(body, WEBHOOK_SECRET)

        expect(() => provider.verifyAndParseWebhook(Buffer.from(body + " "), headers)).toThrow(
            InvalidSignatureError,
        )
    })

    it("throws InvalidSignatureError with the wrong secret", () => {
        const provider = createDodoPaymentProvider()
        const body = paymentSucceededPayload()
        const wrongSecret =
            "whsec_" + Buffer.from("different-webhook-key-value!!").toString("base64")
        const headers = signWebhook(body, wrongSecret)

        expect(() => provider.verifyAndParseWebhook(Buffer.from(body), headers)).toThrow(
            InvalidSignatureError,
        )
    })

    it("throws InvalidSignatureError when signature headers are missing", () => {
        const provider = createDodoPaymentProvider()
        const body = paymentSucceededPayload()

        expect(() => provider.verifyAndParseWebhook(Buffer.from(body), {})).toThrow(
            InvalidSignatureError,
        )
    })

    it("throws InvalidSignatureError for a stale timestamp", () => {
        const provider = createDodoPaymentProvider()
        const body = paymentSucceededPayload()
        const staleTs = (Math.floor(Date.now() / 1000) - 600).toString()
        const headers = signWebhook(body, WEBHOOK_SECRET, "msg_stale", staleTs)

        expect(() => provider.verifyAndParseWebhook(Buffer.from(body), headers)).toThrow(
            InvalidSignatureError,
        )
    })

    it("returns null for unknown event types after verification", () => {
        const provider = createDodoPaymentProvider()
        const body = JSON.stringify({
            type: "payout.created",
            timestamp: "2026-03-15T10:00:00.000Z",
            business_id: "biz_1",
            data: { payout_id: "po_1", amount: 100, currency: "INR" },
        })
        const headers = signWebhook(body, WEBHOOK_SECRET, "msg_unknown")

        expect(provider.verifyAndParseWebhook(Buffer.from(body), headers)).toBeNull()
    })
})
