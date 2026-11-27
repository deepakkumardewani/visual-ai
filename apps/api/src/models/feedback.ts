import {
    FEEDBACK_SOURCES,
    FEEDBACK_STATUSES,
    FEEDBACK_TYPES,
    type FeedbackSource,
    type FeedbackStatus,
    type FeedbackType,
} from "@visual-ai/shared"
import mongoose from "mongoose"

const Schema = mongoose.Schema

export interface IFeedback {
    userId: string
    email: string
    source: FeedbackSource
    type: FeedbackType
    rating?: number
    message: string
    testimonialConsent: boolean
    displayName?: string
    context: {
        route?: string
        lastModelId?: string
        plan?: string
        creditsTier?: string
        appVersion?: string
        userAgent?: string
        viewport?: { w: number; h: number }
    }
    status: FeedbackStatus
    adminNote: string
    createdAt: Date
    updatedAt: Date
}

const ContextSchema = new Schema(
    {
        route: { type: String },
        lastModelId: { type: String },
        plan: { type: String },
        creditsTier: { type: String },
        appVersion: { type: String },
        userAgent: { type: String },
        viewport: { w: { type: Number }, h: { type: Number } },
    },
    { _id: false },
)

const FeedbackSchema = new Schema<IFeedback>(
    {
        userId: { type: String, required: true, index: true },
        // Not required: users without an email store "" and Mongoose rejects "" on required strings.
        email: { type: String, default: "" },
        source: { type: String, enum: FEEDBACK_SOURCES, required: true },
        type: { type: String, enum: FEEDBACK_TYPES, required: true },
        rating: { type: Number },
        message: { type: String, default: "" },
        testimonialConsent: { type: Boolean, default: false },
        displayName: { type: String },
        context: { type: ContextSchema, default: () => ({}) },
        status: { type: String, enum: FEEDBACK_STATUSES, default: "new" },
        adminNote: { type: String, default: "" },
    },
    { timestamps: true, collection: "feedback" },
)

FeedbackSchema.index({ status: 1, createdAt: -1 })
FeedbackSchema.index({ createdAt: -1 })
FeedbackSchema.index({ type: 1, createdAt: -1 })

export const FeedbackModel = mongoose.model<IFeedback>("Feedback", FeedbackSchema)
