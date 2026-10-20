import express from "express"
import { beforeEach, describe, expect, it, vi } from "vitest"
import request from "supertest"

import { InvalidSignatureError } from "./errors.js"
import { PAYMENTS_WEBHOOK_BODY_LIMIT_BYTES } from "./dodo/constants.js"

const mockProvider = vi.hoisted(() => ({
    verifyAndParseWebhook: vi.fn(),
}))

const applyEvent = vi.hoisted(() => vi.fn())

vi.mock("./providerFactory.js", () => ({
    getPaymentProvider: () => mockProvider,
}))

vi.mock("./service.js", () => ({
    applyEvent,
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}))

const { paymentsWebhookRouter } = await import("./webhookRouter.js")

function createWebhookApp() {
    const app = express()
    app.use(paymentsWebhookRouter)
    return app
}

describe("paymentsWebhookRouter", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("returns 200 and applies the event once for a valid signed payload", async () => {
        const event = {
            providerEventId: "wh_1",
            type: "payment.succeeded" as const,
            providerPaymentId: "pay_router",
            userId: "user_1",
            packId: "pack_200",
            amountMinor: 13_000,
            currency: "INR",
            occurredAt: new Date(),
        }
        mockProvider.verifyAndParseWebhook.mockReturnValue(event)
        applyEvent.mockResolvedValue(undefined)

        const app = createWebhookApp()
        const body = JSON.stringify({ type: "payment.succeeded" })
        const res1 = await request(app)
            .post("/webhooks/payments")
            .set("content-type", "application/json")
            .send(body)
        const res2 = await request(app)
            .post("/webhooks/payments")
            .set("content-type", "application/json")
            .send(body)

        expect(res1.status).toBe(200)
        expect(res2.status).toBe(200)
        expect(applyEvent).toHaveBeenCalledTimes(2)
        expect(applyEvent).toHaveBeenCalledWith(event)
    })

    it("returns 401 and skips applyEvent when signature verification fails", async () => {
        mockProvider.verifyAndParseWebhook.mockImplementation(() => {
            throw new InvalidSignatureError()
        })

        const app = createWebhookApp()
        const res = await request(app)
            .post("/webhooks/payments")
            .set("content-type", "application/json")
            .send("{}")

        expect(res.status).toBe(401)
        expect(applyEvent).not.toHaveBeenCalled()
    })

    it("returns 200 for unknown events without calling applyEvent", async () => {
        mockProvider.verifyAndParseWebhook.mockReturnValue(null)

        const app = createWebhookApp()
        const res = await request(app)
            .post("/webhooks/payments")
            .set("content-type", "application/json")
            .send("{}")

        expect(res.status).toBe(200)
        expect(res.body).toEqual({ received: true })
        expect(applyEvent).not.toHaveBeenCalled()
    })

    it("returns 413 when the raw body exceeds the configured limit", async () => {
        const app = createWebhookApp()
        const payloadSize = PAYMENTS_WEBHOOK_BODY_LIMIT_BYTES + 32
        const res = await request(app)
            .post("/webhooks/payments")
            .set("content-type", "application/json")
            .send("x".repeat(payloadSize))

        expect(res.status).toBe(413)
        expect(applyEvent).not.toHaveBeenCalled()
    })

    it("treats a non-buffer request body as empty when invoking the handler", async () => {
        mockProvider.verifyAndParseWebhook.mockReturnValue(null)

        type RouteLayer = {
            route?: { path: string; stack: Array<{ handle: (...args: unknown[]) => unknown }> }
        }
        const postLayer = (paymentsWebhookRouter.stack as RouteLayer[]).find(
            (layer) => layer.route?.path === "/webhooks/payments",
        )
        const asyncHandler = postLayer?.route?.stack.at(-1)?.handle as (
            req: express.Request,
            res: express.Response,
        ) => Promise<void>

        const req = {
            body: { alreadyParsed: true },
            headers: {},
        } as express.Request
        const json = vi.fn()
        const status = vi.fn().mockReturnValue({ json })
        const res = { status } as unknown as express.Response

        await asyncHandler(req, res)

        expect(mockProvider.verifyAndParseWebhook).toHaveBeenCalledWith(
            Buffer.from(""),
            req.headers,
        )
        expect(status).toHaveBeenCalledWith(200)
    })

    it("returns 500 when verification throws a non-signature error", async () => {
        mockProvider.verifyAndParseWebhook.mockImplementation(() => {
            throw new Error("provider unavailable")
        })

        const app = createWebhookApp()
        const res = await request(app)
            .post("/webhooks/payments")
            .set("content-type", "application/json")
            .send("{}")

        expect(res.status).toBe(500)
        expect(applyEvent).not.toHaveBeenCalled()
    })

    it("passes non-payload-size parser errors to next", () => {
        type ErrorMiddleware = (
            err: unknown,
            req: express.Request,
            res: express.Response,
            next: express.NextFunction,
        ) => void

        const errMiddleware = paymentsWebhookRouter.stack
            .map((layer) => layer.handle)
            .find((handle) => handle.length === 4) as ErrorMiddleware | undefined

        expect(errMiddleware).toBeDefined()

        const req = {} as express.Request
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        } as unknown as express.Response
        const next = vi.fn()

        errMiddleware!(new Error("unexpected parser failure"), req, res, next)

        expect(res.status).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.any(Error))
    })

    it("returns 500 when applyEvent throws a transient database error", async () => {
        mockProvider.verifyAndParseWebhook.mockReturnValue({
            providerEventId: "wh_db",
            type: "payment.succeeded",
            providerPaymentId: "pay_db",
            userId: "user_1",
            packId: "pack_200",
            amountMinor: 13_000,
            currency: "INR",
            occurredAt: new Date(),
        })
        applyEvent.mockRejectedValue(new Error("mongo down"))

        const app = createWebhookApp()
        const res = await request(app)
            .post("/webhooks/payments")
            .set("content-type", "application/json")
            .send("{}")

        expect(res.status).toBe(500)
    })
})
