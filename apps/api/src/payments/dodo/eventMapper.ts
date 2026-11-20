import type { UnwrapWebhookEvent } from "dodopayments/resources/webhooks/webhooks.js"

import {
    NORMALIZED_EVENT_TYPE,
    SUBSCRIPTION_EVENT_TYPE,
    type NormalizedEventType,
    type SubscriptionEventType,
} from "../constants.js"
import type { NormalizedPaymentEvent, NormalizedSubscriptionEvent } from "../types.js"
import {
    DODO_SUBSCRIPTION_EVENT_PREFIX,
    DODO_SUBSCRIPTION_EVENT_TYPE,
    DODO_WEBHOOK_EVENT_TYPE,
} from "./constants.js"

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

const SUBSCRIPTION_EVENT_BY_DODO_TYPE: Record<string, SubscriptionEventType> = {
    [DODO_SUBSCRIPTION_EVENT_TYPE.ACTIVE]: SUBSCRIPTION_EVENT_TYPE.ACTIVATED,
    [DODO_SUBSCRIPTION_EVENT_TYPE.RENEWED]: SUBSCRIPTION_EVENT_TYPE.RENEWED,
    [DODO_SUBSCRIPTION_EVENT_TYPE.CANCELLED]: SUBSCRIPTION_EVENT_TYPE.CANCELLED,
    [DODO_SUBSCRIPTION_EVENT_TYPE.FAILED]: SUBSCRIPTION_EVENT_TYPE.PAYMENT_FAILED,
    [DODO_SUBSCRIPTION_EVENT_TYPE.ON_HOLD]: SUBSCRIPTION_EVENT_TYPE.PAYMENT_FAILED,
    [DODO_SUBSCRIPTION_EVENT_TYPE.PAST_DUE]: SUBSCRIPTION_EVENT_TYPE.PAYMENT_FAILED,
    [DODO_SUBSCRIPTION_EVENT_TYPE.EXPIRED]: SUBSCRIPTION_EVENT_TYPE.EXPIRED,
}

/** Events that must carry a billing date to be meaningful. */
const PERIOD_END_REQUIRED: ReadonlySet<SubscriptionEventType> = new Set([
    SUBSCRIPTION_EVENT_TYPE.ACTIVATED,
    SUBSCRIPTION_EVENT_TYPE.RENEWED,
])

export function isDodoSubscriptionEvent(payload: UnwrapWebhookEvent): boolean {
    return payload.type.startsWith(DODO_SUBSCRIPTION_EVENT_PREFIX)
}

function parseDate(value: unknown): Date | null {
    if (typeof value !== "string") {
        return null
    }
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

export function mapDodoSubscriptionEvent(
    payload: UnwrapWebhookEvent,
    providerEventId: string,
): NormalizedSubscriptionEvent | null {
    const type = SUBSCRIPTION_EVENT_BY_DODO_TYPE[payload.type]
    if (!type) {
        return null
    }

    const data = payload.data as unknown as Record<string, unknown>
    const providerSubscriptionId =
        typeof data.subscription_id === "string" ? data.subscription_id : null
    if (!providerSubscriptionId) {
        return null
    }

    const currentPeriodEnd = parseDate(data.next_billing_date)
    if (!currentPeriodEnd && PERIOD_END_REQUIRED.has(type)) {
        return null
    }

    const metadata =
        data.metadata && typeof data.metadata === "object"
            ? (data.metadata as Record<string, unknown>)
            : null

    return {
        providerEventId,
        type,
        providerSubscriptionId,
        userId: readMetadataString(metadata, "userId"),
        currentPeriodEnd,
        occurredAt: parseDate(payload.timestamp) ?? new Date(),
    }
}
