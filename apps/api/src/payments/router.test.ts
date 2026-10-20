import express, { type NextFunction, type Request, type Response } from "express"
import { beforeEach, describe, expect, it, vi } from "vitest"
import request from "supertest"

import { PAYMENTS_MESSAGES } from "./constants.js"
import { ProviderApiError, UnknownPackError } from "./errors.js"

const integrationMocks = vi.hoisted(() => ({
    providerCreateCheckout: vi.fn(),
    providerGetSessionStatus: vi.fn(),
    paymentCreate: vi.fn(),
    paymentFind: vi.fn(),
    paymentFindOne: vi.fn(),
}))

vi.mock("../config/env.js", () => ({
    env: { PAYMENT_RETURN_URL: "https://visual-ai.app/checkout/return" },
}))

vi.mock("../models/payment.js", () => ({
    PaymentModel: {
        create: integrationMocks.paymentCreate,
        find: integrationMocks.paymentFind,
        findOne: integrationMocks.paymentFindOne,
    },
}))

vi.mock("./providerFactory.js", () => ({
    getPaymentProvider: () => ({
        createCheckout: integrationMocks.providerCreateCheckout,
        getSessionStatus: integrationMocks.providerGetSessionStatus,
    }),
}))

vi.mock("./service.js", () => ({
    createCheckout: vi.fn(),
    listPaymentsForUser: vi.fn(),
    getCheckoutSessionStatus: vi.fn(),
    applyEvent: vi.fn(),
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}))

const { isHttpError, NotFoundError } = await import("../lib/errors.js")
const service = await import("./service.js")
const actualService = await vi.importActual<typeof import("./service.js")>("./service.js")
const { paymentsApiRouter } = await import("./router.js")

function createTestApp(auth?: { userId: string; email?: string }) {
    const app = express()
    app.use(express.json())
    app.use((req: Request, _res: Response, next: NextFunction) => {
        if (auth) {
            req.auth = {
                userId: auth.userId,
                sessionClaims: auth.email ? { email: auth.email } : {},
            } as Request["auth"]
        }
        next()
    })
    app.use(paymentsApiRouter)
    app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
        const statusCode = isHttpError(err) ? err.statusCode : 500
        const message = err instanceof Error ? err.message : "Internal server error"
        res.status(statusCode).json({ error: message })
    })
    return app
}

