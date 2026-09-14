import {
    CollectionMembershipSchema,
    CreateCollectionSchema,
    DeleteCollectionSchema,
    ListCollectionsQuerySchema,
    RenameCollectionSchema,
} from "@visual-ai/shared"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { CollectionModel } from "../models/collection.js"
import { UserModel as User } from "../models/user.js"
import {
    addImagesToCollection,
    createCollection,
    deleteCollection,
    listCollections,
    removeImagesFromCollection,
    renameCollection,
} from "./collection-service.js"

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    }),
}))

vi.mock("../models/collection.js", () => ({
    CollectionModel: {
        find: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        deleteOne: vi.fn(),
        findOneAndUpdate: vi.fn(),
    },
}))

vi.mock("../models/user.js", () => ({
    UserModel: {
        findOne: vi.fn(),
    },
}))

const USER_ID = "user_abc"
const COLLECTION_ID = "col_123"
const IMAGE_A = "img_aaa"
const IMAGE_B = "img_bbb"
const IMAGE_C = "img_ccc"
const IMAGE_D = "img_ddd"
const IMAGE_E = "img_eee"

function collectionDoc(overrides: Record<string, unknown> = {}) {
    return {
        _id: { toString: () => COLLECTION_ID },
        userId: USER_ID,
        name: "Favorites",
        imageIds: [IMAGE_A, IMAGE_B],
        createdAt: new Date("2024-03-01T00:00:00.000Z"),
        updatedAt: new Date("2024-03-02T00:00:00.000Z"),
        save: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    }
}

function mockFindSorted(docs: unknown[]) {
    vi.mocked(CollectionModel.find).mockReturnValue({
        sort: vi.fn().mockResolvedValue(docs),
    } as never)
}

function mockUserSelect(value: unknown) {
    vi.mocked(User.findOne).mockReturnValue({
        select: vi.fn().mockResolvedValue(value),
    } as never)
}

describe("listCollections", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("rejects an empty userId", async () => {
        await expect(listCollections("")).rejects.toMatchObject({
            statusCode: 400,
            message: "userId is required",
        })
        expect(CollectionModel.find).not.toHaveBeenCalled()
    })

    it("uses a fallback query error when issues are empty", async () => {
        const spy = vi.spyOn(ListCollectionsQuerySchema, "safeParse").mockReturnValueOnce({
            success: false,
            error: { issues: [] },
        } as never)
        await expect(listCollections(USER_ID)).rejects.toMatchObject({
            statusCode: 400,
            message: "Invalid query",
        })
        spy.mockRestore()
    })

    it("returns list items with count and cover ids capped at 4", async () => {
        mockFindSorted([
            collectionDoc({
                imageIds: [IMAGE_A, IMAGE_B, IMAGE_C, IMAGE_D, IMAGE_E],
            }),
        ])

        const result = await listCollections(USER_ID)

        expect(CollectionModel.find).toHaveBeenCalledWith({ userId: USER_ID })
        expect(result).toHaveLength(1)
        expect(result[0]).toMatchObject({
            id: COLLECTION_ID,
            userId: USER_ID,
            name: "Favorites",
            count: 5,
            coverImageIds: [IMAGE_A, IMAGE_B, IMAGE_C, IMAGE_D],
            createdAt: "2024-03-01T00:00:00.000Z",
            updatedAt: "2024-03-02T00:00:00.000Z",
        })
    })

    it("treats missing imageIds as an empty list", async () => {
        mockFindSorted([
            collectionDoc({ imageIds: undefined, createdAt: undefined, updatedAt: undefined }),
        ])

        const result = await listCollections(USER_ID)

        expect(result[0]?.count).toBe(0)
        expect(result[0]?.coverImageIds).toEqual([])
        expect(result[0]?.createdAt).toBeUndefined()
        expect(result[0]?.updatedAt).toBeUndefined()
    })
})

describe("createCollection", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("rejects invalid name", async () => {
        await expect(createCollection(USER_ID, "")).rejects.toMatchObject({
            statusCode: 400,
            message: "Name is required",
        })
        expect(User.findOne).not.toHaveBeenCalled()
    })

    it("uses a fallback create error when issues are empty", async () => {
        const spy = vi.spyOn(CreateCollectionSchema, "safeParse").mockReturnValueOnce({
            success: false,
            error: { issues: [] },
        } as never)
        await expect(createCollection(USER_ID, "Moodboard")).rejects.toMatchObject({
            message: "Invalid request",
        })
        spy.mockRestore()
    })

    it("throws when the user does not exist", async () => {
        mockUserSelect(null)

        await expect(createCollection(USER_ID, "Moodboard")).rejects.toMatchObject({
            statusCode: 404,
            message: "User not found",
        })
        expect(CollectionModel.create).not.toHaveBeenCalled()
    })

    it("creates an empty collection for an existing user", async () => {
        mockUserSelect({ _id: "mongo1" })
        vi.mocked(CollectionModel.create).mockResolvedValue(
            collectionDoc({ name: "Moodboard", imageIds: [] }) as never,
        )

        const result = await createCollection(USER_ID, "Moodboard")

        expect(CollectionModel.create).toHaveBeenCalledWith({
            userId: USER_ID,
            name: "Moodboard",
            imageIds: [],
        })
        expect(result.name).toBe("Moodboard")
        expect(result.imageIds).toEqual([])
    })
})

