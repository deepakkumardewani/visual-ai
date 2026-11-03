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

type StoredUser = {
    userId: string
    plan: string
    subscription: Record<string, unknown>
}

/** Minimal in-memory stand-in for the one User.updateOne shape the subscription path issues. */
const db = vi.hoisted(() => {
    const state = {
        user: null as null | {
            userId: string
            plan: string
            subscription: Record<string, unknown>
        },
    }

    function get(field: string): unknown {
        return state.user!.subscription[field.replace("subscription.", "")]
    }

    function matches(clause: Record<string, unknown>): boolean {
        if ("$or" in clause) {
            return (clause.$or as Record<string, unknown>[]).some(matches)
        }
        return Object.entries(clause).every(([field, cond]) => {
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

    async function updateOne(
        filter: { userId: string; $and: Record<string, unknown>[] },
        update: { $set: Record<string, unknown> },
    ) {
        const user = state.user
        if (!user || user.userId !== filter.userId || !filter.$and.every(matches)) {
            return { modifiedCount: 0 }
        }
        for (const [path, value] of Object.entries(update.$set)) {
            if (path === "plan") {
                user.plan = value as string
            } else {
                user.subscription[path.replace("subscription.", "")] = value
            }
        }
        return { modifiedCount: 1 }
    }

    return { state, updateOne }
})

vi.mock("../models/user.js", () => ({ UserModel: { updateOne: db.updateOne } }))
vi.mock("../models/payment.js", () => ({ PaymentModel: {} }))

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

describe("subscription webhook lifecycle (signed payload through router, adapter and service)", () => {
    beforeEach(() => {
        db.state.user = { userId: "user_1", plan: "free", subscription: {} }
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

        expect(user()).toEqual({ userId: "user_1", plan: "free", subscription: {} })
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
