import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
    userLimiter: vi.fn((_req: unknown, _res: unknown, next: () => void) => next()),
    adminLimiter: vi.fn((_req: unknown, _res: unknown, next: () => void) => next()),
    claimFeedbackPrompt: vi.fn(),
    submitFeedback: vi.fn(),
    listFeedback: vi.fn(),
    getFeedbackById: vi.fn(),
    updateFeedbackAdmin: vi.fn(),
    env: { ADMIN_USER_IDS: ["admin_1"] as string[] },
}))

vi.mock("../config/env.js", () => ({ env: mocks.env }))
vi.mock("../middlewares/feedback-rate-limit.js", () => ({
    feedbackRateLimiter: mocks.userLimiter,
    feedbackAdminRateLimiter: mocks.adminLimiter,
}))
vi.mock("../services/feedback-service.js", () => ({
    claimFeedbackPrompt: mocks.claimFeedbackPrompt,
    submitFeedback: mocks.submitFeedback,
    listFeedback: mocks.listFeedback,
    getFeedbackById: mocks.getFeedbackById,
    updateFeedbackAdmin: mocks.updateFeedbackAdmin,
}))

const { feedbackRoutes } = await import("./feedback.js")

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
    const layer = feedbackRoutes.stack.find(
        (entry: any) => entry.route?.path === path && entry.route.methods[method],
    )
    if (!layer) throw new Error(`Missing route ${method.toUpperCase()} ${path}`)
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

const userReq = (extra: object = {}) => ({
    auth: { userId: "user_1" },
    body: {},
    params: {},
    query: {},
    ...extra,
})
const adminReq = (extra: object = {}) => ({ ...userReq(extra), auth: { userId: "admin_1" } })

const doc = {
    _id: VALID_ID,
    userId: "user_1",
    email: "u@example.com",
    type: "rating",
    createdAt: new Date("2026-06-01T00:00:00Z"),
    updatedAt: new Date("2026-06-02T00:00:00Z"),
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe("POST /feedback/eligibility", () => {
    it("returns the claim result for a valid trigger", async () => {
        mocks.claimFeedbackPrompt.mockResolvedValue(true)
        const res = mockRes()
        await dispatch(
            "post",
            "/feedback/eligibility",
            userReq({ body: { trigger: "download" } }),
            res,
        )
        expect(mocks.claimFeedbackPrompt).toHaveBeenCalledWith("user_1", "download")
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ eligible: true })
    })

    it("rejects an invalid trigger with 400", async () => {
        await expect(
            dispatch(
                "post",
                "/feedback/eligibility",
                userReq({ body: { trigger: "x" } }),
                mockRes(),
            ),
        ).rejects.toMatchObject({ statusCode: 400 })
        expect(mocks.claimFeedbackPrompt).not.toHaveBeenCalled()
    })

    it("rejects an unauthenticated request with 401", async () => {
        await expect(
            dispatch("post", "/feedback/eligibility", { body: { trigger: "download" } }, mockRes()),
        ).rejects.toMatchObject({ statusCode: 401 })
    })
})

describe("POST /feedback", () => {
    it("creates feedback and returns 201 with the id", async () => {
        mocks.submitFeedback.mockResolvedValue(VALID_ID)
        const res = mockRes()
        await dispatch("post", "/feedback", userReq({ body: { source: "popup", rating: 5 } }), res)
        expect(mocks.submitFeedback).toHaveBeenCalledWith("user_1", { source: "popup", rating: 5 })
        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({ id: VALID_ID })
    })

    it("does not accept an email from the client", async () => {
        mocks.submitFeedback.mockResolvedValue(VALID_ID)
        await dispatch(
            "post",
            "/feedback",
            userReq({ body: { source: "popup", rating: 5, email: "evil@example.com" } }),
            mockRes(),
        )
        expect(mocks.submitFeedback.mock.calls[0]?.[1]).not.toHaveProperty("email")
    })

    it("rejects an invalid body with 400", async () => {
        await expect(
            dispatch(
                "post",
                "/feedback",
                userReq({ body: { source: "menu", type: "bug" } }),
                mockRes(),
            ),
        ).rejects.toMatchObject({ statusCode: 400 })
        expect(mocks.submitFeedback).not.toHaveBeenCalled()
    })
})