describe("renameCollection", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("rejects invalid rename payload", async () => {
        await expect(renameCollection(COLLECTION_ID, "", "New")).rejects.toMatchObject({
            statusCode: 400,
            message: "userId is required",
        })
    })

    it("uses a fallback rename error when issues are empty", async () => {
        const spy = vi.spyOn(RenameCollectionSchema, "safeParse").mockReturnValueOnce({
            success: false,
            error: { issues: [] },
        } as never)
        await expect(renameCollection(COLLECTION_ID, USER_ID, "New")).rejects.toMatchObject({
            message: "Invalid request",
        })
        spy.mockRestore()
    })

    it("throws when the collection is missing", async () => {
        vi.mocked(CollectionModel.findById).mockResolvedValue(null)

        await expect(renameCollection(COLLECTION_ID, USER_ID, "New")).rejects.toMatchObject({
            statusCode: 404,
            message: "Collection not found",
        })
    })

    it("throws when the collection belongs to another user", async () => {
        vi.mocked(CollectionModel.findById).mockResolvedValue(
            collectionDoc({ userId: "someone_else" }) as never,
        )

        await expect(renameCollection(COLLECTION_ID, USER_ID, "New")).rejects.toMatchObject({
            statusCode: 403,
            message: "Not allowed to modify this collection",
        })
    })

    it("saves the new name for the owner", async () => {
        const doc = collectionDoc()
        vi.mocked(CollectionModel.findById).mockResolvedValue(doc as never)

        const result = await renameCollection(COLLECTION_ID, USER_ID, "Renamed")

        expect(doc.name).toBe("Renamed")
        expect(doc.save).toHaveBeenCalled()
        expect(result.name).toBe("Renamed")
    })
})

describe("deleteCollection", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("rejects invalid userId", async () => {
        await expect(deleteCollection(COLLECTION_ID, "")).rejects.toMatchObject({
            statusCode: 400,
            message: "userId is required",
        })
    })

    it("uses a fallback delete error when issues are empty", async () => {
        const spy = vi.spyOn(DeleteCollectionSchema, "safeParse").mockReturnValueOnce({
            success: false,
            error: { issues: [] },
        } as never)
        await expect(deleteCollection(COLLECTION_ID, USER_ID)).rejects.toMatchObject({
            message: "Invalid request",
        })
        spy.mockRestore()
    })

    it("throws when the collection belongs to another user", async () => {
        vi.mocked(CollectionModel.findById).mockResolvedValue(
            collectionDoc({ userId: "someone_else" }) as never,
        )

        await expect(deleteCollection(COLLECTION_ID, USER_ID)).rejects.toMatchObject({
            statusCode: 403,
            message: "Not allowed to modify this collection",
        })
        expect(CollectionModel.deleteOne).not.toHaveBeenCalled()
    })

    it("throws when the collection is missing", async () => {
        vi.mocked(CollectionModel.findById).mockResolvedValue(null)

        await expect(deleteCollection(COLLECTION_ID, USER_ID)).rejects.toMatchObject({
            statusCode: 404,
            message: "Collection not found",
        })
        expect(CollectionModel.deleteOne).not.toHaveBeenCalled()
    })

    it("deletes an owned collection", async () => {
        vi.mocked(CollectionModel.findById).mockResolvedValue(collectionDoc() as never)
        vi.mocked(CollectionModel.deleteOne).mockResolvedValue({ deletedCount: 1 } as never)

        await deleteCollection(COLLECTION_ID, USER_ID)

        expect(CollectionModel.deleteOne).toHaveBeenCalledWith({
            _id: COLLECTION_ID,
            userId: USER_ID,
        })
    })
})

