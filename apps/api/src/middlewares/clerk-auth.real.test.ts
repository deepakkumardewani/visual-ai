import express from "express"
import type { NextFunction, Request, Response } from "express"
import request from "supertest"
import { describe, expect, it, vi } from "vitest"

vi.mock("../config/env.js", () => ({
    env: {
        CLERK_SECRET_KEY: "sk_test_dummy",
        CLERK_PUBLISHABLE_KEY: "pk_test_ZHVtbXkuY2xlcmsuYWNjb3VudHMuZGV2JA",
        CLERK_JWT_KEY: "dummy",
    },
}))
vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
}))

import { resolveErrorStatus } from "../lib/errors.js"
import { requireAuth } from "./clerk.js"

// Uses the real Clerk requireAuth (no mock) with the same status mapping app.ts uses.
function buildApp() {
    const app = express()
    app.use(requireAuth, (_req, res) => res.json({ ok: true }))
    app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
        res.status(resolveErrorStatus(err)).json({ error: (err as Error).message })
    })
    return app
}

describe("real requireAuth without a session", () => {
    it.each([
        ["get", "/media/assets"],
        ["get", "/media/assets/abc"],
        ["delete", "/media/assets/abc"],
        ["post", "/media/assets/abc/versions"],
        ["post", "/media/uploads"],
    ] as const)("%s %s returns 401", async (method, path) => {
        const res = await request(buildApp())[method](path)

        expect(res.status).toBe(401)
    })
})
