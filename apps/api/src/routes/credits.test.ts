import { beforeEach, describe, expect, it, vi } from "vitest"

const userService = vi.hoisted(() => ({
    getUserOrThrow: vi.fn(),
    updateFreeUserCredits: vi.fn(),
}))

vi.mock("../services/user-service.js", () => userService)

const { creditsRoute } = await import("./credits.js")

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
        send(data: unknown) {
            this.body = data
            return this
        },
    }
}

async function dispatch(method: string, path: string, req: object, res: object) {
    const layer = creditsRoute.stack.find(
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

describe("creditsRoute", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("POST /credits", () => {
        it("returns the user's credit balance", async () => {
            userService.getUserOrThrow.mockResolvedValue({ credits: 42 })
            const res = mockRes()
            await dispatch("post", "/credits", { body: { userId: "user_1" } }, res)

            expect(userService.getUserOrThrow).toHaveBeenCalledWith("user_1")
            expect(res.statusCode).toBe(200)
            expect(res.body).toEqual({ credits: 42 })
        })

        it("propagates not-found errors from getUserOrThrow", async () => {
            userService.getUserOrThrow.mockRejectedValue(new Error("User not found"))
            const res = mockRes()
            await expect(
                dispatch("post", "/credits", { body: { userId: "missing" } }, res),
            ).rejects.toMatchObject({ message: "User not found" })
        })
    })

    describe("GET /credits/daily/update", () => {
        it("updates free-user credits and sends success", async () => {
            userService.updateFreeUserCredits.mockResolvedValue(undefined)
            const res = mockRes()
            await dispatch("get", "/credits/daily/update", { body: { userId: "user_1" } }, res)

            expect(userService.updateFreeUserCredits).toHaveBeenCalledWith("user_1")
            expect(res.statusCode).toBe(200)
            expect(res.body).toBe("success")
        })

        it("propagates service errors", async () => {
            userService.updateFreeUserCredits.mockRejectedValue(new Error("User not found"))
            const res = mockRes()
            await expect(
                dispatch("get", "/credits/daily/update", { body: { userId: "missing" } }, res),
            ).rejects.toMatchObject({ message: "User not found" })
        })
    })
})
