import crypto from "crypto"
import express from "express"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { WEBHOOK_HEADERS } from "./constants.js"

const WEBHOOK_SECRET = vi.hoisted(
    () => "whsec_" + Buffer.from("lifecycle-webhook-key-material").toString("base64"),
)

const mockEnv = vi.hoisted(() => ({
    DODO_PAYMENTS_API_KEY: "sk_test_placeholder",
    DODO_PAYMENTS_ENVIRONMENT: "test_mode" as const,
    DODO_PAYMENTS_WEBHOOK_KEY: WEBHOOK_SECRET,
    DODO_PRODUCT_ID_PACK_200: "pdt_200",
    DODO_PRODUCT_ID_PACK_450: "pdt_450",
    DODO_PRODUCT_ID_PACK_960: "pdt_960",
    DODO_PRODUCT_ID_PACK_2000: "pdt_2000",
}))

vi.mock("../config/env.js", () => ({ env: mockEnv }))
vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}))

type EmbeddedPayment = { providerPaymentId: string; status: string }

type StoredUser = {
    userId: string
    plan: string
    dailyCredits: number
    credits: number
    payments: EmbeddedPayment[]
    subscription: Record<string, unknown>
}

type Clause = Record<string, unknown>
type UserUpdate = {
    $set?: Record<string, unknown>
    $max?: Record<string, number>
    $inc?: Record<string, number>
    $push?: { payments: EmbeddedPayment }
}

/** Minimal in-memory stand-in for the User.updateOne filter and update operators the webhook path issues. */
const db = vi.hoisted(() => {
    const state = {
        user: null as null | StoredUser,
        paymentRowUpdates: [] as unknown[],
    }

    function get(field: string): unknown {
        return state.user!.subscription[field.replace("subscription.", "")]
    }

    function matchesPayments(cond: { $not: { $elemMatch: Record<string, unknown> } }): boolean {
        const probe = cond.$not.$elemMatch
        return !state.user!.payments.some((row) =>
            Object.entries(probe).every(([key, value]) => (row as never)[key] === value),
        )
    }

    function matches(clause: Clause): boolean {
        if ("$or" in clause) {
            return (clause.$or as Clause[]).some(matches)
        }
        return Object.entries(clause).every(([field, cond]) => {
            if (field === "payments") {
                return matchesPayments(cond as never)
            }
            const value = get(field)
            if (cond && typeof cond === "object" && "$exists" in cond) {
                return (value !== undefined) === (cond as { $exists: boolean }).$exists
            }
            if (cond && typeof cond === "object" && "$lt" in cond) {
                return value instanceof Date && value < (cond as { $lt: Date }).$lt
            }
            return value === cond
        })
    }

    function applySet(user: StoredUser, set: Record<string, unknown>) {
        for (const [path, value] of Object.entries(set)) {
            if (path === "plan") {
                user.plan = value as string
            } else {
                user.subscription[path.replace("subscription.", "")] = value
            }
        }
    }

    async function updateOne(
        filter: { userId: string; $and?: Clause[]; payments?: unknown },
        update: UserUpdate,
    ) {
        const user = state.user
        const { userId, $and = [], ...rest } = filter
        const guards = [...$and, ...Object.entries(rest).map(([k, v]) => ({ [k]: v }))]
        if (!user || user.userId !== userId || !guards.every(matches)) {
            return { modifiedCount: 0 }
        }
        applySet(user, update.$set ?? {})
        if (update.$max?.dailyCredits !== undefined) {
            user.dailyCredits = Math.max(user.dailyCredits, update.$max.dailyCredits)
        }
        user.credits += update.$inc?.credits ?? 0
        if (update.$push) {
            user.payments.push(update.$push.payments)
        }
        return { modifiedCount: 1 }
    }

    async function exists(filter: { userId: string }) {
        return state.user?.userId === filter.userId ? { _id: "u" } : null
    }

    async function paymentRowUpdate(...args: unknown[]) {
        state.paymentRowUpdates.push(args)
        return { modifiedCount: 1 }
    }

    return { state, updateOne, exists, paymentRowUpdate }
})

