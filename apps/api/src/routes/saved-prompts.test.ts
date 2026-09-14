import { CreateSavedPromptSchema } from "@visual-ai/shared"
import { beforeEach, describe, expect, it, vi } from "vitest"

const SavedPromptModel = vi.hoisted(() => ({
    find: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
}))

vi.mock("../middlewares/clerk.js", () => ({
    ClerkExpressRequireAuth: () => (req: any, res: any, next: any) => {
        if (!req.auth) {
            res.status(401).json({ message: "Unauthorized" })
            return
        }
        next()
    },
}))

vi.mock("../models/saved-prompt.js", () => ({
    SavedPromptModel,
}))

const { savedPromptsRoutes } = await import("./saved-prompts.js")

const VALID_ID = "507f1f77bcf86cd799439011"

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
    const layer = savedPromptsRoutes.stack.find(
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

describe("savedPromptsRoutes", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("GET /saved-prompts", () => {
        it("returns 401 when clerk auth is missing", async () => {
            const res = mockRes()
            await dispatch("get", "/saved-prompts", {}, res)
            expect(res.statusCode).toBe(401)
        })

        it("lists the current user's prompts", async () => {
            SavedPromptModel.find.mockReturnValue({
                sort: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                        lean: vi.fn().mockResolvedValue([
                            {
                                _id: VALID_ID,
                                name: "Sunset",
                                prompt: "golden hour sky",
                                modelId: "flux",
                                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                            },
                        ]),
                    }),
                }),
            })
            const res = mockRes()
            await dispatch("get", "/saved-prompts", { auth: { userId: "user_1" } }, res)

            expect(SavedPromptModel.find).toHaveBeenCalledWith({ userId: "user_1" })
            expect(res.statusCode).toBe(200)
            expect(res.body).toEqual({
                prompts: [
                    {
                        id: VALID_ID,
                        name: "Sunset",
                        prompt: "golden hour sky",
                        modelId: "flux",
                        createdAt: "2026-01-01T00:00:00.000Z",
                    },
                ],
            })
        })

        it("omits modelId from the DTO when it is missing", async () => {
            SavedPromptModel.find.mockReturnValue({
                sort: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                        lean: vi.fn().mockResolvedValue([
                            {
                                _id: VALID_ID,
                                name: "Plain",
                                prompt: "just a prompt",
                                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                            },
                        ]),
                    }),
                }),
            })
            const res = mockRes()
            await dispatch("get", "/saved-prompts", { auth: { userId: "user_1" } }, res)
            expect(res.body).toEqual({
                prompts: [
                    {
                        id: VALID_ID,
                        name: "Plain",
                        prompt: "just a prompt",
                        createdAt: "2026-01-01T00:00:00.000Z",
                    },
                ],
            })
        })
    })

    describe("POST /saved-prompts", () => {
        it("throws UnauthorizedError when userId is missing after clerk", async () => {
            const res = mockRes()
            await expect(
                dispatch("post", "/saved-prompts", { auth: { userId: "" }, body: {} }, res),
            ).rejects.toMatchObject({ name: "UnauthorizedError", statusCode: 401 })
        })

        it("throws BadRequestError for invalid body", async () => {
            const res = mockRes()
            await expect(
                dispatch(
                    "post",
                    "/saved-prompts",
                    { auth: { userId: "user_1" }, body: { name: "", prompt: "" } },
                    res,
                ),
            ).rejects.toMatchObject({ name: "BadRequestError", statusCode: 400 })
        })

        it("uses a fallback message when validation issues are empty", async () => {
            const spy = vi.spyOn(CreateSavedPromptSchema, "safeParse").mockReturnValueOnce({
                success: false,
                error: { issues: [] },
            } as never)
            const res = mockRes()
            await expect(
                dispatch(
                    "post",
                    "/saved-prompts",
                    { auth: { userId: "user_1" }, body: { name: "x", prompt: "y" } },
                    res,
                ),
            ).rejects.toMatchObject({ name: "BadRequestError", message: "Invalid request" })
            spy.mockRestore()
        })

        it("creates a saved prompt", async () => {
            SavedPromptModel.create.mockResolvedValue({
                _id: VALID_ID,
                name: "Forest",
                prompt: "misty pines",
                modelId: undefined,
                createdAt: new Date("2026-02-01T00:00:00.000Z"),
            })
            const res = mockRes()
            await dispatch(
                "post",
                "/saved-prompts",
                { auth: { userId: "user_1" }, body: { name: "Forest", prompt: "misty pines" } },
                res,
            )

            expect(SavedPromptModel.create).toHaveBeenCalledWith({
                userId: "user_1",
                name: "Forest",
                prompt: "misty pines",
            })
            expect(res.statusCode).toBe(201)
            expect(res.body).toEqual({
                prompt: {
                    id: VALID_ID,
                    name: "Forest",
                    prompt: "misty pines",
                    createdAt: "2026-02-01T00:00:00.000Z",
                },
            })
        })

        it("persists an optional modelId", async () => {
            SavedPromptModel.create.mockResolvedValue({
                _id: VALID_ID,
                name: "Forest",
                prompt: "misty pines",
                modelId: "flux",
                createdAt: new Date("2026-02-01T00:00:00.000Z"),
            })
            const res = mockRes()
            await dispatch(
                "post",
                "/saved-prompts",
                {
                    auth: { userId: "user_1" },
                    body: { name: "Forest", prompt: "misty pines", modelId: "flux" },
                },
                res,
            )

            expect(SavedPromptModel.create).toHaveBeenCalledWith({
                userId: "user_1",
                name: "Forest",
                prompt: "misty pines",
                modelId: "flux",
            })
            expect((res.body as { prompt: { modelId: string } }).prompt.modelId).toBe("flux")
        })
    })

    describe("DELETE /saved-prompts/:id", () => {
        it("throws BadRequestError for an invalid id", async () => {
            const res = mockRes()
            await expect(
                dispatch(
                    "delete",
                    "/saved-prompts/:id",
                    { auth: { userId: "user_1" }, params: { id: "not-an-id" } },
                    res,
                ),
            ).rejects.toMatchObject({ name: "BadRequestError", message: "Invalid prompt id" })
        })

        it("throws BadRequestError when the id param is not a string", async () => {
            const res = mockRes()
            await expect(
                dispatch(
                    "delete",
                    "/saved-prompts/:id",
                    { auth: { userId: "user_1" }, params: { id: [VALID_ID] } },
                    res,
                ),
            ).rejects.toMatchObject({ name: "BadRequestError", message: "Invalid prompt id" })
        })

        it("throws NotFoundError when the prompt does not exist", async () => {
            SavedPromptModel.findById.mockResolvedValue(null)
            const res = mockRes()
            await expect(
                dispatch(
                    "delete",
                    "/saved-prompts/:id",
                    { auth: { userId: "user_1" }, params: { id: VALID_ID } },
                    res,
                ),
            ).rejects.toMatchObject({ name: "NotFoundError", statusCode: 404 })
        })

        it("throws ForbiddenError when another user owns the prompt", async () => {
            SavedPromptModel.findById.mockResolvedValue({
                userId: "other_user",
                deleteOne: vi.fn(),
            })
            const res = mockRes()
            await expect(
                dispatch(
                    "delete",
                    "/saved-prompts/:id",
                    { auth: { userId: "user_1" }, params: { id: VALID_ID } },
                    res,
                ),
            ).rejects.toMatchObject({ name: "ForbiddenError", statusCode: 403 })
        })

        it("deletes a prompt the user owns", async () => {
            const deleteOne = vi.fn().mockResolvedValue(undefined)
            SavedPromptModel.findById.mockResolvedValue({ userId: "user_1", deleteOne })
            const res = mockRes()
            await dispatch(
                "delete",
                "/saved-prompts/:id",
                { auth: { userId: "user_1" }, params: { id: VALID_ID } },
                res,
            )

            expect(deleteOne).toHaveBeenCalled()
            expect(res.statusCode).toBe(200)
            expect(res.body).toEqual({ success: true })
        })
    })
})
