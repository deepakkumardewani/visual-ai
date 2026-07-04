import {
    StrictAuthProp,
    createClerkClient,
    createClerkExpressRequireAuth,
} from "@clerk/clerk-sdk-node"
import { Request, Response } from "express"

/* eslint-disable no-unused-vars */
declare global {
    namespace Express {
        interface Request extends StrictAuthProp {}
    }
}
/* eslint-disable no-unused-vars */

const authorizedParties = ["http://localhost:3000", "https://visual-ai.app"]
const clerkOptions = {
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
}
export const clerkClient = createClerkClient(clerkOptions)
export const ClerkExpressRequireAuth = createClerkExpressRequireAuth({
    clerkClient,
})

export const authenticateProgress = async (
    req: Request,
    res: Response,
    next: Function,
) => {
    const token = req.query.token as string
    try {
        await clerkClient.verifyToken(token, {
            jwtKey: process.env.CLERK_JWT_KEY,
            authorizedParties,
        })
        next()
        return
    } catch (error) {
        console.error("error======", error)
        return res.status(401).json({ message: "Unauthorized" })
    }
}
