import crypto from "crypto"
import { Router } from "express"
import { Request, Response } from "express"
import Razorpay from "razorpay"

import { PaymentModel as Payment } from "../models/payment.js"
import { UserModel as User } from "../models/user.js"

export const paymentsRoute = Router()

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// POST /payments/subscription/create
// Subscribe to the pro plan
paymentsRoute.post("/payments/subscription/create", async (req: Request, res: Response) => {
    try {
        const { planId } = req.body

        console.log("planId", planId)
        // Validate request
        if (!planId) {
            return res.status(400).json({
                message: "Missing required fields: planId",
            })
        }

        // Create subscription
        const subscription = await razorpay.subscriptions.create({
            plan_id: planId,
            customer_notify: 0,
            quantity: 1,
            total_count: 12, // 12 months subscription
            addons: [
                {
                    item: {
                        name: "full amount",
                        amount: 299,
                        currency: "INR",
                    },
                },
            ],
        })

        console.log("subscription", subscription)

        return res.status(200).json({
            subscription,
            message: "Subscription created successfully",
        })
    } catch (error) {
        console.error("Error creating subscription:", error)
        return res.status(500).json({
            message: "Error creating subscription",
            error: error instanceof Error ? error.message : "Unknown error",
        })
    }
})

// POST /payments
// Make a payment (for additional credits or subscription)
// paymentsRoute.post("/payments", async (req: Request, res: Response) => {})

// GET /payments
// Get the list of payments made by the user
paymentsRoute.post("/payments", async (req: Request, res: Response) => {
    try {
        const userId = req.body.id
        const payments = await Payment.find({ userId })
        return res.status(200).json({ payments })
    } catch (error) {
        return res.status(500).send(error)
    }
})

// GET /payments/:id
// Get details of a specific payment
paymentsRoute.get("/payments/:id", async (req: Request, res: Response) => {
    try {
        const paymentId = req.params.id
        const payment = await Payment.findById(paymentId)
        return res.status(200).json({ payment })
    } catch (error) {
        return res.status(500).send(error)
    }
})

// POST /payments/order/create
// Create an order for a payment
paymentsRoute.post("/payments/order/create", async (req: Request, res: Response) => {
    const { amount, currency, receipt } = req.body // Example: { amount: 500, currency: 'INR', receipt: 'order_rcptid_11' }
    try {
        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency,
            receipt,
        })
        res.status(200).json(order)
    } catch (error) {
        res.status(500).send(error)
    }
})

// POST /payments/verify-payment
// Verify a payment
paymentsRoute.post("/payments/verify-payment", (req: Request, res: Response) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex")

    if (generatedSignature === razorpay_signature) {
        console.log("Payment verified successfully")
        res.json({ success: true })
    } else {
        console.log("Payment verification failed")
        res.status(400).json({ success: false })
    }
})

// POST /payments/cancel-subscription
// Cancel user's subscription
paymentsRoute.post("/payments/subscription/cancel", async (req: Request, res: Response) => {
    const { userId } = req.body
    const user = await User.findOne({ userId })
    if (!user) {
        return res.status(404).json({ message: "User not found" })
    }

    console.log("user", user)
    razorpay.subscriptions.cancel(user?.subscriptionId || "", 0, (err, response) => {
        if (err) {
            console.error("Error canceling subscription:", err)
            return res.status(500).json({ message: "Internal server error" })
        } else {
            console.log("Subscription canceled:", response)
            return res.status(200).json({ message: "Subscription canceled" })
        }
    })
})
