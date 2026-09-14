import { beforeEach, describe, expect, it, vi } from "vitest"

const mockChild = vi.fn()
const mockTransport = vi.fn(() => ({ destination: "pretty" }))
const mockPino = vi.fn(() => ({ child: mockChild }))

vi.mock("pino", () => {
    const pino = (...args: unknown[]) => mockPino(...args)
    pino.transport = mockTransport
    return { default: pino }
})

vi.mock("../config/env.js", () => ({
    env: {
        NODE_ENV: "test",
        LOG_LEVEL: "debug",
    },
}))

describe("logger", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.resetModules()
        mockPino.mockReturnValue({ child: mockChild })
        mockTransport.mockReturnValue({ destination: "pretty" })
    })

    it("creates a development logger with pino-pretty transport", async () => {
        vi.doMock("../config/env.js", () => ({
            env: { NODE_ENV: "development", LOG_LEVEL: "info" },
        }))

        await import("./logger.js")

        expect(mockTransport).toHaveBeenCalledWith({
            target: "pino-pretty",
            options: expect.objectContaining({
                colorize: true,
                singleLine: true,
                messageFormat: "{msg}",
            }),
        })
        expect(mockPino).toHaveBeenCalledWith(
            expect.objectContaining({
                level: "info",
                redact: expect.objectContaining({ remove: true }),
            }),
            { destination: "pretty" },
        )
    })

    it("creates a production logger without pretty transport", async () => {
        vi.doMock("../config/env.js", () => ({
            env: { NODE_ENV: "production", LOG_LEVEL: "warn" },
        }))

        await import("./logger.js")

        expect(mockTransport).not.toHaveBeenCalled()
        expect(mockPino).toHaveBeenCalledWith(expect.objectContaining({ level: "warn" }), undefined)
    })

    it("createLogger returns a child logger scoped to the module", async () => {
        vi.doMock("../config/env.js", () => ({
            env: { NODE_ENV: "test", LOG_LEVEL: "info" },
        }))
        mockChild.mockReturnValue({ module: "payments" })

        const { createLogger } = await import("./logger.js")
        const child = createLogger("payments")

        expect(mockChild).toHaveBeenCalledWith({ module: "payments" })
        expect(child).toEqual({ module: "payments" })
    })
})

describe("shortId", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.resetModules()
    })

    it("returns a dash when the id is missing", async () => {
        const { shortId } = await import("./logger.js")

        expect(shortId(undefined)).toBe("-")
        expect(shortId("")).toBe("-")
    })

    it("truncates to 8 characters by default", async () => {
        const { shortId } = await import("./logger.js")

        expect(shortId("abcdefghijklmnop")).toBe("abcdefgh")
    })

    it("truncates to a custom length", async () => {
        const { shortId } = await import("./logger.js")

        expect(shortId("abcdefghijklmnop", 4)).toBe("abcd")
    })
})
