import { beforeEach, describe, expect, it, vi } from "vitest"

const collectionService = vi.hoisted(() => ({
    addImagesToCollection: vi.fn(),
    createCollection: vi.fn(),
    deleteCollection: vi.fn(),
    listCollections: vi.fn(),
    removeImagesFromCollection: vi.fn(),
    renameCollection: vi.fn(),
}))

vi.mock("../services/collection-service.js", () => collectionService)

const { collectionRoutes } = await import("./collections.js")

function mockRes() {
    return {
        statusCode: 0,
        body: undefined as unknown,
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(data: unknown) {
            this.body = data
            return this
        },
    }
}

async function dispatch(method: string, path: string, req: object, res: object) {
    const layer = collectionRoutes.stack.find(
        (entry: any) => entry.route?.path === path && entry.route.methods[method],
    )
    if (!layer) {
        throw new Error(`Missing route ${method.toUpperCase()} ${path}`)
    }
    const handles = layer.route.stack.map((item: any) => item.handle)
    let index = 0
    let rejected: unknown
    const next = async (err?: unknown) => {
        if (err) {
            rejected = err
            return
        }
        const handle = handles[index++]
        if (!handle) return
        await handle(req, res, next)
    }
    await next()
    if (rejected) throw rejected
}

describe("collectionRoutes", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("lists collections for a userId query", async () => {
        collectionService.listCollections.mockResolvedValue([{ id: "col_1", name: "Favorites" }])
        const res = mockRes()
        await dispatch("get", "/collections", { query: { userId: "user_1" } }, res)

        expect(collectionService.listCollections).toHaveBeenCalledWith("user_1")
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({
            success: true,
            collections: [{ id: "col_1", name: "Favorites" }],
        })
    })

    it("treats a missing userId query as an empty string", async () => {
        collectionService.listCollections.mockResolvedValue([])
        const res = mockRes()
        await dispatch("get", "/collections", { query: {} }, res)
        expect(collectionService.listCollections).toHaveBeenCalledWith("")
    })

    it("treats a non-string userId query as an empty string", async () => {
        collectionService.listCollections.mockResolvedValue([])
        const res = mockRes()
        await dispatch("get", "/collections", { query: { userId: ["user_1"] } }, res)
        expect(collectionService.listCollections).toHaveBeenCalledWith("")
    })

    it("creates a collection", async () => {
        collectionService.createCollection.mockResolvedValue({ id: "col_2", name: "Landscapes" })
        const res = mockRes()
        await dispatch(
            "post",
            "/collections",
            { body: { userId: "user_1", name: "Landscapes" } },
            res,
        )

        expect(collectionService.createCollection).toHaveBeenCalledWith("user_1", "Landscapes")
        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({
            success: true,
            collection: { id: "col_2", name: "Landscapes" },
        })
    })

    it("renames a collection", async () => {
        collectionService.renameCollection.mockResolvedValue({ id: "col_2", name: "Seascapes" })
        const res = mockRes()
        await dispatch(
            "patch",
            "/collections/:id",
            { params: { id: "col_2" }, body: { userId: "user_1", name: "Seascapes" } },
            res,
        )

        expect(collectionService.renameCollection).toHaveBeenCalledWith(
            "col_2",
            "user_1",
            "Seascapes",
        )
        expect(res.statusCode).toBe(200)
    })

    it("passes an empty id when the route param is not a string", async () => {
        collectionService.renameCollection.mockResolvedValue({ id: "", name: "X" })
        const res = mockRes()
        await dispatch(
            "patch",
            "/collections/:id",
            { params: { id: ["col_2"] }, body: { userId: "user_1", name: "X" } },
            res,
        )
        expect(collectionService.renameCollection).toHaveBeenCalledWith("", "user_1", "X")
    })

    it("deletes a collection using body userId", async () => {
        collectionService.deleteCollection.mockResolvedValue(undefined)
        const res = mockRes()
        await dispatch(
            "delete",
            "/collections/:id",
            { params: { id: "col_2" }, body: { userId: "user_1" }, query: {} },
            res,
        )

        expect(collectionService.deleteCollection).toHaveBeenCalledWith("col_2", "user_1")
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ success: true, message: "Collection deleted" })
    })

    it("deletes a collection using query userId when body is empty", async () => {
        collectionService.deleteCollection.mockResolvedValue(undefined)
        const res = mockRes()
        await dispatch(
            "delete",
            "/collections/:id",
            { params: { id: "col_2" }, body: {}, query: { userId: "user_1" } },
            res,
        )
        expect(collectionService.deleteCollection).toHaveBeenCalledWith("col_2", "user_1")
    })

    it("falls back to query userId when body userId is not a string", async () => {
        collectionService.deleteCollection.mockResolvedValue(undefined)
        const res = mockRes()
        await dispatch(
            "delete",
            "/collections/:id",
            { params: { id: "col_2" }, body: { userId: 123 }, query: { userId: "user_1" } },
            res,
        )
        expect(collectionService.deleteCollection).toHaveBeenCalledWith("col_2", "user_1")
    })

    it("uses empty strings when delete is missing body and query userId", async () => {
        collectionService.deleteCollection.mockResolvedValue(undefined)
        const res = mockRes()
        await dispatch("delete", "/collections/:id", { params: { id: "col_2" }, query: {} }, res)
        expect(collectionService.deleteCollection).toHaveBeenCalledWith("col_2", "")
    })

    it("adds images to a collection", async () => {
        collectionService.addImagesToCollection.mockResolvedValue({
            id: "col_2",
            imageIds: ["img_1"],
        })
        const res = mockRes()
        await dispatch(
            "post",
            "/collections/:id/images",
            { params: { id: "col_2" }, body: { userId: "user_1", imageIds: ["img_1"] } },
            res,
        )

        expect(collectionService.addImagesToCollection).toHaveBeenCalledWith("col_2", "user_1", [
            "img_1",
        ])
        expect(res.statusCode).toBe(200)
    })

    it("removes images from a collection", async () => {
        collectionService.removeImagesFromCollection.mockResolvedValue({
            id: "col_2",
            imageIds: [],
        })
        const res = mockRes()
        await dispatch(
            "delete",
            "/collections/:id/images",
            { params: { id: "col_2" }, body: { userId: "user_1", imageIds: ["img_1"] } },
            res,
        )

        expect(collectionService.removeImagesFromCollection).toHaveBeenCalledWith(
            "col_2",
            "user_1",
            ["img_1"],
        )
        expect(res.statusCode).toBe(200)
    })

    it("propagates service not-found errors", async () => {
        const error = Object.assign(new Error("Collection not found"), { statusCode: 404 })
        collectionService.renameCollection.mockRejectedValue(error)
        const res = mockRes()
        await expect(
            dispatch(
                "patch",
                "/collections/:id",
                { params: { id: "missing" }, body: { userId: "user_1", name: "X" } },
                res,
            ),
        ).rejects.toMatchObject({ message: "Collection not found" })
    })
})
