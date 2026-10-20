import { getCreditPack } from "@visual-ai/shared"
import moment from "moment"

import { env } from "../config/env.js"
import { NotFoundError } from "../lib/errors.js"
import { PaymentModel as Payment } from "../models/payment.js"
import {
    CHECKOUT_SESSION_STATUS,
    MINOR_UNITS_PER_MAJOR,
    PAYMENT_PROVIDER_DODO,
    PAYMENT_STATUS,
    PAYMENTS_MESSAGES,
    type CheckoutSessionStatus,
} from "./constants.js"
import { asProviderApiError, UnknownPackError } from "./errors.js"
import { getPaymentProvider } from "./providerFactory.js"
import type { NormalizedPaymentEvent } from "./types.js"

export async function createCheckout(
    userId: string,
    packId: string,
    email?: string,
): Promise<{ checkoutUrl: string; sessionId: string }> {
    const pack = getCreditPack(packId)
    if (!pack) {
        throw new UnknownPackError(packId)
    }

    const provider = getPaymentProvider()
    let checkout: { checkoutUrl: string; sessionId: string }
    try {
        checkout = await provider.createCheckout({
            userId,
            pack,
            email,
            returnUrl: env.PAYMENT_RETURN_URL as string,
        })
    } catch (error) {
        throw asProviderApiError(error, PAYMENTS_MESSAGES.PROVIDER_REQUEST_FAILED)
    }

    await Payment.create({
        userId,
        provider: PAYMENT_PROVIDER_DODO,
        providerSessionId: checkout.sessionId,
        packId: pack.id,
        credits: pack.credits,
        currency: pack.currency,
        amount: pack.priceMinor / MINOR_UNITS_PER_MAJOR,
        status: PAYMENT_STATUS.PENDING,
        transactionId: checkout.sessionId,
        paymentMethod: "other",
        description: pack.description,
        humanReadableDate: moment().format("MM/DD/YYYY"),
    })

    return checkout
}

export async function listPaymentsForUser(userId: string) {
    return Payment.find({ userId }).sort({ createdAt: -1 }).lean()
}

function mapRecordStatusToCheckoutStatus(status: string): CheckoutSessionStatus | null {
    if (status === PAYMENT_STATUS.COMPLETED) {
        return CHECKOUT_SESSION_STATUS.SUCCEEDED
    }
    if (status === PAYMENT_STATUS.FAILED) {
        return CHECKOUT_SESSION_STATUS.FAILED
    }
    if (status === PAYMENT_STATUS.PENDING) {
        return CHECKOUT_SESSION_STATUS.PENDING
    }
    return null
}

export async function getCheckoutSessionStatus(
    userId: string,
    sessionId: string,
): Promise<{ status: CheckoutSessionStatus; credits?: number }> {
    const record = await Payment.findOne({ providerSessionId: sessionId })
    if (!record) {
        throw new NotFoundError(PAYMENTS_MESSAGES.CHECKOUT_SESSION_NOT_FOUND)
    }
    if (record.userId !== userId) {
        throw new NotFoundError(PAYMENTS_MESSAGES.CHECKOUT_SESSION_NOT_FOUND)
    }

    const fromDb = mapRecordStatusToCheckoutStatus(record.status)
    if (fromDb === CHECKOUT_SESSION_STATUS.SUCCEEDED) {
        return {
            status: CHECKOUT_SESSION_STATUS.SUCCEEDED,
            credits: record.credits ?? undefined,
        }
    }
    if (fromDb === CHECKOUT_SESSION_STATUS.FAILED) {
        return { status: CHECKOUT_SESSION_STATUS.FAILED }
    }

    const provider = getPaymentProvider()
    let providerStatus: Awaited<ReturnType<typeof provider.getSessionStatus>>
    try {
        providerStatus = await provider.getSessionStatus(sessionId)
    } catch (error) {
        throw asProviderApiError(error, PAYMENTS_MESSAGES.PROVIDER_REQUEST_FAILED)
    }

    if (providerStatus.status === PAYMENT_STATUS.COMPLETED) {
        return {
            status: CHECKOUT_SESSION_STATUS.SUCCEEDED,
            credits: record.credits ?? undefined,
        }
    }
    if (providerStatus.status === PAYMENT_STATUS.FAILED) {
        return { status: CHECKOUT_SESSION_STATUS.FAILED }
    }
    return { status: CHECKOUT_SESSION_STATUS.PENDING }
}

/** Provider-agnostic webhook handler (completed in Phase 4). */
export async function applyEvent(_event: NormalizedPaymentEvent): Promise<void> {
    throw new Error("applyEvent is not implemented yet")
}
