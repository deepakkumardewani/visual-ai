import type { CreditPack, PaymentProviderName } from "@visual-ai/shared"
import type { IncomingHttpHeaders } from "http"

import type { NormalizedEventType, PaymentStatus } from "./constants.js"

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

export interface PaymentProvider {
    readonly name: PaymentProviderName
    createCheckout(req: {
        userId: string
        pack: CreditPack
        email?: string
        returnUrl: string
    }): Promise<CheckoutResult>
    verifyAndParseWebhook(
        rawBody: Buffer,
        headers: IncomingHttpHeaders,
    ): NormalizedPaymentEvent | null
    getSessionStatus(sessionId: string): Promise<{
        paymentId: string | null
        status: PaymentStatus
    }>
}
