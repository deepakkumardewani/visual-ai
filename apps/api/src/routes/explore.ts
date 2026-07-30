import { Router, type Request, type Response } from "express"

import { asyncHandler } from "../lib/async-handler.js"
import { getExploreFeed, getExploreItemById } from "../services/explore-service.js"

export const exploreRoutes = Router()

exploreRoutes.get(
    "/explore/feed",
    asyncHandler(async (req: Request, res: Response) => {
        const excludeUserId =
            typeof req.query.excludeUserId === "string" ? req.query.excludeUserId : ""
        const cursor = typeof req.query.cursor === "string" ? req.query.cursor : null
        const limit = req.query.limit ? Number(req.query.limit) : undefined

        const feed = await getExploreFeed({ excludeUserId, cursor, limit })
        res.status(200).json(feed)
    }),
)

exploreRoutes.get(
    "/explore/items/:id",
    asyncHandler(async (req: Request, res: Response) => {
        const item = await getExploreItemById(String(req.params.id ?? ""))
        res.status(200).json(item)
    }),
)
