import { beforeEach, describe, expect, it, vi } from "vitest"

import { asyncHandler } from "./async-handler.js"

describe("asyncHandler", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("returns a function", () => {
        const asyncFn = async () => {
            // dummy async function
        }
        const wrapped = asyncHandler(asyncFn)
        expect(typeof wrapped).toBe("function")
    })

    it("has the correct middleware signature (req, res, next)", () => {
        const asyncFn = async (_req: any, _res: any, _next: any) => {
            // dummy async function
        }
        const wrapped = asyncHandler(asyncFn)
        expect(wrapped.length).toBe(3)
    })

    it("invokes the handler and does not call next on success", async () => {
        const req = { params: { id: "user-1" } } as any
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any
        const next = vi.fn()
        const asyncFn = vi.fn(async (_req: any, response: any) => {
            response.status(200).json({ ok: true })
        })

        const wrapped = asyncHandler(asyncFn)
        await wrapped(req, res, next)

        expect(asyncFn).toHaveBeenCalledWith(req, res, next)
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({ ok: true })
        expect(next).not.toHaveBeenCalled()
    })

    it("forwards a rejected promise to next", async () => {
        const error = new Error("boom")
        const next = vi.fn()
        const wrapped = asyncHandler(async () => {
            throw error
        })

        await wrapped({} as any, {} as any, next)

        expect(next).toHaveBeenCalledWith(error)
    })

    it("forwards a rejected Promise.resolve path to next", async () => {
        const error = new Error("async fail")
        const next = vi.fn()
        const wrapped = asyncHandler(() => Promise.reject(error) as any)

        await wrapped({} as any, {} as any, next)

        expect(next).toHaveBeenCalledWith(error)
    })
})
