import { beforeEach, describe, expect, it, vi } from "vitest"

const mounted = vi.hoisted(() => [] as unknown[][])

vi.mock("../middlewares/clerk.js", () => ({
    requireAuth: "clerk-auth",
}))

vi.mock("../routes/collections.js", () => ({ collectionRoutes: "collectionRoutes" }))
vi.mock("../routes/credits.js", () => ({ creditsRoute: "creditsRoute" }))
vi.mock("../routes/explore.js", () => ({ exploreRoutes: "exploreRoutes" }))
vi.mock("../routes/generate.js", () => ({ generateRoute: "generateRoute" }))
vi.mock("../routes/image.js", () => ({ imageRoutes: "imageRoutes" }))
vi.mock("../payments/router.js", () => ({ paymentsApiRouter: "paymentsApiRouter" }))
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
        expect(mounted).toContainEqual(["clerk-auth", "userRoutes"])
        expect(mounted).toContainEqual(["clerk-auth", "exploreRoutes"])
        expect(mounted).toContainEqual(["clerk-auth", "creditsRoute"])
        expect(mounted).toContainEqual(["clerk-auth", "imageRoutes"])
        expect(mounted).toContainEqual(["clerk-auth", "collectionRoutes"])
        expect(mounted).toContainEqual(["clerk-auth", "paymentsApiRouter"])
    })

    it("registers every application router exactly once", async () => {
        await import("./index.js")
        const routerNames = mounted.flatMap((args) =>
            args[0] === "clerk-auth" ? args.slice(1) : [args[0]],
        )
        expect(routerNames).toEqual([
            "generateRoute",
            "promptRoutes",
            "savedPromptsRoutes",
            "userRoutes",
            "exploreRoutes",
            "creditsRoute",
            "imageRoutes",
            "collectionRoutes",
            "paymentsApiRouter",
        ])
    })
})
