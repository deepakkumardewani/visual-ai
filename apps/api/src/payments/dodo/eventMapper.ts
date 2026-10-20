import type { UnwrapWebhookEvent } from "dodopayments/resources/webhooks/webhooks.js"

import { NORMALIZED_EVENT_TYPE, type NormalizedEventType } from "../constants.js"
import { DODO_WEBHOOK_EVENT_TYPE } from "./constants.js"
import type { NormalizedPaymentEvent } from "../types.js"

export type ParsedWebhookEvent = NormalizedPaymentEvent & {
    providerSessionId: string | null
    paymentMethod: string | null
}

function readMetadataString(
    metadata: Record<string, unknown> | null | undefined,
    key: string,
): string | null {
    if (!metadata || typeof metadata !== "object") {
        return null
    }
    const value = metadata[key]
    return typeof value === "string" && value.length > 0 ? value : null
}

function mapEventType(type: string): NormalizedEventType | null {
    if (type === DODO_WEBHOOK_EVENT_TYPE.PAYMENT_SUCCEEDED) {
        return NORMALIZED_EVENT_TYPE.PAYMENT_SUCCEEDED
    }
    if (type === DODO_WEBHOOK_EVENT_TYPE.PAYMENT_FAILED) {
        return NORMALIZED_EVENT_TYPE.PAYMENT_FAILED
    }
    return null
}

export function mapDodoWebhookEvent(
    payload: UnwrapWebhookEvent,
    providerEventId: string,
): ParsedWebhookEvent | null {
    const normalizedType = mapEventType(payload.type)
    if (!normalizedType) {
        return null
    }

    const data = payload.data as unknown as Record<string, unknown>
    const paymentId = typeof data.payment_id === "string" ? data.payment_id : null
    if (!paymentId) {
        return null
    }

    const totalAmount = data.total_amount
    const amountMinor = typeof totalAmount === "number" ? totalAmount : Number(totalAmount)
    if (!Number.isFinite(amountMinor)) {
        return null
    }

    const currency = typeof data.currency === "string" ? data.currency : "INR"
    const metadata =
        data.metadata && typeof data.metadata === "object"
            ? (data.metadata as Record<string, unknown>)
            : null

    const checkoutSessionId =
        typeof data.checkout_session_id === "string" ? data.checkout_session_id : null
    const paymentMethod = typeof data.payment_method === "string" ? data.payment_method : null

    const occurredAt =
        typeof payload.timestamp === "string" ? new Date(payload.timestamp) : new Date()

    return {
        providerEventId,
        type: normalizedType,
        providerPaymentId: paymentId,
        userId: readMetadataString(metadata, "userId"),
        packId: readMetadataString(metadata, "packId"),
        amountMinor,
        currency,
        occurredAt,
        providerSessionId: checkoutSessionId,
        paymentMethod,
    }
}
