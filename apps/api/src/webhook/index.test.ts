import { beforeEach, describe, expect, it, vi } from "vitest"

const verify = vi.fn()
const signUpHandler = vi.fn()

vi.mock("svix", () => ({
    Webhook: class {
        verify = verify
    },
}))

vi.mock("../config/env.js", () => ({
    env: { WEBHOOK_SECRET: "whsec_test_secret" },
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    }),
}))

vi.mock("../services/user-service.js", () => ({
    signUpHandler,
}))

function mockRes() {
    return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    }
}

function routeHandler(
    router: { stack: Array<{ route?: { path: string; stack: Array<{ handle: Function }> } }> },
    path: string,
) {
    const layer = router.stack.find((entry) => entry.route?.path === path)
    const stack = layer?.route?.stack ?? []
    return stack[stack.length - 1].handle
}

const { webhookRouter } = await import("./index.js")

describe("webhookRouter clerk", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("returns a 400 Response when Svix headers are missing", async () => {
        const handler = routeHandler(webhookRouter, "/webhooks/clerk")
        const result = await handler({ headers: {}, body: Buffer.from("{}") }, mockRes())

        expect(result).toBeInstanceOf(Response)
        expect(result.status).toBe(400)
        expect(verify).not.toHaveBeenCalled()
        expect(signUpHandler).not.toHaveBeenCalled()
    })

    it("returns 400 when signature verification fails", async () => {
        verify.mockImplementation(() => {
            throw new Error("invalid signature")
        })

        const res = mockRes()
        const handler = routeHandler(webhookRouter, "/webhooks/clerk")
        await handler(
            {
                headers: {
                    "svix-id": "msg_1",
                    "svix-timestamp": "1710000000",
                    "svix-signature": "v1,bad",
                },
                body: Buffer.from('{"type":"user.created"}'),
            },
            res,
        )

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "invalid signature",
        })
        expect(signUpHandler).not.toHaveBeenCalled()
    })

    it("verifies the payload and calls signUpHandler on success", async () => {
        const evt = { type: "user.created", data: { id: "user_abc" } }
        verify.mockReturnValue(evt)

        const res = mockRes()
        const handler = routeHandler(webhookRouter, "/webhooks/clerk")
        const payload = Buffer.from(JSON.stringify(evt))

        await handler(
            {
                headers: {
                    "svix-id": "msg_1",
                    "svix-timestamp": "1710000000",
                    "svix-signature": "v1,good",
                },
                body: payload,
            },
            res,
        )

        expect(verify).toHaveBeenCalledWith(payload, {
            "svix-id": "msg_1",
            "svix-timestamp": "1710000000",
            "svix-signature": "v1,good",
        })
        expect(signUpHandler).toHaveBeenCalledWith(evt)
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Webhook received",
        })
    })
})