vi.mock("../models/user.js", () => ({
    UserModel: { updateOne: db.updateOne, exists: db.exists },
}))
vi.mock("../models/payment.js", () => ({ PaymentModel: { updateOne: db.paymentRowUpdate } }))

const { createDodoPaymentProvider } = await import("./dodo/adapter.js")
const provider = createDodoPaymentProvider()
vi.mock("./providerFactory.js", () => ({ getPaymentProvider: () => provider }))

const { paymentsWebhookRouter } = await import("./webhookRouter.js")

const app = express()
app.use(paymentsWebhookRouter)

function sign(body: string, id: string, secret = WEBHOOK_SECRET) {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const key = Buffer.from(secret.slice("whsec_".length), "base64")
    const digest = crypto
        .createHmac("sha256", new Uint8Array(key))
        .update(`${id}.${timestamp}.${body}`)
        .digest("base64")
    return {
        [WEBHOOK_HEADERS.ID]: id,
        [WEBHOOK_HEADERS.TIMESTAMP]: timestamp,
        [WEBHOOK_HEADERS.SIGNATURE]: `v1,${digest}`,
    }
}

type SubEventOptions = { id: string; type: string; at: string; subscriptionId?: string }

function send(
    { id, type, at, subscriptionId = "sub_1" }: SubEventOptions,
    secret = WEBHOOK_SECRET,
) {
    const body = JSON.stringify({
        type,
        timestamp: at,
        business_id: "biz_1",
        data: {
            subscription_id: subscriptionId,
            next_billing_date: "2026-05-01T00:00:00.000Z",
            metadata: { userId: "user_1" },
        },
    })
    return request(app)
        .post("/webhooks/payments")
        .set("content-type", "application/json")
        .set(sign(body, id, secret))
        .send(body)
}

const user = (): StoredUser => db.state.user!

function freshUser(overrides: Partial<StoredUser> = {}): StoredUser {
    return {
        userId: "user_1",
        plan: "free",
        dailyCredits: 30,
        credits: 0,
        payments: [],
        subscription: {},
        ...overrides,
    }
}

