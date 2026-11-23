import { beforeEach, describe, expect, it, vi } from "vitest"

import { FeatureType, HISTORY_CAP, PLAN } from "@visual-ai/shared"
import type { MediaAssetDto } from "@visual-ai/shared"

const MediaAssetModel = vi.hoisted(() => ({
    create: vi.fn(),
    countDocuments: vi.fn(),
    findOneAndUpdate: vi.fn(),
    deleteOne: vi.fn(),
    deleteMany: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
}))
const User = vi.hoisted(() => ({ findOne: vi.fn() }))
const uploadMediaToCloudinary = vi.hoisted(() => vi.fn())
const deleteMediaByPublicIds = vi.hoisted(() => vi.fn())
const resolveUserIsPro = vi.hoisted(() => vi.fn())
const isE2eUser = vi.hoisted(() => vi.fn(() => false))

vi.mock("../models/media-asset.js", () => ({ MediaAssetModel }))
vi.mock("../models/user.js", () => ({ UserModel: User }))
vi.mock("../utils/cloudinary.js", () => ({
    uploadMediaToCloudinary,
    buildMediaFolder: (userId: string, feature: string) => `base/${userId}/${feature}`,
}))
vi.mock("../lib/e2e-user.js", () => ({ isE2eUser }))
vi.mock("./cloudinary-service.js", () => ({ deleteMediaByPublicIds }))
vi.mock("./generation-service.js", () => ({ resolveUserIsPro }))
vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({ debug: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

const service = await import("./media-asset-service.js")

const OID_A = "507f1f77bcf86cd799439011"
const OID_B = "507f1f77bcf86cd799439012"
const OID_C = "507f1f77bcf86cd799439013"
const CREATED = new Date("2026-01-02T03:04:05.000Z")

function doc(overrides: Record<string, unknown> = {}) {
    return {
        _id: { toString: () => OID_A },
        type: "audio",
        feature: FeatureType.MUSIC,
        modelKey: "LYRIA_2",
        title: "calm piano",
        url: "https://res.example.com/a.mp3",
        publicId: "base/u/music/a",
        prompt: "calm piano",
        creditsCharged: 12,
        saved: true,
        createdAt: CREATED,
        ...overrides,
    }
}

function setHistory(images: number, media: number) {
    User.findOne.mockReturnValue({
        lean: async () => ({ history: Array.from({ length: images }, () => ({})) }),
    })
    MediaAssetModel.countDocuments.mockResolvedValue(media)
}

/** find() returns a chainable query that resolves to the given rows. */
function setFind(rows: unknown[]) {
    const limit = vi.fn(async () => rows)
    const sort = vi.fn(() => ({ limit }))
    MediaAssetModel.find.mockReturnValueOnce({ sort })
    return { sort, limit }
}

const persistArgs = {
    userId: "user_1",
    jobId: "job_1",
    modelKey: "LYRIA_2",
    featureType: FeatureType.MUSIC,
    prompt: "calm piano",
    outputUrl: "https://replicate.example/out.mp3",
    creditsCharged: 12,
}

beforeEach(() => {
    vi.clearAllMocks()
    resolveUserIsPro.mockResolvedValue(false)
    setHistory(0, 0)
})

describe("toMediaAssetDto", () => {
    it("maps every stored field and keeps publicId and params server-side", () => {
        const dto = service.toMediaAssetDto(
            doc({
                format: "mp3",
                bytes: 10,
                durationSec: 5,
                width: 1,
                height: 2,
                posterUrl: "p",
                transcriptUrl: "t",
                lyrics: "la",
                parentId: { toString: () => OID_B },
                params: { secret: "x" },
            }) as never,
        )

        expect(dto).toEqual({
            id: OID_A,
            type: "audio",
            feature: FeatureType.MUSIC,
            modelKey: "LYRIA_2",
            title: "calm piano",
            url: "https://res.example.com/a.mp3",
            format: "mp3",
            bytes: 10,
            durationSec: 5,
            width: 1,
            height: 2,
            posterUrl: "p",
            transcriptUrl: "t",
            prompt: "calm piano",
            lyrics: "la",
            parentId: OID_B,
            creditsCharged: 12,
            saved: true,
            createdAt: "2026-01-02T03:04:05.000Z",
        })
        expect(dto).not.toHaveProperty("publicId")
        expect(dto).not.toHaveProperty("params")
    })

    it("leaves absent optional fields undefined and drops an empty prompt", () => {
        const dto = service.toMediaAssetDto(doc({ prompt: "", format: null }) as never)

        expect(dto.format).toBeUndefined()
        expect(dto.prompt).toBeUndefined()
        expect(dto.parentId).toBeUndefined()
    })
})

describe("countUserHistory", () => {
    it("adds embedded image history and media rows", async () => {
        setHistory(3, 4)

        expect(await service.countUserHistory("user_1")).toBe(7)
        expect(MediaAssetModel.countDocuments).toHaveBeenCalledWith({ userId: "user_1" })
    })

    it("counts only media when the user has no document", async () => {
        User.findOne.mockReturnValue({ lean: async () => null })
        MediaAssetModel.countDocuments.mockResolvedValue(2)

        expect(await service.countUserHistory("user_1")).toBe(2)
    })

    it("counts only media when history is missing", async () => {
        User.findOne.mockReturnValue({ lean: async () => ({}) })
        MediaAssetModel.countDocuments.mockResolvedValue(1)

        expect(await service.countUserHistory("user_1")).toBe(1)
    })
})

describe("persistMediaAsset", () => {
    const freeCap = HISTORY_CAP[PLAN.FREE]

    it("creates the row with mapped fields when below the cap", async () => {
        MediaAssetModel.create.mockResolvedValue(doc({ url: persistArgs.outputUrl }))

        const result = await service.persistMediaAsset({ ...persistArgs, params: { seed: 1 } })

        expect(MediaAssetModel.create).toHaveBeenCalledWith({
            type: "audio",
            feature: FeatureType.MUSIC,
            modelKey: "LYRIA_2",
            title: "calm piano",
            url: persistArgs.outputUrl,
            prompt: "calm piano",
            creditsCharged: 12,
            userId: "user_1",
            jobId: "job_1",
            params: { seed: 1 },
            saved: true,
        })
        expect(result.saved).toBe(true)
        expect(result.id).toBe(OID_A)
    })

    it("truncates the title to 60 characters", async () => {
        MediaAssetModel.create.mockResolvedValue(doc())

        await service.persistMediaAsset({ ...persistArgs, prompt: "x".repeat(100) })

        expect(MediaAssetModel.create.mock.calls[0][0].title).toBe("x".repeat(60))
    })

    it.each([FeatureType.VIDEO, FeatureType.WATERMARK_VIDEO, FeatureType.AUTOCAPTION])(
        "stores %s as a video",
        async (featureType) => {
            MediaAssetModel.create.mockResolvedValue(doc())

            await service.persistMediaAsset({ ...persistArgs, featureType })

            expect(MediaAssetModel.create.mock.calls[0][0].type).toBe("video")
        },
    )

    it("saves at cap-1", async () => {
        setHistory(freeCap - 1, 0)
        MediaAssetModel.create.mockResolvedValue(doc())

        const result = await service.persistMediaAsset(persistArgs)

        expect(result.saved).toBe(true)
        expect(MediaAssetModel.create).toHaveBeenCalledTimes(1)
    })

    it.each([freeCap, freeCap + 1])(
        "returns the asset unsaved and writes no row at count %i",
        async (count) => {
            setHistory(count - 2, 2)

            const result = await service.persistMediaAsset(persistArgs)

            expect(MediaAssetModel.create).not.toHaveBeenCalled()
            expect(result).toMatchObject({
                id: "job_1",
                saved: false,
                url: persistArgs.outputUrl,
                creditsCharged: 12,
            })
        },
    )

    it("applies the higher Pro cap", async () => {
        resolveUserIsPro.mockResolvedValue(true)
        setHistory(freeCap, 0)
        MediaAssetModel.create.mockResolvedValue(doc())

        const result = await service.persistMediaAsset(persistArgs)

        expect(result.saved).toBe(true)
    })
})

describe("copyMediaAssetToCloudinary", () => {
    const asset = { id: OID_A, feature: FeatureType.MUSIC, url: "https://tmp/x", saved: true }

    it("returns an unsaved asset untouched without uploading", async () => {
        const unsaved = { ...asset, saved: false } as unknown as MediaAssetDto

        expect(await service.copyMediaAssetToCloudinary(unsaved, "user_1")).toBe(unsaved)
        expect(uploadMediaToCloudinary).not.toHaveBeenCalled()
    })

    it("uses a fake upload for an e2e user without calling Cloudinary", async () => {
        isE2eUser.mockReturnValueOnce(true)
        MediaAssetModel.findOneAndUpdate.mockResolvedValue(doc())

        await service.copyMediaAssetToCloudinary(asset as unknown as MediaAssetDto, "user_e2e")

        expect(uploadMediaToCloudinary).not.toHaveBeenCalled()
        const update = MediaAssetModel.findOneAndUpdate.mock.calls[0][1]
        expect(update.url).toContain("fake-cloudinary.invalid")
    })

    it("uploads to the user's folder and updates the owned row", async () => {
        uploadMediaToCloudinary.mockResolvedValue({
            url: "https://res/perm.mp3",
            publicId: "pid",
            format: "mp3",
            bytes: 9,
            durationSec: 3,
        })
        MediaAssetModel.findOneAndUpdate.mockResolvedValue(doc({ url: "https://res/perm.mp3" }))

        const result = await service.copyMediaAssetToCloudinary(
            asset as unknown as MediaAssetDto,
            "user_1",
        )

        expect(uploadMediaToCloudinary).toHaveBeenCalledWith(
            "https://tmp/x",
            `base/user_1/${FeatureType.MUSIC}`,
        )
        const [filter, update, options] = MediaAssetModel.findOneAndUpdate.mock.calls[0]
        expect(filter).toEqual({ _id: OID_A, userId: "user_1" })
        expect(update).toMatchObject({
            url: "https://res/perm.mp3",
            publicId: "pid",
            resourceType: "video",
            bytes: 9,
        })
        expect(options).toEqual({ new: true })
        expect(result.url).toBe("https://res/perm.mp3")
    })

    it("removes the row and rethrows when the upload fails", async () => {
        uploadMediaToCloudinary.mockRejectedValue(new Error("upload down"))

        await expect(
            service.copyMediaAssetToCloudinary(asset as unknown as MediaAssetDto, "user_1"),
        ).rejects.toThrow("upload down")
        expect(MediaAssetModel.deleteOne).toHaveBeenCalledWith({ _id: OID_A, userId: "user_1" })
    })

    it("removes the row and throws not found when the row vanished", async () => {
        uploadMediaToCloudinary.mockResolvedValue({ url: "u", publicId: "p", bytes: 1 })
        MediaAssetModel.findOneAndUpdate.mockResolvedValue(null)

        await expect(
            service.copyMediaAssetToCloudinary(asset as unknown as MediaAssetDto, "user_1"),
        ).rejects.toThrow("Asset not found")
        expect(MediaAssetModel.deleteOne).toHaveBeenCalledTimes(1)
    })
})

describe("discardMediaAsset", () => {
    it("deletes the owned row of a saved asset", async () => {
        await service.discardMediaAsset({ id: OID_A, saved: true } as MediaAssetDto, "user_1")

        expect(MediaAssetModel.deleteOne).toHaveBeenCalledWith({ _id: OID_A, userId: "user_1" })
    })

    it("does nothing for an unsaved asset", async () => {
        await service.discardMediaAsset({ id: "job_1", saved: false } as MediaAssetDto, "user_1")

        expect(MediaAssetModel.deleteOne).not.toHaveBeenCalled()
    })
})

describe("listMediaAssets", () => {
    const row = (id: string, ms: number) =>
        doc({ _id: { toString: () => id }, createdAt: new Date(ms) })

    it("scopes by user, sorts newest first and defaults the page size", async () => {
        const { sort, limit } = setFind([])

        const result = await service.listMediaAssets("user_1")

        expect(MediaAssetModel.find).toHaveBeenCalledWith({ userId: "user_1" })
        expect(sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 })
        expect(limit).toHaveBeenCalledWith(service.DEFAULT_PAGE_SIZE + 1)
        expect(result).toEqual({ items: [], nextCursor: null })
    })

    it("filters by type", async () => {
        setFind([])

        await service.listMediaAssets("user_1", { type: "video" })

        expect(MediaAssetModel.find).toHaveBeenCalledWith({ userId: "user_1", type: "video" })
    })

    it("clamps the limit into 1..MAX_PAGE_SIZE", async () => {
        const high = setFind([])
        await service.listMediaAssets("user_1", { limit: 9999 })
        expect(high.limit).toHaveBeenCalledWith(service.MAX_PAGE_SIZE + 1)

        const low = setFind([])
        await service.listMediaAssets("user_1", { limit: 0 })
        expect(low.limit).toHaveBeenCalledWith(2)
    })

    it("returns a next cursor that round-trips into the following query", async () => {
        setFind([row(OID_A, 3000), row(OID_B, 2000), row(OID_C, 1000)])

        const page = await service.listMediaAssets("user_1", { limit: 2 })

        expect(page.items.map((i) => i.id)).toEqual([OID_A, OID_B])
        expect(page.nextCursor).not.toBeNull()

        setFind([])
        await service.listMediaAssets("user_1", { cursor: page.nextCursor! })
        expect(MediaAssetModel.find).toHaveBeenLastCalledWith({
            userId: "user_1",
            $or: [
                { createdAt: { $lt: new Date(2000) } },
                { createdAt: new Date(2000), _id: { $lt: OID_B } },
            ],
        })
    })

    it("has no next cursor when the rows fit in one page", async () => {
        setFind([row(OID_A, 3000)])

        const page = await service.listMediaAssets("user_1", { limit: 2 })

        expect(page.nextCursor).toBeNull()
    })

    it.each([
        ["not base64 of a pair", "garbage"],
        ["bad timestamp", Buffer.from(`abc_${OID_A}`).toString("base64url")],
        ["missing id", Buffer.from("123").toString("base64url")],
        ["bad id", Buffer.from("123_nope").toString("base64url")],
    ])("rejects an invalid cursor (%s) with 400", async (_name, cursor) => {
        await expect(service.listMediaAssets("user_1", { cursor })).rejects.toMatchObject({
            statusCode: 400,
        })
        expect(MediaAssetModel.find).not.toHaveBeenCalled()
    })
})

describe("getMediaAsset", () => {
    it("returns the owned asset as a DTO", async () => {
        MediaAssetModel.findOne.mockResolvedValue(doc())

        const dto = await service.getMediaAsset("user_1", OID_A)

        expect(MediaAssetModel.findOne).toHaveBeenCalledWith({ _id: OID_A, userId: "user_1" })
        expect(dto.id).toBe(OID_A)
    })

    it("returns 404 for another user's or a missing asset", async () => {
        MediaAssetModel.findOne.mockResolvedValue(null)

        await expect(service.getMediaAsset("user_2", OID_A)).rejects.toMatchObject({
            statusCode: 404,
        })
    })

    it("returns 404 for a malformed id without querying", async () => {
        await expect(service.getMediaAsset("user_1", "not-an-id")).rejects.toMatchObject({
            statusCode: 404,
        })
        expect(MediaAssetModel.findOne).not.toHaveBeenCalled()
    })
})

describe("createVersion", () => {
    const parent = doc({ lyrics: "la", modelKey: "LYRIA_2" })

    it("creates a zero-credit child pointing at the parent", async () => {
        MediaAssetModel.findOne.mockResolvedValue(parent)
        uploadMediaToCloudinary.mockResolvedValue({
            url: "https://res/v.mp3",
            publicId: "vp",
            format: "mp3",
            bytes: 5,
            durationSec: 2,
        })
        MediaAssetModel.create.mockResolvedValue(doc({ url: "https://res/v.mp3" }))
        const file = Buffer.from("edit")

        await service.createVersion("user_1", OID_A, file)

        expect(uploadMediaToCloudinary).toHaveBeenCalledWith(
            file,
            `base/user_1/${FeatureType.MUSIC}`,
        )
        expect(MediaAssetModel.create).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: "user_1",
                parentId: parent._id,
                creditsCharged: 0,
                saved: true,
                publicId: "vp",
                resourceType: "video",
                lyrics: "la",
                title: "calm piano",
            }),
        )
    })

    it("rejects with 409 HISTORY_FULL before uploading when at the cap", async () => {
        MediaAssetModel.findOne.mockResolvedValue(parent)
        setHistory(HISTORY_CAP[PLAN.FREE], 0)

        await expect(
            service.createVersion("user_1", OID_A, Buffer.from("x")),
        ).rejects.toMatchObject({ statusCode: 409, message: service.HISTORY_FULL_CODE })
        expect(uploadMediaToCloudinary).not.toHaveBeenCalled()
        expect(MediaAssetModel.create).not.toHaveBeenCalled()
    })

    it("returns 404 for another user's parent and uploads nothing", async () => {
        MediaAssetModel.findOne.mockResolvedValue(null)

        await expect(
            service.createVersion("user_2", OID_A, Buffer.from("x")),
        ).rejects.toMatchObject({ statusCode: 404 })
        expect(uploadMediaToCloudinary).not.toHaveBeenCalled()
    })
})