describe("paymentsApiRouter", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("POST /payments/checkout", () => {
        it("returns 401 when unauthenticated", async () => {
            const app = createTestApp()
            const res = await request(app).post("/payments/checkout").send({ packId: "pack_200" })
            expect(res.status).toBe(401)
            expect(res.body).toEqual({ message: "Unauthorized" })
            expect(service.createCheckout).not.toHaveBeenCalled()
        })

        it("returns 400 when packId is missing", async () => {
            const app = createTestApp({ userId: "user_1" })
            const res = await request(app).post("/payments/checkout").send({})
            expect(res.status).toBe(400)
            expect(res.body).toEqual({ error: "packId is required" })
        })

        it("returns 400 for unknown pack", async () => {
            vi.mocked(service.createCheckout).mockRejectedValue(new UnknownPackError("pack_999"))
            const app = createTestApp({ userId: "user_1" })
            const res = await request(app).post("/payments/checkout").send({ packId: "pack_999" })
            expect(res.status).toBe(400)
            expect(res.body.error).toContain("Unknown credit pack")
        })

        it("returns 201 with checkoutUrl and sessionId", async () => {
            vi.mocked(service.createCheckout).mockResolvedValue({
                checkoutUrl: "https://checkout.test/pay",
                sessionId: "cks_abc",
            })
            const app = createTestApp({ userId: "user_1", email: "buyer@example.com" })
            const res = await request(app).post("/payments/checkout").send({ packId: "pack_200" })
            expect(res.status).toBe(201)
            expect(res.body).toEqual({
                checkoutUrl: "https://checkout.test/pay",
                sessionId: "cks_abc",
            })
            expect(service.createCheckout).toHaveBeenCalledWith(
                "user_1",
                "pack_200",
                "buyer@example.com",
            )
        })

        it("ignores extra body fields and passes only packId to checkout", async () => {
            vi.mocked(service.createCheckout).mockResolvedValue({
                checkoutUrl: "https://checkout.test/pay",
                sessionId: "cks_extra",
            })
            const app = createTestApp({ userId: "user_1" })
            await request(app).post("/payments/checkout").send({
                packId: "pack_450",
                amount: 9999,
                credits: 9999,
                userId: "attacker",
            })
            expect(service.createCheckout).toHaveBeenCalledWith("user_1", "pack_450", undefined)
        })

        it("returns 502 with a generic message on provider failure", async () => {
            vi.mocked(service.createCheckout).mockRejectedValue(
                new ProviderApiError("upstream down"),
            )
            const app = createTestApp({ userId: "user_1" })
            const res = await request(app).post("/payments/checkout").send({ packId: "pack_200" })
            expect(res.status).toBe(502)
            expect(res.body).toEqual({ message: "Payment provider temporarily unavailable" })
        })

        it("rethrows unexpected errors to the error handler", async () => {
            vi.mocked(service.createCheckout).mockRejectedValue(new Error("database offline"))
            const app = createTestApp({ userId: "user_1" })
            const res = await request(app).post("/payments/checkout").send({ packId: "pack_200" })
            expect(res.status).toBe(500)
        })
    })

    describe("GET /payments", () => {
        it("returns 401 when unauthenticated", async () => {
            const app = createTestApp()
            const res = await request(app).get("/payments")
            expect(res.status).toBe(401)
            expect(res.body).toEqual({ message: "Unauthorized" })
        })

        it("returns caller payments newest first", async () => {
            const rows = [
                { _id: "2", userId: "user_1", createdAt: new Date("2026-02-02T00:00:00.000Z") },
                { _id: "1", userId: "user_1", createdAt: new Date("2026-02-01T00:00:00.000Z") },
            ] as unknown as Awaited<ReturnType<typeof service.listPaymentsForUser>>
            vi.mocked(service.listPaymentsForUser).mockResolvedValue(rows)
            const app = createTestApp({ userId: "user_1" })
            const res = await request(app).get("/payments")
            expect(res.status).toBe(200)
            expect(res.body).toEqual({
                payments: [
                    { _id: "2", userId: "user_1", createdAt: "2026-02-02T00:00:00.000Z" },
                    { _id: "1", userId: "user_1", createdAt: "2026-02-01T00:00:00.000Z" },
                ],
            })
            expect(service.listPaymentsForUser).toHaveBeenCalledWith("user_1")
        })
    })

    describe("GET /payments/checkout/:sessionId/status", () => {
        it("returns 401 when unauthenticated", async () => {
            const app = createTestApp()
            const res = await request(app).get("/payments/checkout/cks_1/status")
            expect(res.status).toBe(401)
            expect(res.body).toEqual({ message: "Unauthorized" })
        })

        it("returns 404 when session belongs to another user (NotFoundError from service)", async () => {
            vi.mocked(service.getCheckoutSessionStatus).mockRejectedValue(
                new NotFoundError(PAYMENTS_MESSAGES.CHECKOUT_SESSION_NOT_FOUND),
            )
            const app = createTestApp({ userId: "user_1" })
            const res = await request(app).get("/payments/checkout/cks_other/status")
            expect(res.status).toBe(404)
            expect(res.body).toEqual({
                error: "Checkout session not found",
            })
        })

        it("returns 404 when session is missing (NotFoundError from service)", async () => {
            vi.mocked(service.getCheckoutSessionStatus).mockRejectedValue(
                new NotFoundError(PAYMENTS_MESSAGES.CHECKOUT_SESSION_NOT_FOUND),
            )
            const app = createTestApp({ userId: "user_1" })
            const res = await request(app).get("/payments/checkout/cks_missing/status")
            expect(res.status).toBe(404)
            expect(res.body).toEqual({
                error: "Checkout session not found",
            })
        })

        it("returns succeeded with credits from completed DB record", async () => {
            vi.mocked(service.getCheckoutSessionStatus).mockResolvedValue({
                status: "succeeded",
                credits: 200,
            })
            const app = createTestApp({ userId: "user_1" })
            const res = await request(app).get("/payments/checkout/cks_done/status")
            expect(res.status).toBe(200)
            expect(res.body).toEqual({ status: "succeeded", credits: 200 })
        })

        it("returns pending status while checkout is open", async () => {
            vi.mocked(service.getCheckoutSessionStatus).mockResolvedValue({ status: "pending" })
            const app = createTestApp({ userId: "user_1" })
            const res = await request(app).get("/payments/checkout/cks_open/status")
            expect(res.status).toBe(200)
            expect(res.body).toEqual({ status: "pending" })
        })

        it("returns 502 on provider failure", async () => {
            vi.mocked(service.getCheckoutSessionStatus).mockRejectedValue(
                new ProviderApiError("provider timeout"),
            )
            const app = createTestApp({ userId: "user_1" })
            const res = await request(app).get("/payments/checkout/cks_1/status")
            expect(res.status).toBe(502)
            expect(res.body).toEqual({ message: "Payment provider temporarily unavailable" })
        })

        it("rethrows unexpected errors", async () => {
            vi.mocked(service.getCheckoutSessionStatus).mockRejectedValue(new Error("unexpected"))
            const app = createTestApp({ userId: "user_1" })
            const res = await request(app).get("/payments/checkout/cks_1/status")
            expect(res.status).toBe(500)
        })
    })
})

