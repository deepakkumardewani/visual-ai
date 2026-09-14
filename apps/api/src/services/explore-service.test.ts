import { beforeEach, describe, expect, it, vi } from "vitest"

import { UserModel as User } from "../models/user.js"
import { getExploreFeed, getExploreItemById } from "./explore-service.js"

const VALID_ID = "507f1f77bcf86cd799439011"
const VALID_ID_2 = "507f191e810c19729de860ea"
const CREATED_AT = new Date("2024-06-15T10:00:00.000Z")

vi.mock("../config/env.js", () => ({
    env: { CLOUDINARY_CLOUD_NAME: "demo-cloud" },
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    }),
}))

vi.mock("../models/user.js", () => ({
    UserModel: {
        aggregate: vi.fn(),
    },
}))

function exploreRow(overrides: Record<string, unknown> = {}) {
    return {
        id: VALID_ID,
        prompt: "a lighthouse at dusk",
        modelName: "FLUX_PRO",
        createdAt: CREATED_AT,
        aspectRatio: "16:9",
        aiImagePublicId: "user1/img-abc",
        aiImageUrl: "https://cdn.example.com/fallback.jpg",
        authorUserId: "user_abc",
        author: "Ada Lovelace",
        ...overrides,
    }
}

describe("getExploreFeed", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("throws when excludeUserId is missing", async () => {
        await expect(getExploreFeed({ excludeUserId: "" })).rejects.toMatchObject({
            statusCode: 400,
            message: "excludeUserId is required",
        })
        await expect(getExploreFeed({ excludeUserId: "   " })).rejects.toThrow(
            "excludeUserId is required",
        )
        expect(User.aggregate).not.toHaveBeenCalled()
    })

    it("returns mapped items with Cloudinary URL from public id", async () => {
        vi.mocked(User.aggregate).mockResolvedValue([exploreRow()])

        const result = await getExploreFeed({ excludeUserId: "viewer_1" })

        expect(result.items).toHaveLength(1)
        expect(result.items[0]).toMatchObject({
            id: VALID_ID,
            imageUrl:
                "https://res.cloudinary.com/demo-cloud/image/upload/q_auto,f_auto/user1/img-abc",
            aspectRatio: "16:9",
            prompt: "a lighthouse at dusk",
            modelName: "FLUX_PRO",
            author: "Ada Lovelace",
            authorUserId: "user_abc",
            createdAt: CREATED_AT.toISOString(),
        })
        expect(result.nextCursor).toBeNull()
    })

    it("falls back to aiImageUrl when public id is absent", async () => {
        vi.mocked(User.aggregate).mockResolvedValue([
            exploreRow({
                aiImagePublicId: undefined,
                aiImageUrl: "https://cdn.example.com/fb.jpg",
            }),
        ])

        const result = await getExploreFeed({ excludeUserId: "viewer_1" })

        expect(result.items[0]?.imageUrl).toBe("https://cdn.example.com/fb.jpg")
    })

    it("drops rows that have no image URL", async () => {
        vi.mocked(User.aggregate).mockResolvedValue([
            exploreRow({ aiImagePublicId: undefined, aiImageUrl: undefined }),
            exploreRow({ id: VALID_ID_2 }),
        ])

        const result = await getExploreFeed({ excludeUserId: "viewer_1" })

        expect(result.items).toHaveLength(1)
        expect(result.items[0]?.id).toBe(VALID_ID_2)
    })

    it("applies default field fallbacks for empty mapped values", async () => {
        vi.mocked(User.aggregate).mockResolvedValue([
            exploreRow({
                aspectRatio: "",
                prompt: "",
                modelName: "",
                author: "",
                createdAt: "2024-01-01T00:00:00.000Z",
            }),
        ])

        const result = await getExploreFeed({ excludeUserId: "viewer_1" })

        expect(result.items[0]).toMatchObject({
            aspectRatio: "1:1",
            prompt: "",
            modelName: "",
            author: "Creator",
            createdAt: "2024-01-01T00:00:00.000Z",
        })
    })

    it("uses default page size 24 when limit is omitted or NaN", async () => {
        vi.mocked(User.aggregate).mockResolvedValue([])

        await getExploreFeed({ excludeUserId: "viewer_1" })
        expect(User.aggregate).toHaveBeenCalledWith(expect.arrayContaining([{ $limit: 25 }]))

        await getExploreFeed({ excludeUserId: "viewer_1", limit: Number.NaN })
        expect(User.aggregate).toHaveBeenLastCalledWith(expect.arrayContaining([{ $limit: 25 }]))
    })

    it("clamps limit between 1 and 48", async () => {
        vi.mocked(User.aggregate).mockResolvedValue([])

        await getExploreFeed({ excludeUserId: "viewer_1", limit: 0 })
        expect(User.aggregate).toHaveBeenLastCalledWith(expect.arrayContaining([{ $limit: 2 }]))

        await getExploreFeed({ excludeUserId: "viewer_1", limit: 200 })
        expect(User.aggregate).toHaveBeenLastCalledWith(expect.arrayContaining([{ $limit: 49 }]))
    })

    it("returns nextCursor when an extra row indicates another page", async () => {
        const page = [
            exploreRow({ id: VALID_ID, createdAt: CREATED_AT }),
            exploreRow({ id: VALID_ID_2, createdAt: new Date("2024-06-14T10:00:00.000Z") }),
        ]
        vi.mocked(User.aggregate).mockResolvedValue(page)

        const result = await getExploreFeed({ excludeUserId: "viewer_1", limit: 1 })

        expect(result.items).toHaveLength(1)
        expect(result.nextCursor).toBe(`${CREATED_AT.toISOString()}_${VALID_ID}`)
    })

    it("keeps nextCursor null when extra rows exist but page items have no images", async () => {
        vi.mocked(User.aggregate).mockResolvedValue([
            exploreRow({ aiImagePublicId: undefined, aiImageUrl: "" }),
            exploreRow({ id: VALID_ID_2, aiImagePublicId: undefined, aiImageUrl: "" }),
        ])

        const result = await getExploreFeed({ excludeUserId: "viewer_1", limit: 1 })

        expect(result.items).toEqual([])
        expect(result.nextCursor).toBeNull()
    })

    it("applies cursor filter for a valid cursor", async () => {
        vi.mocked(User.aggregate).mockResolvedValue([])
        const cursor = `${CREATED_AT.toISOString()}_${VALID_ID}`

        await getExploreFeed({ excludeUserId: "viewer_1", cursor })

        const pipeline = vi.mocked(User.aggregate).mock.calls[0]?.[0] as Array<
            Record<string, unknown>
        >
        const matchStage = pipeline.find((stage) => "$match" in stage) as {
            $match: Record<string, unknown>
        }
        expect(matchStage.$match.userId).toEqual({ $ne: "viewer_1" })
        expect(matchStage.$match.$or).toEqual([
            { "history.createdAt": { $lt: CREATED_AT } },
            {
                "history.createdAt": CREATED_AT,
                "history._id": { $lt: expect.anything() },
            },
        ])
    })

    it("rejects invalid cursors", async () => {
        await expect(
            getExploreFeed({ excludeUserId: "viewer_1", cursor: "no-separator" }),
        ).rejects.toThrow("Invalid cursor")
        await expect(
            getExploreFeed({ excludeUserId: "viewer_1", cursor: "_onlyid" }),
        ).rejects.toThrow("Invalid cursor")
        await expect(
            getExploreFeed({
                excludeUserId: "viewer_1",
                cursor: "not-a-date_507f1f77bcf86cd799439011",
            }),
        ).rejects.toThrow("Invalid cursor")
        await expect(
            getExploreFeed({
                excludeUserId: "viewer_1",
                cursor: `${CREATED_AT.toISOString()}_not-an-object-id`,
            }),
        ).rejects.toThrow("Invalid cursor")
    })
})

