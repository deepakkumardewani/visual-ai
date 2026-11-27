import { beforeEach, describe, expect, it, vi } from "vitest"

const envMock = vi.hoisted(() => ({ ADMIN_USER_IDS: [] as string[] }))
vi.mock("../config/env.js", () => ({ env: envMock }))

const { isAdminUser, requireAdmin } = await import("./require-admin.js")

function run(userId: string | undefined) {
    const res = {
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
    const next = vi.fn()
    requireAdmin({ auth: { userId } } as never, res as never, next)
    return { res, next }
}

describe("requireAdmin", () => {
    beforeEach(() => {
        envMock.ADMIN_USER_IDS = ["admin_1", "admin_2"]
    })

    it("calls next for a listed admin", () => {
        const { res, next } = run("admin_2")
        expect(next).toHaveBeenCalledTimes(1)
        expect(res.statusCode).toBe(0)
    })

    it("returns 403 { error } for a non-admin", () => {
        const { res, next } = run("user_9")
        expect(next).not.toHaveBeenCalled()
        expect(res.statusCode).toBe(403)
        expect(res.body).toEqual({ error: "Forbidden" })
    })

    it("denies everyone when the admin list is empty", () => {
        envMock.ADMIN_USER_IDS = []
        expect(run("admin_1").res.statusCode).toBe(403)
    })

    it("denies a missing user id", () => {
        expect(run(undefined).res.statusCode).toBe(403)
        expect(isAdminUser(null)).toBe(false)
    })
})
