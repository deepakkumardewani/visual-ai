import { Router } from "express"
import { Request, Response } from "express"

import { asyncHandler } from "../lib/async-handler.js"
import {
    addImagesToCollection,
    createCollection,
    deleteCollection,
    listCollections,
    removeImagesFromCollection,
    renameCollection,
} from "../services/collection-service.js"

export const collectionRoutes = Router()

function routeParam(value: string | string[] | undefined): string {
    return typeof value === "string" ? value : ""
}

function queryString(value: unknown): string {
    return typeof value === "string" ? value : ""
}

collectionRoutes.get(
    "/collections",
    asyncHandler(async (req: Request, res: Response) => {
        const userId = queryString(req.query.userId)
        const collections = await listCollections(userId)
        res.status(200).json({ success: true, collections })
    }),
)

collectionRoutes.post(
    "/collections",
    asyncHandler(async (req: Request, res: Response) => {
        const { userId, name } = req.body
        const collection = await createCollection(userId, name)
        res.status(201).json({ success: true, collection })
    }),
)

collectionRoutes.patch(
    "/collections/:id",
    asyncHandler(async (req: Request, res: Response) => {
        const { userId, name } = req.body
        const collection = await renameCollection(routeParam(req.params.id), userId, name)
        res.status(200).json({ success: true, collection })
    }),
)

collectionRoutes.delete(
    "/collections/:id",
    asyncHandler(async (req: Request, res: Response) => {
        const userId = queryString(req.body?.userId) || queryString(req.query.userId)
        await deleteCollection(routeParam(req.params.id), userId)
        res.status(200).json({ success: true, message: "Collection deleted" })
    }),
)

collectionRoutes.post(
    "/collections/:id/images",
    asyncHandler(async (req: Request, res: Response) => {
        const { userId, imageIds } = req.body
        const collection = await addImagesToCollection(routeParam(req.params.id), userId, imageIds)
        res.status(200).json({ success: true, collection })
    }),
)

collectionRoutes.delete(
    "/collections/:id/images",
    asyncHandler(async (req: Request, res: Response) => {
        const { userId, imageIds } = req.body
        const collection = await removeImagesFromCollection(
            routeParam(req.params.id),
            userId,
            imageIds,
        )
        res.status(200).json({ success: true, collection })
    }),
)
