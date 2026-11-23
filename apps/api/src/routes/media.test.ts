import { beforeEach, describe, expect, it, vi } from "vitest"

const enqueueGeneration = vi.hoisted(() => vi.fn())
const resolveUserIsPro = vi.hoisted(() => vi.fn())
const checkPromptSafety = vi.hoisted(() => vi.fn())
const getAvailableCredits = vi.hoisted(() => vi.fn())
const hasExistingJob = vi.hoisted(() => vi.fn())
const assets = vi.hoisted(() => ({
    createVersion: vi.fn(),
    deleteMediaAsset: vi.fn(),
    getMediaAsset: vi.fn(),
    listMediaAssets: vi.fn(),
    persistMediaAsset: vi.fn(),
    copyMediaAssetToCloudinary: vi.fn(),
    discardMediaAsset: vi.fn(),
}))
const multerOptions = vi.hoisted(() => ({ current: undefined as any }))
const uploads = vi.hoisted(() => ({
    createMediaUpload: vi.fn(),
    removeTempFile: vi.fn(),
    rateLimited: vi.fn(),
    mapUploadError: vi.fn(),
    // What the kind-specific multer instance does with the request: set req.file/body or fail.
    parse: vi.fn(),
    singleField: vi.fn(),
}))

vi.mock("../middlewares/clerk.js", () => ({
    requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
}))
vi.mock("../services/media-asset-service.js", () => assets)
vi.mock("../middlewares/rate-limit.js", () => ({
    uploadRateLimiter: (_req: unknown, _res: unknown, next: (err?: unknown) => void) =>
        uploads.rateLimited(next),
}))
vi.mock("../middlewares/multer.js", () => {
    const handlerFor = (kind: string) => ({
        single: (field: string) => {
            uploads.singleField(kind, field)
            return (req: unknown, res: unknown, cb: (err?: unknown) => void) =>
                uploads.parse(req, res, cb)
        },
    })
    return {
        mapUploadError: uploads.mapUploadError,
        UPLOAD_BY_KIND: {
            audio: handlerFor("audio"),
            image: handlerFor("image"),
            video: handlerFor("video"),
        },
    }
})
vi.mock("../lib/media-upload.js", async () => {
    const actual =
        await vi.importActual<typeof import("../lib/media-upload.js")>("../lib/media-upload.js")
    return {
        ...actual,
        createMediaUpload: uploads.createMediaUpload,
        removeTempFile: uploads.removeTempFile,
    }
})
// Real multipart parsing is out of scope; capture the options so the limits and filter are tested.
vi.mock("multer", () => {
    const multer: any = (options: unknown) => {
        multerOptions.current = options
        return {
            single: () => (_req: unknown, _res: unknown, next: () => void) => next(),
        }
    }
    multer.memoryStorage = () => "memory"
    multer.diskStorage = () => "disk"
    return { default: multer }
})
vi.mock("../services/generation-service.js", () => ({ resolveUserIsPro }))
vi.mock("../queue/generation-queue.js", () => ({ enqueueGeneration }))
vi.mock("../lib/prompt-moderation.js", () => ({ checkPromptSafety }))
vi.mock("../services/media-service.js", async () => {
    const actual = await vi.importActual<typeof import("../services/media-service.js")>(
        "../services/media-service.js",
    )
    return { ...actual, getAvailableCredits, hasExistingJob }
})
vi.mock("../models/user.js", () => ({ UserModel: {} }))
vi.mock("../models/media-upload.js", () => ({ MediaUploadModel: {} }))
vi.mock("../lib/credit-deduction.js", () => ({
    updateAndGetUserCredits: vi.fn(),
}))
vi.mock("../lib/replicate.js", () => ({ runReplicate: vi.fn() }))
vi.mock("../services/redis-service.js", () => ({ RedisService: class {} }))
vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({ debug: vi.fn(), error: vi.fn(), info: vi.fn() }),
    shortId: (id: string) => id,
}))

const { mediaRoutes } = await import("./media.js")

const LYRIA_COST = 12
const PATH = "/generate/audio/music"

