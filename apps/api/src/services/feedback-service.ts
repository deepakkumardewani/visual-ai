import type { FeedbackAlertData } from "@visual-ai/email"
import { feedbackAlertSubject, renderFeedbackAlert } from "@visual-ai/email"
import {
    FEEDBACK_HIGH_RATING_MIN,
    FEEDBACK_LOW_RATING_MAX,
    FEEDBACK_OPEN_STATUSES,
    FEEDBACK_TYPES,
    type AdminFeedbackQuery,
    type CreateFeedbackRequest,
    type FeedbackTrigger,
    type UpdateFeedbackAdminRequest,
} from "@visual-ai/shared"
import type { FilterQuery } from "mongoose"

import { env } from "../config/env.js"
import { NotFoundError } from "../lib/errors.js"
import { isFeedbackEligible } from "../lib/feedback/eligibility.js"
import { deliverFeedbackEmail } from "../lib/feedback/mailer.js"
import { createLogger } from "../lib/logger.js"
import { FeedbackModel, type IFeedback } from "../models/feedback.js"
import { UserModel } from "../models/user.js"
import { FeatureType } from "../types/index.js"

const logger = createLogger("feedback-service")

const DEFAULT_APP_URL = "https://visual-ai.app"
const ADMIN_PATH = "/admin/feedback"

export function feedbackAdminUrl(): string {
    return `${(env.APP_PUBLIC_URL || DEFAULT_APP_URL).replace(/\/+$/, "")}${ADMIN_PATH}`
}

// ---------------------------------------------------------------------------
// Eligibility
// ---------------------------------------------------------------------------

/**
 * Counts one successful image generation. Called before the job is marked completed so the
 * client's next eligibility check sees it. Never throws: a counter failure must not fail a
 * generation the user already paid for.
 */
export async function recordSuccessfulGeneration(
    userId: string,
    featureType: FeatureType,
): Promise<void> {
    if (featureType !== FeatureType.IMAGE) return
    try {
        await UserModel.updateOne({ userId }, { $inc: { "feedback.successfulGenerations": 1 } })
    } catch (err) {
        logger.error({ err, userId }, "Failed to increment successful generation count")
    }
}

/**
 * Decides eligibility and, when eligible, atomically marks the prompt as shown. The claim is a
 * compare-and-set on lastPromptedAt, so concurrent tabs cannot both win.
 */
export async function claimFeedbackPrompt(
    userId: string,
    trigger: FeedbackTrigger,
    now: Date = new Date(),
): Promise<boolean> {
    const user = await UserModel.findOne({ userId }).select("createdAt feedback").lean()
    if (!user?.createdAt) return false

    const lastPromptedAt = user.feedback?.lastPromptedAt ?? null
    const eligible = isFeedbackEligible({
        trigger,
        now,
        accountCreatedAt: new Date(user.createdAt),
        successfulGenerations: user.feedback?.successfulGenerations ?? 0,
        lastPromptedAt,
    })
    if (!eligible) return false

    const claimed = await UserModel.findOneAndUpdate(
        { userId, "feedback.lastPromptedAt": lastPromptedAt },
        { $set: { "feedback.lastPromptedAt": now } },
        { projection: { _id: 1 } },
    )
    return claimed !== null
}

// ---------------------------------------------------------------------------
// Submission
// ---------------------------------------------------------------------------

function toFeedbackFields(
    userId: string,
    email: string,
    body: CreateFeedbackRequest,
): Omit<IFeedback, "status" | "adminNote" | "createdAt" | "updatedAt"> {
    const context = body.context ?? {}
    if (body.source === "popup") {
        // Consent and display name only make sense for ratings the popup offers them for.
        const consent =
            body.rating >= FEEDBACK_HIGH_RATING_MIN && (body.testimonialConsent ?? false)
        return {
            userId,
            email,
            source: "popup",
            type: "rating",
            rating: body.rating,
            message: body.message ?? "",
            testimonialConsent: consent,
            ...(consent && body.displayName ? { displayName: body.displayName } : {}),
            context,
        }
    }
    return {
        userId,
        email,
        source: "menu",
        type: body.type,
        message: body.message,
        testimonialConsent: false,
        context,
    }
}