describe("admin routes", () => {
    it("GET /feedback/admin/access reports admin status without needing admin", async () => {
        const asUser = mockRes()
        await dispatch("get", "/feedback/admin/access", userReq(), asUser)
        expect(asUser.body).toEqual({ isAdmin: false })

        const asAdmin = mockRes()
        await dispatch("get", "/feedback/admin/access", adminReq(), asAdmin)
        expect(asAdmin.body).toEqual({ isAdmin: true })
    })

    it("blocks non-admins with 403 on list, detail and patch", async () => {
        for (const [method, path] of [
            ["get", "/feedback/admin"],
            ["get", "/feedback/admin/:id"],
            ["patch", "/feedback/admin/:id"],
        ] as const) {
            const res = mockRes()
            await dispatch(method, path, userReq({ params: { id: VALID_ID } }), res)
            expect(res.statusCode).toBe(403)
            expect(res.body).toEqual({ error: "Forbidden" })
        }
        expect(mocks.listFeedback).not.toHaveBeenCalled()
    })

    it("lists with parsed filters and serialises items", async () => {
        mocks.listFeedback.mockResolvedValue({
            items: [doc],
            total: 1,
            page: 1,
            limit: 25,
            summary: { avgRating: 4, countByType: { rating: 1 }, open: 1 },
        })
        const res = mockRes()
        await dispatch(
            "get",
            "/feedback/admin",
            adminReq({ query: { type: "rating", page: "2" } }),
            res,
        )

        expect(mocks.listFeedback).toHaveBeenCalledWith(
            expect.objectContaining({ type: "rating", page: 2 }),
        )
        const body = res.body as { items: Array<Record<string, unknown>>; summary: unknown }
        expect(body.items[0]).toMatchObject({ id: VALID_ID, createdAt: "2026-06-01T00:00:00.000Z" })
        expect(body.items[0]).not.toHaveProperty("_id")
        expect(body.summary).toEqual({ avgRating: 4, countByType: { rating: 1 }, open: 1 })
    })

    it("rejects an invalid list query with 400", async () => {
        await expect(
            dispatch("get", "/feedback/admin", adminReq({ query: { type: "nope" } }), mockRes()),
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    it("returns one item, and 400 for a malformed id", async () => {
        mocks.getFeedbackById.mockResolvedValue(doc)
        const res = mockRes()
        await dispatch("get", "/feedback/admin/:id", adminReq({ params: { id: VALID_ID } }), res)
        expect(res.body).toMatchObject({ item: { id: VALID_ID } })

        await expect(
            dispatch("get", "/feedback/admin/:id", adminReq({ params: { id: "bad" } }), mockRes()),
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    it("patches status and note", async () => {
        mocks.updateFeedbackAdmin.mockResolvedValue({ ...doc, status: "planned" })
        const res = mockRes()
        await dispatch(
            "patch",
            "/feedback/admin/:id",
            adminReq({ params: { id: VALID_ID }, body: { status: "planned", adminNote: " ok " } }),
            res,
        )
        expect(mocks.updateFeedbackAdmin).toHaveBeenCalledWith(VALID_ID, {
            status: "planned",
            adminNote: "ok",
        })
        expect(res.body).toMatchObject({ item: { status: "planned" } })
    })

    it("rejects an empty patch and an invalid status with 400", async () => {
        await expect(
            dispatch(
                "patch",
                "/feedback/admin/:id",
                adminReq({ params: { id: VALID_ID }, body: {} }),
                mockRes(),
            ),
        ).rejects.toMatchObject({ statusCode: 400 })
        await expect(
            dispatch(
                "patch",
                "/feedback/admin/:id",
                adminReq({ params: { id: VALID_ID }, body: { status: "bogus" } }),
                mockRes(),
            ),
        ).rejects.toMatchObject({ statusCode: 400 })
    })
})

describe("rate limiter buckets", () => {
    const limitersOf = (method: string, path: string) =>
        feedbackRoutes.stack
            .find((entry: any) => entry.route?.path === path && entry.route.methods[method])!
            .route!.stack.map((item: any) => item.handle)

    it("keeps submit and eligibility on the user limiter only", () => {
        for (const path of ["/feedback", "/feedback/eligibility"]) {
            const handles = limitersOf("post", path)
            expect(handles).toContain(mocks.userLimiter)
            expect(handles).not.toContain(mocks.adminLimiter)
        }
    })

    it("puts every admin route on the admin limiter, never the user one", () => {
        const adminRoutes: Array<[string, string]> = [
            ["get", "/feedback/admin/access"],
            ["get", "/feedback/admin"],
            ["get", "/feedback/admin/:id"],
            ["patch", "/feedback/admin/:id"],
        ]
        for (const [method, path] of adminRoutes) {
            const handles = limitersOf(method, path)
            expect(handles).toContain(mocks.adminLimiter)
            expect(handles).not.toContain(mocks.userLimiter)
        }
    })
})

describe("route registration order", () => {
    it("registers /feedback/admin/access before /feedback/admin/:id", () => {
        const paths = feedbackRoutes.stack.map((entry: any) => entry.route?.path)
        expect(paths.indexOf("/feedback/admin/access")).toBeLessThan(
            paths.indexOf("/feedback/admin/:id"),
        )
    })
})
