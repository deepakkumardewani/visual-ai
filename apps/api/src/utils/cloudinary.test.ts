import { beforeEach, describe, expect, it, vi } from "vitest"

const { upload, probe, toBuffer, jpeg, sharpFn, updateOne, mockLogger } = vi.hoisted(() => {
    const toBuffer = vi.fn()
    const jpeg = vi.fn(() => ({ toBuffer }))
    return {
        upload: vi.fn(),
        probe: vi.fn(),
        toBuffer,
        jpeg,
        sharpFn: vi.fn(() => ({ jpeg })),
        updateOne: vi.fn(),
        mockLogger: { error: vi.fn(), info: vi.fn() },
    }
})

vi.mock("cloudinary", () => ({
    default: {
        v2: {
            uploader: {
                upload: (...args: unknown[]) => upload(...args),
            },
        },
    },
}))

vi.mock("probe-image-size", () => ({
    default: (...args: unknown[]) => probe(...args),
}))

vi.mock("sharp", () => ({
    default: (...args: unknown[]) => sharpFn(...args),
}))

vi.mock("../config/env.js", () => ({
    env: {
        CLOUDINARY_BASE_PATH: "private/development/uploads",
    },
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => mockLogger,
}))

vi.mock("../models/user.js", () => ({
    UserModel: {
        updateOne: (...args: unknown[]) => updateOne(...args),
    },
}))

import { getImageDetails, uploadToCloudinary } from "./cloudinary.js"

const LARGE_BYTES = 11 * 1024 * 1024
const SMALL_BYTES = 1024

function probeResult(bytes: number) {
    return { width: 1024, height: 768, type: "jpg", length: bytes }
}

function uploadResult(overrides: Record<string, unknown> = {}) {
    return {
        secure_url: "https://res.cloudinary.com/demo/image.jpg",
        public_id: "folder/image",
        width: 1024,
        height: 768,
        format: "jpg",
        bytes: 2048,
        original_filename: "scene",
        ...overrides,
    }
}

describe("getImageDetails", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("returns width, height, format, and bytes from probe", async () => {
        probe.mockResolvedValue(probeResult(2048))

        await expect(getImageDetails("https://cdn.example.com/a.jpg")).resolves.toEqual({
            width: 1024,
            height: 768,
            format: "jpg",
            bytes: 2048,
        })
    })

    it("logs and rethrows when probe fails", async () => {
        const error = new Error("probe failed")
        probe.mockRejectedValue(error)

        await expect(getImageDetails("https://cdn.example.com/missing.jpg")).rejects.toThrow(
            "probe failed",
        )
        expect(mockLogger.error).toHaveBeenCalledWith({ err: error }, "Error getting image details")
    })
})

