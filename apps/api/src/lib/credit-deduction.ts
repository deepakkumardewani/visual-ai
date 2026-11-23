import { createLogger } from "./logger.js"
import { UserModel as User } from "../models/user.js"

const logger = createLogger("credit-deduction")

/**
 * Atomically deduct credits from two buckets (daily first, then persistent).
 * Uses a single findOneAndUpdate with aggregation pipeline to ensure no partial deductions.
 *
 * @throws Error if user not found or insufficient combined credits
 */
export async function updateAndGetUserCredits(userId: string, amount: number): Promise<number> {
    const user = await User.findOneAndUpdate(
        {
            userId,
            // Verify sufficient combined credits before deduction
            $expr: {
                $gte: [
                    { $add: [{ $ifNull: ["$dailyCredits", 0] }, { $ifNull: ["$credits", 0] }] },
                    amount,
                ],
            },
        },
        [
            {
                $set: {
                    // Deduct from daily first, then from persistent
                    dailyCredits: {
                        $max: [0, { $subtract: [{ $ifNull: ["$dailyCredits", 0] }, amount] }],
                    },
                    // Deduct overflow from persistent credits
                    credits: {
                        $cond: [
                            { $gte: [{ $ifNull: ["$dailyCredits", 0] }, amount] },
                            // Daily covers full amount
                            "$credits",
                            // Daily doesn't cover, deduct overflow from persistent
                            {
                                $subtract: [
                                    "$credits",
                                    { $subtract: [amount, { $ifNull: ["$dailyCredits", 0] }] },
                                ],
                            },
                        ],
                    },
                },
            },
        ],
        { new: true },
    )

    if (!user) {
        logger.error({ userId, amount }, "Insufficient credits for deduction")
        throw new Error("Insufficient credits")
    }

    const totalRemaining = (user.dailyCredits ?? 0) + (user.credits ?? 0)
    logger.debug(
        {
            userId,
            amount,
            daily: user.dailyCredits,
            persistent: user.credits,
            total: totalRemaining,
        },
        "Credits deducted",
    )
    return totalRemaining
}
