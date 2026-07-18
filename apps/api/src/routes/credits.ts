import { Router } from "express"
import { Request, Response } from "express"

import { asyncHandler } from "../lib/async-handler.js"
import { getUserOrThrow, updateFreeUserCredits } from "../services/user-service.js"

export const creditsRoute = Router()

// Get the current credit balance of the logged-in user
creditsRoute.post(
    "/credits",
    asyncHandler(async (req: Request, res: Response) => {
        const { userId } = req.body
        const user = await getUserOrThrow(userId)
        res.status(200).json({ credits: user.credits })
    }),
)

// Update free user credits (daily limit)
creditsRoute.get(
    "/credits/daily/update",
    asyncHandler(async (req: Request, res: Response) => {
        const { userId } = req.body
        await updateFreeUserCredits(userId)
        res.status(200).send("success")
    }),
)
