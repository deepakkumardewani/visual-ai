import { mkdir, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import path from "node:path"

import { Resend } from "resend"

import { env } from "../../config/env.js"
import { createLogger } from "../logger.js"

const logger = createLogger("feedback-mailer")

// apps/api/.tmp/feedback-emails, resolved from this file (src/lib/feedback) so cwd does not matter.
const PREVIEW_DIR = fileURLToPath(new URL("../../../.tmp/feedback-emails", import.meta.url))

export interface FeedbackEmail {
    /** Short slug used in the preview file name, e.g. "alert" or "digest". */
    label: string
    subject: string
    html: string
    text: string
}

export interface DeliverOptions {
    /** Dry run: behave as log mode even when FEEDBACK_EMAIL_MODE=send. */
    forceLog?: boolean
}

export type FeedbackMailOutcome = "sent" | "logged" | "skipped"

export class FeedbackMailError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "FeedbackMailError"
    }
}

function previewFileName(label: string, now: Date): string {
    return `${now.toISOString().replace(/[:.]/g, "-")}-${label}.html`
}

async function writePreview(email: FeedbackEmail, to: string): Promise<void> {
    if (env.NODE_ENV === "production") return
    try {
        await mkdir(PREVIEW_DIR, { recursive: true })
        await writeFile(
            path.join(PREVIEW_DIR, previewFileName(email.label, new Date())),
            email.html,
            "utf8",
        )
    } catch (err) {
        logger.warn({ err, to }, "Could not write feedback email preview")
    }
}

async function sendViaResend(email: FeedbackEmail, to: string): Promise<void> {
    if (!env.RESEND_API_KEY || !env.MAIL_FROM) {
        throw new FeedbackMailError("RESEND_API_KEY and MAIL_FROM are required in send mode")
    }
    const { error } = await new Resend(env.RESEND_API_KEY).emails.send({
        from: env.MAIL_FROM,
        to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        ...(env.EMAIL_REPLY_TO ? { replyTo: env.EMAIL_REPLY_TO } : {}),
    })
    if (error) {
        throw new FeedbackMailError(error.message)
    }
}

/**
 * Delivers an internal feedback email. Default mode is "log": nothing leaves the process.
 * Only FEEDBACK_EMAIL_MODE=send reaches Resend. Throws FeedbackMailError on a failed send;
 * callers on a request path must catch and log it.
 */
export async function deliverFeedbackEmail(
    email: FeedbackEmail,
    options: DeliverOptions = {},
): Promise<FeedbackMailOutcome> {
    const to = env.FEEDBACK_NOTIFY_EMAIL
    if (!to) {
        logger.info({ subject: email.subject }, "FEEDBACK_NOTIFY_EMAIL not set, skipping email")
        return "skipped"
    }
    // Tests load the developer .env, so a local FEEDBACK_EMAIL_MODE=send must never send from a test.
    const sendAllowed = env.FEEDBACK_EMAIL_MODE === "send" && env.NODE_ENV !== "test"
    if (options.forceLog || !sendAllowed) {
        logger.info({ to, subject: email.subject }, "Feedback email (log mode, not sent)")
        await writePreview(email, to)
        return "logged"
    }
    await sendViaResend(email, to)
    logger.info({ to, subject: email.subject }, "Feedback email sent")
    return "sent"
}
