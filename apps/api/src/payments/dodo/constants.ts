/** Max raw JSON body size for POST /webhooks/payments (express.raw limit). */
export const PAYMENTS_WEBHOOK_BODY_LIMIT_BYTES = 256 * 1024

export const DODO_WEBHOOK_EVENT_TYPE = {
    PAYMENT_SUCCEEDED: "payment.succeeded",
    PAYMENT_FAILED: "payment.failed",
} as const

export type DodoWebhookEventType =
    (typeof DODO_WEBHOOK_EVENT_TYPE)[keyof typeof DODO_WEBHOOK_EVENT_TYPE]
