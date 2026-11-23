import { createHash } from "node:crypto"
import { mkdtemp, rm, stat, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
    isE2eUser: vi.fn(() => false),
    uploadStream: vi.fn(),
    deleteResources: vi.fn(),
    uploadMedia: vi.fn(),
    buildMediaFolder: vi.fn(),
    create: vi.fn(),
    logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock("cloudinary", () => ({
    default: {
        v2: {
            uploader: { upload_stream: mocks.uploadStream },
            api: { delete_resources: mocks.deleteResources },
        },
    },
}))
vi.mock("../utils/cloudinary.js", () => ({
    buildMediaFolder: mocks.buildMediaFolder,
    uploadMediaToCloudinary: mocks.uploadMedia,
}))
vi.mock("../models/media-upload.js", () => ({
    MediaUploadModel: { create: mocks.create },
}))
vi.mock("./e2e-user.js", () => ({ isE2eUser: mocks.isE2eUser }))
vi.mock("./logger.js", () => ({ createLogger: () => mocks.logger }))

const {
    UPLOAD_PURPOSES,
    createMediaUpload,
    deleteUploadedFile,
    isUploadPurpose,
    maxBytesForKind,
    parseUploadPurpose,
    removeTempFile,
    sniffMime,
    uploadTooLargeError,
} = await import("./media-upload.js")

type UploadFile = Parameters<typeof createMediaUpload>[0]["file"]

const MB = 1024 * 1024

function ascii(text: string) {
    return text.split("").map((c) => c.charCodeAt(0))
}

/** Builds a 16-byte header from byte runs placed at offsets. */
function head(parts: Array<[number, number[]]>, length = 16) {
    const bytes = new Uint8Array(length)
    for (const [offset, data] of parts) bytes.set(data, offset)
    return bytes
}

const HEADS = {
    id3: head([[0, ascii("ID3")]]),
    mpegFrame: head([[0, [0xff, 0xfb]]]),
    flac: head([[0, ascii("fLaC")]]),
    webm: head([[0, [0x1a, 0x45, 0xdf, 0xa3]]]),
    png: head([[0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]]]),
    jpeg: head([[0, [0xff, 0xd8, 0xff]]]),
    bmp: head([[0, ascii("BM")]]),
    wav: head([
        [0, ascii("RIFF")],
        [8, ascii("WAVE")],
    ]),
    webp: head([
        [0, ascii("RIFF")],
        [8, ascii("WEBP")],
    ]),
    mp4: head([
        [4, ascii("ftyp")],
        [8, ascii("isom")],
    ]),
    quicktime: head([
        [4, ascii("ftyp")],
        [8, ascii("qt  ")],
    ]),
    m4a: head([
        [4, ascii("ftyp")],
        [8, ascii("M4A ")],
    ]),
    m4b: head([
        [4, ascii("ftyp")],
        [8, ascii("M4B ")],
    ]),
}

const encoder = new TextEncoder()

/** Plain Uint8Array concat; the workspace Buffer typings are not assignable to Uint8Array. */
function concat(header: Uint8Array, body: string): Uint8Array {
    const bytes = encoder.encode(body)
    const out = new Uint8Array(header.length + bytes.length)
    out.set(header)
    out.set(bytes, header.length)
    return out
}

function memoryFile(header: Uint8Array, size?: number): UploadFile {
    const buffer = concat(header, "payload")
    return {
        buffer,
        size: size ?? buffer.length,
        path: undefined,
    } as unknown as UploadFile
}

const STORED = {
    url: "https://res.cloudinary.test/a.mp3",
    publicId: "uploads/a",
    bytes: 99,
    durationSec: 3.5,
    width: undefined,
    height: undefined,
}