/** Resolves when the handler answers via res.json, rejects when it forwards an error to next. */
function post(req: Record<string, unknown>, path = PATH) {
    const layer = mediaRoutes.stack.find(
        (entry: any) => entry.route?.path === path && entry.route.methods.post,
    )
    if (!layer) throw new Error("Missing route")
    const handles = layer.route!.stack.map((item: any) => item.handle)

    return new Promise<{ statusCode: number; body: unknown }>((resolve, reject) => {
        const res = {
            statusCode: 0,
            body: undefined as unknown,
            status(code: number) {
                this.statusCode = code
                return this
            },
            json(data: unknown) {
                this.body = data
                resolve(this)
                return this
            },
        }
        let index = 0
        const next = (err?: unknown) => {
            if (err) {
                reject(err)
                return
            }
            handles[index++]?.(req, res, next)
        }
        next()
    })
}

const validBody = {
    jobId: "5f0c9a52-7a8e-4a1b-9c1d-2f6c1c8e4b10",
    modelKey: "LYRIA_2",
    prompt: "calm piano",
}
const authed = (body: unknown) => ({ auth: { userId: "user_1" }, body })

describe("POST /generate/audio/music", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        checkPromptSafety.mockResolvedValue({ safe: true })
        getAvailableCredits.mockResolvedValue(100)
        hasExistingJob.mockResolvedValue(false)
        resolveUserIsPro.mockResolvedValue(false)
        enqueueGeneration.mockResolvedValue(undefined)
    })

    it("accepts a valid request and enqueues a music job stamped with the session user", async () => {
        const res = await post(authed({ ...validBody, negativePrompt: "drums", seed: 4 }))

        expect(res.statusCode).toBe(202)
        expect(res.body).toEqual({
            message: "Processing started",
            status: "processing",
        })
        expect(enqueueGeneration).toHaveBeenCalledTimes(1)
        expect(enqueueGeneration).toHaveBeenCalledWith({
            kind: "music",
            body: {
                prompt: "calm piano",
                negativePrompt: "drums",
                seed: 4,
                jobId: "5f0c9a52-7a8e-4a1b-9c1d-2f6c1c8e4b10",
                modelKey: "LYRIA_2",
                userId: "user_1",
            },
            isPro: false,
        })
    })

    it("passes the Pro flag through to the queue", async () => {
        resolveUserIsPro.mockResolvedValue(true)

        await post(authed(validBody))

        expect(resolveUserIsPro).toHaveBeenCalledWith("user_1")
        expect(enqueueGeneration.mock.calls[0][0].isPro).toBe(true)
    })

    it("ignores a body userId and never trusts a client credits value", async () => {
        await post(authed({ ...validBody, userId: "attacker" }))

        expect(enqueueGeneration.mock.calls[0][0].body.userId).toBe("user_1")
        expect(hasExistingJob).toHaveBeenCalledWith(
            "5f0c9a52-7a8e-4a1b-9c1d-2f6c1c8e4b10",
            "user_1",
        )
    })

    it("rejects an unauthenticated request with 401", async () => {
        await expect(post({ auth: undefined, body: validBody })).rejects.toMatchObject({
            statusCode: 401,
        })
        expect(enqueueGeneration).not.toHaveBeenCalled()
    })

    it("rejects a schema violation with a field-level 400", async () => {
        await expect(post(authed({ ...validBody, prompt: "" }))).rejects.toMatchObject({
            statusCode: 400,
            message: "prompt: Prompt is required",
        })
    })

    it("falls back to a body-level message when the issue has no path", async () => {
        await expect(post(authed(undefined))).rejects.toMatchObject({
            statusCode: 400,
        })
    })

    it("rejects an unknown modelKey with 400", async () => {
        await expect(post(authed({ ...validBody, modelKey: "NOPE" }))).rejects.toMatchObject({
            statusCode: 400,
            message: 'modelKey: unknown model "NOPE"',
        })
    })

    it("rejects a modelKey of another kind with 400", async () => {
        await expect(
            post(authed({ ...validBody, modelKey: "MINIMAX_MUSIC_26" })),
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    it("drops a field the schema does not declare instead of forwarding it to the queue", async () => {
        const res = await post(authed({ ...validBody, durationSec: 10, credits: 0 }))

        expect(res.statusCode).toBe(202)
        expect(enqueueGeneration.mock.calls[0][0].body).not.toHaveProperty("durationSec")
        expect(enqueueGeneration.mock.calls[0][0].body).not.toHaveProperty("credits")
    })

    it("moderates the prompt and negative prompt together", async () => {
        await post(authed({ ...validBody, negativePrompt: "drums" }))

        expect(checkPromptSafety).toHaveBeenCalledWith("calm piano\ndrums")
    })

    it("moderates only the prompt when there is no negative prompt", async () => {
        await post(authed(validBody))

        expect(checkPromptSafety).toHaveBeenCalledWith("calm piano")
    })

    it("answers 422 PROMPT_REJECTED and enqueues nothing when moderation fails", async () => {
        checkPromptSafety.mockResolvedValue({ safe: false, reason: "nope" })

        const res = await post(authed(validBody))

        expect(res.statusCode).toBe(422)
        expect(res.body).toEqual({
            code: "PROMPT_REJECTED",
            error: "This text can't be used. Try rephrasing it.",
        })
        expect(getAvailableCredits).not.toHaveBeenCalled()
        expect(enqueueGeneration).not.toHaveBeenCalled()
    })

    it("answers 402 with required and available when credits are short", async () => {
        getAvailableCredits.mockResolvedValue(LYRIA_COST - 1)

        const res = await post(authed(validBody))

        expect(res.statusCode).toBe(402)
        expect(res.body).toEqual({
            code: "INSUFFICIENT_CREDITS",
            required: LYRIA_COST,
            available: LYRIA_COST - 1,
        })
        expect(enqueueGeneration).not.toHaveBeenCalled()
    })

    it("allows a user whose credits exactly cover the cost", async () => {
        getAvailableCredits.mockResolvedValue(LYRIA_COST)

        const res = await post(authed(validBody))

        expect(res.statusCode).toBe(202)
    })

    it("answers 202 without a second enqueue when the same jobId is already queued", async () => {
        hasExistingJob.mockResolvedValue(true)

        const res = await post(authed(validBody))

        expect(res.statusCode).toBe(202)
        expect(enqueueGeneration).not.toHaveBeenCalled()
    })

    it("rejects a jobId owned by another user", async () => {
        hasExistingJob.mockRejectedValue(
            Object.assign(new Error("jobId: already in use"), { statusCode: 400 }),
        )

        await expect(post(authed(validBody))).rejects.toMatchObject({
            statusCode: 400,
        })
        expect(enqueueGeneration).not.toHaveBeenCalled()
    })

    it("propagates an enqueue failure", async () => {
        enqueueGeneration.mockRejectedValue(new Error("redis down"))

        await expect(post(authed(validBody))).rejects.toThrow("redis down")
    })
})

const SONG_PATH = "/generate/audio/song"
const SONG_COST = 30
const songBody = {
    jobId: "5f0c9a52-7a8e-4a1b-9c1d-2f6c1c8e4b10",
    prompt: "upbeat indie pop",
    lyrics: "[Verse]\nWalking home in the rain",
}
const postSong = (body: unknown, req: Record<string, unknown> = { auth: { userId: "user_1" } }) =>
    post({ ...req, body }, SONG_PATH)

describe("POST /generate/audio/song", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        checkPromptSafety.mockResolvedValue({ safe: true })
        getAvailableCredits.mockResolvedValue(100)
        hasExistingJob.mockResolvedValue(false)
        resolveUserIsPro.mockResolvedValue(false)
        enqueueGeneration.mockResolvedValue(undefined)
    })

    it("accepts a valid body, answers 202 and enqueues a song job for the session user", async () => {
        const res = await postSong(songBody)

        expect(res.statusCode).toBe(202)
        expect(res.body).toEqual({ message: "Processing started", status: "processing" })
        expect(enqueueGeneration).toHaveBeenCalledTimes(1)
        expect(enqueueGeneration).toHaveBeenCalledWith({
            kind: "song",
            body: {
                stylePrompt: "upbeat indie pop",
                lyrics: "[Verse]\nWalking home in the rain",
                jobId: "5f0c9a52-7a8e-4a1b-9c1d-2f6c1c8e4b10",
                modelKey: "MINIMAX_MUSIC_26",
                userId: "user_1",
            },
            isPro: false,
        })
    })

    it("passes the Pro flag through to the queue", async () => {
        resolveUserIsPro.mockResolvedValue(true)

        await postSong(songBody)

        expect(resolveUserIsPro).toHaveBeenCalledWith("user_1")
        expect(enqueueGeneration.mock.calls[0][0].isPro).toBe(true)
    })

    it("rejects an unauthenticated request with 401", async () => {
        await expect(postSong(songBody, { auth: undefined })).rejects.toMatchObject({
            statusCode: 401,
        })
        expect(enqueueGeneration).not.toHaveBeenCalled()
    })

    it("ignores a client modelKey, userId and audioFormat", async () => {
        await postSong({
            ...songBody,
            modelKey: "MINIMAX_MUSIC_15",
            userId: "attacker",
            audioFormat: "wav",
        })

        const { body } = enqueueGeneration.mock.calls[0][0]
        expect(body.modelKey).toBe("MINIMAX_MUSIC_26")
        expect(body.userId).toBe("user_1")
        expect(body).not.toHaveProperty("audioFormat")
    })

    it.each([
        ["prompt", { prompt: "123456789" }, "prompt: Style must be at least 10 characters"],
        ["prompt", { prompt: "x".repeat(301) }, "prompt: Style must be at most 300 characters"],
        ["lyrics", { lyrics: "123456789" }, "lyrics: Lyrics must be at least 10 characters"],
        ["lyrics", { lyrics: "x".repeat(3001) }, "lyrics: Lyrics must be at most 3000 characters"],
        ["lyrics", { lyrics: " ".repeat(10) }, "lyrics: Lyrics must contain at least one line"],
    ])("rejects an out-of-range %s with a field-level 400", async (_field, override, message) => {
        await expect(postSong({ ...songBody, ...override })).rejects.toMatchObject({
            statusCode: 400,
            message,
        })
        expect(enqueueGeneration).not.toHaveBeenCalled()
    })

    it.each([
        ["prompt at 10", { prompt: "x".repeat(10) }],
        ["prompt at 300", { prompt: "x".repeat(300) }],
        ["lyrics at 10", { lyrics: "x".repeat(10) }],
        ["lyrics at 3000", { lyrics: "x".repeat(3000) }],
    ])("accepts the boundary %s", async (_name, override) => {
        const res = await postSong({ ...songBody, ...override })

        expect(res.statusCode).toBe(202)
    })

    it("falls back to a body-level message when the body is missing", async () => {
        await expect(postSong(undefined)).rejects.toMatchObject({ statusCode: 400 })
    })

    it("moderates the style and the lyrics together", async () => {
        await postSong(songBody)

        expect(checkPromptSafety).toHaveBeenCalledWith(
            "upbeat indie pop\n[Verse]\nWalking home in the rain",
        )
    })

    it("answers 422 PROMPT_REJECTED and queues nothing when the lyrics fail safety", async () => {
        checkPromptSafety.mockResolvedValue({ safe: false, reason: "nope" })

        const res = await postSong(songBody)

        expect(res.statusCode).toBe(422)
        expect(res.body).toEqual({
            code: "PROMPT_REJECTED",
            error: "This text can't be used. Try rephrasing it.",
        })
        expect(getAvailableCredits).not.toHaveBeenCalled()
        expect(enqueueGeneration).not.toHaveBeenCalled()
    })

    it("answers 402 with required and available and queues nothing when credits are short", async () => {
        getAvailableCredits.mockResolvedValue(SONG_COST - 1)

        const res = await postSong(songBody)

        expect(res.statusCode).toBe(402)
        expect(res.body).toEqual({
            code: "INSUFFICIENT_CREDITS",
            required: SONG_COST,
            available: SONG_COST - 1,
        })
        expect(enqueueGeneration).not.toHaveBeenCalled()
    })

    it("allows a user whose credits exactly cover the cost", async () => {
        getAvailableCredits.mockResolvedValue(SONG_COST)

        const res = await postSong(songBody)

        expect(res.statusCode).toBe(202)
        expect(enqueueGeneration).toHaveBeenCalledTimes(1)
    })

    it("answers 202 without a second enqueue when the same jobId is already queued", async () => {
        hasExistingJob.mockResolvedValue(true)

        const res = await postSong(songBody)

        expect(res.statusCode).toBe(202)
        expect(hasExistingJob).toHaveBeenCalledWith(songBody.jobId, "user_1")
        expect(enqueueGeneration).not.toHaveBeenCalled()
    })

    it("rejects a jobId owned by another user", async () => {
        hasExistingJob.mockRejectedValue(
            Object.assign(new Error("jobId: already in use"), { statusCode: 400 }),
        )

        await expect(postSong(songBody)).rejects.toMatchObject({ statusCode: 400 })
        expect(enqueueGeneration).not.toHaveBeenCalled()
    })

    it("propagates an enqueue failure", async () => {
        enqueueGeneration.mockRejectedValue(new Error("redis down"))

        await expect(postSong(songBody)).rejects.toThrow("redis down")
    })
})