describe("getExploreItemById", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("rejects empty or invalid ids", async () => {
        await expect(getExploreItemById("")).rejects.toMatchObject({
            statusCode: 400,
            message: "Invalid item id",
        })
        await expect(getExploreItemById("   ")).rejects.toThrow("Invalid item id")
        await expect(getExploreItemById("not-valid")).rejects.toThrow("Invalid item id")
        expect(User.aggregate).not.toHaveBeenCalled()
    })

    it("throws NotFoundError when no row is returned", async () => {
        vi.mocked(User.aggregate).mockResolvedValue([])

        await expect(getExploreItemById(VALID_ID)).rejects.toMatchObject({
            statusCode: 404,
            message: "Explore item not found",
        })
    })

    it("throws NotFoundError when the row has no image URL", async () => {
        vi.mocked(User.aggregate).mockResolvedValue([
            exploreRow({ aiImagePublicId: undefined, aiImageUrl: "" }),
        ])

        await expect(getExploreItemById(VALID_ID)).rejects.toThrow("Explore item not found")
    })

    it("returns the mapped item on success", async () => {
        vi.mocked(User.aggregate).mockResolvedValue([exploreRow()])

        const item = await getExploreItemById(VALID_ID)

        expect(item.id).toBe(VALID_ID)
        expect(item.imageUrl).toContain("demo-cloud")
        expect(User.aggregate).toHaveBeenCalledWith(expect.arrayContaining([{ $limit: 1 }]))
    })
})
