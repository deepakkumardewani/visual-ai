// @vitest-environment node
import express from "express"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"

const envState = vi.hoisted(() => ({ UNSUBSCRIBE_SECRET: "route-secret" as string | undefined }))
const updateOne = vi.hoisted(() => vi.fn())

vi.mock("../config/env.js", () => ({ env: envState }))
vi.mock("../models/user.js", () => ({ UserModel: { updateOne } }))

const { emailRoutes } = await import("./email.js")
const { signUnsubscribeToken } = await import("../lib/unsubscribe-token.js")

function buildApp() {
    const app = express()
    app.use(emailRoutes)
    app.use(
        (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
            res.status(500).json({ message: err.message })
        },
    )
    return app
}

describe("email unsubscribe routes", () => {
    beforeEach(() => {
        envState.UNSUBSCRIBE_SECRET = "route-secret"
        updateOne.mockReset()
        updateOne.mockResolvedValue({ acknowledged: true })
    })

    describe("GET /email/unsubscribe", () => {
        it("renders the confirmation page without auth and without writing", async () => {
            const token = signUnsubscribeToken("user_1")

            const res = await request(buildApp()).get("/email/unsubscribe").query({ token })

            expect(res.status).toBe(200)
            expect(res.headers["content-type"]).toContain("text/html")
            expect(res.headers["cache-control"]).toBe("no-store")
            expect(res.text).toContain('data-testid="unsubscribe-confirm"')
            expect(res.text).toContain(
                `action="/email/unsubscribe?token=${encodeURIComponent(token)}"`,
            )
            expect(updateOne).not.toHaveBeenCalled()
        })

        it("answers 400 for a missing token", async () => {
            const res = await request(buildApp()).get("/email/unsubscribe")

            expect(res.status).toBe(400)
            expect(res.text).toContain('data-testid="unsubscribe-invalid"')
        })

        it("answers 400 for a tampered token", async () => {
            const res = await request(buildApp())
                .get("/email/unsubscribe")
                .query({ token: "abc.def" })

            expect(res.status).toBe(400)
            expect(res.text).toContain('data-testid="unsubscribe-invalid"')
        })

        it("answers 400 when the token query param is repeated", async () => {
            const token = signUnsubscribeToken("user_1")

            const res = await request(buildApp()).get(
                `/email/unsubscribe?token=${token}&token=${token}`,
            )

            expect(res.status).toBe(400)
        })

        it("answers 400 when the secret is not configured", async () => {
            const token = signUnsubscribeToken("user_1")
            envState.UNSUBSCRIBE_SECRET = undefined

            const res = await request(buildApp()).get("/email/unsubscribe").query({ token })

            expect(res.status).toBe(400)
        })
    })

    describe("POST /email/unsubscribe", () => {
        it("persists the opt-out for the token's user and confirms", async () => {
            const token = signUnsubscribeToken("user_42")

            const res = await request(buildApp()).post("/email/unsubscribe").query({ token })

            expect(res.status).toBe(200)
            expect(res.text).toContain('data-testid="unsubscribe-success"')
            expect(updateOne).toHaveBeenCalledWith(
                { userId: "user_42" },
                { $set: { emailOptOut: true } },
            )
        })

        it("is idempotent across repeated posts", async () => {
            const token = signUnsubscribeToken("user_42")
            const app = buildApp()

            const first = await request(app).post("/email/unsubscribe").query({ token })
            const second = await request(app).post("/email/unsubscribe").query({ token })

            expect(first.status).toBe(200)
            expect(second.status).toBe(200)
            expect(updateOne).toHaveBeenCalledTimes(2)
            for (const call of updateOne.mock.calls) {
                expect(call).toEqual([{ userId: "user_42" }, { $set: { emailOptOut: true } }])
            }
        })

        it("answers 400 and writes nothing for a missing token", async () => {
            const res = await request(buildApp()).post("/email/unsubscribe")

            expect(res.status).toBe(400)
            expect(res.text).toContain('data-testid="unsubscribe-invalid"')
            expect(updateOne).not.toHaveBeenCalled()
        })

        it("answers 400 and writes nothing for an invalid token", async () => {
            const res = await request(buildApp()).post("/email/unsubscribe").query({ token: "x.y" })

            expect(res.status).toBe(400)
            expect(updateOne).not.toHaveBeenCalled()
        })

        it("rejects a token signed for a different purpose", async () => {
            const token = signUnsubscribeToken("user_1", "other")

            const res = await request(buildApp()).post("/email/unsubscribe").query({ token })

            expect(res.status).toBe(400)
            expect(updateOne).not.toHaveBeenCalled()
        })

        it("accepts an RFC 8058 one-click body without cookies", async () => {
            const token = signUnsubscribeToken("user_7")

            const res = await request(buildApp())
                .post(`/email/unsubscribe?token=${token}`)
                .type("form")
                .send("List-Unsubscribe=One-Click")

            expect(res.status).toBe(200)
            expect(updateOne).toHaveBeenCalledWith(
                { userId: "user_7" },
                { $set: { emailOptOut: true } },
            )
        })

        it("forwards database failures to the error handler", async () => {
            updateOne.mockRejectedValueOnce(new Error("db down"))
            const token = signUnsubscribeToken("user_1")

            const res = await request(buildApp()).post("/email/unsubscribe").query({ token })

            expect(res.status).toBe(500)
            expect(res.body).toEqual({ message: "db down" })
        })
    })
})
