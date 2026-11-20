import type { IncomingHttpHeaders } from "http"

import {
    DODO_API_PAYMENT_STATUS,
    PAYMENT_PROVIDER_DODO,
    PAYMENT_STATUS,
    WEBHOOK_HEADERS,
} from "../constants.js"
import { asProviderApiError, InvalidSignatureError, ProviderApiError } from "../errors.js"
import type { CheckoutResult, NormalizedWebhookEvent, PaymentProvider } from "../types.js"
import { createDodoClient, type DodoClient } from "./client.js"
import {
    isDodoSubscriptionEvent,
    mapDodoSubscriptionEvent,
    mapDodoWebhookEvent,
} from "./eventMapper.js"
import { getDodoProductIdForPack, getDodoProductIdForPro } from "./productMap.js"

interface CheckoutSessionInput {
    productId: string
    metadata: Record<string, string>
    email?: string
    returnUrl: string
}

function normalizeWebhookHeaders(headers: IncomingHttpHeaders): Record<string, string> {
    const normalized: Record<string, string> = {}
    for (const [key, value] of Object.entries(headers)) {
        if (value === undefined) {
            continue
        }
        normalized[key.toLowerCase()] = Array.isArray(value) ? value.join(",") : value
    }
    return normalized
}

function requireWebhookHeader(headers: Record<string, string>, name: string): string {
    const value = headers[name]
    if (!value) {
        throw new InvalidSignatureError(`Missing webhook header: ${name}`)
    }
    return value
}

function mapPaymentStatus(
    paymentStatus: string | null | undefined,
): typeof PAYMENT_STATUS.PENDING | typeof PAYMENT_STATUS.COMPLETED | typeof PAYMENT_STATUS.FAILED {
    if (
        paymentStatus === DODO_API_PAYMENT_STATUS.SUCCEEDED ||
        paymentStatus === DODO_API_PAYMENT_STATUS.PAID
    ) {
        return PAYMENT_STATUS.COMPLETED
    }
    if (
        paymentStatus === DODO_API_PAYMENT_STATUS.FAILED ||
        paymentStatus === DODO_API_PAYMENT_STATUS.CANCELLED
    ) {
        return PAYMENT_STATUS.FAILED
    }
    return PAYMENT_STATUS.PENDING
}

async function createSession(
    client: DodoClient,
    { productId, metadata, email, returnUrl }: CheckoutSessionInput,
): Promise<CheckoutResult> {
    const session = await client.checkoutSessions.create({
        product_cart: [{ product_id: productId, quantity: 1 }],
        metadata,
        ...(email ? { customer: { email } } : {}),
        return_url: returnUrl,
    })

    if (!session.checkout_url || !session.session_id) {
        throw new ProviderApiError("Checkout session missing checkout URL or session id")
    }

    return { checkoutUrl: session.checkout_url, sessionId: session.session_id }
}

export function createDodoPaymentProvider(
    client: DodoClient = createDodoClient(),
): PaymentProvider {
    return {
        name: PAYMENT_PROVIDER_DODO,

        async createCheckout({ userId, pack, email, returnUrl }) {
            try {
                return await createSession(client, {
                    productId: getDodoProductIdForPack(pack.id),
                    metadata: { userId, packId: pack.id },
                    email,
                    returnUrl,
                })
            } catch (error) {
                throw asProviderApiError(error, "Dodo checkout session creation failed")
            }
        },

        async createSubscriptionCheckout({ userId, email, returnUrl }) {
            try {
                return await createSession(client, {
                    productId: getDodoProductIdForPro(),
                    metadata: { userId },
                    email,
                    returnUrl,
                })
            } catch (error) {
                throw asProviderApiError(error, "Dodo subscription checkout creation failed")
            }
        },

        verifyAndParseWebhook(
            rawBody: Buffer,
            headers: IncomingHttpHeaders,
        ): NormalizedWebhookEvent | null {
            const normalizedHeaders = normalizeWebhookHeaders(headers)
            requireWebhookHeader(normalizedHeaders, WEBHOOK_HEADERS.ID)
            requireWebhookHeader(normalizedHeaders, WEBHOOK_HEADERS.TIMESTAMP)
            requireWebhookHeader(normalizedHeaders, WEBHOOK_HEADERS.SIGNATURE)

            const body = rawBody.toString("utf8")
            let payload: ReturnType<DodoClient["webhooks"]["unwrap"]>
            try {
                payload = client.webhooks.unwrap(body, { headers: normalizedHeaders })
            } catch (error) {
                throw new InvalidSignatureError(undefined, { cause: error })
            }

            const webhookId = normalizedHeaders[WEBHOOK_HEADERS.ID]!
            return isDodoSubscriptionEvent(payload)
                ? mapDodoSubscriptionEvent(payload, webhookId)
                : mapDodoWebhookEvent(payload, webhookId)
        },

        async getSessionStatus(sessionId: string) {
            try {
                const session = await client.checkoutSessions.retrieve(sessionId)
                const paymentId = typeof session.payment_id === "string" ? session.payment_id : null
                return {
                    paymentId,
                    status: mapPaymentStatus(session.payment_status),
                }
            } catch (error) {
                throw asProviderApiError(error, "Dodo checkout session retrieve failed")
            }
        },
    }
}