describe("subscription webhook lifecycle (signed payload through router, adapter and service)", () => {
    beforeEach(() => {
        db.state.user = freshUser()
        db.state.paymentRowUpdates = []
    })

    it("walks active, renewed, cancelled and expired", async () => {
        await send({
            id: "m1",
            type: "subscription.active",
            at: "2026-04-01T10:00:00.000Z",
        }).expect(200)
        expect(user()).toMatchObject({
            plan: "pro",
            subscription: {
                status: "active",
                providerSubscriptionId: "sub_1",
                currentPeriodEnd: new Date("2026-05-01T00:00:00.000Z"),
                cancelAtPeriodEnd: false,
            },
        })

        await send({
            id: "m2",
            type: "subscription.renewed",
            at: "2026-05-01T10:00:00.000Z",
        }).expect(200)
        expect(user().subscription.lastEventAt).toEqual(new Date("2026-05-01T10:00:00.000Z"))

        await send({
            id: "m3",
            type: "subscription.cancelled",
            at: "2026-05-02T10:00:00.000Z",
        }).expect(200)
        expect(user()).toMatchObject({
            plan: "pro",
            subscription: { status: "cancelled", cancelAtPeriodEnd: true },
        })

        await send({
            id: "m4",
            type: "subscription.expired",
            at: "2026-06-01T10:00:00.000Z",
        }).expect(200)
        expect(user()).toMatchObject({ plan: "free", subscription: { status: "expired" } })
    })

    it("marks past_due on a failed renewal while keeping Pro", async () => {
        await send({ id: "m1", type: "subscription.active", at: "2026-04-01T10:00:00.000Z" })
        await send({
            id: "m2",
            type: "subscription.on_hold",
            at: "2026-05-01T10:00:00.000Z",
        }).expect(200)

        expect(user()).toMatchObject({ plan: "pro", subscription: { status: "past_due" } })
    })

    it("treats a re-delivered event as a no-op", async () => {
        await send({ id: "m1", type: "subscription.active", at: "2026-04-01T10:00:00.000Z" })
        await send({ id: "m2", type: "subscription.cancelled", at: "2026-04-02T10:00:00.000Z" })
        const afterCancel = structuredClone(user())

        await send({
            id: "m1",
            type: "subscription.active",
            at: "2026-04-01T10:00:00.000Z",
        }).expect(200)

        expect(user()).toEqual(afterCancel)
    })

    it("ignores an out-of-order older event after a newer one", async () => {
        await send({ id: "m1", type: "subscription.active", at: "2026-04-01T10:00:00.000Z" })
        await send({ id: "m3", type: "subscription.expired", at: "2026-06-01T10:00:00.000Z" })

        await send({
            id: "m2",
            type: "subscription.renewed",
            at: "2026-05-01T10:00:00.000Z",
        }).expect(200)

        expect(user()).toMatchObject({ plan: "free", subscription: { status: "expired" } })
    })

    it("ignores lifecycle events for a different subscription than the stored one", async () => {
        await send({ id: "m1", type: "subscription.active", at: "2026-04-01T10:00:00.000Z" })

        await send({
            id: "m2",
            type: "subscription.expired",
            at: "2026-05-01T10:00:00.000Z",
            subscriptionId: "sub_other",
        }).expect(200)

        expect(user()).toMatchObject({ plan: "pro", subscription: { status: "active" } })
    })

    it("lets a new activation replace the stored subscription", async () => {
        await send({ id: "m1", type: "subscription.expired", at: "2026-04-01T10:00:00.000Z" })

        await send({
            id: "m2",
            type: "subscription.active",
            at: "2026-05-01T10:00:00.000Z",
            subscriptionId: "sub_new",
        }).expect(200)

        expect(user()).toMatchObject({
            plan: "pro",
            subscription: { providerSubscriptionId: "sub_new", status: "active" },
        })
    })

    it("acknowledges unknown subscription events without changing the user", async () => {
        await send({
            id: "m1",
            type: "subscription.plan_changed",
            at: "2026-04-01T10:00:00.000Z",
        }).expect(200)

        expect(user()).toEqual(freshUser())
    })

    it("rejects a payload signed with the wrong secret and leaves the user untouched", async () => {
        const wrong = "whsec_" + Buffer.from("some-other-key-material-here").toString("base64")

        await send(
            { id: "m1", type: "subscription.active", at: "2026-04-01T10:00:00.000Z" },
            wrong,
        ).expect(401)

        expect(user().plan).toBe("free")
    })
})

describe("subscription top-up of the daily balance (webhook level)", () => {
    const activate = (id: string, at: string, subscriptionId = "sub_1") =>
        send({ id, type: "subscription.active", at, subscriptionId }).expect(200)

    beforeEach(() => {
        db.state.user = freshUser({ dailyCredits: 12 })
    })

    it("raises a balance of 12 to the Pro allowance of 50 on activation", async () => {
        await activate("m1", "2026-04-01T10:00:00.000Z")

        expect(user().dailyCredits).toBe(50)
    })

    it("leaves a balance above the allowance (80) untouched on activation", async () => {
        db.state.user = freshUser({ dailyCredits: 80 })

        await activate("m1", "2026-04-01T10:00:00.000Z")

        expect(user()).toMatchObject({ plan: "pro", dailyCredits: 80 })
    })

    it("does not top up again when the same event is replayed after spending", async () => {
        await activate("m1", "2026-04-01T10:00:00.000Z")
        user().dailyCredits = 20

        await activate("m1", "2026-04-01T10:00:00.000Z")

        expect(user().dailyCredits).toBe(20)
    })

    it("does not top up on renewal", async () => {
        await activate("m1", "2026-04-01T10:00:00.000Z")
        user().dailyCredits = 20

        await send({
            id: "m2",
            type: "subscription.renewed",
            at: "2026-05-01T10:00:00.000Z",
        }).expect(200)

        expect(user().dailyCredits).toBe(20)
    })

    it("leaves the balance alone on expiry", async () => {
        await activate("m1", "2026-04-01T10:00:00.000Z")
        user().dailyCredits = 20

        await send({
            id: "m2",
            type: "subscription.expired",
            at: "2026-04-01T12:00:00.000Z",
        }).expect(200)

        expect(user()).toMatchObject({ plan: "free", dailyCredits: 20 })
    })

    it("tops up again on a same-day cancel, expire and re-subscribe", async () => {
        await activate("m1", "2026-04-01T09:00:00.000Z")
        user().dailyCredits = 5
        await send({ id: "m2", type: "subscription.cancelled", at: "2026-04-01T10:00:00.000Z" })
        await send({ id: "m3", type: "subscription.expired", at: "2026-04-01T11:00:00.000Z" })
        expect(user().dailyCredits).toBe(5)

        await activate("m4", "2026-04-01T12:00:00.000Z", "sub_2")

        expect(user()).toMatchObject({
            plan: "pro",
            dailyCredits: 50,
            subscription: { providerSubscriptionId: "sub_2" },
        })
    })
})

