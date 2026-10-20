import type { PaymentProviderName } from "@visual-ai/shared"

export const PAYMENT_PROVIDER_DODO: PaymentProviderName = "dodo"
export const PAYMENT_PROVIDER_RAZORPAY: PaymentProviderName = "razorpay"

export const PAYMENT_STATUS = {
    PENDING: "pending",
    COMPLETED: "completed",
    FAILED: "failed",
} as const

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS]

export const CHECKOUT_SESSION_STATUS = {
    PENDING: "pending",
    SUCCEEDED: "succeeded",
    FAILED: "failed",
} as const

export type CheckoutSessionStatus =
    (typeof CHECKOUT_SESSION_STATUS)[keyof typeof CHECKOUT_SESSION_STATUS]

export const NORMALIZED_EVENT_TYPE = {
    PAYMENT_SUCCEEDED: "payment.succeeded",
    PAYMENT_FAILED: "payment.failed",
} as const

export type NormalizedEventType = (typeof NORMALIZED_EVENT_TYPE)[keyof typeof NORMALIZED_EVENT_TYPE]

export const WEBHOOK_HEADERS = {
    ID: "webhook-id",
    TIMESTAMP: "webhook-timestamp",
    SIGNATURE: "webhook-signature",
} as const

/** Minor currency units (e.g. paise) per major unit (e.g. INR). */
export const MINOR_UNITS_PER_MAJOR = 100

export const DODO_API_PAYMENT_STATUS = {
    SUCCEEDED: "succeeded",
    PAID: "paid",
    FAILED: "failed",
    CANCELLED: "cancelled",
} as const

export const PAYMENTS_MESSAGES = {
    PROVIDER_UNAVAILABLE: "Payment provider temporarily unavailable",
    PROVIDER_REQUEST_FAILED: "Payment provider request failed",
    CHECKOUT_SESSION_NOT_FOUND: "Checkout session not found",
} as const
