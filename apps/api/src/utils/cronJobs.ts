import cron from "node-cron"
import { DAILY_CREDITS } from "@visual-ai/shared"

import { createLogger } from "../lib/logger.js"
import { UserModel as User } from "../models/user.js"

const logger = createLogger("cron-jobs")

// Schedule the cron job to run every 24 hours (at midnight server time)
// Resets dailyCredits to DAILY_CREDITS for all users
cron.schedule("0 0 * * *", async () => {
    try {
        logger.info("Running daily credit reset for all users")
        await User.updateMany({}, { $set: { dailyCredits: DAILY_CREDITS } })
        logger.info("Daily credits successfully reset")
    } catch (error) {
        logger.error({ err: error }, "Error resetting daily credits")
    }
})
