import {
    AdminFeedbackQuerySchema,
    CreateFeedbackSchema,
    FeedbackEligibilityRequestSchema,
    UpdateFeedbackAdminSchema,
} from "@visual-ai/shared"
import { Router, type Request, type Response } from "express"
import mongoose from "mongoose"

import { asyncHandler } from "../lib/async-handler.js"
import { BadRequestError, UnauthorizedError } from "../lib/errors.js"
import {
    feedbackAdminRateLimiter,
    feedbackRateLimiter,
} from "../middlewares/feedback-rate-limit.js"
import { isAdminUser, requireAdmin } from "../middlewares/require-admin.js"
import type { IFeedback } from "../models/feedback.js"
import {
    claimFeedbackPrompt,
    getFeedbackById,
    listFeedback,
    submitFeedback,
    updateFeedbackAdmin,
} from "../services/feedback-service.js"

export const feedbackRoutes = Router()

type FeedbackDoc = IFeedback & { _id: mongoose.Types.ObjectId }

function requireUserId(req: Request): string {
    const userId = req.auth?.userId
    if (!userId) {
        throw new UnauthorizedError()
    }
    return userId
}

function requireObjectId(id: string): string {
    if (!mongoose.isValidObjectId(id)) {
        throw new BadRequestError("Invalid feedback id")
    }
    return id
}

function toDto({ _id, ...doc }: FeedbackDoc) {
    return {
        id: String(_id),
        ...doc,
        createdAt: new Date(doc.createdAt).toISOString(),
        updatedAt: new Date(doc.updatedAt).toISOString(),
    }
}

const userGuards = [feedbackRateLimiter]
const adminGuards = [feedbackAdminRateLimiter, requireAdmin]

feedbackRoutes.post(
    "/feedback/eligibility",
    ...userGuards,
    asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req)
        const parsed = FeedbackEligibilityRequestSchema.safeParse(req.body)
        if (!parsed.success) {
            throw new BadRequestError(parsed.error.issues[0]?.message ?? "Invalid request")
        }
        const eligible = await claimFeedbackPrompt(userId, parsed.data.trigger)
        res.status(200).json({ eligible })
    }),
)

feedbackRoutes.post(
    "/feedback",
    ...userGuards,
    asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req)
        const parsed = CreateFeedbackSchema.safeParse(req.body)
        if (!parsed.success) {
            throw new BadRequestError(parsed.error.issues[0]?.message ?? "Invalid feedback")
        }
        const id = await submitFeedback(userId, parsed.data)
        res.status(201).json({ id })
    }),
)

feedbackRoutes.get(
    "/feedback/admin/access",
    feedbackAdminRateLimiter,
    (req: Request, res: Response) => {
        res.status(200).json({ isAdmin: isAdminUser(req.auth?.userId) })
    },
)

feedbackRoutes.get(
    "/feedback/admin",
    ...adminGuards,
    asyncHandler(async (req: Request, res: Response) => {
        const parsed = AdminFeedbackQuerySchema.safeParse(req.query)
        if (!parsed.success) {
            throw new BadRequestError(parsed.error.issues[0]?.message ?? "Invalid query")
        }
        const { items, ...rest } = await listFeedback(parsed.data)
        res.status(200).json({ items: (items as FeedbackDoc[]).map(toDto), ...rest })
    }),
)

feedbackRoutes.get(
    "/feedback/admin/:id",
    ...adminGuards,
    asyncHandler(async (req: Request, res: Response) => {
        const doc = await getFeedbackById(requireObjectId(String(req.params.id)))
        res.status(200).json({ item: toDto(doc as FeedbackDoc) })
    }),
)

feedbackRoutes.patch(
    "/feedback/admin/:id",
    ...adminGuards,
    asyncHandler(async (req: Request, res: Response) => {
        const id = requireObjectId(String(req.params.id))
        const parsed = UpdateFeedbackAdminSchema.safeParse(req.body)
        if (!parsed.success) {
            throw new BadRequestError(parsed.error.issues[0]?.message ?? "Invalid update")
        }
        if (parsed.data.status === undefined && parsed.data.adminNote === undefined) {
            throw new BadRequestError("Provide status or adminNote")
        }
        const doc = await updateFeedbackAdmin(id, parsed.data)
        res.status(200).json({ item: toDto(doc as FeedbackDoc) })
    }),
)
