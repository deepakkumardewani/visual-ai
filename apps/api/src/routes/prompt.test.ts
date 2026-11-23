import { beforeEach, describe, expect, it, vi } from "vitest"

const promptActions = vi.hoisted(() => ({
    describeImageFromBuffer: vi.fn(),
    generateRandomPrompt: vi.fn(),
    improveUserPrompt: vi.fn(),
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({ error: vi.fn(), info: vi.fn(), debug: vi.fn() }),
}))

vi.mock("../lib/prompt-actions.js", () => promptActions)

const lyricsState = vi.hoisted(() => ({ generateLyrics: vi.fn() }))
vi.mock("../lib/lyrics-generator.js", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../lib/lyrics-generator.js")>()
    return { ...actual, generateLyrics: lyricsState.generateLyrics }
})

// The limiter itself is covered in rate-limit.test.ts; here it is a pass-through.
vi.mock("../middlewares/rate-limit.js", () => ({
    lyricsRateLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}))

vi.mock("../middlewares/clerk.js", () => ({
    requireAuth: (req: any, res: any, next: any) => {
        if (!req.auth) {
            res.status(401).json({ message: "Unauthorized" })
            return
        }
        next()
    },
}))

vi.mock("../middlewares/multer.js", () => ({
    memoryUpload: { single: () => (_req: unknown, _res: unknown, next: () => void) => next() },
}))

const { promptRoutes } = await import("./prompt.js")

function mockRes() {
    return {
        statusCode: 0,
        body: undefined as unknown,
        status(code: number) {
            this.statusCode = code
            return this
        },
        json(data: unknown) {
            this.body = data
            return this
        },
    }
}

async function dispatch(method: string, path: string, req: object, res: object) {
    const layer = promptRoutes.stack.find(
        (entry: any) => entry.route?.path === path && entry.route.methods[method],
    )
    if (!layer) {
        throw new Error(`Missing route ${method.toUpperCase()} ${path}`)
    }
    const handles = layer.route!.stack.map((item: any) => item.handle)
    let index = 0
    let rejected: unknown
    const next = async (err?: unknown) => {
        if (err) {
            rejected = err
            return
        }
        const handle = handles[index++]
        if (!handle) return
        await handle(req, res, next)
    }
    await next()
    if (rejected) throw rejected
}

