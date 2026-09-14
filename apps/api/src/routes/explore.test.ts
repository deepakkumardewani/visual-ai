import { beforeEach, describe, expect, it, vi } from "vitest"

const exploreService = vi.hoisted(() => ({
    getExploreFeed: vi.fn(),
    getExploreItemById: vi.fn(),
}))

vi.mock("../services/explore-service.js", () => exploreService)

const { exploreRoutes } = await import("./explore.js")

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
    const layer = exploreRoutes.stack.find(
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

describe("exploreRoutes", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("GET /explore/feed", () => {
        it("returns the explore feed with parsed query params", async () => {
            const feed = { items: [{ id: "exp_1" }], nextCursor: "c2" }
            exploreService.getExploreFeed.mockResolvedValue(feed)
            const res = mockRes()
            await dispatch(
                "get",
                "/explore/feed",
                { query: { excludeUserId: "user_1", cursor: "c1", limit: "12" } },
                res,
            )

            expect(exploreService.getExploreFeed).toHaveBeenCalledWith({
                excludeUserId: "user_1",
                cursor: "c1",
                limit: 12,
            })
            expect(res.statusCode).toBe(200)
            expect(res.body).toEqual(feed)
        })

        it("defaults excludeUserId, cursor, and limit when query is empty", async () => {
            exploreService.getExploreFeed.mockResolvedValue({ items: [], nextCursor: null })
            const res = mockRes()
            await dispatch("get", "/explore/feed", { query: {} }, res)

            expect(exploreService.getExploreFeed).toHaveBeenCalledWith({
                excludeUserId: "",
                cursor: null,
                limit: undefined,
            })
        })
    })

    describe("GET /explore/items/:id", () => {
        it("returns a single explore item", async () => {
            const item = { id: "exp_1", prompt: "aurora" }
            exploreService.getExploreItemById.mockResolvedValue(item)
            const res = mockRes()
            await dispatch("get", "/explore/items/:id", { params: { id: "exp_1" } }, res)

            expect(exploreService.getExploreItemById).toHaveBeenCalledWith("exp_1")
            expect(res.statusCode).toBe(200)
            expect(res.body).toEqual(item)
        })

        it("propagates not-found errors", async () => {
            exploreService.getExploreItemById.mockRejectedValue(new Error("Explore item not found"))
            const res = mockRes()
            await expect(
                dispatch("get", "/explore/items/:id", { params: { id: "missing" } }, res),
            ).rejects.toMatchObject({ message: "Explore item not found" })
        })

        it("passes an empty string when id is missing", async () => {
            exploreService.getExploreItemById.mockResolvedValue(null)
            const res = mockRes()
            await dispatch("get", "/explore/items/:id", { params: {} }, res)
            expect(exploreService.getExploreItemById).toHaveBeenCalledWith("")
        })
    })
})
