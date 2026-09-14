import { beforeEach, describe, expect, it, vi } from "vitest"

import { v2 as cloudinary } from "cloudinary"

import { FeatureType, type IImageObject } from "../types/index.js"
import {
    deleteCloudinaryUserData,
    deleteImageByObject,
    deleteImagesByPublicIds,
} from "./cloudinary-service.js"

vi.mock("cloudinary", () => ({
    v2: {
        api: {
            delete_resources_by_prefix: vi.fn(),
            delete_resources: vi.fn(),
        },
    },
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    }),
}))

function imageObject(overrides: Partial<IImageObject> = {}): IImageObject {
    return {
        userId: "user_1",
        prompt: "test",
        featureType: FeatureType.IMAGE,
        images: [],
        ...overrides,
    }
}

describe("deleteCloudinaryUserData", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("deletes resources by user prefix", async () => {
        vi.mocked(cloudinary.api.delete_resources_by_prefix).mockResolvedValue({
            deleted: {},
        } as never)

        await deleteCloudinaryUserData("user_1")

        expect(cloudinary.api.delete_resources_by_prefix).toHaveBeenCalledWith("user_1/")
    })

    it("swallows Cloudinary errors", async () => {
        vi.mocked(cloudinary.api.delete_resources_by_prefix).mockRejectedValue(
            new Error("rate limited"),
        )

        await expect(deleteCloudinaryUserData("user_1")).resolves.toBeUndefined()
    })
})

describe("deleteImagesByPublicIds", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("returns immediately for an empty list", async () => {
        await deleteImagesByPublicIds([])

        expect(cloudinary.api.delete_resources).not.toHaveBeenCalled()
    })

    it("deletes the provided public ids", async () => {
        vi.mocked(cloudinary.api.delete_resources).mockResolvedValue({ deleted: {} } as never)

        await deleteImagesByPublicIds(["a/1", "a/2"])

        expect(cloudinary.api.delete_resources).toHaveBeenCalledWith(["a/1", "a/2"])
    })

    it("swallows delete_resources errors", async () => {
        vi.mocked(cloudinary.api.delete_resources).mockRejectedValue(new Error("not found"))

        await expect(deleteImagesByPublicIds(["missing"])).resolves.toBeUndefined()
    })
})

describe("deleteImageByObject", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(cloudinary.api.delete_resources).mockResolvedValue({ deleted: {} } as never)
    })

    it("deletes aiImagePublicId for IMAGE feature types", async () => {
        await deleteImageByObject(
            imageObject({
                featureType: FeatureType.IMAGE,
                images: [
                    {
                        name: "one",
                        aiImagePublicId: "gen/1",
                        resolution: "1k",
                        aspectRatio: "1:1",
                        width: 1,
                        height: 1,
                        format: "png",
                        bytes: 10,
                    },
                    {
                        name: "two",
                        resolution: "1k",
                        aspectRatio: "1:1",
                        width: 1,
                        height: 1,
                        format: "png",
                        bytes: 10,
                    },
                ],
            }),
        )

        expect(cloudinary.api.delete_resources).toHaveBeenCalledWith(["gen/1"])
    })

    it("deletes original and enhanced ids for non-IMAGE features", async () => {
        await deleteImageByObject(
            imageObject({
                featureType: FeatureType.UPSCALE,
                images: [
                    {
                        name: "up",
                        originalPublicId: "orig/1",
                        enhancedPublicId: "enh/1",
                        resolution: "2k",
                        aspectRatio: "1:1",
                        width: 2,
                        height: 2,
                        format: "png",
                        bytes: 20,
                    },
                ],
            }),
        )

        expect(cloudinary.api.delete_resources).toHaveBeenCalledWith(["orig/1", "enh/1"])
    })

    it("skips Cloudinary when no public ids are present", async () => {
        await deleteImageByObject(
            imageObject({
                featureType: FeatureType.COLORIZE,
                images: [
                    {
                        name: "empty",
                        resolution: "1k",
                        aspectRatio: "1:1",
                        width: 1,
                        height: 1,
                        format: "png",
                        bytes: 1,
                    },
                ],
            }),
        )

        expect(cloudinary.api.delete_resources).not.toHaveBeenCalled()
    })
})