describe("uploadToCloudinary", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                arrayBuffer: async () => new ArrayBuffer(8),
            }),
        )
        toBuffer.mockResolvedValue(Buffer.from("compressed"))
        updateOne.mockResolvedValue({ acknowledged: true })
        upload.mockResolvedValue(uploadResult())
        probe.mockResolvedValue(probeResult(SMALL_BYTES))
    })

    it("uploads multiple images, compresses oversized ones, and updates history", async () => {
        probe
            .mockResolvedValueOnce(probeResult(LARGE_BYTES))
            .mockResolvedValueOnce(probeResult(SMALL_BYTES))
        upload
            .mockResolvedValueOnce(uploadResult({ public_id: "a", secure_url: "https://a.jpg" }))
            .mockResolvedValueOnce(uploadResult({ public_id: "b", secure_url: "https://b.jpg" }))

        await uploadToCloudinary({
            imageUrl: ["https://cdn.example.com/one.jpg", "https://cdn.example.com/two.jpg"],
            userId: "user-1",
            prompt: "twins",
            type: "image",
            imageType: "generated",
            modelName: "FLUX_QUICK",
            imageId: "hist-1",
            aspectRatio: "1:1",
        })

        expect(fetch).toHaveBeenCalledWith("https://cdn.example.com/one.jpg")
        expect(sharpFn).toHaveBeenCalled()
        expect(upload).toHaveBeenCalledTimes(2)
        expect(updateOne).toHaveBeenCalledWith(
            { userId: "user-1", "history._id": "hist-1" },
            {
                $set: expect.objectContaining({
                    "history.$.images.0.aiImageUrl": expect.stringMatching(/^https:\/\//),
                    "history.$.images.0.aiImagePublicId": expect.any(String),
                    "history.$.images.1.aiImageUrl": expect.stringMatching(/^https:\/\//),
                    "history.$.images.1.aiImagePublicId": expect.any(String),
                }),
            },
        )
    })

    it("skips the history update when a multi-image upload has no imageId", async () => {
        await uploadToCloudinary({
            imageUrl: ["https://cdn.example.com/one.jpg", "https://cdn.example.com/two.jpg"],
            userId: "user-1",
            prompt: "twins",
            type: "image",
            imageType: "generated",
        })

        expect(upload).toHaveBeenCalledTimes(2)
        expect(updateOne).not.toHaveBeenCalled()
    })

    it("reduces jpeg quality until the compressed buffer is under the size limit", async () => {
        probe.mockResolvedValue(probeResult(LARGE_BYTES))
        toBuffer
            .mockResolvedValueOnce(Buffer.alloc(LARGE_BYTES))
            .mockResolvedValueOnce(Buffer.from("small"))

        await uploadToCloudinary({
            imageUrl: "https://cdn.example.com/huge.jpg",
            userId: "user-1",
            prompt: "wide shot",
            type: "image",
            imageType: "generated",
            modelName: "FLUX_QUICK",
            imageId: "hist-2",
        })

        expect(jpeg).toHaveBeenCalledWith({ quality: 80 })
        expect(jpeg).toHaveBeenCalledWith({ quality: 70 })
        expect(upload).toHaveBeenCalledWith(
            expect.stringMatching(/^data:image\/jpeg;base64,/),
            expect.objectContaining({
                folder: "private/development/uploads/user-1/image",
            }),
        )
    })

    it("never compresses remove-bg images so alpha is preserved", async () => {
        probe.mockResolvedValue(probeResult(LARGE_BYTES))

        await uploadToCloudinary({
            imageUrl: "https://cdn.example.com/cutout.png",
            userId: "user-1",
            prompt: "",
            type: "remove_bg",
            imageType: "utility",
            imageId: "hist-3",
            original: "https://cdn.example.com/original.png",
            originalPublicId: "orig-1",
        })

        expect(fetch).not.toHaveBeenCalled()
        expect(upload).toHaveBeenCalledWith("https://cdn.example.com/cutout.png", {
            folder: "private/development/uploads/user-1/remove_bg",
            format: "png",
        })
        expect(updateOne).toHaveBeenCalledWith(
            { userId: "user-1", "history._id": "hist-3" },
            expect.objectContaining({
                $set: expect.objectContaining({
                    "history.$.images.0.originalImageUrl": "https://cdn.example.com/original.png",
                    "history.$.images.0.enhancedImageUrl":
                        "https://res.cloudinary.com/demo/image.jpg",
                    "history.$.images.0.originalPublicId": "orig-1",
                }),
            }),
        )
    })

    it("uploads a local transform original when it is not a remote URL", async () => {
        probe.mockResolvedValue(probeResult(SMALL_BYTES))
        upload
            .mockResolvedValueOnce(
                uploadResult({ public_id: "enhanced", secure_url: "https://e.jpg" }),
            )
            .mockResolvedValueOnce(
                uploadResult({ public_id: "orig-up", secure_url: "https://orig.jpg" }),
            )

        await uploadToCloudinary({
            imageUrl: "https://cdn.example.com/upscaled.jpg",
            userId: "user-1",
            prompt: "",
            type: "upscale",
            imageType: "utility",
            imageId: "hist-4",
            original: "/tmp/multer-original.jpg",
            aspectRatio: "16:9",
        })

        expect(upload).toHaveBeenNthCalledWith(2, "/tmp/multer-original.jpg", {
            folder: "private/development/uploads/user-1/upscale/originals",
        })
        expect(updateOne).toHaveBeenCalledWith(
            { userId: "user-1", "history._id": "hist-4" },
            {
                $set: {
                    "history.$.images.0.originalImageUrl": "https://orig.jpg",
                    "history.$.images.0.enhancedImageUrl": "https://e.jpg",
                    "history.$.images.0.originalPublicId": "orig-up",
                    "history.$.images.0.enhancedPublicId": "enhanced",
                    "history.$.images.0.aspectRatio": "16:9",
                },
            },
        )
    })

    it("keeps the local original path when the originals upload fails", async () => {
        probe.mockResolvedValue(probeResult(SMALL_BYTES))
        upload
            .mockResolvedValueOnce(uploadResult())
            .mockRejectedValueOnce(new Error("original upload failed"))

        await uploadToCloudinary({
            imageUrl: "https://cdn.example.com/color.jpg",
            userId: "user-1",
            prompt: "",
            type: "colorize",
            imageType: "utility",
            imageId: "hist-5",
            original: "/tmp/local.jpg",
        })

        expect(mockLogger.error).toHaveBeenCalledWith(
            { err: expect.any(Error) },
            "Failed to upload transform original to Cloudinary",
        )
        expect(updateOne).toHaveBeenCalledWith(
            { userId: "user-1", "history._id": "hist-5" },
            expect.objectContaining({
                $set: expect.objectContaining({
                    "history.$.images.0.originalImageUrl": "/tmp/local.jpg",
                }),
            }),
        )
    })

    it("updates revive history using a remote original without a second upload", async () => {
        await uploadToCloudinary({
            imageUrl: "https://cdn.example.com/revived.jpg",
            userId: "user-1",
            prompt: "",
            type: "revive",
            imageType: "utility",
            imageId: "hist-6",
            original: "https://cdn.example.com/old.jpg",
            originalPublicId: "old-1",
        })

        expect(upload).toHaveBeenCalledTimes(1)
        expect(updateOne).toHaveBeenCalled()
    })

    it("logs and rethrows when the Cloudinary upload fails", async () => {
        const error = new Error("cloudinary down")
        probe.mockRejectedValue(error)

        await expect(
            uploadToCloudinary({
                imageUrl: "https://cdn.example.com/fail.jpg",
                userId: "user-1",
                prompt: "x",
                type: "image",
            }),
        ).rejects.toThrow("cloudinary down")
        expect(mockLogger.error).toHaveBeenCalledWith(
            { err: error },
            "Error uploading to Cloudinary",
        )
    })
})
