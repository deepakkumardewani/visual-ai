import { feedbackDigestSubject, renderFeedbackDigest } from "@visual-ai/email"

import {
    buildFeedbackDigest,
    getDigestWindows,
    type DigestFeedbackItem,
    type DigestWindow,
} from "../lib/feedback/digest.js"
import { deliverFeedbackEmail, type FeedbackMailOutcome } from "../lib/feedback/mailer.js"
import { createLogger } from "../lib/logger.js"
import { FeedbackModel } from "../models/feedback.js"
import { feedbackAdminUrl } from "./feedback-service.js"

const logger = createLogger("feedback-digest")

export interface DigestOptions {
    /** Never sends, whatever FEEDBACK_EMAIL_MODE says. */
    dryRun?: boolean
    now?: Date
}

function loadWindow({ from, to }: DigestWindow): Promise<DigestFeedbackItem[]> {
    return FeedbackModel.find({ createdAt: { $gte: from, $lt: to } })
        .sort({ createdAt: -1 })
        .select("type rating message testimonialConsent displayName")
        .lean() as Promise<DigestFeedbackItem[]>
}

export async function sendFeedbackDigest(
    options: DigestOptions = {},
): Promise<FeedbackMailOutcome> {
    const windows = getDigestWindows(options.now ?? new Date())
    const [current, previous] = await Promise.all([
        loadWindow(windows.current),
        loadWindow(windows.previous),
    ])
    const data = buildFeedbackDigest({
        current,
        previous,
        windows,
        adminUrl: feedbackAdminUrl(),
    })
    const { html, text } = await renderFeedbackDigest(data)
    const outcome = await deliverFeedbackEmail(
        { label: "digest", subject: feedbackDigestSubject(data), html, text },
        { forceLog: options.dryRun === true },
    )
    logger.info({ outcome, total: data.totalCount }, "Feedback digest processed")
    return outcome
}
