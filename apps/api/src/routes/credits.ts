import { Router } from "express"
import { Request, Response } from "express"

import { UserModel as User } from "../models/user.js"

export const creditsRoute = Router()

// Get the current credit balance of the logged-in user
creditsRoute.post("/credits", async (req: Request, res: Response) => {
    try {
        const { userId } = req.body
        const user = await User.findOne({ userId })
        return res.status(200).json({ credits: user?.credits || 0 })
    } catch (error) {
        return res.status(500).send(error)
    }
})

creditsRoute.get(
    "/credits/daily/update",
    async (req: Request, res: Response) => {
        try {
            const { userId } = req.body
            await updateFreeUserCredits(userId)
            return res.status(200).send("success")
        } catch (error) {
            return res.status(500).send(error)
        }
    },
)

const updateFreeUserCredits = async (userId: string) => {
    const filter = { userId }
    await User.findOneAndUpdate(
        filter,
        {
            $inc: { credits: 5 },
        },
        { new: true },
    )
}