export function shouldAlert(feedback: Pick<IFeedback, "type" | "rating">): boolean {
    if (feedback.type === "bug") return true
    return typeof feedback.rating === "number" && feedback.rating <= FEEDBACK_LOW_RATING_MAX
}

function toAlertData(feedback: IFeedback, plan: string | undefined): FeedbackAlertData {
    return {
        type: feedback.type,
        ...(feedback.rating === undefined ? {} : { rating: feedback.rating }),
        message: feedback.message,
        userEmail: feedback.email,
        ...(feedback.context.route ? { route: feedback.context.route } : {}),
        // Plan comes from the user record: client-supplied context.plan is spoofable.
        ...(plan ? { plan } : {}),
        adminUrl: feedbackAdminUrl(),
    }
}

/** Sends the alert for low ratings and bugs. Never throws and never fires for e2e users. */
export async function notifyFeedbackAlert(
    feedback: IFeedback,
    plan: string | undefined,
): Promise<void> {
    if (!shouldAlert(feedback) || env.E2E_USER_IDS.includes(feedback.userId)) return
    try {
        const data = toAlertData(feedback, plan)
        const { html, text } = await renderFeedbackAlert(data)
        await deliverFeedbackEmail({
            label: "alert",
            subject: feedbackAlertSubject(data),
            html,
            text,
        })
    } catch (err) {
        logger.error({ err, userId: feedback.userId }, "Failed to send feedback alert")
    }
}

export async function submitFeedback(userId: string, body: CreateFeedbackRequest): Promise<string> {
    const user = await UserModel.findOne({ userId }).select("email plan").lean()
    if (!user) throw new NotFoundError("User not found")

    const created = await FeedbackModel.create(toFeedbackFields(userId, user.email ?? "", body))
    await notifyFeedbackAlert(created.toObject(), user.plan)
    return String(created._id)
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export interface FeedbackSummary {
    avgRating: number | null
    countByType: Record<string, number>
    open: number
}

function buildAdminFilter(query: AdminFeedbackQuery): FilterQuery<IFeedback> {
    const filter: FilterQuery<IFeedback> = {}
    if (query.type) filter.type = query.type
    if (query.status) filter.status = query.status
    if (query.rating !== undefined) filter.rating = query.rating
    if (query.testimonial !== undefined) filter.testimonialConsent = query.testimonial
    if (query.from || query.to) {
        filter.createdAt = {
            ...(query.from ? { $gte: query.from } : {}),
            ...(query.to ? { $lte: query.to } : {}),
        }
    }
    return filter
}

/** Summary covers all feedback, not the active filters, so the strip stays a stable overview. */
export async function getFeedbackSummary(): Promise<FeedbackSummary> {
    const [ratingAgg, typeAgg, open] = await Promise.all([
        FeedbackModel.aggregate<{ avg: number }>([
            { $match: { rating: { $exists: true, $ne: null } } },
            { $group: { _id: null, avg: { $avg: "$rating" } } },
        ]),
        FeedbackModel.aggregate<{ _id: string; count: number }>([
            { $group: { _id: "$type", count: { $sum: 1 } } },
        ]),
        FeedbackModel.countDocuments({ status: { $in: [...FEEDBACK_OPEN_STATUSES] } }),
    ])

    const countByType = Object.fromEntries(FEEDBACK_TYPES.map((type) => [type, 0]))
    for (const row of typeAgg) countByType[row._id] = row.count
    return { avgRating: ratingAgg[0]?.avg ?? null, countByType, open }
}

export async function listFeedback(query: AdminFeedbackQuery) {
    const filter = buildAdminFilter(query)
    const [items, total, summary] = await Promise.all([
        FeedbackModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((query.page - 1) * query.limit)
            .limit(query.limit)
            .lean(),
        FeedbackModel.countDocuments(filter),
        getFeedbackSummary(),
    ])
    return { items, total, page: query.page, limit: query.limit, summary }
}

export async function getFeedbackById(id: string) {
    const doc = await FeedbackModel.findById(id).lean()
    if (!doc) throw new NotFoundError("Feedback not found")
    return doc
}

export async function updateFeedbackAdmin(id: string, patch: UpdateFeedbackAdminRequest) {
    const doc = await FeedbackModel.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean()
    if (!doc) throw new NotFoundError("Feedback not found")
    return doc
}
