import { beforeEach, describe, expect, it, vi } from "vitest"

import { UserModel as User } from "../models/user.js"
import {
    FREE_DOWNLOAD_TRANSFORM,
    getImageDownloadUrl,
    toFreeDownloadUrl,
} from "./download-service.js"

vi.mock("../models/user.js", () => ({
    UserModel: { findOne: vi.fn() },
}))

const ORIGINAL = "https://res.cloudinary.com/demo/image/upload/v1/folder/ai.png"
const OPTIMIZED = `https://res.cloudinary.com/demo/image/upload/${FREE_DOWNLOAD_TRANSFORM}/v1/folder/ai.png`

const FREE_USER = { plan: "free", history: [] as unknown[] }
const PRO_USER = {
    plan: "pro",
    subscription: { status: "active" },
    history: [] as unknown[],
}

function userWith(base: object, images: object[]) {
    return { ...base, history: [{ _id: { toString: () => "img_1" }, images }] }
}

describe("toFreeDownloadUrl", () => {
    it("inserts the capped optimization transform after /image/upload/", () => {
        expect(toFreeDownloadUrl(ORIGINAL)).toBe(OPTIMIZED)
    })

    it("is idempotent for an already optimized url", () => {
        expect(toFreeDownloadUrl(OPTIMIZED)).toBe(OPTIMIZED)
    })

    it("returns non-Cloudinary urls unchanged", () => {
        const url = "https://cdn.example.com/image/upload/a.png"
        expect(toFreeDownloadUrl(url)).toBe(url)
    })

    it("returns Cloudinary urls without an upload segment unchanged", () => {
        const url = "https://res.cloudinary.com/demo/video/upload/clip.mp4"
        expect(toFreeDownloadUrl(url)).toBe(url)
    })
})

describe("getImageDownloadUrl", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("gives a free user the optimized derivative", async () => {
        vi.mocked(User.findOne).mockResolvedValue(userWith(FREE_USER, [{ aiImageUrl: ORIGINAL }]))

        await expect(getImageDownloadUrl("user_1", "img_1")).resolves.toBe(OPTIMIZED)
    })

    it("gives a Pro user the original untouched", async () => {
        vi.mocked(User.findOne).mockResolvedValue(userWith(PRO_USER, [{ aiImageUrl: ORIGINAL }]))

        await expect(getImageDownloadUrl("user_1", "img_1")).resolves.toBe(ORIGINAL)
    })

    it("treats a Pro plan with an expired subscription as free", async () => {
        const expired = { plan: "pro", subscription: { status: "expired" } }
        vi.mocked(User.findOne).mockResolvedValue(userWith(expired, [{ aiImageUrl: ORIGINAL }]))

        await expect(getImageDownloadUrl("user_1", "img_1")).resolves.toBe(OPTIMIZED)
    })

    it("falls back from ai to enhanced to original url and honours the image index", async () => {
        const enhanced = ORIGINAL.replace("ai.png", "enh.png")
        const source = ORIGINAL.replace("ai.png", "orig.png")
        vi.mocked(User.findOne).mockResolvedValue(
            userWith(PRO_USER, [
                { aiImageUrl: null, enhancedImageUrl: enhanced },
                { originalImageUrl: source },
            ]),
        )

        await expect(getImageDownloadUrl("user_1", "img_1", 0)).resolves.toBe(enhanced)
        await expect(getImageDownloadUrl("user_1", "img_1", 1)).resolves.toBe(source)
    })

    it("scopes the lookup to the requesting user", async () => {
        vi.mocked(User.findOne).mockResolvedValue(userWith(FREE_USER, [{ aiImageUrl: ORIGINAL }]))

        await getImageDownloadUrl("user_1", "img_1")

        expect(User.findOne).toHaveBeenCalledWith(
            { userId: "user_1" },
            { plan: 1, subscription: 1, history: 1 },
        )
    })

    it("rejects an unknown user", async () => {
        vi.mocked(User.findOne).mockResolvedValue(null)

        await expect(getImageDownloadUrl("ghost", "img_1")).rejects.toMatchObject({
            message: "Image not found",
        })
    })

    it("rejects an image id that is not in the owner's history (non-owner)", async () => {
        vi.mocked(User.findOne).mockResolvedValue(userWith(PRO_USER, [{ aiImageUrl: ORIGINAL }]))

        await expect(getImageDownloadUrl("other_user", "img_999")).rejects.toMatchObject({
            message: "Image not found",
        })
    })

    it("rejects an out-of-range image index and an image with no url", async () => {
        vi.mocked(User.findOne).mockResolvedValue(userWith(PRO_USER, [{ aiImageUrl: "" }]))

        await expect(getImageDownloadUrl("user_1", "img_1", 5)).rejects.toMatchObject({
            message: "Image not found",
        })
        await expect(getImageDownloadUrl("user_1", "img_1", 0)).rejects.toMatchObject({
            message: "Image not found",
        })
    })

    it("skips history entries without an _id", async () => {
        vi.mocked(User.findOne).mockResolvedValue({
            ...PRO_USER,
            history: [{ images: [{ aiImageUrl: ORIGINAL }] }],
        })

        await expect(getImageDownloadUrl("user_1", "img_1")).rejects.toMatchObject({
            message: "Image not found",
        })
    })
})
