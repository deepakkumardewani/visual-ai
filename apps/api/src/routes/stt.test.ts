// @vitest-environment node
import express from "express"
import { STT_MAX_BYTES } from "@visual-ai/shared"
import request from "supertest"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const envState = vi.hoisted(() => ({ XAI_API_KEY: "xai-test-key" as string | undefined }))
const fetchMock = vi.hoisted(() => vi.fn())
let rateLimitGate = vi.hoisted(
    () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
)

vi.mock("../config/env.js", () => ({
    env: envState,
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({ error: vi.fn(), info: vi.fn(), debug: vi.fn() }),
}))

vi.mock("../middlewares/clerk.js", () => ({
    requireAuth: (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const auth = (req as express.Request & { auth?: { userId?: string } }).auth
        if (!auth?.userId) {
            res.status(401).json({ message: "Unauthorized" })
            return
        }
        next()
    },
}))

vi.mock("../middlewares/rate-limit.js", () => ({
    get sttRateLimiter() {
        return (req: express.Request, res: express.Response, next: express.NextFunction) =>
            rateLimitGate(req, res, next)
    },
}))

const { sttRoute } = await import("./stt.js")

async function dispatchSttHandler(req: object, res: ReturnType<typeof mockRes>) {
    const layer = sttRoute.stack.find((entry) => entry.route?.path === "/stt")
    if (!layer?.route) {
        throw new Error("Missing POST /stt route")
    }
    const handler = layer.route.stack[layer.route.stack.length - 1]?.handle
    if (!handler) {
        throw new Error("Missing STT handler")
    }
    let forwarded: unknown
    await handler(
        req as unknown as express.Request,
        res as unknown as express.Response,
        (err?: unknown) => {
            forwarded = err
        },
    )
    if (forwarded) {
        throw forwarded
    }
}

function mockRes() {
    return {
        statusCode: 200,
        body: undefined as unknown,
        json(data: unknown) {
            this.body = data
            return this
        },
    }
}

function createApp() {
    const app = express()
    app.use((req, _res, next) => {
        const headerUser = req.headers["x-test-user"] as string | undefined
        if (headerUser) {
            ;(req as express.Request & { auth?: { userId: string } }).auth = {
                userId: headerUser,
            } as express.Request["auth"]
        }
        next()
    })
    app.use(sttRoute)
    app.use(
        (
            err: Error & { statusCode?: number },
            _req: express.Request,
            res: express.Response,
            _next: express.NextFunction,
        ) => {
            const status = err.statusCode ?? 500
            res.status(status).json({ message: err.message })
        },
    )
    return app
}

function mockUpstreamJson(body: unknown, status = 200) {
    fetchMock.mockResolvedValueOnce({
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
    })
}

