import cron from "node-cron"

import { UserModel as User } from "../models/user.js"

// Constants for credit limits
const PRO_MONTHLY_CREDITS = 500
const MAX_PRO_CREDITS = 2000

// Schedule the cron job to run every 24 hours (at midnight server time)
cron.schedule("0 0 * * *", async () => {
    try {
        console.log("Running daily credit update for free users...")
        await User.updateMany(
            {
                plan: "free",
                credits: { $lt: 20 },
            },
            { credits: 20 },
        )
        console.log("Free user credits successfully updated.")
    } catch (error) {
        console.error("Error updating free user credits:", error)
    }
})

// Schedule the cron job to run on the 1st of every month
cron.schedule("0 0 1 * *", async () => {
    try {
        console.log("Running monthly credit update for pro users...")

        // Update credits for pro users who have less than MAX_PRO_CREDITS
        await User.updateMany(
            {
                plan: "pro",
                credits: { $lt: MAX_PRO_CREDITS },
            },
            [
                {
                    $set: {
                        credits: {
                            $min: [MAX_PRO_CREDITS, { $add: ["$credits", PRO_MONTHLY_CREDITS] }],
                        },
                    },
                },
            ],
        )

        console.log("Pro user credits successfully updated.")
    } catch (error) {
        console.error("Error updating pro user credits:", error)
    }
})
