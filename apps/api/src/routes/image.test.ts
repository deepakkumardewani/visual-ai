import { beforeEach, describe, expect, it, vi } from "vitest"

const imageService = vi.hoisted(() => ({
    toggleImageFavorite: vi.fn(),
    deleteUserImage: vi.fn(),
    deleteBulkUserImages: vi.fn(),
}))

vi.mock("../services/image-service.js", () => imageService)

const { imageRoutes } = await import("./image.js")

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
    const layer = imageRoutes.stack.find(
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

describe("imageRoutes", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("toggles favorite and returns the new state", async () => {
        imageService.toggleImageFavorite.mockResolvedValue({ isFavorite: true })
        const res = mockRes()
        await dispatch(
            "put",
            "/image/favorite",
            { body: { imageId: "img_1", userId: "user_1" } },
            res,
        )

        expect(imageService.toggleImageFavorite).toHaveBeenCalledWith("user_1", "img_1")
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ success: true, isFavorite: true })
    })

    it("propagates not-found errors from toggleImageFavorite", async () => {
        imageService.toggleImageFavorite.mockRejectedValue(new Error("Image not found"))
        const res = mockRes()
        await expect(
            dispatch(
                "put",
                "/image/favorite",
                { body: { imageId: "missing", userId: "user_1" } },
                res,
            ),
        ).rejects.toMatchObject({ message: "Image not found" })
    })

    it("deletes a single image", async () => {
        imageService.deleteUserImage.mockResolvedValue(undefined)
        const image = { _id: "img_1", url: "https://cdn.example/img.png" }
        const res = mockRes()
        await dispatch("delete", "/image/delete", { body: { image, userId: "user_1" } }, res)

        expect(imageService.deleteUserImage).toHaveBeenCalledWith("user_1", "img_1")
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({
            success: true,
            image,
            message: "Image deleted successfully",
        })
    })

    it("deletes images in bulk", async () => {
        imageService.deleteBulkUserImages.mockResolvedValue(undefined)
        const res = mockRes()
        await dispatch(
            "delete",
            "/image/delete/bulk",
            {
                body: {
                    userId: "user_1",
                    publicIds: ["pub_1"],
                    imageIds: ["img_1", "img_2"],
                },
            },
            res,
        )

        expect(imageService.deleteBulkUserImages).toHaveBeenCalledWith(
            "user_1",
            ["pub_1"],
            ["img_1", "img_2"],
        )
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({
            success: true,
            message: "Images deleted successfully",
        })
    })
})
