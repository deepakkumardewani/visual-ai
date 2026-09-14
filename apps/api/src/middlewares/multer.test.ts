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

vi.mock("multer", () => {
    const memoryStorage = vi.fn(() => ({ kind: "memory" }))
    const multerFn = Object.assign(
        (options: unknown) => {
            capturedMulterOptions.push(options)
            return { options }
        },
        { memoryStorage },
    )
    return { default: multerFn }
})

import { memoryUpload, upload } from "./multer.js"

describe("multer middleware", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("configures Cloudinary storage with a user-scoped folder and uuid public id", async () => {
        expect(upload).toEqual({ options: { storage: { kind: "cloudinary-storage" } } })
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
})
