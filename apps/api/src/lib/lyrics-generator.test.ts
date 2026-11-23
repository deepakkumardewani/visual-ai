import { beforeEach, describe, expect, it, vi } from "vitest"

const envState = vi.hoisted(() => ({ E2E_USER_IDS: [] as string[] }))
const loggerState = vi.hoisted(() => ({ warn: vi.fn() }))

vi.mock("../config/env.js", () => ({ env: envState }))
vi.mock("./logger.js", () => ({
    createLogger: () => ({ ...loggerState, info: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

const { generateLyrics, FAKE_LYRICS } = await import("./lyrics-generator.js")

describe("generateLyrics", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        envState.E2E_USER_IDS = []
    })

    it("returns the fixed fake sections for an e2e user", async () => {
        envState.E2E_USER_IDS = ["user_e2e"]
        const result = await generateLyrics({ userId: "user_e2e" })
        expect(result.sections.map((s) => s.section)).toEqual(["Verse", "Chorus"])
        expect(result.sections.every((s) => s.lines.length > 0)).toBe(true)
        expect(loggerState.warn).toHaveBeenCalledTimes(1)
    })

    it("returns a copy so callers cannot mutate the shared fixture", async () => {
        envState.E2E_USER_IDS = ["user_e2e"]
        const result = await generateLyrics({ userId: "user_e2e" })
        result.sections[0]?.lines.push("mutated")
        expect(FAKE_LYRICS.sections[0]?.lines).not.toContain("mutated")
    })

    it("matches any id in a multi-id list", async () => {
        envState.E2E_USER_IDS = ["user_a", "user_b"]
        await expect(generateLyrics({ userId: "user_b" })).resolves.toEqual(FAKE_LYRICS)
    })

    it("rejects for a non-e2e user until the real generator exists", async () => {
        envState.E2E_USER_IDS = ["user_e2e"]
        await expect(generateLyrics({ userId: "someone_else" })).rejects.toThrow("not implemented")
        expect(loggerState.warn).not.toHaveBeenCalled()
    })

    it("never treats an empty userId as an e2e user", async () => {
        envState.E2E_USER_IDS = [""]
        await expect(generateLyrics({ userId: "" })).rejects.toThrow("not implemented")
    })
})
