import { Resend } from "resend"

import { SendError } from "./batching.js"
import type { Recipient } from "./recipients.js"

export const ANNOUNCEMENT_SUBJECT = "Visual AI V2 is here"

export interface RenderedMessage {
    html: string
    text: string
}

export interface SenderConfig {
    apiKey: string
    from: string
    replyTo?: string
    /** Absolute unsubscribe URL for this recipient. */
    unsubscribeUrlFor: (recipient: Recipient) => string
    render: (input: { firstName: string; unsubscribeUrl: string }) => Promise<RenderedMessage>
}

export interface OutgoingMessage {
    from: string
    to: string
    subject: string
    html: string
    text: string
    replyTo?: string
    headers: Record<string, string>
}

export async function buildMessage(
    recipient: Recipient,
    config: Omit<SenderConfig, "apiKey">,
    subject: string = ANNOUNCEMENT_SUBJECT,
): Promise<OutgoingMessage> {
    const unsubscribeUrl = config.unsubscribeUrlFor(recipient)
    const { html, text } = await config.render({
        firstName: recipient.firstName,
        unsubscribeUrl,
    })
    return {
        from: config.from,
        to: recipient.email,
        subject,
        html,
        text,
        ...(config.replyTo ? { replyTo: config.replyTo } : {}),
        headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
    }
}

/** Batch sender returning one Resend email id per recipient, in order. */
export function createBatchSender(config: SenderConfig) {
    const resend = new Resend(config.apiKey)
    return async (batch: Recipient[], idempotencyKey: string): Promise<string[]> => {
        const messages = await Promise.all(
            batch.map((recipient) => buildMessage(recipient, config)),
        )
        const { data, error } = await resend.batch.send(messages, {
            idempotencyKey,
        })
        if (error) {
            throw new SendError(error.message, error.statusCode ?? undefined)
        }
        return (data?.data ?? []).map((entry) => entry.id)
    }
}

/** Single message for `--test-to`; never recorded against a user. */
export async function sendTestMessage(config: SenderConfig, to: string): Promise<string> {
    const resend = new Resend(config.apiKey)
    const message = await buildMessage({ userId: "test", email: to, firstName: "" }, config)
    const { data, error } = await resend.emails.send(message)
    if (error || !data) {
        throw new SendError(error?.message ?? "no response", error?.statusCode ?? undefined)
    }
    return data.id
}
