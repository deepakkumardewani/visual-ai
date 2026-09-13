import cron from "node-cron"
import { DAILY_CREDITS } from "@visual-ai/shared"

import { env } from "../config/env.js"
import { createLogger } from "../lib/logger.js"
import { UserModel as User } from "../models/user.js"

const logger = createLogger("cron-jobs")

// Initialize cron jobs only if enabled
if (env.ENABLE_CRON) {
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
    logger.info("Cron jobs enabled")
} else {
    logger.info("Cron disabled - no scheduled jobs will run")
}
