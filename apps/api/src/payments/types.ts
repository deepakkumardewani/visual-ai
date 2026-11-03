import type { CreditPack, PaymentProviderName } from "@visual-ai/shared"
import type { IncomingHttpHeaders } from "http"

import type { NormalizedEventType, PaymentStatus, SubscriptionEventType } from "./constants.js"

export interface CheckoutResult {
    checkoutUrl: string
    sessionId: string
}

export interface NormalizedPaymentEvent {
    providerEventId: string
    type: NormalizedEventType
    providerPaymentId: string
    userId: string | null
    packId: string | null
    amountMinor: number
    currency: string
    occurredAt: Date
}

export interface NormalizedSubscriptionEvent {
    providerEventId: string
    type: SubscriptionEventType
    providerSubscriptionId: string
    userId: string | null
    /** Provider's next billing date; null when the payload carries none. */
    currentPeriodEnd: Date | null
    occurredAt: Date
}

export type NormalizedWebhookEvent = NormalizedPaymentEvent | NormalizedSubscriptionEvent

export interface PaymentProvider {
    readonly name: PaymentProviderName
    createCheckout(req: {
        userId: string
        pack: CreditPack
        email?: string
        returnUrl: string
    }): Promise<CheckoutResult>
    createSubscriptionCheckout(req: {
        userId: string
        email?: string
        returnUrl: string
    }): Promise<CheckoutResult>
    verifyAndParseWebhook(
        rawBody: Buffer,
        headers: IncomingHttpHeaders,
    ): NormalizedWebhookEvent | null
    getSessionStatus(sessionId: string): Promise<{
        paymentId: string | null
        status: PaymentStatus
    }>
}
