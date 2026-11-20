import cron from "node-cron"
import { DAILY_RESET_UTC_HOUR, getDailyCredits } from "@visual-ai/shared"

import { env } from "../config/env.js"
import { freeUsersFilter, proUsersFilter } from "../lib/isPro.js"
import { createLogger } from "../lib/logger.js"
import { UserModel as User } from "../models/user.js"

const logger = createLogger("cron-jobs")

// Initialize cron jobs only if enabled
if (env.ENABLE_CRON) {
    // Resets at 00:00 UTC regardless of server timezone: Pro users get the Pro allowance, everyone else Free.
    cron.schedule(
        `0 ${DAILY_RESET_UTC_HOUR} * * *`,
        async () => {
            try {
                logger.info("Running daily credit reset for all users")
                const now = new Date()
                await User.updateMany(proUsersFilter(now), {
                    $set: { dailyCredits: getDailyCredits(true) },
                })
                await User.updateMany(freeUsersFilter(now), {
                    $set: { dailyCredits: getDailyCredits(false) },
                })
                logger.info("Daily credits successfully reset")
            } catch (error) {
                logger.error({ err: error }, "Error resetting daily credits")
            }
        },
        { timezone: "UTC" },
    )
    logger.info("Cron jobs enabled")
} else {
    logger.info("Cron disabled - no scheduled jobs will run")
}
