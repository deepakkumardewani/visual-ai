import { Router, type NextFunction, type Request, type Response } from "express"
import express from "express"

import { createLogger } from "../lib/logger.js"
import { PAYMENTS_WEBHOOK_BODY_LIMIT_BYTES } from "./dodo/constants.js"
import { InvalidSignatureError } from "./errors.js"
import { getPaymentProvider } from "./providerFactory.js"
import { applyEvent } from "./service.js"

const logger = createLogger("payments-webhook")

/** Express body-parser error `type` when raw JSON exceeds the configured limit. */
const EXPRESS_PAYLOAD_TOO_LARGE = "entity.too.large"

export const paymentsWebhookRouter = Router()

paymentsWebhookRouter.post(
    "/webhooks/payments",
    express.raw({ type: "application/json", limit: PAYMENTS_WEBHOOK_BODY_LIMIT_BYTES }),
    async (req: Request, res: Response) => {
        try {
            const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("")
            const provider = getPaymentProvider()
            let event
            try {
                event = provider.verifyAndParseWebhook(rawBody, req.headers)
            } catch (error) {
                if (error instanceof InvalidSignatureError) {
                    return res.status(401).json({ error: "Invalid webhook signature" })
                }
                throw error
            }

            if (!event) {
                return res.status(200).json({ received: true })
            }

            await applyEvent(event)
            return res.status(200).json({ received: true })
        } catch (error) {
            logger.error({ err: error }, "Payments webhook handler failed")
            return res.status(500).json({ error: "Internal server error" })
        }
    },
)

paymentsWebhookRouter.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (
        err &&
        typeof err === "object" &&
        "type" in err &&
        (err as { type?: string }).type === EXPRESS_PAYLOAD_TOO_LARGE
    ) {
        return res.status(413).json({ error: "Payload too large" })
    }
    next(err)
})
