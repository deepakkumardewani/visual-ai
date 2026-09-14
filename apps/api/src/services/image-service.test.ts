import { beforeEach, describe, expect, it, vi } from "vitest"

const User = vi.hoisted(() => ({
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
}))

const cloudinary = vi.hoisted(() => ({
    deleteImageByObject: vi.fn(),
    deleteImagesByPublicIds: vi.fn(),
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}))

vi.mock("../models/user.js", () => ({
    UserModel: User,
}))

vi.mock("./cloudinary-service.js", () => cloudinary)

const { toggleImageFavorite, deleteUserImage, deleteBulkUserImages } =
    await import("./image-service.js")

const USER_ID = "user_1"
const IMAGE_ID = "img_1"

function userWithHistory(isFavorite = false) {
    return {
        userId: USER_ID,
        history: [
            { _id: { toString: () => IMAGE_ID }, isFavorite, publicId: "pub_1" },
            { _id: undefined, isFavorite: false },
        ],
    }
}

describe("image-service", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("toggleImageFavorite", () => {
        it("throws when the user does not exist", async () => {
            User.findOne.mockResolvedValue(null)

            await expect(toggleImageFavorite(USER_ID, IMAGE_ID)).rejects.toMatchObject({
                statusCode: 404,
                message: "User not found",
            })
        })

        it("throws when the image is not in history", async () => {
            User.findOne.mockResolvedValue({ history: [] })

            await expect(toggleImageFavorite(USER_ID, IMAGE_ID)).rejects.toMatchObject({
                statusCode: 404,
                message: "Image not found",
            })
        })

        it("flips isFavorite from false to true", async () => {
            User.findOne.mockResolvedValue(userWithHistory(false))
            User.findOneAndUpdate.mockResolvedValue({})

            const result = await toggleImageFavorite(USER_ID, IMAGE_ID)

            expect(User.findOneAndUpdate).toHaveBeenCalledWith(
                { userId: USER_ID },
                { $set: { "history.0.isFavorite": true } },
                { new: true },
            )
            expect(result).toEqual({ isFavorite: true })
        })

        it("flips isFavorite from true to false", async () => {
            User.findOne.mockResolvedValue(userWithHistory(true))
            User.findOneAndUpdate.mockResolvedValue({})

            const result = await toggleImageFavorite(USER_ID, IMAGE_ID)

            expect(result).toEqual({ isFavorite: false })
        })
    })

    describe("deleteUserImage", () => {
        it("throws when the user does not exist", async () => {
            User.findOne.mockResolvedValue(null)

            await expect(deleteUserImage(USER_ID, IMAGE_ID)).rejects.toMatchObject({
                statusCode: 404,
                message: "User not found",
            })
        })

        it("throws when the image is missing", async () => {
            User.findOne.mockResolvedValue({ history: [] })

            await expect(deleteUserImage(USER_ID, IMAGE_ID)).rejects.toMatchObject({
                statusCode: 404,
                message: "Image not found",
            })
        })

        it("deletes from Cloudinary and pulls the history entry", async () => {
            const user = userWithHistory()
            User.findOne.mockResolvedValue(user)
            User.findOneAndUpdate.mockResolvedValue({})

            await deleteUserImage(USER_ID, IMAGE_ID)

            expect(cloudinary.deleteImageByObject).toHaveBeenCalledWith(user.history[0])
            expect(User.findOneAndUpdate).toHaveBeenCalledWith(
                { userId: USER_ID },
                { $pull: { history: { _id: IMAGE_ID } } },
                { new: true },
            )
        })
    })

    describe("deleteBulkUserImages", () => {
        it("throws when the user does not exist", async () => {
            User.findOne.mockResolvedValue(null)

            await expect(deleteBulkUserImages(USER_ID, ["p1"], [IMAGE_ID])).rejects.toMatchObject({
                statusCode: 404,
                message: "User not found",
            })
        })

        it("bulk-deletes public ids and history entries", async () => {
            User.findOne.mockResolvedValue(userWithHistory())
            User.findOneAndUpdate.mockResolvedValue({})

            await deleteBulkUserImages(USER_ID, ["p1", "p2"], [IMAGE_ID, "img_2"])

            expect(cloudinary.deleteImagesByPublicIds).toHaveBeenCalledWith(["p1", "p2"])
            expect(User.findOneAndUpdate).toHaveBeenCalledWith(
                { userId: USER_ID },
                { $pull: { history: { _id: { $in: [IMAGE_ID, "img_2"] } } } },
                { new: true },
            )
        })
    })
})
