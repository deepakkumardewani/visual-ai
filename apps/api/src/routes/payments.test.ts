import crypto from "crypto"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { env } from "../config/env.js"

const razorpayOrdersCreate = vi.hoisted(() => vi.fn())
const Payment = vi.hoisted(() => ({
    find: vi.fn(),
    findById: vi.fn(),
}))

vi.mock("razorpay", () => ({
    default: class Razorpay {
        orders = { create: razorpayOrdersCreate }
    },
}))

vi.mock("../models/payment.js", () => ({
    PaymentModel: Payment,
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}))

const { paymentsRoute } = await import("./payments.js")

function mockRes() {
    return {
        statusCode: 200,
        body: undefined as unknown,
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(data: unknown) {
            this.body = data
            return this
        },
    }
}

async function dispatch(method: string, path: string, req: object, res: object) {
    const layer = paymentsRoute.stack.find(
        (entry: { route?: { path: string; methods: Record<string, boolean> } }) =>
            entry.route?.path === path && entry.route.methods[method],
    )
    if (!layer) {
        throw new Error(`Missing route ${method.toUpperCase()} ${path}`)
    }
    const handles = layer.route.stack.map((item: { handle: Function }) => item.handle)
    let index = 0
    let rejected: unknown
    const next = async (err?: unknown) => {
        if (err) {
            rejected = err
            return
        }
        const handle = handles[index++]
        if (!handle) return
        await handle(req, res, next)
    }
    await next()
    if (rejected) throw rejected
}

describe("paymentsRoute", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("exposes list, detail, order, and verify routes only", () => {
        const paths = paymentsRoute.stack.map(
            (entry: { route?: { path: string } }) => entry.route?.path,
        )
        expect(paths).toEqual([
            "/payments",
            "/payments/:id",
            "/payments/order/create",
            "/payments/verify-payment",
        ])
    })

    describe("POST /payments", () => {
        it("returns payments for the given user id", async () => {
            const rows = [{ id: "pay_1" }]
            Payment.find.mockResolvedValue(rows)
            const res = mockRes()

            await dispatch("post", "/payments", { body: { id: "user_1" } }, res)

            expect(Payment.find).toHaveBeenCalledWith({ userId: "user_1" })
            expect(res.statusCode).toBe(200)
            expect(res.body).toEqual({ payments: rows })
        })

        it("propagates Payment.find failures", async () => {
            Payment.find.mockRejectedValue(new Error("db down"))
            const res = mockRes()

            await expect(
                dispatch("post", "/payments", { body: { id: "user_1" } }, res),
            ).rejects.toMatchObject({ message: "db down" })
        })
    })

    describe("GET /payments/:id", () => {
        it("returns a payment by id", async () => {
            const payment = { _id: "abc" }
            Payment.findById.mockResolvedValue(payment)
            const res = mockRes()

            await dispatch("get", "/payments/:id", { params: { id: "abc" } }, res)

            expect(Payment.findById).toHaveBeenCalledWith("abc")
            expect(res.body).toEqual({ payment })
        })
    })

    describe("POST /payments/order/create", () => {
        it("creates a Razorpay order with amount in paise", async () => {
            const order = { id: "order_1" }
            razorpayOrdersCreate.mockResolvedValue(order)
            const res = mockRes()

            await dispatch(
                "post",
                "/payments/order/create",
                { body: { amount: 10, currency: "INR", receipt: "rcpt_1" } },
                res,
            )

            expect(razorpayOrdersCreate).toHaveBeenCalledWith({
                amount: 1000,
                currency: "INR",
                receipt: "rcpt_1",
            })
            expect(res.body).toEqual(order)
        })
    })

    describe("POST /payments/verify-payment", () => {
        it("accepts a valid HMAC signature", async () => {
            const razorpay_order_id = "order_1"
            const razorpay_payment_id = "pay_1"
            const razorpay_signature = crypto
                .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest("hex")
            const res = mockRes()

            await dispatch(
                "post",
                "/payments/verify-payment",
                { body: { razorpay_order_id, razorpay_payment_id, razorpay_signature } },
                res,
            )

            expect(res.body).toEqual({ success: true })
        })

        it("rejects an invalid HMAC signature", async () => {
            const res = mockRes()

            await dispatch(
                "post",
                "/payments/verify-payment",
                {
                    body: {
                        razorpay_order_id: "order_1",
                        razorpay_payment_id: "pay_1",
                        razorpay_signature: "not-valid",
                    },
                },
                res,
            )

            expect(res.statusCode).toBe(400)
            expect(res.body).toEqual({ success: false })
        })
    })
})
