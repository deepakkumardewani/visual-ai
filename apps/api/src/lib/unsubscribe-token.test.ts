import { createHmac } from "node:crypto"
import { beforeEach, describe, expect, it, vi } from "vitest"

const envState = vi.hoisted(() => ({ UNSUBSCRIBE_SECRET: "test-secret" as string | undefined }))

vi.mock("../config/env.js", () => ({ env: envState }))

const { signUnsubscribeToken, verifyUnsubscribeToken, UNSUBSCRIBE_PURPOSE } =
    await import("./unsubscribe-token.js")

const encode = (value: string) => Buffer.from(value).toString("base64url")
const hmac = (payload: string, secret: string) =>
    createHmac("sha256", secret).update(payload).digest("base64url")

describe("unsubscribe token", () => {
    beforeEach(() => {
        envState.UNSUBSCRIBE_SECRET = "test-secret"
    })

    it("round-trips a userId with the default purpose", () => {
        const token = signUnsubscribeToken("user_123")

        expect(verifyUnsubscribeToken(token)).toBe("user_123")
        expect(UNSUBSCRIBE_PURPOSE).toBe("unsubscribe")
    })

    it("round-trips userIds containing the separator", () => {
        const token = signUnsubscribeToken("user.with.dots")

        expect(verifyUnsubscribeToken(token)).toBe("user.with.dots")
    })

    it("round-trips a custom purpose", () => {
        const token = signUnsubscribeToken("user_1", "preferences")

        expect(verifyUnsubscribeToken(token, "preferences")).toBe("user_1")
    })

    it("rejects a token signed for a different purpose", () => {
        const token = signUnsubscribeToken("user_1", "preferences")

        expect(verifyUnsubscribeToken(token)).toBeNull()
    })

    it("rejects a tampered payload", () => {
        const [, signature] = signUnsubscribeToken("user_1").split(".")
        const forged = `${encode("user_2.unsubscribe")}.${signature}`

        expect(verifyUnsubscribeToken(forged)).toBeNull()
    })

    it("rejects a tampered signature", () => {
        const [payload, signature] = signUnsubscribeToken("user_1").split(".")
        const flipped = `${signature!.startsWith("A") ? "B" : "A"}${signature!.slice(1)}`

        expect(verifyUnsubscribeToken(`${payload}.${flipped}`)).toBeNull()
    })

    it("rejects a signature of the wrong length", () => {
        const [payload] = signUnsubscribeToken("user_1").split(".")

        expect(verifyUnsubscribeToken(`${payload}.abc`)).toBeNull()
    })

    it("rejects a token signed with another secret", () => {
        const token = signUnsubscribeToken("user_1")
        envState.UNSUBSCRIBE_SECRET = "other-secret"

        expect(verifyUnsubscribeToken(token)).toBeNull()
    })

    it.each([
        ["empty string", ""],
        ["no separator", "abc"],
        ["empty signature", "abc."],
        ["empty payload", ".abc"],
        ["extra segments", "a.b.c"],
    ])("rejects a malformed token: %s", (_label, token) => {
        expect(verifyUnsubscribeToken(token)).toBeNull()
    })

    it("rejects a validly signed payload that has no purpose separator", () => {
        const payload = encode("nopurpose")

        expect(verifyUnsubscribeToken(`${payload}.${hmac(payload, "test-secret")}`)).toBeNull()
    })

    it("rejects a validly signed payload with an empty userId", () => {
        const payload = encode(".unsubscribe")

        expect(verifyUnsubscribeToken(`${payload}.${hmac(payload, "test-secret")}`)).toBeNull()
    })

    describe("when UNSUBSCRIBE_SECRET is missing", () => {
        it("throws when signing", () => {
            envState.UNSUBSCRIBE_SECRET = undefined

            expect(() => signUnsubscribeToken("user_1")).toThrow("UNSUBSCRIBE_SECRET is not set")
        })

        it("returns null when verifying a previously valid token", () => {
            const token = signUnsubscribeToken("user_1")
            envState.UNSUBSCRIBE_SECRET = undefined

            expect(verifyUnsubscribeToken(token)).toBeNull()
        })
    })
})