describe("addImagesToCollection", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("rejects empty imageIds", async () => {
        await expect(addImagesToCollection(COLLECTION_ID, USER_ID, [])).rejects.toMatchObject({
            statusCode: 400,
            message: "At least one image id is required",
        })
    })

    it("uses a fallback membership error when issues are empty", async () => {
        const spy = vi.spyOn(CollectionMembershipSchema, "safeParse").mockReturnValueOnce({
            success: false,
            error: { issues: [] },
        } as never)
        await expect(
            addImagesToCollection(COLLECTION_ID, USER_ID, [IMAGE_A]),
        ).rejects.toMatchObject({
            message: "Invalid request",
        })
        spy.mockRestore()
    })

    it("treats missing user history as empty ownership", async () => {
        vi.mocked(CollectionModel.findById).mockResolvedValue(collectionDoc() as never)
        mockUserSelect({ history: undefined })

        await expect(addImagesToCollection(COLLECTION_ID, USER_ID, [IMAGE_A])).rejects.toThrow(
            "One or more images do not belong to this user",
        )
    })

    it("throws when the user has no history document", async () => {
        vi.mocked(CollectionModel.findById).mockResolvedValue(collectionDoc() as never)
        mockUserSelect(null)

        await expect(
            addImagesToCollection(COLLECTION_ID, USER_ID, [IMAGE_A]),
        ).rejects.toMatchObject({ statusCode: 404, message: "User not found" })
    })

    it("rejects image ids that the user does not own", async () => {
        vi.mocked(CollectionModel.findById).mockResolvedValue(collectionDoc() as never)
        mockUserSelect({
            history: [{ _id: { toString: () => IMAGE_A } }],
        })

        await expect(
            addImagesToCollection(COLLECTION_ID, USER_ID, [IMAGE_A, "foreign_id"]),
        ).rejects.toThrow("One or more images do not belong to this user")
        expect(CollectionModel.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it("throws when the update returns no document", async () => {
        vi.mocked(CollectionModel.findById).mockResolvedValue(collectionDoc() as never)
        mockUserSelect({
            history: [{ _id: { toString: () => IMAGE_A } }],
        })
        vi.mocked(CollectionModel.findOneAndUpdate).mockResolvedValue(null)

        await expect(
            addImagesToCollection(COLLECTION_ID, USER_ID, [IMAGE_A]),
        ).rejects.toMatchObject({ statusCode: 404, message: "Collection not found" })
    })

    it("adds owned images with $addToSet", async () => {
        vi.mocked(CollectionModel.findById).mockResolvedValue(collectionDoc() as never)
        mockUserSelect({
            history: [{ _id: { toString: () => IMAGE_A } }, { _id: undefined }],
        })
        vi.mocked(CollectionModel.findOneAndUpdate).mockResolvedValue(
            collectionDoc({ imageIds: [IMAGE_A] }) as never,
        )

        const result = await addImagesToCollection(COLLECTION_ID, USER_ID, [IMAGE_A])

        expect(CollectionModel.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: COLLECTION_ID, userId: USER_ID },
            { $addToSet: { imageIds: { $each: [IMAGE_A] } } },
            { new: true },
        )
        expect(result.imageIds).toEqual([IMAGE_A])
    })
})

describe("removeImagesFromCollection", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("rejects invalid membership payload", async () => {
        await expect(removeImagesFromCollection(COLLECTION_ID, USER_ID, [])).rejects.toMatchObject({
            statusCode: 400,
            message: "At least one image id is required",
        })
    })

    it("uses a fallback membership error when issues are empty", async () => {
        const spy = vi.spyOn(CollectionMembershipSchema, "safeParse").mockReturnValueOnce({
            success: false,
            error: { issues: [] },
        } as never)
        await expect(
            removeImagesFromCollection(COLLECTION_ID, USER_ID, [IMAGE_A]),
        ).rejects.toMatchObject({ message: "Invalid request" })
        spy.mockRestore()
    })

    it("throws when the update returns no document", async () => {
        vi.mocked(CollectionModel.findById).mockResolvedValue(collectionDoc() as never)
        vi.mocked(CollectionModel.findOneAndUpdate).mockResolvedValue(null)

        await expect(
            removeImagesFromCollection(COLLECTION_ID, USER_ID, [IMAGE_A]),
        ).rejects.toMatchObject({ statusCode: 404, message: "Collection not found" })
    })

    it("pulls image ids from an owned collection", async () => {
        vi.mocked(CollectionModel.findById).mockResolvedValue(collectionDoc() as never)
        vi.mocked(CollectionModel.findOneAndUpdate).mockResolvedValue(
            collectionDoc({ imageIds: [IMAGE_B] }) as never,
        )

        const result = await removeImagesFromCollection(COLLECTION_ID, USER_ID, [IMAGE_A])

        expect(CollectionModel.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: COLLECTION_ID, userId: USER_ID },
            { $pull: { imageIds: { $in: [IMAGE_A] } } },
            { new: true },
        )
        expect(result.imageIds).toEqual([IMAGE_B])
    })
})
