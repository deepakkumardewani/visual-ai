import { getCreditPack, type CreditPack } from "@visual-ai/shared"
import moment from "moment"

import { env } from "../config/env.js"
import { NotFoundError } from "../lib/errors.js"
import { createLogger } from "../lib/logger.js"
import { PaymentModel as Payment } from "../models/payment.js"
import { UserModel as User } from "../models/user.js"
import {
    CHECKOUT_SESSION_STATUS,
    MINOR_UNITS_PER_MAJOR,
    NORMALIZED_EVENT_TYPE,
    PAYMENT_PROVIDER_DODO,
    PAYMENT_STATUS,
    PAYMENTS_MESSAGES,
    type CheckoutSessionStatus,
} from "./constants.js"
import { type ParsedWebhookEvent } from "./dodo/eventMapper.js"
import { asProviderApiError, UnknownPackError } from "./errors.js"
import { getPaymentProvider } from "./providerFactory.js"
import type { NormalizedPaymentEvent } from "./types.js"

const paymentsLogger = createLogger("payments-service")

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

function asParsedEvent(event: NormalizedPaymentEvent): ParsedWebhookEvent {
    return event as ParsedWebhookEvent
}

function webhookLogContext(event: NormalizedPaymentEvent) {
    return {
        webhookId: event.providerEventId,
        paymentId: event.providerPaymentId,
        userId: event.userId,
    }
}

function normalizePaymentMethod(method: string | null): string {
    if (!method) {
        return "other"
    }
    const lower = method.toLowerCase()
    if (lower.includes("upi")) {
        return "upi"
    }
    if (lower.includes("card")) {
        return "card"
    }
    return "other"
}

function buildEmbeddedPaymentRecord(
    event: ParsedWebhookEvent,
    pack: CreditPack,
    status: typeof PAYMENT_STATUS.COMPLETED | typeof PAYMENT_STATUS.FAILED,
) {
    return {
        userId: event.userId,
        provider: PAYMENT_PROVIDER_DODO,
        providerPaymentId: event.providerPaymentId,
        providerSessionId: event.providerSessionId ?? undefined,
        packId: pack.id,
        credits: pack.credits,
        currency: pack.currency,
        amount: pack.priceMinor / MINOR_UNITS_PER_MAJOR,
        status,
        transactionId: event.providerPaymentId,
        paymentMethod: normalizePaymentMethod(event.paymentMethod),
        description: pack.description,
        humanReadableDate: moment(event.occurredAt).format("MM/DD/YYYY"),
        createdAt: event.occurredAt,
    }
}

function completedPaymentGuard(paymentId: string) {
    return {
        payments: {
            $not: {
                $elemMatch: {
                    providerPaymentId: paymentId,
                    status: PAYMENT_STATUS.COMPLETED,
                },
            },
        },
    }
}

/** Blocks when any embedded row already exists for this provider payment id. */
function noExistingPaymentGuard(paymentId: string) {
    return {
        payments: {
            $not: {
                $elemMatch: {
                    providerPaymentId: paymentId,
                },
            },
        },
    }
}

async function syncCheckoutPaymentRow(
    event: ParsedWebhookEvent,
    pack: CreditPack,
    status: typeof PAYMENT_STATUS.COMPLETED | typeof PAYMENT_STATUS.FAILED,
) {
    const rowUpdate = {
        status,
        provider: PAYMENT_PROVIDER_DODO,
        providerPaymentId: event.providerPaymentId,
        packId: pack.id,
        credits: pack.credits,
        currency: pack.currency,
        amount: pack.priceMinor / MINOR_UNITS_PER_MAJOR,
        transactionId: event.providerPaymentId,
        paymentMethod: normalizePaymentMethod(event.paymentMethod),
        description: pack.description,
    }

    if (event.providerSessionId) {
        await Payment.updateOne(
            { providerSessionId: event.providerSessionId, userId: event.userId },
            { $set: rowUpdate },
        )
        return
    }

    await Payment.updateOne(
        { providerPaymentId: event.providerPaymentId, userId: event.userId },
        { $set: rowUpdate },
        { upsert: true },
    )
}

async function recordFailedPayment(event: ParsedWebhookEvent, pack: CreditPack) {
    const result = await User.updateOne(
        { userId: event.userId, ...noExistingPaymentGuard(event.providerPaymentId) },
        { $push: { payments: buildEmbeddedPaymentRecord(event, pack, PAYMENT_STATUS.FAILED) } },
    )

    if (result.modifiedCount > 0) {
        await syncCheckoutPaymentRow(event, pack, PAYMENT_STATUS.FAILED)
    }
}

async function grantSucceeded(event: ParsedWebhookEvent, pack: CreditPack) {
    const logCtx = webhookLogContext(event)
    const result = await User.updateOne(
        { userId: event.userId, ...completedPaymentGuard(event.providerPaymentId) },
        {
            $push: { payments: buildEmbeddedPaymentRecord(event, pack, PAYMENT_STATUS.COMPLETED) },
            $inc: { credits: pack.credits },
        },
    )

    if (result.modifiedCount === 0) {
        paymentsLogger.info(logCtx, "Duplicate webhook delivery ignored")
        return
    }

    paymentsLogger.info({ ...logCtx, credits: pack.credits }, "Payment credits granted")
    await syncCheckoutPaymentRow(event, pack, PAYMENT_STATUS.COMPLETED)
}

async function resolveWebhookGrant(
    event: NormalizedPaymentEvent,
): Promise<{ parsed: ParsedWebhookEvent; pack: CreditPack } | null> {
    const logCtx = webhookLogContext(event)

    if (!event.userId) {
        paymentsLogger.warn({ ...logCtx, reason: "missing_user_id" }, "Webhook missing userId")
        return null
    }

    const userExists = await User.exists({ userId: event.userId })
    if (!userExists) {
        paymentsLogger.warn({ ...logCtx, reason: "user_not_found" }, "Webhook user not found")
        return null
    }

    if (!event.packId) {
        paymentsLogger.warn({ ...logCtx, reason: "missing_pack_id" }, "Webhook missing packId")
        return null
    }

    const pack = getCreditPack(event.packId)
    if (!pack) {
        paymentsLogger.error(
            { ...logCtx, packId: event.packId, reason: "unknown_pack" },
            "Unknown pack",
        )
        return null
    }

    return { parsed: asParsedEvent(event), pack }
}

async function dispatchWebhookPayment(parsed: ParsedWebhookEvent, pack: CreditPack): Promise<void> {
    const amountMatches =
        parsed.amountMinor === pack.priceMinor && parsed.currency.toUpperCase() === pack.currency
    if (!amountMatches) {
        paymentsLogger.error(
            {
                ...webhookLogContext(parsed),
                packId: pack.id,
                expectedMinor: pack.priceMinor,
                receivedMinor: parsed.amountMinor,
                currency: parsed.currency,
            },
            "Webhook amount or currency mismatch",
        )
        await recordFailedPayment(parsed, pack)
        return
    }

    if (parsed.type === NORMALIZED_EVENT_TYPE.PAYMENT_FAILED) {
        await recordFailedPayment(parsed, pack)
        return
    }

    if (parsed.type === NORMALIZED_EVENT_TYPE.PAYMENT_SUCCEEDED) {
        await grantSucceeded(parsed, pack)
    }
}

/** Provider-agnostic webhook handler (idempotent credit grant). */
export async function applyEvent(event: NormalizedPaymentEvent): Promise<void> {
    const resolved = await resolveWebhookGrant(event)
    if (!resolved) {
        return
    }
    await dispatchWebhookPayment(resolved.parsed, resolved.pack)
}
