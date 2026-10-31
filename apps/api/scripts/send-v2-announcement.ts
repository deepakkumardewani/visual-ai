import "dotenv/config"

import { renderV2Announcement } from "@visual-ai/email"
import mongoose from "mongoose"

import { env } from "../src/config/env.js"
import { signUnsubscribeToken } from "../src/lib/unsubscribe-token.js"
import type { PendingBatch } from "../src/lib/v2-announcement/batching.js"
import { PLACEHOLDERS, runCli, type RunDeps } from "../src/lib/v2-announcement/modes.js"
import { writePreviewFile } from "../src/lib/v2-announcement/preview.js"
import {
    loadEligibleRecipients,
    loadPendingBatches,
    type Recipient,
} from "../src/lib/v2-announcement/recipients.js"
import {
    createBatchSender,
    sendTestMessage,
    type SenderConfig,
} from "../src/lib/v2-announcement/resend-client.js"
import { UserModel } from "../src/models/user.js"

const UNSUBSCRIBE_PATH = "/email/unsubscribe"

function unsubscribeUrlFor(recipient: Recipient): string {
    if (!env.UNSUBSCRIBE_SECRET || !env.API_PUBLIC_URL) {
        return PLACEHOLDERS.unsubscribeUrl
    }
    const token = signUnsubscribeToken(recipient.userId)
    return `${env.API_PUBLIC_URL.replace(/\/+$/, "")}${UNSUBSCRIBE_PATH}?token=${token}`
}

const senderConfig: SenderConfig = {
    apiKey: env.RESEND_API_KEY ?? "",
    from: env.MAIL_FROM ?? "",
    ...(env.EMAIL_REPLY_TO ? { replyTo: env.EMAIL_REPLY_TO } : {}),
    unsubscribeUrlFor,
    render: ({ firstName, unsubscribeUrl }) =>
        renderV2Announcement({
            ...(firstName ? { firstName } : {}),
            unsubscribeUrl,
            postalAddress: env.MAIL_POSTAL_ADDRESS || PLACEHOLDERS.postalAddress,
        }),
}

// Memoized and lazy: the blank-env guard and --test-to must never touch Mongo, while both
// loaders (pending batches run first on --confirm) need a live connection before querying.
let connection: Promise<unknown> | undefined
function ensureConnected(): Promise<unknown> {
    connection ??= mongoose.connect(env.MONGO_URI)
    return connection
}

async function loadRecipients(): Promise<Recipient[]> {
    await ensureConnected()
    return loadEligibleRecipients()
}

async function loadPending(): Promise<PendingBatch<Recipient>[]> {
    await ensureConnected()
    return loadPendingBatches()
}

const deps: RunDeps = {
    loadRecipients,
    loadPendingBatches: loadPending,
    renderFor: (recipient) =>
        senderConfig.render({
            firstName: recipient.firstName,
            unsubscribeUrl: unsubscribeUrlFor(recipient),
        }),
    writePreview: writePreviewFile,
    sendBatch: (batch, key) => createBatchSender(senderConfig)(batch, key),
    sendTest: (to) => sendTestMessage(senderConfig, to),
    reserveBatch: async (batch, key) => {
        await UserModel.updateMany(
            { userId: { $in: batch.map((item) => item.userId) } },
            {
                $set: {
                    "announcements.v2.pendingKey": key,
                    "announcements.v2.pendingAt": new Date(),
                },
            },
        )
    },
    markBatchSent: async (sent) => {
        const sentAt = new Date()
        await UserModel.bulkWrite(
            sent.map(({ item, providerId }) => ({
                updateOne: {
                    filter: { userId: item.userId },
                    update: { $set: { "announcements.v2": { sentAt, resendId: providerId } } },
                },
            })),
        )
    },
    env: process.env,
    log: (line) => console.log(line),
}

try {
    process.exitCode = await runCli(process.argv.slice(2), deps)
} finally {
    await mongoose.disconnect()
}