describe("payments checkout service integration", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(service.createCheckout).mockImplementation(actualService.createCheckout)
        vi.mocked(service.listPaymentsForUser).mockImplementation(actualService.listPaymentsForUser)
        vi.mocked(service.getCheckoutSessionStatus).mockImplementation(
            actualService.getCheckoutSessionStatus,
        )
        integrationMocks.paymentCreate.mockResolvedValue(undefined)
        integrationMocks.providerCreateCheckout.mockResolvedValue({
            checkoutUrl: "https://checkout.test/session",
            sessionId: "cks_catalog",
        })
    })

    it("calls the provider with catalog pack values, not client price or credits", async () => {
        await service.createCheckout("user_catalog", "pack_200", "a@b.com")
        expect(integrationMocks.providerCreateCheckout).toHaveBeenCalledWith({
            userId: "user_catalog",
            pack: expect.objectContaining({
                id: "pack_200",
                credits: 200,
                priceMinor: 13_000,
                currency: "INR",
            }),
            email: "a@b.com",
            returnUrl: "https://visual-ai.app/checkout/return",
        })
        expect(integrationMocks.paymentCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: "user_catalog",
                packId: "pack_200",
                credits: 200,
                amount: 130,
                currency: "INR",
            }),
        )
    })

    it("throws NotFoundError when session belongs to another user", async () => {
        integrationMocks.paymentFindOne.mockResolvedValue({
            userId: "user_other",
            status: "pending",
            credits: 200,
        })
        await expect(service.getCheckoutSessionStatus("user_1", "cks_other")).rejects.toMatchObject(
            {
                name: "NotFoundError",
                message: PAYMENTS_MESSAGES.CHECKOUT_SESSION_NOT_FOUND,
            },
        )
    })

    it("throws NotFoundError when session row is missing", async () => {
        integrationMocks.paymentFindOne.mockResolvedValue(null)
        await expect(
            service.getCheckoutSessionStatus("user_1", "cks_missing"),
        ).rejects.toMatchObject({
            message: PAYMENTS_MESSAGES.CHECKOUT_SESSION_NOT_FOUND,
        })
    })

    it("returns succeeded from a completed DB row without calling the provider", async () => {
        integrationMocks.providerGetSessionStatus.mockImplementation(() => {
            throw new Error("provider must not be called")
        })
        integrationMocks.paymentFindOne.mockResolvedValue({
            userId: "user_1",
            status: "completed",
            credits: 450,
        })
        const status = await service.getCheckoutSessionStatus("user_1", "cks_completed")
        expect(status).toEqual({ status: "succeeded", credits: 450 })
        expect(integrationMocks.providerGetSessionStatus).not.toHaveBeenCalled()
    })

    it("lists only the requested user payments sorted newest first", async () => {
        const sort = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([{ id: "new" }]) })
        integrationMocks.paymentFind.mockReturnValue({ sort })
        const rows = await service.listPaymentsForUser("user_list")
        expect(integrationMocks.paymentFind).toHaveBeenCalledWith({ userId: "user_list" })
        expect(sort).toHaveBeenCalledWith({ createdAt: -1 })
        expect(rows).toEqual([{ id: "new" }])
    })
})
