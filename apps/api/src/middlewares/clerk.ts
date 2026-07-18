import {
    StrictAuthProp,
    createClerkClient,
    createClerkExpressRequireAuth,
} from "@clerk/clerk-sdk-node"
import { Request, Response } from "express"

import { env } from "../config/env.js"
import { createLogger } from "../lib/logger.js"

/* eslint-disable no-unused-vars */
declare global {
    namespace Express {
        interface Request extends StrictAuthProp {}
    }
}
/* eslint-disable no-unused-vars */

const logger = createLogger("clerk-middleware")

const authorizedParties = ["http://localhost:3000", "https://visual-ai.app"]
const clerkOptions = {
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
}
export const clerkClient = createClerkClient(clerkOptions)
export const ClerkExpressRequireAuth = createClerkExpressRequireAuth({
    clerkClient,
})

export const authenticateProgress = async (req: Request, res: Response, next: Function) => {
    const token = req.query.token as string
    try {
        await clerkClient.verifyToken(token, {
            jwtKey: env.CLERK_JWT_KEY,
            authorizedParties,
        })
        next()
        return
    } catch (error) {
        logger.error({ err: error }, "Token verification failed")
        return res.status(401).json({ message: "Unauthorized" })
    }
}
