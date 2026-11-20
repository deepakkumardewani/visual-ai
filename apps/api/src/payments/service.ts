import {
    DAILY_CREDITS,
    getCreditPack,
    PLAN,
    SUBSCRIPTION_STATUS,
    type CreditPack,
} from "@visual-ai/shared"
import moment from "moment"

import { env } from "../config/env.js"
import { NotFoundError } from "../lib/errors.js"
import { isPro } from "../lib/isPro.js"
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
    SUBSCRIPTION_EVENT_TYPE,
    type CheckoutSessionStatus,
} from "./constants.js"
import { type ParsedWebhookEvent } from "./dodo/eventMapper.js"
import { AlreadySubscribedError, asProviderApiError, UnknownPackError } from "./errors.js"
import { getPaymentProvider } from "./providerFactory.js"
import type {
    NormalizedPaymentEvent,
    NormalizedSubscriptionEvent,
    NormalizedWebhookEvent,
} from "./types.js"

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

/** Blocks a second subscription while one is active and not set to cancel. */
async function assertNotActivelySubscribed(userId: string): Promise<void> {
    const user = await User.findOne({ userId }).select("plan subscription").lean()
    const subscription = user?.subscription
    const hasLiveSubscription =
        isPro(user) &&
        subscription?.status === SUBSCRIPTION_STATUS.ACTIVE &&
        !subscription.cancelAtPeriodEnd
    if (hasLiveSubscription) {
        throw new AlreadySubscribedError()
    }
}

export async function createSubscriptionCheckout(
    userId: string,
    email?: string,
): Promise<{ checkoutUrl: string; sessionId: string }> {
    await assertNotActivelySubscribed(userId)

    try {
        return await getPaymentProvider().createSubscriptionCheckout({
            userId,
            email,
            returnUrl: env.PAYMENT_RETURN_URL as string,
        })
    } catch (error) {
        throw asProviderApiError(error, PAYMENTS_MESSAGES.PROVIDER_REQUEST_FAILED)
    }
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

type SubscriptionPatch = Record<string, unknown>

function isSubscriptionEvent(event: NormalizedWebhookEvent): event is NormalizedSubscriptionEvent {
    return (Object.values(SUBSCRIPTION_EVENT_TYPE) as string[]).includes(event.type)
}

/** Builds the `$set` for one lifecycle event; `plan` access follows `isPro`, which reads status and period end. */
function buildSubscriptionPatch(event: NormalizedSubscriptionEvent): SubscriptionPatch {
    const base: SubscriptionPatch = {
        "subscription.providerSubscriptionId": event.providerSubscriptionId,
        "subscription.lastEventAt": event.occurredAt,
    }

    switch (event.type) {
        case SUBSCRIPTION_EVENT_TYPE.ACTIVATED:
        case SUBSCRIPTION_EVENT_TYPE.RENEWED:
            return {
                ...base,
                plan: PLAN.PRO,
                "subscription.status": SUBSCRIPTION_STATUS.ACTIVE,
                "subscription.currentPeriodEnd": event.currentPeriodEnd,
                "subscription.cancelAtPeriodEnd": false,
            }
        case SUBSCRIPTION_EVENT_TYPE.CANCELLED:
            // Period end is deliberately untouched: Pro lasts until the already-paid term ends.
            return {
                ...base,
                "subscription.status": SUBSCRIPTION_STATUS.CANCELLED,
                "subscription.cancelAtPeriodEnd": true,
            }
        case SUBSCRIPTION_EVENT_TYPE.PAYMENT_FAILED:
            return { ...base, "subscription.status": SUBSCRIPTION_STATUS.PAST_DUE }
        case SUBSCRIPTION_EVENT_TYPE.EXPIRED:
            return {
                ...base,
                plan: PLAN.FREE,
                "subscription.status": SUBSCRIPTION_STATUS.EXPIRED,
                "subscription.cancelAtPeriodEnd": false,
            }
    }
}

/**
 * ACTIVATED tops the daily balance up to the Pro allowance once (`$max` never lowers a higher
 * balance); RENEWED and EXPIRED leave it alone. Replays are dropped by `staleEventClause`.
 */
function buildSubscriptionUpdate(event: NormalizedSubscriptionEvent) {
    const update: Record<string, unknown> = { $set: buildSubscriptionPatch(event) }
    if (event.type === SUBSCRIPTION_EVENT_TYPE.ACTIVATED) {
        update.$max = { dailyCredits: DAILY_CREDITS.pro }
    }
    return update
}

/**
 * Only a new subscription may replace the stored one; every other event must target the stored
 * subscription (or fill an empty slot when it arrived before its activation).
 */
function subscriptionOwnerClauses(event: NormalizedSubscriptionEvent) {
    if (event.type === SUBSCRIPTION_EVENT_TYPE.ACTIVATED) {
        return []
    }
    return [
        {
            $or: [
                { "subscription.providerSubscriptionId": event.providerSubscriptionId },
                { "subscription.providerSubscriptionId": { $exists: false } },
            ],
        },
    ]
}

/** Drops duplicate and out-of-order deliveries by provider timestamp. */
function staleEventClause(event: NormalizedSubscriptionEvent) {
    return {
        $or: [
            { "subscription.lastEventAt": { $exists: false } },
            { "subscription.lastEventAt": { $lt: event.occurredAt } },
        ],
    }
}

async function applySubscriptionEvent(event: NormalizedSubscriptionEvent): Promise<void> {
    const logCtx = {
        webhookId: event.providerEventId,
        subscriptionId: event.providerSubscriptionId,
        userId: event.userId,
        type: event.type,
    }

    if (!event.userId) {
        paymentsLogger.warn({ ...logCtx, reason: "missing_user_id" }, "Webhook missing userId")
        return
    }

    const result = await User.updateOne(
        {
            userId: event.userId,
            $and: [...subscriptionOwnerClauses(event), staleEventClause(event)],
        },
        buildSubscriptionUpdate(event),
    )

    if (result.modifiedCount === 0) {
        paymentsLogger.info(logCtx, "Subscription event ignored (stale, duplicate or no user)")
        return
    }
    paymentsLogger.info(logCtx, "Subscription event applied")
}

/** Provider-agnostic webhook handler (idempotent credit grant and subscription lifecycle). */
export async function applyEvent(event: NormalizedWebhookEvent): Promise<void> {
    if (isSubscriptionEvent(event)) {
        await applySubscriptionEvent(event)
        return
    }
    const resolved = await resolveWebhookGrant(event)
    if (!resolved) {
        return
    }
    await dispatchWebhookPayment(resolved.parsed, resolved.pack)
}