describe("credit pack payment webhooks (signed payload through router and service)", () => {
    const PACK_200_PRICE_MINOR = 13_000
    const PACK_200_CREDITS = 200

    beforeEach(() => {
        db.state.user = freshUser()
        db.state.paymentRowUpdates = []
    })

    function sendPayment(overrides: {
        id: string
        type: string
        paymentId?: string
        amount?: number
        currency?: string
        sessionId?: string
        method?: string
        metadata?: Record<string, string>
    }) {
        const {
            id,
            type,
            paymentId = "pay_1",
            amount = PACK_200_PRICE_MINOR,
            currency = "INR",
            sessionId,
            method,
            metadata = { userId: "user_1", packId: "pack_200" },
        } = overrides
        const body = JSON.stringify({
            type,
            timestamp: "2026-04-01T10:00:00.000Z",
            business_id: "biz_1",
            data: {
                payment_id: paymentId,
                total_amount: amount,
                currency,
                checkout_session_id: sessionId,
                payment_method: method,
                metadata,
            },
        })
        return request(app)
            .post("/webhooks/payments")
            .set("content-type", "application/json")
            .set(sign(body, id))
            .send(body)
    }

    it("grants the pack once and ignores a replay of the same payment", async () => {
        await sendPayment({ id: "p1", type: "payment.succeeded", sessionId: "cks_1" }).expect(200)
        await sendPayment({ id: "p2", type: "payment.succeeded", sessionId: "cks_1" }).expect(200)

        expect(user().credits).toBe(PACK_200_CREDITS)
        expect(user().payments).toHaveLength(1)
        expect(db.state.paymentRowUpdates).toHaveLength(1)
    })

    it("syncs by payment id when the event carries no checkout session", async () => {
        await sendPayment({ id: "p1", type: "payment.succeeded", method: "UPI Collect" }).expect(
            200,
        )

        expect(db.state.paymentRowUpdates).toEqual([
            [
                { providerPaymentId: "pay_1", userId: "user_1" },
                expect.objectContaining({
                    $set: expect.objectContaining({ paymentMethod: "upi" }),
                }),
                { upsert: true },
            ],
        ])
    })

    it("records a failed payment without granting credits", async () => {
        await sendPayment({ id: "p1", type: "payment.failed", method: "credit_card" }).expect(200)

        expect(user().credits).toBe(0)
        expect(user().payments).toMatchObject([{ providerPaymentId: "pay_1", status: "failed" }])
    })

    it("withholds credits and records a failure when the amount does not match the pack", async () => {
        await sendPayment({ id: "p1", type: "payment.succeeded", amount: 1 }).expect(200)

        expect(user().credits).toBe(0)
        expect(user().payments).toMatchObject([{ status: "failed" }])
    })

    it("acknowledges a payment for an unknown user without granting", async () => {
        db.state.user = freshUser({ userId: "someone_else" })

        await sendPayment({ id: "p1", type: "payment.succeeded" }).expect(200)

        expect(user().credits).toBe(0)
    })

    it.each([
        ["no userId", { packId: "pack_200" }],
        ["no packId", { userId: "user_1" }],
        ["an unknown packId", { userId: "user_1", packId: "pack_missing" }],
    ])("acknowledges a payment with %s without granting or recording", async (_label, metadata) => {
        await sendPayment({ id: "p1", type: "payment.succeeded", metadata }).expect(200)

        expect(user().credits).toBe(0)
        expect(user().payments).toEqual([])
    })
})
