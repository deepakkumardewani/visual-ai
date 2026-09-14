import { beforeEach, describe, expect, it, vi } from "vitest"

const verify = vi.fn()
const signUpHandler = vi.fn()
const findOneAndUpdate = vi.fn()

vi.mock("svix", () => ({
    Webhook: class {
        verify = verify
    },
}))

vi.mock("../config/env.js", () => ({
    env: { WEBHOOK_SECRET: "whsec_test_secret" },
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    }),
}))

vi.mock("../services/user-service.js", () => ({
    signUpHandler,
}))

vi.mock("../models/payment.js", () => ({
    PaymentModel: class {
        constructor(doc: Record<string, unknown>) {
            Object.assign(this, doc)
        }
    },
}))

vi.mock("../models/user.js", () => ({
    UserModel: { findOneAndUpdate },
}))

function mockRes() {
    return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    }
}

function routeHandler(
    router: { stack: Array<{ route?: { path: string; stack: Array<{ handle: Function }> } }> },
    path: string,
) {
    const layer = router.stack.find((entry) => entry.route?.path === path)
    const stack = layer?.route?.stack ?? []
    return stack[stack.length - 1].handle
}

const { webhookRouter } = await import("./index.js")

describe("webhookRouter clerk", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("returns a 400 Response when Svix headers are missing", async () => {
        const handler = routeHandler(webhookRouter, "/webhooks/clerk")
        const result = await handler({ headers: {}, body: Buffer.from("{}") }, mockRes())

        expect(result).toBeInstanceOf(Response)
        expect(result.status).toBe(400)
        expect(verify).not.toHaveBeenCalled()
        expect(signUpHandler).not.toHaveBeenCalled()
    })

    it("returns 400 when signature verification fails", async () => {
        verify.mockImplementation(() => {
            throw new Error("invalid signature")
        })

        const res = mockRes()
        const handler = routeHandler(webhookRouter, "/webhooks/clerk")
        await handler(
            {
                headers: {
                    "svix-id": "msg_1",
                    "svix-timestamp": "1710000000",
                    "svix-signature": "v1,bad",
                },
                body: Buffer.from('{"type":"user.created"}'),
            },
            res,
        )

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "invalid signature",
        })
        expect(signUpHandler).not.toHaveBeenCalled()
    })

    it("verifies the payload and calls signUpHandler on success", async () => {
        const evt = { type: "user.created", data: { id: "user_abc" } }
        verify.mockReturnValue(evt)

        const res = mockRes()
        const handler = routeHandler(webhookRouter, "/webhooks/clerk")
        const payload = Buffer.from(JSON.stringify(evt))

        await handler(
            {
                headers: {
                    "svix-id": "msg_1",
                    "svix-timestamp": "1710000000",
                    "svix-signature": "v1,good",
                },
                body: payload,
            },
            res,
        )

        expect(verify).toHaveBeenCalledWith(payload, {
            "svix-id": "msg_1",
            "svix-timestamp": "1710000000",
            "svix-signature": "v1,good",
        })
        expect(signUpHandler).toHaveBeenCalledWith(evt)
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Webhook received",
        })
    })
})

describe("webhookRouter razorpay", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("ignores events that are not payment.captured", async () => {
        const res = mockRes()
        const handler = routeHandler(webhookRouter, "/webhooks/razorpay")
        const result = await handler({ body: { event: "payment.failed" } }, res)

        expect(result).toBeUndefined()
        expect(findOneAndUpdate).not.toHaveBeenCalled()
        expect(res.status).not.toHaveBeenCalled()
    })

    it("returns 404 when the paying user is missing", async () => {
        findOneAndUpdate.mockResolvedValue(null)

        const res = mockRes()
        const handler = routeHandler(webhookRouter, "/webhooks/razorpay")
        await handler(
            {
                body: {
                    event: "payment.captured",
                    payload: {
                        payment: {
                            entity: {
                                id: "pay_1",
                                amount: 50000,
                                status: "captured",
                                notes: { userId: "user_missing", credits: 20 },
                            },
                        },
                    },
                },
            },
            res,
        )

        expect(res.status).toHaveBeenCalledWith(404)
        expect(res.json).toHaveBeenCalledWith({ message: "User not found" })
    })

    it("increments credits and stores the payment on capture", async () => {
        const user = { userId: "user_1", credits: 70 }
        findOneAndUpdate.mockResolvedValue(user)

        const res = mockRes()
        const handler = routeHandler(webhookRouter, "/webhooks/razorpay")
        await handler(
            {
                body: {
                    event: "payment.captured",
                    payload: {
                        payment: {
                            entity: {
                                id: "pay_99",
                                amount: 9900,
                                status: "captured",
                                description: "Starter pack",
                                card: { entity: "credit_card" },
                                notes: { userId: "user_1", credits: 20 },
                            },
                        },
                    },
                },
            },
            res,
        )

        expect(findOneAndUpdate).toHaveBeenCalledWith(
            { userId: "user_1" },
            {
                $push: {
                    payments: expect.objectContaining({
                        amount: 99,
                        paymentMethod: "credit_card",
                        transactionId: "pay_99",
                        description: "Starter pack",
                        status: "captured",
                    }),
                },
                $inc: { credits: 20 },
            },
            { new: true },
        )
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Payment successful",
            user,
        })
    })

    it("returns 500 when updating the user fails", async () => {
        findOneAndUpdate.mockRejectedValue(new Error("mongo down"))

        const res = mockRes()
        const handler = routeHandler(webhookRouter, "/webhooks/razorpay")
        await handler(
            {
                body: {
                    event: "payment.captured",
                    payload: {
                        payment: {
                            entity: {
                                id: "pay_err",
                                amount: 100,
                                status: "captured",
                                notes: { userId: "user_1", credits: 1 },
                            },
                        },
                    },
                },
            },
            res,
        )

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" })
    })
})