describe("sttRoute POST /stt", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        envState.XAI_API_KEY = "xai-test-key"
        rateLimitGate = (_req, _res, next) => next()
        vi.stubGlobal("fetch", fetchMock)
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.unstubAllGlobals()
    })

    it("returns 401 when the caller is not authenticated", async () => {
        const res = await request(createApp()).post("/stt").attach("file", Buffer.from("audio"), {
            filename: "a.webm",
            contentType: "audio/webm",
        })
        expect(res.status).toBe(401)
        expect(res.body).toEqual({ message: "Unauthorized" })
    })

    it("returns 429 with Retry-After when the rate limiter blocks the request", async () => {
        rateLimitGate = (_req, res: express.Response) => {
            res.setHeader("Retry-After", "600")
            res.status(429).json({ message: "Too many voice requests. Try again later." })
        }
        const app = createApp()
        const res = await request(app)
            .post("/stt")
            .set("x-test-user", "user-rate")
            .attach("file", Buffer.from("audio"), {
                filename: "a.webm",
                contentType: "audio/webm",
            })
        expect(res.status).toBe(429)
        expect(res.headers["retry-after"]).toBe("600")
    })

    it("returns 503 when XAI_API_KEY is not configured", async () => {
        envState.XAI_API_KEY = undefined
        const res = await request(createApp())
            .post("/stt")
            .set("x-test-user", "user-1")
            .attach("file", Buffer.from("audio"), {
                filename: "a.webm",
                contentType: "audio/webm",
            })
        expect(res.status).toBe(503)
        expect(res.body.message).toBe("Speech transcription is not configured")
    })

    it("returns 400 when no audio file is uploaded", async () => {
        const res = await request(createApp()).post("/stt").set("x-test-user", "user-1").send()
        expect(res.status).toBe(400)
        expect(res.body.message).toBe("No audio file provided")
    })

    it("returns 400 for a disallowed mime type", async () => {
        const res = await request(createApp())
            .post("/stt")
            .set("x-test-user", "user-1")
            .attach("file", Buffer.from("not-audio"), {
                filename: "notes.txt",
                contentType: "text/plain",
            })
        expect(res.status).toBe(400)
        expect(res.body.message).toBe("Invalid audio file type")
    })

    it("accepts audio/mpeg uploads", async () => {
        mockUpstreamJson({ text: "mpeg clip" })
        const res = await request(createApp())
            .post("/stt")
            .set("x-test-user", "user-1")
            .attach("file", Buffer.from("mpeg-bytes"), {
                filename: "clip.mp3",
                contentType: "audio/mpeg",
            })
        expect(res.status).toBe(200)
        expect(res.body).toEqual({ text: "mpeg clip" })
    })

    it("accepts video/webm uploads", async () => {
        mockUpstreamJson({ text: " hello " })
        const res = await request(createApp())
            .post("/stt")
            .set("x-test-user", "user-1")
            .attach("file", Buffer.from("webm-bytes"), {
                filename: "clip.webm",
                contentType: "video/webm",
            })
        expect(res.status).toBe(200)
        expect(res.body).toEqual({ text: "hello" })
    })

    it("returns 413 when the upload exceeds STT_MAX_BYTES", async () => {
        const oversized = Buffer.alloc(STT_MAX_BYTES + 1)
        const res = await request(createApp())
            .post("/stt")
            .set("x-test-user", "user-1")
            .attach("file", oversized, {
                filename: "big.webm",
                contentType: "audio/webm",
            })
        expect(res.status).toBe(413)
        expect(res.body.message).toBe("Audio file too large")
    })

    it("returns trimmed transcription text from xAI", async () => {
        mockUpstreamJson({ text: "  dictated prompt  " })
        const res = await request(createApp())
            .post("/stt")
            .set("x-test-user", "user-1")
            .attach("file", Buffer.from("audio"), {
                filename: "take.webm",
                contentType: "audio/webm",
            })
        expect(res.status).toBe(200)
        expect(res.body).toEqual({ text: "dictated prompt" })
    })

    it("returns empty text when upstream omits a string text field", async () => {
        mockUpstreamJson({ text: 42 })
        const res = await request(createApp())
            .post("/stt")
            .set("x-test-user", "user-1")
            .attach("file", Buffer.from("audio"), {
                filename: "take.webm",
                contentType: "audio/webm",
            })
        expect(res.status).toBe(200)
        expect(res.body).toEqual({ text: "" })
    })

    it("sends model before file in the multipart body to xAI", async () => {
        mockUpstreamJson({ text: "ok" })
        await request(createApp())
            .post("/stt")
            .set("x-test-user", "user-1")
            .attach("file", Buffer.from("audio-bytes"), {
                filename: "rec.webm",
                contentType: "audio/webm",
            })

        expect(fetchMock).toHaveBeenCalledTimes(1)
        const init = fetchMock.mock.calls[0]?.[1] as RequestInit
        const body = init.body as FormData
        const fieldOrder = [...body.keys()]
        expect(fieldOrder).toEqual(["model", "file"])
        expect(body.get("model")).toBe("grok-voice-transcribe-2.0")
    })

    it("returns 502 when xAI responds with a non-success status", async () => {
        mockUpstreamJson({ error: "upstream" }, 500)
        const res = await request(createApp())
            .post("/stt")
            .set("x-test-user", "user-1")
            .attach("file", Buffer.from("audio"), {
                filename: "a.webm",
                contentType: "audio/webm",
            })
        expect(res.status).toBe(502)
        expect(res.body.message).toBe("Transcription failed")
    })

    it("returns 502 when the upstream request aborts", async () => {
        fetchMock.mockRejectedValueOnce(Object.assign(new Error("aborted"), { name: "AbortError" }))
        const res = await request(createApp())
            .post("/stt")
            .set("x-test-user", "user-1")
            .attach("file", Buffer.from("audio"), {
                filename: "a.webm",
                contentType: "audio/webm",
            })
        expect(res.status).toBe(502)
        expect(res.body.message).toBe("Transcription timed out")
    })

    it("arms a 30s abort timer while calling xAI", async () => {
        mockUpstreamJson({ text: "timed" })
        const abortSpy = vi.spyOn(AbortController.prototype, "abort")
        const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout")
        await dispatchSttHandler(
            {
                file: {
                    buffer: Buffer.from("audio"),
                    mimetype: "audio/webm",
                    originalname: "a.webm",
                },
            },
            mockRes(),
        )
        const timerCall = setTimeoutSpy.mock.calls.find(([, delay]) => delay === 30_000)
        expect(timerCall).toBeDefined()
        ;(timerCall![0] as () => void)()
        expect(abortSpy).toHaveBeenCalled()
        abortSpy.mockRestore()
        setTimeoutSpy.mockRestore()
    })

    it("returns 502 when fetch fails with a generic error", async () => {
        fetchMock.mockRejectedValueOnce(new Error("network down"))
        const res = await request(createApp())
            .post("/stt")
            .set("x-test-user", "user-1")
            .attach("file", Buffer.from("audio"), {
                filename: "a.webm",
                contentType: "audio/webm",
            })
        expect(res.status).toBe(502)
        expect(res.body.message).toBe("Transcription failed")
    })

    it("uses recording.webm when the uploaded file has no original name", async () => {
        mockUpstreamJson({ text: "fallback name" })
        const res = mockRes()
        await dispatchSttHandler(
            {
                file: {
                    buffer: Buffer.from("audio"),
                    mimetype: "audio/webm",
                    originalname: undefined,
                },
            } as unknown as express.Request,
            res,
        )
        expect(res.body).toEqual({ text: "fallback name" })
        const init = fetchMock.mock.calls.at(-1)?.[1] as RequestInit
        const filePart = (init.body as FormData).get("file") as File
        expect(filePart.name).toBe("recording.webm")
    })

    it("forwards non-size multer errors to downstream error handling", async () => {
        const app = express()
        app.use((req, _res, next) => {
            ;(req as express.Request & { auth?: { userId: string } }).auth = {
                userId: "user-1",
            } as express.Request["auth"]
            next()
        })
        app.use(sttRoute)
        const seen = vi.fn()
        app.use(
            (
                err: Error,
                _req: express.Request,
                res: express.Response,
                _next: express.NextFunction,
            ) => {
                seen(err.message)
                res.status(500).json({ message: err.message })
            },
        )

        const res = await request(app)
            .post("/stt")
            .set("x-test-user", "user-1")
            .attach("file", Buffer.from("one"), {
                filename: "one.webm",
                contentType: "audio/webm",
            })
            .attach("file", Buffer.from("two"), {
                filename: "two.webm",
                contentType: "audio/webm",
            })

        expect(seen).toHaveBeenCalled()
        expect(res.status).toBe(500)
    })
})
