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

let razorpayClient: Razorpay | undefined

function getRazorpayClient(): Razorpay {
    const keyId = env.RAZORPAY_KEY_ID
    const keySecret = env.RAZORPAY_KEY_SECRET
    if (!keyId || !keySecret) {
        throw new Error("Razorpay is not configured")
    }
    if (!razorpayClient) {
        razorpayClient = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        })
    }
    return razorpayClient
}

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
        const order = await getRazorpayClient().orders.create({
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
    const keySecret = env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
        logger.warn("Payment verification rejected: Razorpay secret is not configured")
        res.status(503).json({ success: false, message: "Razorpay verification is not configured" })
        return
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    const generatedSignature = crypto
        .createHmac("sha256", keySecret)
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
