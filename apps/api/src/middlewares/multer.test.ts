import { MAX_IMAGE_BYTES } from "@visual-ai/shared"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { capturedMulterOptions, storageState } = vi.hoisted(() => ({
    capturedMulterOptions: [] as any[],
    storageState: {
        params: undefined as ((req: any, file: any) => Promise<unknown>) | undefined,
    },
}))

vi.mock("cloudinary", () => ({
    v2: { uploader: {} },
}))

vi.mock("multer-storage-cloudinary", () => ({
    CloudinaryStorage: class {
        kind = "cloudinary-storage"
        constructor(options: { params: (req: any, file: any) => Promise<unknown> }) {
            storageState.params = options.params
        }
    },
}))

vi.mock("uuid", () => ({
    v1: () => "fixed-uuid",
}))

vi.mock("../config/env.js", () => ({
    env: {
        CLOUDINARY_BASE_PATH: "private/development/uploads",
    },
}))

vi.mock("../utils/cloudinary.js", () => ({
    buildMediaFolder: vi.fn(),
    uploadMediaToCloudinary: vi.fn(),
}))
vi.mock("../models/media-upload.js", () => ({ MediaUploadModel: {} }))
vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({ debug: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

vi.mock("multer", () => {
    const memoryStorage = vi.fn(() => ({ kind: "memory" }))
    const diskStorage = vi.fn(() => ({ kind: "disk" }))
    class MulterError extends Error {
        constructor(
            public code: string,
            message = code,
        ) {
            super(message)
        }
    }
    const multerFn = Object.assign(
        (options: unknown) => {
            capturedMulterOptions.push(options)
            return { options }
        },
        { memoryStorage, diskStorage, MulterError },
    )
    return { default: multerFn }
})

import multer from "multer"

import {
    audioUpload,
    mapUploadError,
    MAX_REFERENCE_IMAGES_PER_REQUEST,
    memoryUpload,
    toolImageUpload,
    UPLOAD_BY_KIND,
    videoUpload,
    referenceImagesUpload,
    upload,
} from "./multer.js"

describe("multer middleware", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("configures Cloudinary storage with a user-scoped folder and uuid public id", async () => {
        expect(upload).toEqual({
            options: { storage: { kind: "cloudinary-storage" } },
        })
        expect(storageState.params).toBeTypeOf("function")

        const params = await storageState.params!(
            { body: { userId: "user-9", feature: "upscale", format: "png" } },
            {},
        )

        expect(params).toEqual({
            folder: "private/development/uploads/user-9/upscale",
            format: "png",
            public_id: "original-fixed-uuid",
            unique_filename: false,
            use_filename: true,
        })
    })

    it("resolves Cloudinary params when req.body is a promise", async () => {
        const params = await storageState.params!(
            {
                body: Promise.resolve({
                    userId: "user-10",
                    feature: "gen",
                    format: "webp",
                }),
            },
            {},
        )

        expect(params).toEqual({
            folder: "private/development/uploads/user-10/gen",
            format: "webp",
            public_id: "original-fixed-uuid",
            unique_filename: false,
            use_filename: true,
        })
    })

    it("accepts image files in the memory uploader", () => {
        const memoryOptions = capturedMulterOptions.find(
            (option) => option.storage?.kind === "memory",
        )
        expect(memoryOptions.limits).toEqual({ fileSize: 10 * 1024 * 1024 })

        const cb = vi.fn()
        memoryOptions.fileFilter({}, { mimetype: "image/webp" }, cb)

        expect(cb).toHaveBeenCalledWith(null, true)
        expect(memoryUpload).toEqual({ options: memoryOptions })
    })

    it("rejects non-image files in the memory uploader", () => {
        const memoryOptions = capturedMulterOptions.find(
            (option) => option.storage?.kind === "memory",
        )
        const cb = vi.fn()

        memoryOptions.fileFilter({}, { mimetype: "application/pdf" }, cb)

        expect(cb).toHaveBeenCalledWith(expect.any(Error))
        expect(cb.mock.calls[0][0].message).toBe("Only image files are allowed")
    })

    it("configures reference image upload limits and accepted mime types", () => {
        const refOptions = capturedMulterOptions.find(
            (option) =>
                option.storage?.kind === "cloudinary-storage" &&
                option.limits?.fileSize !== undefined &&
                option.fileFilter !== undefined,
        )
        expect(refOptions.limits.fileSize).toBe(MAX_IMAGE_BYTES)
        expect(referenceImagesUpload).toEqual({ options: refOptions })
        expect(MAX_REFERENCE_IMAGES_PER_REQUEST).toBeGreaterThan(0)

        const accept = vi.fn()
        refOptions.fileFilter({}, { mimetype: "image/png" }, accept)
        expect(accept).toHaveBeenCalledWith(null, true)

        const reject = vi.fn()
        refOptions.fileFilter({}, { mimetype: "application/pdf" }, reject)
        expect(reject).toHaveBeenCalledWith(expect.any(Error))
        expect(reject.mock.calls[0][0].message).toBe("Only JPG, PNG, and WEBP images are allowed")
    })

    it("bounds each kind-specific uploader by the largest purpose cap and a single file", () => {
        const MB = 1024 * 1024
        const byStorage = (kind: string) =>
            capturedMulterOptions.filter((o) => o.storage?.kind === kind && o.limits?.files === 1)
        const [audio, image] = byStorage("memory")
        const [video] = byStorage("disk")

        expect(audio.limits.fileSize).toBe(20 * MB)
        expect(image.limits.fileSize).toBe(10 * MB)
        expect(video.limits.fileSize).toBe(100 * MB)
    })

    it("selects the uploader by kind", () => {
        expect(UPLOAD_BY_KIND).toEqual({
            audio: audioUpload,
            image: toolImageUpload,
            video: videoUpload,
        })
    })

    describe("mapUploadError", () => {
        const MulterError = (multer as any).MulterError

        it("maps a size-limit error to a 413 naming the purpose cap", () => {
            const mapped = mapUploadError(new MulterError("LIMIT_FILE_SIZE"), "tool-video")

            expect(mapped).toMatchObject({
                statusCode: 413,
                message: "File must be under 100 MB",
            })
        })

        it("maps any other multer error to a 400 with its message", () => {
            const mapped = mapUploadError(
                new MulterError("LIMIT_UNEXPECTED_FILE", "Unexpected field"),
                "tool-image",
            )

            expect(mapped).toMatchObject({
                statusCode: 400,
                message: "file: Unexpected field",
            })
        })

        it("passes non-multer errors through unchanged", () => {
            const err = new Error("boom")

            expect(mapUploadError(err, "tool-image")).toBe(err)
        })
    })
})
