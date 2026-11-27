import {
    DAILY_CREDITS,
    getCreditPack,
    PLAN,
    SUBSCRIPTION_STATUS,
    type PackCurrency,
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
import { packCharge, resolveWebhookCharge, type PackCharge } from "./packCharge.js"
import { getPaymentProvider } from "./providerFactory.js"
import type {
    NormalizedPaymentEvent,
    NormalizedSubscriptionEvent,
    NormalizedWebhookEvent,
} from "./types.js"

const paymentsLogger = createLogger("payments-service")

export interface CreateCheckoutInput {
    userId: string
    packId: string
    /** Decided server-side from the buyer's country; never a client value. */
    currency: PackCurrency
    email?: string
}

export async function createCheckout({
    userId,
    packId,
    currency,
    email,
}: CreateCheckoutInput): Promise<{ checkoutUrl: string; sessionId: string }> {
    const pack = getCreditPack(packId)
    if (!pack) {
        throw new UnknownPackError(packId)
    }
    const charge = packCharge(pack, currency)

    const provider = getPaymentProvider()
    let checkout: { checkoutUrl: string; sessionId: string }
    try {
        checkout = await provider.createCheckout({
            userId,
            pack,
            currency,
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
        packId: charge.packId,
        credits: charge.credits,
        currency: charge.currency,
        amount: charge.amountMinor / MINOR_UNITS_PER_MAJOR,
        status: PAYMENT_STATUS.PENDING,
        transactionId: checkout.sessionId,
        paymentMethod: "other",
        description: charge.description,
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
    charge: PackCharge,
    status: typeof PAYMENT_STATUS.COMPLETED | typeof PAYMENT_STATUS.FAILED,
) {
    return {
        userId: event.userId,
        provider: PAYMENT_PROVIDER_DODO,
        providerPaymentId: event.providerPaymentId,
        providerSessionId: event.providerSessionId ?? undefined,
        packId: charge.packId,
        credits: charge.credits,
        currency: charge.currency,
        amount: charge.amountMinor / MINOR_UNITS_PER_MAJOR,
        status,
        transactionId: event.providerPaymentId,
        paymentMethod: normalizePaymentMethod(event.paymentMethod),
        description: charge.description,
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
    charge: PackCharge,
    status: typeof PAYMENT_STATUS.COMPLETED | typeof PAYMENT_STATUS.FAILED,
) {
    const rowUpdate = {
        status,
        provider: PAYMENT_PROVIDER_DODO,
        providerPaymentId: event.providerPaymentId,
        packId: charge.packId,
        credits: charge.credits,
        currency: charge.currency,
        amount: charge.amountMinor / MINOR_UNITS_PER_MAJOR,
        transactionId: event.providerPaymentId,
        paymentMethod: normalizePaymentMethod(event.paymentMethod),
        description: charge.description,
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

async function recordFailedPayment(event: ParsedWebhookEvent, charge: PackCharge) {
    const result = await User.updateOne(
        { userId: event.userId, ...noExistingPaymentGuard(event.providerPaymentId) },
        { $push: { payments: buildEmbeddedPaymentRecord(event, charge, PAYMENT_STATUS.FAILED) } },
    )

    if (result.modifiedCount > 0) {
        await syncCheckoutPaymentRow(event, charge, PAYMENT_STATUS.FAILED)
    }
}

async function grantSucceeded(event: ParsedWebhookEvent, charge: PackCharge) {
    const logCtx = webhookLogContext(event)
    const result = await User.updateOne(
        { userId: event.userId, ...completedPaymentGuard(event.providerPaymentId) },
        {
            $push: {
                payments: buildEmbeddedPaymentRecord(event, charge, PAYMENT_STATUS.COMPLETED),
            },
            $inc: { credits: charge.credits },
        },
    )

    if (result.modifiedCount === 0) {
        paymentsLogger.info(logCtx, "Duplicate webhook delivery ignored")
        return
    }

    paymentsLogger.info({ ...logCtx, credits: charge.credits }, "Payment credits granted")
    await syncCheckoutPaymentRow(event, charge, PAYMENT_STATUS.COMPLETED)
}

async function resolveWebhookGrant(
    event: NormalizedPaymentEvent,
): Promise<{ parsed: ParsedWebhookEvent; charge: PackCharge } | null> {
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

    const charge = resolveWebhookCharge(event.packId, event.checkoutCurrency)
    if (!charge) {
        paymentsLogger.error(
            {
                ...logCtx,
                packId: event.packId,
                checkoutCurrency: event.checkoutCurrency,
                reason: "unknown_pack",
            },
            "Unknown pack or checkout currency",
        )
        return null
    }

    return { parsed: asParsedEvent(event), charge }
}

/**
 * The paid total must be the checkout's pack price in the checkout's currency. Tax may sit on top
 * (tax-exclusive product) or inside it (tax-inclusive), so either the total or the pre-tax amount
 * may equal the price.
 */
function chargeMatches(event: NormalizedPaymentEvent, charge: PackCharge): boolean {
    if (event.currency.toUpperCase() !== charge.currency) {
        return false
    }
    const preTaxMinor = event.amountMinor - event.taxMinor
    return event.amountMinor === charge.amountMinor || preTaxMinor === charge.amountMinor
}

async function dispatchWebhookPayment(
    parsed: ParsedWebhookEvent,
    charge: PackCharge,
): Promise<void> {
    if (!chargeMatches(parsed, charge)) {
        paymentsLogger.error(
            {
                ...webhookLogContext(parsed),
                packId: charge.packId,
                expectedMinor: charge.amountMinor,
                expectedCurrency: charge.currency,
                receivedMinor: parsed.amountMinor,
                receivedTaxMinor: parsed.taxMinor,
                currency: parsed.currency,
            },
            "Webhook amount or currency mismatch",
        )
        await recordFailedPayment(parsed, charge)
        return
    }

    if (parsed.type === NORMALIZED_EVENT_TYPE.PAYMENT_FAILED) {
        await recordFailedPayment(parsed, charge)
        return
    }

    if (parsed.type === NORMALIZED_EVENT_TYPE.PAYMENT_SUCCEEDED) {
        await grantSucceeded(parsed, charge)
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
    await dispatchWebhookPayment(resolved.parsed, resolved.charge)
}