describe("promptRoutes", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("POST /prompt/improve", () => {
        it("returns 401 when clerk auth is missing", async () => {
            const res = mockRes()
            await dispatch("post", "/prompt/improve", { body: { prompt: "a cat" } }, res)
            expect(res.statusCode).toBe(401)
        })

        it("throws BadRequestError when prompt is empty", async () => {
            const res = mockRes()
            await expect(
                dispatch(
                    "post",
                    "/prompt/improve",
                    { auth: { userId: "user_1" }, body: { prompt: "   " } },
                    res,
                ),
            ).rejects.toMatchObject({ name: "BadRequestError", statusCode: 400 })
        })

        it("throws BadRequestError when prompt is not a string", async () => {
            const res = mockRes()
            await expect(
                dispatch(
                    "post",
                    "/prompt/improve",
                    { auth: { userId: "user_1" }, body: { prompt: 12 } },
                    res,
                ),
            ).rejects.toMatchObject({ name: "BadRequestError", message: "Prompt is required" })
        })

        it("throws BadRequestError when the body is missing", async () => {
            const res = mockRes()
            await expect(
                dispatch("post", "/prompt/improve", { auth: { userId: "user_1" } }, res),
            ).rejects.toMatchObject({ name: "BadRequestError" })
        })

        it("returns improved prompt text", async () => {
            promptActions.improveUserPrompt.mockResolvedValue("a fluffy orange cat")
            const res = mockRes()
            await dispatch(
                "post",
                "/prompt/improve",
                { auth: { userId: "user_1" }, body: { prompt: " a cat " } },
                res,
            )

            expect(promptActions.improveUserPrompt).toHaveBeenCalledWith("a cat")
            expect(res.body).toEqual({ text: "a fluffy orange cat" })
        })

        it("throws HttpError 502 when improvement fails", async () => {
            promptActions.improveUserPrompt.mockRejectedValue(new Error("model down"))
            const res = mockRes()
            await expect(
                dispatch(
                    "post",
                    "/prompt/improve",
                    { auth: { userId: "user_1" }, body: { prompt: "a cat" } },
                    res,
                ),
            ).rejects.toMatchObject({ name: "HttpError", statusCode: 502 })
        })
    })

    describe("POST /prompt/random", () => {
        it("returns 401 when clerk auth is missing", async () => {
            const res = mockRes()
            await dispatch("post", "/prompt/random", {}, res)
            expect(res.statusCode).toBe(401)
        })

        it("returns a random prompt", async () => {
            promptActions.generateRandomPrompt.mockResolvedValue("neon city rain")
            const res = mockRes()
            await dispatch("post", "/prompt/random", { auth: { userId: "user_1" } }, res)
            expect(res.body).toEqual({ text: "neon city rain" })
        })

        it("throws HttpError 502 when generation fails", async () => {
            promptActions.generateRandomPrompt.mockRejectedValue(new Error("timeout"))
            const res = mockRes()
            await expect(
                dispatch("post", "/prompt/random", { auth: { userId: "user_1" } }, res),
            ).rejects.toMatchObject({ name: "HttpError", statusCode: 502 })
        })
    })

    describe("POST /prompt/describe", () => {
        it("returns 401 when clerk auth is missing", async () => {
            const res = mockRes()
            await dispatch("post", "/prompt/describe", { file: { buffer: Buffer.from("x") } }, res)
            expect(res.statusCode).toBe(401)
        })

        it("throws BadRequestError when no image buffer is provided", async () => {
            const res = mockRes()
            await expect(
                dispatch("post", "/prompt/describe", { auth: { userId: "user_1" } }, res),
            ).rejects.toMatchObject({ message: "No image file provided" })
        })

        it("describes an uploaded image", async () => {
            promptActions.describeImageFromBuffer.mockResolvedValue("a mountain lake")
            const buffer = Buffer.from("fake-image")
            const res = mockRes()
            await dispatch(
                "post",
                "/prompt/describe",
                { auth: { userId: "user_1" }, file: { buffer, mimetype: "image/png" } },
                res,
            )

            expect(promptActions.describeImageFromBuffer).toHaveBeenCalledWith(buffer, "image/png")
            expect(res.body).toEqual({ text: "a mountain lake" })
        })

        it("throws HttpError 502 when describe fails", async () => {
            promptActions.describeImageFromBuffer.mockRejectedValue(new Error("vision error"))
            const res = mockRes()
            await expect(
                dispatch(
                    "post",
                    "/prompt/describe",
                    {
                        auth: { userId: "user_1" },
                        file: { buffer: Buffer.from("x"), mimetype: "image/jpeg" },
                    },
                    res,
                ),
            ).rejects.toMatchObject({ statusCode: 502, message: "Failed to describe image" })
        })
    })

    describe("POST /prompt/lyrics", () => {
        const auth = { userId: "user_1" }

        it("returns 401 when clerk auth is missing", async () => {
            const res = mockRes()
            await dispatch("post", "/prompt/lyrics", { body: { mode: "full", theme: "x" } }, res)
            expect(res.statusCode).toBe(401)
            expect(lyricsState.generateLyrics).not.toHaveBeenCalled()
        })

        it("returns lyrics and passes the Clerk user id and parsed request", async () => {
            lyricsState.generateLyrics.mockResolvedValue("[Verse]\nhello")
            const res = mockRes()
            await dispatch(
                "post",
                "/prompt/lyrics",
                { auth, body: { mode: "full", theme: "  a road trip  " } },
                res,
            )
            expect(res.body).toEqual({ lyrics: "[Verse]\nhello" })
            expect(lyricsState.generateLyrics).toHaveBeenCalledWith({
                userId: "user_1",
                request: { mode: "full", theme: "a road trip" },
            })
        })

        it("throws BadRequestError naming the invalid field", async () => {
            const res = mockRes()
            await expect(
                dispatch(
                    "post",
                    "/prompt/lyrics",
                    { auth, body: { mode: "full", theme: "  " } },
                    res,
                ),
            ).rejects.toMatchObject({
                name: "BadRequestError",
                statusCode: 400,
                message: "theme: Theme is required",
            })
            expect(lyricsState.generateLyrics).not.toHaveBeenCalled()
        })

        it("falls back to a body label when the issue has no path", async () => {
            const res = mockRes()
            await expect(
                dispatch("post", "/prompt/lyrics", { auth, body: undefined }, res),
            ).rejects.toMatchObject({ statusCode: 400, message: expect.stringMatching(/^body: /) })
        })

        it("rejects an unknown mode", async () => {
            const res = mockRes()
            await expect(
                dispatch("post", "/prompt/lyrics", { auth, body: { mode: "poem" } }, res),
            ).rejects.toMatchObject({ statusCode: 400 })
        })

        it("responds 422 with the rejected code and never returns lyrics", async () => {
            const { LyricsRejectedError } = await import("../lib/lyrics-generator.js")
            lyricsState.generateLyrics.mockRejectedValue(new LyricsRejectedError())
            const res = mockRes()
            await dispatch(
                "post",
                "/prompt/lyrics",
                { auth, body: { mode: "full", theme: "x" } },
                res,
            )
            expect(res.statusCode).toBe(422)
            expect(res.body).toEqual({
                code: "PROMPT_REJECTED",
                error: "This text can't be used. Try rephrasing it.",
            })
        })

        it("propagates a 504 timeout error to the error handler", async () => {
            const { HttpError } = await import("../lib/errors.js")
            lyricsState.generateLyrics.mockRejectedValue(new HttpError(504, "too slow"))
            const res = mockRes()
            await expect(
                dispatch(
                    "post",
                    "/prompt/lyrics",
                    { auth, body: { mode: "full", theme: "x" } },
                    res,
                ),
            ).rejects.toMatchObject({ statusCode: 504, message: "too slow" })
        })
    })
})