describe("deleteMediaAsset", () => {
    it("returns 404 for another user's asset and deletes nothing", async () => {
        MediaAssetModel.findOne.mockResolvedValue(null)

        await expect(service.deleteMediaAsset("user_2", OID_A)).rejects.toMatchObject({
            statusCode: 404,
        })
        expect(deleteMediaByPublicIds).not.toHaveBeenCalled()
        expect(MediaAssetModel.deleteMany).not.toHaveBeenCalled()
    })

    it("cascades through every generation of versions and deletes the video resources", async () => {
        const root = doc({ _id: { toString: () => OID_A, id: "A" }, publicId: "p-root" })
        const child = doc({ _id: { toString: () => OID_B, id: "B" }, publicId: "p-child" })
        const grandchild = doc({ _id: { toString: () => OID_C, id: "C" }, publicId: "" })
        MediaAssetModel.findOne.mockResolvedValue(root)
        MediaAssetModel.find
            .mockResolvedValueOnce([child])
            .mockResolvedValueOnce([grandchild])
            .mockResolvedValueOnce([])

        await service.deleteMediaAsset("user_1", OID_A)

        expect(MediaAssetModel.find).toHaveBeenNthCalledWith(1, {
            userId: "user_1",
            parentId: { $in: [root._id] },
        })
        expect(MediaAssetModel.find).toHaveBeenNthCalledWith(2, {
            userId: "user_1",
            parentId: { $in: [child._id] },
        })
        expect(deleteMediaByPublicIds).toHaveBeenCalledWith(["p-root", "p-child"])
        expect(MediaAssetModel.deleteMany).toHaveBeenCalledWith({
            userId: "user_1",
            _id: { $in: [root._id, child._id, grandchild._id] },
        })
    })
})
