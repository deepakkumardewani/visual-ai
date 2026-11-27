import { FEEDBACK_ADMIN_RATE_LIMIT, FEEDBACK_RATE_LIMIT } from "@visual-ai/shared"
import rateLimit from "express-rate-limit"

import { createRateLimitStore, userOrIpRateLimitKey } from "./rate-limit.js"

const FEEDBACK_LIMIT_MESSAGE = "Too many feedback requests. Try again later."
const MS_PER_SECOND = 1000

function createFeedbackLimiter(limit: { windowMs: number; max: number }, storePrefix: string) {
    return rateLimit({
        windowMs: limit.windowMs,
        max: limit.max,
        standardHeaders: true,
        legacyHeaders: false,
        message: FEEDBACK_LIMIT_MESSAGE,
        keyGenerator: userOrIpRateLimitKey,
        store: createRateLimitStore(storePrefix),
        handler: (_req, res, _next, options) => {
            res.setHeader("Retry-After", String(Math.ceil(options.windowMs / MS_PER_SECOND)))
            res.status(options.statusCode).json({ message: FEEDBACK_LIMIT_MESSAGE })
        },
    })
}

/** Submit and eligibility routes. */
export const feedbackRateLimiter = createFeedbackLimiter(FEEDBACK_RATE_LIMIT, "feedback-rl")

/** Admin routes: separate bucket and a looser limit so triaging does not hit 429. */
export const feedbackAdminRateLimiter = createFeedbackLimiter(
    FEEDBACK_ADMIN_RATE_LIMIT,
    "feedback-admin-rl",
)