/** Drives the matching route's whole handler chain; settles on json, end or next(err). */
function call(method: "get" | "delete" | "post", path: string, req: Record<string, unknown>) {
    const layer = mediaRoutes.stack.find(
        (entry: any) => entry.route?.path === path && entry.route.methods[method],
    )
    if (!layer) throw new Error(`Missing route ${method} ${path}`)
    const handles = layer.route!.stack.map((item: any) => item.handle)

    return new Promise<{ statusCode: number; body: unknown; ended: boolean }>((resolve, reject) => {
        const res = {
            statusCode: 200,
            body: undefined as unknown,
            ended: false,
            status(code: number) {
                this.statusCode = code
                return this
            },
            json(data: unknown) {
                this.body = data
                resolve(this)
                return this
            },
            end() {
                this.ended = true
                resolve(this)
                return this
            },
        }
        let index = 0
        const next = (err?: unknown) => {
            if (err) {
                reject(err)
                return
            }
            handles[index++]?.({ params: {}, query: {}, ...req }, res, next)
        }
        next()
    })
}

const LIST = "/media/assets"
const ONE = "/media/assets/:id"
const VERSIONS = "/media/assets/:id/versions"
const session = { auth: { userId: "user_1" } }

describe("GET /media/assets", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        assets.listMediaAssets.mockResolvedValue({ items: [], nextCursor: null })
    })

    it("lists for the session user with parsed query options", async () => {
        const res = await call("get", LIST, {
            ...session,
            query: { type: "video", cursor: "abc", limit: "5" },
        })

        expect(res.body).toEqual({ items: [], nextCursor: null })
        expect(assets.listMediaAssets).toHaveBeenCalledWith("user_1", {
            type: "video",
            cursor: "abc",
            limit: 5,
        })
    })

    it("passes undefined options when the query is empty", async () => {
        await call("get", LIST, { ...session, query: { cursor: "" } })

        expect(assets.listMediaAssets).toHaveBeenCalledWith("user_1", {
            type: undefined,
            cursor: undefined,
            limit: undefined,
        })
    })

    it("rejects an unknown type with 400", async () => {
        await expect(
            call("get", LIST, { ...session, query: { type: "image" } }),
        ).rejects.toMatchObject({ statusCode: 400 })
        expect(assets.listMediaAssets).not.toHaveBeenCalled()
    })

    it("rejects a non-integer limit with 400", async () => {
        await expect(
            call("get", LIST, { ...session, query: { limit: "1.5" } }),
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    it("returns 401 without a session", async () => {
        await expect(call("get", LIST, {})).rejects.toMatchObject({
            statusCode: 401,
        })
    })
})

describe("GET /media/assets/:id", () => {
    beforeEach(() => vi.clearAllMocks())

    it("returns the asset scoped to the session user", async () => {
        assets.getMediaAsset.mockResolvedValue({ id: "a1" })

        const res = await call("get", ONE, { ...session, params: { id: "a1" } })

        expect(res.body).toEqual({ id: "a1" })
        expect(assets.getMediaAsset).toHaveBeenCalledWith("user_1", "a1")
    })

    it("forwards a not-found error from the service", async () => {
        assets.getMediaAsset.mockRejectedValue(Object.assign(new Error("nf"), { statusCode: 404 }))

        await expect(call("get", ONE, { ...session, params: { id: "x" } })).rejects.toMatchObject({
            statusCode: 404,
        })
    })

    it("returns 401 without a session", async () => {
        await expect(call("get", ONE, { params: { id: "a1" } })).rejects.toMatchObject({
            statusCode: 401,
        })
    })
})

describe("DELETE /media/assets/:id", () => {
    beforeEach(() => vi.clearAllMocks())

    it("deletes for the session user and answers 204", async () => {
        assets.deleteMediaAsset.mockResolvedValue(undefined)

        const res = await call("delete", ONE, { ...session, params: { id: "a1" } })

        expect(res.statusCode).toBe(204)
        expect(res.ended).toBe(true)
        expect(assets.deleteMediaAsset).toHaveBeenCalledWith("user_1", "a1")
    })

    it("returns 401 without a session and deletes nothing", async () => {
        await expect(call("delete", ONE, { params: { id: "a1" } })).rejects.toMatchObject({
            statusCode: 401,
        })
        expect(assets.deleteMediaAsset).not.toHaveBeenCalled()
    })
})

describe("POST /media/assets/:id/versions", () => {
    beforeEach(() => vi.clearAllMocks())

    it("creates a version from the uploaded buffer and answers 201", async () => {
        assets.createVersion.mockResolvedValue({ id: "v1" })
        const buffer = Buffer.from("ID3 audio")

        const res = await call("post", VERSIONS, {
            ...session,
            params: { id: "a1" },
            file: { buffer },
        })

        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({ id: "v1" })
        expect(assets.createVersion).toHaveBeenCalledWith("user_1", "a1", buffer)
    })

    it("rejects a missing file with 400", async () => {
        await expect(
            call("post", VERSIONS, { ...session, params: { id: "a1" } }),
        ).rejects.toMatchObject({ statusCode: 400 })
        expect(assets.createVersion).not.toHaveBeenCalled()
    })

    it("rejects a file whose bytes are not audio or video with 400", async () => {
        await expect(
            call("post", VERSIONS, {
                ...session,
                params: { id: "a1" },
                file: { buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
            }),
        ).rejects.toMatchObject({ statusCode: 400 })
        expect(assets.createVersion).not.toHaveBeenCalled()
    })

    it("returns 401 without a session", async () => {
        await expect(
            call("post", VERSIONS, {
                params: { id: "a1" },
                file: { buffer: Buffer.from("x") },
            }),
        ).rejects.toMatchObject({ statusCode: 401 })
    })

    it("caps uploads at 50 MB in memory", () => {
        expect(multerOptions.current.limits.fileSize).toBe(50 * 1024 * 1024)
        expect(multerOptions.current.storage).toBe("memory")
    })

    it.each(["audio/mpeg", "video/mp4"])("accepts %s files", (mimetype) => {
        const cb = vi.fn()

        multerOptions.current.fileFilter({}, { mimetype }, cb)

        expect(cb).toHaveBeenCalledWith(null, true)
    })

    it("rejects other file types with a 400 error", () => {
        const cb = vi.fn()

        multerOptions.current.fileFilter({}, { mimetype: "image/png" }, cb)

        expect(cb.mock.calls[0][0]).toMatchObject({ statusCode: 400 })
    })
})

describe("POST /media/uploads", () => {
    const UPLOADS = "/media/uploads"
    const file = { buffer: Buffer.from("x"), size: 1, originalname: "a.mp3" }
    const dto = {
        uploadId: "up_1",
        url: "https://cdn.test/a.mp3",
        mime: "audio/mpeg",
        bytes: 1,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        uploads.rateLimited.mockImplementation((next: () => void) => next())
        uploads.parse.mockImplementation((_req: unknown, _res: unknown, cb: () => void) => cb())
        uploads.mapUploadError.mockImplementation((err: unknown) => err)
        uploads.createMediaUpload.mockResolvedValue(dto)
        uploads.removeTempFile.mockResolvedValue(undefined)
    })

    const upload = (req: Record<string, unknown> = {}) =>
        call("post", UPLOADS, {
            ...session,
            query: { purpose: "voice-sample" },
            body: {},
            file,
            ...req,
        })

    it("creates the upload for the session user and answers 201 with the DTO", async () => {
        const res = await upload()

        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual(dto)
        expect(uploads.createMediaUpload).toHaveBeenCalledWith({
            userId: "user_1",
            purpose: "voice-sample",
            file,
        })
    })

    it.each([
        ["voice-sample", "audio"],
        ["video-image", "image"],
        ["tool-video", "video"],
    ])(
        "parses a %s upload with the %s multer instance on the file field",
        async (purpose, kind) => {
            await upload({ query: { purpose } })

            expect(uploads.singleField).toHaveBeenCalledWith(kind, "file")
        },
    )

    it("removes the temp file after a successful upload", async () => {
        await upload()

        expect(uploads.removeTempFile).toHaveBeenCalledWith(file)
    })

    it("removes the temp file even when creating the upload fails", async () => {
        uploads.createMediaUpload.mockRejectedValue(new Error("cloud down"))

        await expect(upload()).rejects.toThrow("cloud down")

        expect(uploads.removeTempFile).toHaveBeenCalledWith(file)
    })

    it("rejects a missing file with 400", async () => {
        await expect(upload({ file: undefined })).rejects.toMatchObject({
            statusCode: 400,
            message: "file: required",
        })

        expect(uploads.createMediaUpload).not.toHaveBeenCalled()
    })

    it.each([[undefined], ["not-a-purpose"]])(
        "rejects purpose %s with 400 before parsing",
        async (purpose) => {
            await expect(upload({ query: { purpose } })).rejects.toMatchObject({
                statusCode: 400,
            })

            expect(uploads.parse).not.toHaveBeenCalled()
            expect(uploads.createMediaUpload).not.toHaveBeenCalled()
        },
    )

    it("returns 401 without a session and creates nothing", async () => {
        await expect(
            call("post", UPLOADS, { query: { purpose: "voice-sample" } }),
        ).rejects.toMatchObject({
            statusCode: 401,
        })

        expect(uploads.createMediaUpload).not.toHaveBeenCalled()
    })

    it("stops at the rate limiter when the limit is hit", async () => {
        const limited = Object.assign(new Error("Too many"), { statusCode: 429 })
        uploads.rateLimited.mockImplementation((next: (e: unknown) => void) => next(limited))

        await expect(upload()).rejects.toBe(limited)

        expect(uploads.parse).not.toHaveBeenCalled()
    })

    it("forwards a multer failure after mapping it", async () => {
        const raw = new Error("raw multer")
        const mapped = Object.assign(new Error("File must be under 20 MB"), {
            statusCode: 413,
        })
        uploads.parse.mockImplementation((_r: unknown, _s: unknown, cb: (e: unknown) => void) =>
            cb(raw),
        )
        uploads.mapUploadError.mockReturnValue(mapped)

        await expect(upload()).rejects.toBe(mapped)

        expect(uploads.mapUploadError).toHaveBeenCalledWith(raw, "voice-sample")
        expect(uploads.createMediaUpload).not.toHaveBeenCalled()
    })

    it("accepts a form purpose that agrees with the query purpose", async () => {
        const res = await upload({ body: { purpose: "voice-sample" } })

        expect(res.statusCode).toBe(201)
    })

    it("rejects a form purpose that disagrees with the query purpose", async () => {
        await expect(upload({ body: { purpose: "tool-video" } })).rejects.toMatchObject({
            statusCode: 400,
            message: "purpose: does not match the upload request",
        })

        expect(uploads.createMediaUpload).not.toHaveBeenCalled()
    })

    it("removes the spooled temp file when the form purpose disagrees", async () => {
        const file = { path: "/tmp/spooled.mp4" }

        await expect(upload({ body: { purpose: "tool-video" }, file })).rejects.toMatchObject({
            statusCode: 400,
        })

        expect(uploads.removeTempFile).toHaveBeenCalledWith(file)
    })

    it("tolerates a missing body when the parser leaves none", async () => {
        const res = await upload({ body: undefined })

        expect(res.statusCode).toBe(201)
    })
})
