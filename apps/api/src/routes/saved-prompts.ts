import { CreateSavedPromptSchema, type SavedPrompt } from "@visual-ai/shared"
import { Router } from "express"
import { Request, Response } from "express"
import mongoose from "mongoose"

import { asyncHandler } from "../lib/async-handler.js"
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from "../lib/errors.js"
import { ClerkExpressRequireAuth } from "../middlewares/clerk.js"
import { SavedPromptModel } from "../models/saved-prompt.js"

const LIST_CAP = 100

export const savedPromptsRoutes = Router()

function requireUserId(req: Request): string {
    const userId = req.auth?.userId
    if (!userId) {
        throw new UnauthorizedError()
    }
    return userId
}

function toDto(doc: {
    _id: mongoose.Types.ObjectId
    name: string
    prompt: string
    modelId?: string | null
    createdAt: Date
}): SavedPrompt {
    return {
        id: String(doc._id),
        name: doc.name,
        prompt: doc.prompt,
        ...(doc.modelId ? { modelId: doc.modelId } : {}),
        createdAt: doc.createdAt.toISOString(),
    }
}

savedPromptsRoutes.get(
    "/saved-prompts",
    // @ts-ignore — Clerk middleware typing
    ClerkExpressRequireAuth({}),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req)
        const docs = await SavedPromptModel.find({ userId })
            .sort({ createdAt: -1 })
            .limit(LIST_CAP)
            .lean()

        res.status(200).json({
            prompts: docs.map((doc) =>
                toDto({
                    _id: doc._id as mongoose.Types.ObjectId,
                    name: doc.name,
                    prompt: doc.prompt,
                    modelId: doc.modelId,
                    createdAt: doc.createdAt as Date,
                }),
            ),
        })
    }),
)

savedPromptsRoutes.post(
    "/saved-prompts",
    // @ts-ignore — Clerk middleware typing
    ClerkExpressRequireAuth({}),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req)
        const parsed = CreateSavedPromptSchema.safeParse(req.body)
        if (!parsed.success) {
            const message = parsed.error.issues[0]?.message ?? "Invalid request"
            throw new BadRequestError(message)
        }

        const { name, prompt, modelId } = parsed.data
        const doc = await SavedPromptModel.create({
            userId,
            name,
            prompt,
            ...(modelId ? { modelId } : {}),
        })

        res.status(201).json({
            prompt: toDto({
                _id: doc._id as mongoose.Types.ObjectId,
                name: doc.name,
                prompt: doc.prompt,
                modelId: doc.modelId,
                createdAt: doc.createdAt,
            }),
        })
    }),
)

savedPromptsRoutes.delete(
    "/saved-prompts/:id",
    // @ts-ignore — Clerk middleware typing
    ClerkExpressRequireAuth({}),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req)
        const id = typeof req.params.id === "string" ? req.params.id : ""
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            throw new BadRequestError("Invalid prompt id")
        }

        const doc = await SavedPromptModel.findById(id)
        if (!doc) {
            throw new NotFoundError("Saved prompt not found")
        }
        if (doc.userId !== userId) {
            throw new ForbiddenError("You do not own this saved prompt")
        }

        await doc.deleteOne()
        res.status(200).json({ success: true })
    }),
)
