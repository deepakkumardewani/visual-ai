import cron from "node-cron"
import { DAILY_RESET_UTC_HOUR, getDailyCredits } from "@visual-ai/shared"

import { env } from "../config/env.js"
import { freeUsersFilter, proUsersFilter } from "../lib/isPro.js"
import { createLogger } from "../lib/logger.js"
import { deleteUploadedFile } from "../lib/media-upload.js"
import { MediaUploadModel } from "../models/media-upload.js"
import { UserModel as User } from "../models/user.js"

const logger = createLogger("cron-jobs")

const SWEEP_BATCH_SIZE = 200
const UPLOAD_SWEEP_SCHEDULE = "17 * * * *"

/**
 * Removes expired uploads' Cloudinary files, then their rows. A row whose file could not be
 * deleted is kept so the next run retries it. Returns how many were removed.
 */
export async function sweepExpiredMediaUploads(now: Date = new Date()): Promise<number> {
    const expired = await MediaUploadModel.find({ expiresAt: { $lte: now } }).limit(
        SWEEP_BATCH_SIZE,
    )
    let removed = 0
    for (const upload of expired) {
        try {
            await deleteUploadedFile(upload)
            await MediaUploadModel.deleteOne({ _id: upload._id })
            removed += 1
        } catch (err) {
            logger.error({ err, uploadId: String(upload._id) }, "Failed to sweep expired upload")
        }
    }
    return removed
}

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
    cron.schedule(
        UPLOAD_SWEEP_SCHEDULE,
        async () => {
            try {
                const removed = await sweepExpiredMediaUploads()
                logger.info({ removed }, "Expired media uploads swept")
            } catch (error) {
                logger.error({ err: error }, "Error sweeping expired media uploads")
            }
        },
        { timezone: "UTC" },
    )
    logger.info("Cron jobs enabled")
} else {
    logger.info("Cron disabled - no scheduled jobs will run")
}
