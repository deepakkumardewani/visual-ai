import { Router } from "express"
import type { Request, Response } from "express"

import { asyncHandler } from "../lib/async-handler.js"
import { BadRequestError } from "../lib/errors.js"
import { PAYMENTS_MESSAGES } from "./constants.js"
import { ProviderApiError, UnknownPackError } from "./errors.js"
import { createCheckout, getCheckoutSessionStatus, listPaymentsForUser } from "./service.js"

export const paymentsApiRouter = Router()

function getUserIdOrRespondUnauthorized(req: Request, res: Response): string | undefined {
    const userId = req.auth?.userId
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" })
        return undefined
    }
    return userId
}

paymentsApiRouter.post(
    "/payments/checkout",
    asyncHandler(async (req: Request, res: Response) => {
        const userId = getUserIdOrRespondUnauthorized(req, res)
        if (!userId) {
            return
        }

        const packId = typeof req.body?.packId === "string" ? req.body.packId : ""
        if (!packId) {
            throw new BadRequestError("packId is required")
        }

        const email =
            typeof req.auth?.sessionClaims?.email === "string"
                ? req.auth.sessionClaims.email
                : undefined

        try {
            const result = await createCheckout(userId, packId, email)
            res.status(201).json(result)
        } catch (error) {
            if (error instanceof UnknownPackError) {
                throw new BadRequestError(error.message)
            }
            if (error instanceof ProviderApiError) {
                res.status(502).json({ message: PAYMENTS_MESSAGES.PROVIDER_UNAVAILABLE })
                return
            }
            throw error
        }
    }),
)

paymentsApiRouter.get(
    "/payments",
    asyncHandler(async (req: Request, res: Response) => {
        const userId = getUserIdOrRespondUnauthorized(req, res)
        if (!userId) {
            return
        }

        const payments = await listPaymentsForUser(userId)
        res.status(200).json({ payments })
    }),
)

paymentsApiRouter.get(
    "/payments/checkout/:sessionId/status",
    asyncHandler(async (req: Request, res: Response) => {
        const userId = getUserIdOrRespondUnauthorized(req, res)
        if (!userId) {
            return
        }

        const sessionId = String(req.params.sessionId)
        try {
            const status = await getCheckoutSessionStatus(userId, sessionId)
            res.status(200).json(status)
        } catch (error) {
            if (error instanceof ProviderApiError) {
                res.status(502).json({ message: PAYMENTS_MESSAGES.PROVIDER_UNAVAILABLE })
                return
            }
            throw error
        }
    }),
)