describe("sniffMime", () => {
    it.each([
        ["ID3 tag", HEADS.id3, "audio/mpeg"],
        ["MPEG frame sync", HEADS.mpegFrame, "audio/mpeg"],
        ["FLAC", HEADS.flac, "audio/flac"],
        ["WebM", HEADS.webm, "video/webm"],
        ["PNG", HEADS.png, "image/png"],
        ["JPEG", HEADS.jpeg, "image/jpeg"],
        ["BMP", HEADS.bmp, "image/bmp"],
        ["WAV", HEADS.wav, "audio/wav"],
        ["WebP", HEADS.webp, "image/webp"],
        ["MP4", HEADS.mp4, "video/mp4"],
        ["QuickTime", HEADS.quicktime, "video/quicktime"],
        ["M4A", HEADS.m4a, "audio/mp4"],
        ["M4B", HEADS.m4b, "audio/mp4"],
    ])("identifies %s by magic bytes", (_name, header, expected) => {
        expect(sniffMime(header)).toBe(expected)
    })

    it("returns null for fewer than four bytes", () => {
        expect(sniffMime(new Uint8Array([0xff, 0xfb, 0x90]))).toBeNull()
    })

    it("rejects a frame sync with the reserved layer bits", () => {
        expect(sniffMime(head([[0, [0xff, 0xe1]]]))).toBeNull()
    })

    it("rejects 0xff followed by too few sync bits", () => {
        expect(sniffMime(head([[0, [0xff, 0x1b]]]))).toBeNull()
    })

    it("rejects BM with non-zero reserved bytes", () => {
        expect(sniffMime(head([[0, [...ascii("BM"), 0, 0, 0, 0, 1]]]))).toBeNull()
    })

    it("rejects a RIFF container that is neither WAVE nor WEBP", () => {
        expect(
            sniffMime(
                head([
                    [0, ascii("RIFF")],
                    [8, ascii("AVI ")],
                ]),
            ),
        ).toBeNull()
    })

    it("rejects unknown content", () => {
        expect(sniffMime(new Uint8Array(16).fill(0x41))).toBeNull()
    })

    it("ignores any claimed name or type because only bytes are read", () => {
        expect(sniffMime(HEADS.png)).toBe("image/png")
    })
})

describe("purposes", () => {
    it("narrows voice samples to strictly under the shared limit", () => {
        expect(UPLOAD_PURPOSES["voice-sample"].maxBytes).toBe(20 * MB - 1)
    })

    it.each(["voice-sample", "tool-video"])("recognises %s as a purpose", (value) => {
        expect(isUploadPurpose(value)).toBe(true)
        expect(parseUploadPurpose(value)).toBe(value)
    })

    it.each([["nope"], ["toString"], [undefined], [42]])("rejects %s", (value) => {
        expect(isUploadPurpose(value)).toBe(false)
        expect(() => parseUploadPurpose(value)).toThrowError(
            expect.objectContaining({ statusCode: 400 }),
        )
    })

    it.each([
        ["audio", 20 * MB],
        ["image", 10 * MB],
        ["video", 100 * MB],
    ] as const)("uses the largest %s cap as the multer bound", (kind, expected) => {
        expect(maxBytesForKind(kind)).toBe(expected)
    })

    it("builds a 413 whose message states the limit in MB", () => {
        const err = uploadTooLargeError("tool-video")
        expect(err.statusCode).toBe(413)
        expect(err.message).toBe("File must be under 100 MB")
    })
})

describe("deleteUploadedFile", () => {
    beforeEach(() => vi.clearAllMocks())

    it.each([
        ["image/png", "image"],
        ["audio/mpeg", "video"],
        ["video/mp4", "video"],
    ])("deletes a %s as resource_type %s", async (mime, resourceType) => {
        mocks.deleteResources.mockResolvedValue({})

        await deleteUploadedFile({ publicId: "p1", mime })

        expect(mocks.deleteResources).toHaveBeenCalledWith(["p1"], {
            resource_type: resourceType,
        })
    })

    it("propagates failures so the sweep can retry", async () => {
        mocks.deleteResources.mockRejectedValue(new Error("cloud down"))

        await expect(deleteUploadedFile({ publicId: "p", mime: "audio/mpeg" })).rejects.toThrow(
            "cloud down",
        )
    })
})

describe("removeTempFile", () => {
    let dir: string
    beforeEach(async () => {
        vi.clearAllMocks()
        dir = await mkdtemp(join(tmpdir(), "media-upload-test-"))
    })
    afterEach(() => rm(dir, { recursive: true, force: true }))

    it("does nothing without a file or a path", async () => {
        await removeTempFile(undefined)
        await removeTempFile(memoryFile(HEADS.id3))

        expect(mocks.logger.error).not.toHaveBeenCalled()
    })

    it("deletes the temp file from disk", async () => {
        const path = join(dir, "tmp.bin")
        await writeFile(path, "x")

        await removeTempFile({ path } as UploadFile)

        await expect(stat(path)).rejects.toMatchObject({ code: "ENOENT" })
    })

    it("logs instead of throwing when the file cannot be removed", async () => {
        const path = join(dir, "missing.bin")

        await expect(removeTempFile({ path } as UploadFile)).resolves.toBeUndefined()

        expect(mocks.logger.error).toHaveBeenCalledWith(
            { err: expect.any(Error), path },
            "Failed to remove temporary upload file",
        )
    })
})

