/** Max raw JSON body size for POST /webhooks/payments (express.raw limit). */
export const PAYMENTS_WEBHOOK_BODY_LIMIT_BYTES = 256 * 1024

export const DODO_WEBHOOK_EVENT_TYPE = {
    PAYMENT_SUCCEEDED: "payment.succeeded",
    PAYMENT_FAILED: "payment.failed",
} as const

export const DODO_SUBSCRIPTION_EVENT_PREFIX = "subscription."

/** Confirmed against the dodopayments SDK webhook union (see GO-LIVE.md). */
export const DODO_SUBSCRIPTION_EVENT_TYPE = {
    ACTIVE: "subscription.active",
    RENEWED: "subscription.renewed",
    CANCELLED: "subscription.cancelled",
    FAILED: "subscription.failed",
    ON_HOLD: "subscription.on_hold",
    PAST_DUE: "subscription.past_due",
    EXPIRED: "subscription.expired",
} as const

export type DodoWebhookEventType =
    (typeof DODO_WEBHOOK_EVENT_TYPE)[keyof typeof DODO_WEBHOOK_EVENT_TYPE]
