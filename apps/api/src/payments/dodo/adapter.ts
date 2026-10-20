import type { IncomingHttpHeaders } from "http"

import { DODO_API_PAYMENT_STATUS, PAYMENT_PROVIDER_DODO, PAYMENT_STATUS } from "../constants.js"
import { asProviderApiError, InvalidSignatureError, ProviderApiError } from "../errors.js"
import type { PaymentProvider } from "../types.js"
import { createDodoClient, type DodoClient } from "./client.js"
import { getDodoProductIdForPack } from "./productMap.js"

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

export function createDodoPaymentProvider(
    client: DodoClient = createDodoClient(),
): PaymentProvider {
    return {
        name: PAYMENT_PROVIDER_DODO,

        async createCheckout({ userId, pack, email, returnUrl }) {
            try {
                const session = await client.checkoutSessions.create({
                    product_cart: [
                        {
                            product_id: getDodoProductIdForPack(pack.id),
                            quantity: 1,
                        },
                    ],
                    metadata: {
                        userId,
                        packId: pack.id,
                    },
                    ...(email ? { customer: { email } } : {}),
                    return_url: returnUrl,
                })

                if (!session.checkout_url || !session.session_id) {
                    throw new ProviderApiError(
                        "Checkout session missing checkout URL or session id",
                    )
                }

                return {
                    checkoutUrl: session.checkout_url,
                    sessionId: session.session_id,
                }
            } catch (error) {
                throw asProviderApiError(error, "Dodo checkout session creation failed")
            }
        },

        verifyAndParseWebhook(_rawBody: Buffer, _headers: IncomingHttpHeaders) {
            throw new InvalidSignatureError("Dodo webhook handling is not implemented yet")
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
