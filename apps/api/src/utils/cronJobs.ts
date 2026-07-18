import cron from "node-cron"

import { createLogger } from "../lib/logger.js"
import { UserModel as User } from "../models/user.js"

const logger = createLogger("cron-jobs")

// Constants for credit limits
const PRO_MONTHLY_CREDITS = 500
const MAX_PRO_CREDITS = 2000

// Schedule the cron job to run every 24 hours (at midnight server time)
cron.schedule("0 0 * * *", async () => {
    try {
        logger.info("Running daily credit update for free users")
        await User.updateMany(
            {
                plan: "free",
                credits: { $lt: 20 },
            },
            { credits: 20 },
        )
        logger.info("Free user credits successfully updated")
    } catch (error) {
        logger.error({ err: error }, "Error updating free user credits")
    }
})

// Schedule the cron job to run on the 1st of every month
cron.schedule("0 0 1 * *", async () => {
    try {
        logger.info("Running monthly credit update for pro users")

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

        logger.info("Pro user credits successfully updated")
    } catch (error) {
        logger.error({ err: error }, "Error updating pro user credits")
    }
})
