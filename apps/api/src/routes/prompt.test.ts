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

vi.mock("../middlewares/clerk.js", () => ({
    ClerkExpressRequireAuth: () => (req: any, res: any, next: any) => {
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
    const handles = layer.route.stack.map((item: any) => item.handle)
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
})
