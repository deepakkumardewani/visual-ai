/**
 * Builds and delivers the weekly feedback digest.
 *
 * Without flags it follows FEEDBACK_EMAIL_MODE (default "log": nothing is sent, HTML is written
 * to apps/api/.tmp/feedback-emails/). --dry-run forces log behaviour even when the mode is "send".
 *
 * Usage (from apps/api): bun scripts/send-feedback-digest.ts --dry-run
 */
import "dotenv/config"

import mongoose from "mongoose"

import { env } from "../src/config/env.js"
import { sendFeedbackDigest } from "../src/services/feedback-digest-service.js"

const DRY_RUN_FLAG = "--dry-run"

async function main() {
    const dryRun = process.argv.slice(2).includes(DRY_RUN_FLAG)
    await mongoose.connect(env.MONGO_URI)
    try {
        const outcome = await sendFeedbackDigest({ dryRun })
        console.log(`Feedback digest: ${outcome}${dryRun ? " (dry run)" : ""}`)
    } finally {
        await mongoose.disconnect()
    }
}

main().catch((error) => {
    console.error("send-feedback-digest failed:", error)
    process.exit(1)
})
