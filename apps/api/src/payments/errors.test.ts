import { describe, expect, it } from "vitest"

import { InvalidSignatureError, ProviderApiError, UnknownPackError } from "./errors.js"

describe("InvalidSignatureError", () => {
    it("uses the default message when none is provided", () => {
        const error = new InvalidSignatureError()
        expect(error.message).toBe("Invalid webhook signature")
        expect(error.name).toBe("InvalidSignatureError")
    })

    it("preserves a custom message", () => {
        const error = new InvalidSignatureError("bad sig")
        expect(error.message).toBe("bad sig")
    })
})

describe("UnknownPackError", () => {
    it("names the unknown pack in the message", () => {
        const error = new UnknownPackError("pack_fake")
        expect(error.message).toBe("Unknown credit pack: pack_fake")
        expect(error.name).toBe("UnknownPackError")
    })
})

describe("ProviderApiError", () => {
    it("redacts webhook secrets from the message", () => {
        const error = new ProviderApiError("failed whsec_live_abc123xyz end")
        expect(error.message).toBe("failed [redacted] end")
        expect(error.name).toBe("ProviderApiError")
    })

    it("redacts bearer tokens and sk_ keys from the message", () => {
        const error = new ProviderApiError("sk_test_secretkey and bearer deadbeef")
        expect(error.message).toBe("[redacted] and [redacted]")
    })

    it("preserves safe messages and optional cause", () => {
        const cause = new Error("upstream")
        const error = new ProviderApiError("checkout failed", { cause })
        expect(error.message).toBe("checkout failed")
        expect(error.cause).toBe(cause)
    })
})