describe("createMediaUpload", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.isE2eUser.mockReturnValue(false)
        mocks.buildMediaFolder.mockReturnValue("base/user_1/uploads")
        mocks.uploadMedia.mockResolvedValue(STORED)
        mocks.deleteResources.mockResolvedValue({})
        mocks.create.mockResolvedValue({ _id: "row_1" })
    })

    it("returns a fake upload for an e2e user without calling Cloudinary", async () => {
        mocks.isE2eUser.mockReturnValue(true)
        mocks.create.mockResolvedValue({ _id: "row_e2e" })

        const dto = await createMediaUpload({
            userId: "user_e2e",
            purpose: "voice-sample",
            file: memoryFile(HEADS.id3),
        })

        expect(mocks.uploadMedia).not.toHaveBeenCalled()
        expect(mocks.uploadStream).not.toHaveBeenCalled()
        expect(dto.uploadId).toBe("row_e2e")
        expect(dto.durationSec).toBe(5)
        expect(dto.url).toContain("fake-cloudinary.invalid")
    })

    it("does not call Cloudinary to clean up a fake upload when the insert fails", async () => {
        mocks.isE2eUser.mockReturnValue(true)
        mocks.create.mockRejectedValue(new Error("db down"))

        await expect(
            createMediaUpload({
                userId: "user_e2e",
                purpose: "voice-sample",
                file: memoryFile(HEADS.id3),
            }),
        ).rejects.toThrow("db down")
        expect(mocks.deleteResources).not.toHaveBeenCalled()
    })

    it("stores a memory audio file, records it and returns the DTO", async () => {
        const file = memoryFile(HEADS.id3)

        const dto = await createMediaUpload({
            userId: "user_1",
            purpose: "voice-sample",
            file,
        })

        expect(mocks.buildMediaFolder).toHaveBeenCalledWith("user_1", "uploads")
        expect(mocks.uploadMedia).toHaveBeenCalledWith(file.buffer, "base/user_1/uploads")
        expect(mocks.create).toHaveBeenCalledWith({
            userId: "user_1",
            purpose: "voice-sample",
            url: STORED.url,
            publicId: STORED.publicId,
            mime: "audio/mpeg",
            bytes: 99,
            durationSec: 3.5,
            width: undefined,
            height: undefined,
            sha256: createHash("sha256").update(concat(HEADS.id3, "payload")).digest("hex"),
        })
        expect(dto).toEqual({
            uploadId: "row_1",
            url: STORED.url,
            mime: "audio/mpeg",
            bytes: 99,
            durationSec: 3.5,
            width: undefined,
            height: undefined,
        })
    })

    it("streams an image to Cloudinary as an image resource and returns its dimensions", async () => {
        const file = memoryFile(HEADS.png)
        mocks.uploadStream.mockImplementation((options, done) => {
            done(undefined, {
                secure_url: "https://res.cloudinary.test/i.png",
                public_id: "uploads/i",
                format: "png",
                bytes: 12,
                width: 640,
                height: 480,
            })
            return { end: vi.fn() }
        })

        const dto = await createMediaUpload({
            userId: "user_1",
            purpose: "tool-image",
            file,
        })

        expect(mocks.uploadStream).toHaveBeenCalledWith(
            { folder: "base/user_1/uploads", resource_type: "image" },
            expect.any(Function),
        )
        expect(mocks.uploadMedia).not.toHaveBeenCalled()
        expect(dto).toMatchObject({
            mime: "image/png",
            bytes: 12,
            width: 640,
            height: 480,
        })
    })

    it("writes the buffer to the image upload stream", async () => {
        const end = vi.fn()
        mocks.uploadStream.mockImplementation(() => ({ end }))
        const file = memoryFile(HEADS.jpeg)

        void createMediaUpload({ userId: "u", purpose: "tool-image", file })
        await vi.waitFor(() => expect(end).toHaveBeenCalledWith(file.buffer))
    })

    it("rejects and cleans up when the image upload callback reports an error", async () => {
        mocks.uploadStream.mockImplementation((_o, done) => {
            done(new Error("upload failed"))
            return { end: vi.fn() }
        })

        await expect(
            createMediaUpload({
                userId: "u",
                purpose: "tool-image",
                file: memoryFile(HEADS.png),
            }),
        ).rejects.toThrow("upload failed")
        expect(mocks.create).not.toHaveBeenCalled()
    })

    it("rejects with a clear error when Cloudinary returns neither error nor result", async () => {
        mocks.uploadStream.mockImplementation((_o, done) => {
            done(undefined, undefined)
            return { end: vi.fn() }
        })

        await expect(
            createMediaUpload({
                userId: "u",
                purpose: "tool-image",
                file: memoryFile(HEADS.png),
            }),
        ).rejects.toThrow("Cloudinary returned no upload result")
    })

    it("sniffs, hashes and uploads a disk-backed video by path", async () => {
        const dir = await mkdtemp(join(tmpdir(), "media-upload-test-"))
        try {
            const path = join(dir, "clip.bin")
            const content = concat(HEADS.mp4, "video-body")
            await writeFile(path, content)
            const file = { path, size: content.length } as UploadFile

            const dto = await createMediaUpload({
                userId: "user_1",
                purpose: "tool-video",
                file,
            })

            expect(mocks.uploadMedia).toHaveBeenCalledWith(path, "base/user_1/uploads")
            expect(mocks.create.mock.calls[0][0].sha256).toBe(
                createHash("sha256").update(content).digest("hex"),
            )
            expect(dto.mime).toBe("video/mp4")
        } finally {
            await rm(dir, { recursive: true, force: true })
        }
    })

    it("rejects a disk file shorter than four bytes as unrecognized", async () => {
        const dir = await mkdtemp(join(tmpdir(), "media-upload-test-"))
        try {
            const path = join(dir, "tiny.bin")
            await writeFile(path, "ab")

            await expect(
                createMediaUpload({
                    userId: "u",
                    purpose: "tool-video",
                    file: { path, size: 2 } as UploadFile,
                }),
            ).rejects.toThrow("unsupported or unrecognized file type")
        } finally {
            await rm(dir, { recursive: true, force: true })
        }
    })

    it("rejects a file over the purpose cap with 413 before reading it", async () => {
        const file = memoryFile(HEADS.id3, 20 * MB)

        await expect(
            createMediaUpload({ userId: "u", purpose: "voice-sample", file }),
        ).rejects.toMatchObject({
            statusCode: 413,
            message: "File must be under 20 MB",
        })
        expect(mocks.uploadMedia).not.toHaveBeenCalled()
    })

    it("accepts a file exactly one byte under the voice-sample limit", async () => {
        const file = memoryFile(HEADS.id3, 20 * MB - 1)

        await expect(
            createMediaUpload({ userId: "u", purpose: "voice-sample", file }),
        ).resolves.toMatchObject({ uploadId: "row_1" })
    })

    it("rejects unrecognized content with 400 and uploads nothing", async () => {
        const file = memoryFile(new Uint8Array(16).fill(0x41))

        await expect(
            createMediaUpload({ userId: "u", purpose: "tool-image", file }),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "file: unsupported or unrecognized file type",
        })
        expect(mocks.uploadMedia).not.toHaveBeenCalled()
        expect(mocks.uploadStream).not.toHaveBeenCalled()
    })

    it("rejects a recognized type that the purpose does not allow", async () => {
        const file = memoryFile(HEADS.png)

        await expect(
            createMediaUpload({ userId: "u", purpose: "voice-sample", file }),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "file: this file type is not allowed for voice-sample",
        })
        expect(mocks.uploadMedia).not.toHaveBeenCalled()
    })

    it("deletes the Cloudinary file and rethrows when recording the row fails", async () => {
        mocks.create.mockRejectedValue(new Error("mongo down"))

        await expect(
            createMediaUpload({
                userId: "u",
                purpose: "voice-sample",
                file: memoryFile(HEADS.id3),
            }),
        ).rejects.toThrow("mongo down")

        expect(mocks.deleteResources).toHaveBeenCalledWith(["uploads/a"], {
            resource_type: "video",
        })
    })

    it("still surfaces the original error when orphan cleanup also fails", async () => {
        mocks.create.mockRejectedValue(new Error("mongo down"))
        mocks.deleteResources.mockRejectedValue(new Error("cloud down"))

        await expect(
            createMediaUpload({
                userId: "u",
                purpose: "voice-sample",
                file: memoryFile(HEADS.id3),
            }),
        ).rejects.toThrow("mongo down")
        expect(mocks.logger.error).toHaveBeenCalledWith(
            { err: expect.objectContaining({ message: "cloud down" }) },
            "Failed to remove orphaned upload",
        )
    })

    it("propagates a Cloudinary upload failure without recording a row", async () => {
        mocks.uploadMedia.mockRejectedValue(new Error("cloud 500"))

        await expect(
            createMediaUpload({
                userId: "u",
                purpose: "voice-sample",
                file: memoryFile(HEADS.id3),
            }),
        ).rejects.toThrow("cloud 500")
        expect(mocks.create).not.toHaveBeenCalled()
    })
})
