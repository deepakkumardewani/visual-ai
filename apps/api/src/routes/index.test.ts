import { beforeEach, describe, expect, it, vi } from "vitest"

const mounted = vi.hoisted(() => [] as unknown[][])

vi.mock("../middlewares/clerk.js", () => ({
    ClerkExpressRequireAuth: () => "clerk-auth",
}))

vi.mock("../routes/collections.js", () => ({ collectionRoutes: "collectionRoutes" }))
vi.mock("../routes/credits.js", () => ({ creditsRoute: "creditsRoute" }))
vi.mock("../routes/explore.js", () => ({ exploreRoutes: "exploreRoutes" }))
vi.mock("../routes/generate.js", () => ({ generateRoute: "generateRoute" }))
vi.mock("../routes/image.js", () => ({ imageRoutes: "imageRoutes" }))
vi.mock("../routes/payments.js", () => ({ paymentsRoute: "paymentsRoute" }))
vi.mock("../routes/prompt.js", () => ({ promptRoutes: "promptRoutes" }))
vi.mock("../routes/saved-prompts.js", () => ({ savedPromptsRoutes: "savedPromptsRoutes" }))
vi.mock("../routes/users.js", () => ({ userRoutes: "userRoutes" }))

vi.mock("express", () => {
    const router = {
        use: (...args: unknown[]) => {
            mounted.push(args)
            return router
        },
    }
    return {
        default: {
            Router: () => router,
        },
        Router: () => router,
    }
})

describe("api router index", () => {
    beforeEach(() => {
        mounted.length = 0
        vi.resetModules()
    })

    it("mounts public generate, prompt, and saved-prompt routers without clerk", async () => {
        const { router } = await import("./index.js")
        expect(router).toBeDefined()
        expect(mounted[0]).toEqual(["generateRoute"])
        expect(mounted[1]).toEqual(["promptRoutes"])
        expect(mounted[2]).toEqual(["savedPromptsRoutes"])
    })

    it("mounts authenticated routers with ClerkExpressRequireAuth", async () => {
        await import("./index.js")
        expect(mounted).toContainEqual(["userRoutes", "clerk-auth"])
        expect(mounted).toContainEqual(["exploreRoutes", "clerk-auth"])
        expect(mounted).toContainEqual(["creditsRoute", "clerk-auth"])
        expect(mounted).toContainEqual(["imageRoutes", "clerk-auth"])
        expect(mounted).toContainEqual(["collectionRoutes", "clerk-auth"])
        expect(mounted).toContainEqual(["paymentsRoute", "clerk-auth"])
    })

    it("registers every application router exactly once", async () => {
        await import("./index.js")
        expect(mounted.map((args) => args[0])).toEqual([
            "generateRoute",
            "promptRoutes",
            "savedPromptsRoutes",
            "userRoutes",
            "exploreRoutes",
            "creditsRoute",
            "imageRoutes",
            "collectionRoutes",
            "paymentsRoute",
        ])
    })
})
