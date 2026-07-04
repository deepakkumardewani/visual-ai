import { Router } from "express"
import express from "express"
import { Webhook } from "svix"

import { signUpHandler } from "../helpers/userRouteHelpers.js"
import { PaymentModel as Payment } from "../models/payment.js"
import { UserModel as User } from "../models/user.js"

export const webhookRouter = Router()

// 'express.raw({ type: "application/json" })' this is important for svix to verify the webhook
// use this before express.json middleware to avoid payload type error
webhookRouter.post(
    "/webhooks/clerk",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        const { WEBHOOK_SECRET } = process.env
        if (!WEBHOOK_SECRET) {
            throw new Error("You need a WEBHOOK_SECRET in your .env")
        }

        // Get the headers and body
        const headers = req.headers
        const payload = req.body

        // Get the Svix headers for verification
        const svix_id = headers["svix-id"] as string
        const svix_timestamp = headers["svix-timestamp"] as string
        const svix_signature = headers["svix-signature"] as string

        // If there are no Svix headers, error out
        if (!svix_id || !svix_timestamp || !svix_signature) {
            return new Response("Error occured -- no svix headers", {
                status: 400,
            })
        }

        // Create a new Svix instance with your secret.
        const wh = new Webhook(WEBHOOK_SECRET)

        let evt: any

        // Attempt to verify the incoming webhook
        // If successful, the payload will be available from 'evt'
        // If the verification fails, error out and return error code
        try {
            evt = wh.verify(payload, {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            })
        } catch (err) {
            console.log("Error verifying webhook:", (err as Error).message)
            return res.status(400).json({
                success: false,
                message: (err as Error).message,
            })
        }

        // Do something with the payload
        // For this guide, you simply log the payload to the console
        const { id } = evt.data
        const eventType = evt.type
        if (eventType === "user.created") {
            console.log("userId:", evt.data.id)
            console.log(`Webhook with an ID of ${id} and type of ${eventType}`)
            console.log("Webhook body:", evt)
        }

        await signUpHandler(evt)

        return res.status(200).json({
            success: true,
            message: "Webhook received",
        })
    },
)

webhookRouter.post("/webhooks/razorpay", express.json(), async (req, res) => {
    // console.log("=============")
    // console.log("body", JSON.stringify(req.body, null, 2))
    // console.log("=============")
    const { event } = req.body
    console.log("event", event)
    // if (event === "payment.authorized") {
    //     const { payment } = req.body.payload
    //     console.log("payment", payment)
    // }
    // if (event === "order.paid") {
    //     const { payment } = req.body.payload
    //     console.log("payment", payment)
    // }
    if (event === "payment.captured") {
        const { payment } = req.body.payload

        const { userId, subscribe, credits } = payment.entity.notes
        const amount = payment.entity.amount / 100
        const paymentMethod = payment?.entity?.card?.entity ?? ""
        const description = payment?.entity?.description ?? ""
        const humanReadableDate = new Date().toLocaleDateString()
        const paymentObject = new Payment({
            amount,
            paymentMethod,
            transactionId: payment.entity.id,
            description,
            status: payment.entity.status,
            humanReadableDate,
        })

        try {
            const user = await User.findOneAndUpdate(
                { userId },
                {
                    $push: { payments: paymentObject },
                    $inc: { credits },
                    ...(subscribe === "true" && {
                        $set: {
                            isPro: true,
                            plan: "pro",
                            subscriptionId: payment.entity.notes.subscriptionId,
                        },
                    }),
                },
                { new: true },
            )

            if (!user) {
                console.error(`User not found with ID: ${userId}`)
                return res.status(404).json({ message: "User not found" })
            }

            return res.status(200).json({
                success: true,
                message: "Payment successful",
                user,
            })
        } catch (error) {
            console.error("Error updating user payments and credits:", error)
            return res.status(500).json({ message: "Internal server error" })
        }
    } else {
        return
    }
})
