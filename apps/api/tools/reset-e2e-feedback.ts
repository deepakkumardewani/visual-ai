/**
 * Resets the E2E test user's feedback state so the popup flow can run again:
 * clears feedback.lastPromptedAt, sets feedback.successfulGenerations and deletes the user's
 * feedback documents. Touches only the E2E user.
 *
 * Usage (from apps/api): bun run reset:e2e-feedback [-- <successfulGenerations>]
 */
import mongoose from "mongoose"

import { FEEDBACK_GENERATION_THRESHOLD } from "@visual-ai/shared"

import { env } from "../src/config/env.js"
import { FeedbackModel } from "../src/models/feedback.js"
import { UserModel } from "../src/models/user.js"

const E2E_USER_ID = process.env.E2E_CLERK_USER_ID ?? "user_2wTu04vGSICXzCOVXoiL8nuv7zn"

function parseGenerations(arg: string | undefined): number {
    if (arg === undefined) return FEEDBACK_GENERATION_THRESHOLD
    const value = Number.parseInt(arg, 10)
    if (!Number.isInteger(value) || value < 0) {
        throw new Error(`Invalid successfulGenerations: ${arg}`)
    }
    return value
}

async function main() {
    const successfulGenerations = parseGenerations(process.argv[2])
    await mongoose.connect(env.MONGO_URI)
    try {
        const user = await UserModel.updateOne(
            { userId: E2E_USER_ID },
            {
                $set: {
                    "feedback.lastPromptedAt": null,
                    "feedback.successfulGenerations": successfulGenerations,
                },
            },
        )
        if (user.matchedCount === 0) {
            throw new Error(`User ${E2E_USER_ID} not found - run seed:e2e-user first`)
        }
        const removed = await FeedbackModel.deleteMany({ userId: E2E_USER_ID })
        console.log(
            `Reset feedback for ${E2E_USER_ID}: generations=${successfulGenerations}, deleted ${removed.deletedCount} feedback docs`,
        )
    } finally {
        await mongoose.disconnect()
    }
}

main().catch((error) => {
    console.error("reset-e2e-feedback failed:", error)
    process.exit(1)
})
