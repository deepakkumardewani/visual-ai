import crypto from "crypto"
import { Router } from "express"
import { Request, Response } from "express"
import Razorpay from "razorpay"

import { env } from "../config/env.js"
import { asyncHandler } from "../lib/async-handler.js"
import { createLogger } from "../lib/logger.js"
import { PaymentModel as Payment } from "../models/payment.js"

const logger = createLogger("payments-route")

export const paymentsRoute = Router()

const razorpay = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
})

// POST /payments
// Get the list of payments made by the user
paymentsRoute.post(
    "/payments",
    asyncHandler(async (req: Request, res: Response) => {
        const userId = req.body.id
        const payments = await Payment.find({ userId })
        res.status(200).json({ payments })
    }),
)

// GET /payments/:id
// Get details of a specific payment
paymentsRoute.get(
    "/payments/:id",
    asyncHandler(async (req: Request, res: Response) => {
        const paymentId = req.params.id
        const payment = await Payment.findById(paymentId)
        res.status(200).json({ payment })
    }),
)

// POST /payments/order/create
// Create an order for a payment
paymentsRoute.post(
    "/payments/order/create",
    asyncHandler(async (req: Request, res: Response) => {
        const { amount, currency, receipt } = req.body
        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency,
            receipt,
        })
        res.status(200).json(order)
    }),
)

// POST /payments/verify-payment
// Verify a Razorpay payment using HMAC signature
paymentsRoute.post("/payments/verify-payment", (req: Request, res: Response) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    const generatedSignature = crypto
        .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex")

    if (generatedSignature === razorpay_signature) {
        logger.info("Payment verified successfully")
        res.json({ success: true })
    } else {
        logger.warn("Payment verification failed")
        res.status(400).json({ success: false })
    }
})
