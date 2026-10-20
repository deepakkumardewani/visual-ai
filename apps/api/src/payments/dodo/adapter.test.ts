import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { describe, expect, it, vi } from "vitest"

const mockEnv = vi.hoisted(() => ({
    DODO_PRODUCT_ID_PACK_200: "pdt_from_env_200",
    DODO_PRODUCT_ID_PACK_450: "pdt_env_450",
    DODO_PRODUCT_ID_PACK_960: "pdt_env_960",
    DODO_PRODUCT_ID_PACK_2000: "pdt_env_2000",
}))

vi.mock("../../config/env.js", () => ({
    env: mockEnv,
}))

const createDodoClient = vi.hoisted(() => vi.fn())

vi.mock("./client.js", () => ({
    createDodoClient,
}))

import { CREDIT_PACKS } from "@visual-ai/shared"

import { PAYMENT_STATUS } from "../constants.js"
import { InvalidSignatureError, ProviderApiError } from "../errors.js"
import { createDodoPaymentProvider } from "./adapter.js"

const pack200 = CREDIT_PACKS[0]!

function makeMockClient() {
    return {
        checkoutSessions: {
            create: vi.fn(),
            retrieve: vi.fn(),
        },
    }
}

describe("createDodoPaymentProvider", () => {
    it("sends product id from env mapping, metadata, return URL, and optional email", async () => {
        const client = makeMockClient()
        client.checkoutSessions.create.mockResolvedValue({
            checkout_url: "https://checkout.example/session",
            session_id: "cks_abc",
        })

        const provider = createDodoPaymentProvider(client as never)
        const result = await provider.createCheckout({
            userId: "user_1",
            pack: pack200,
            email: "buyer@example.com",
            returnUrl: "https://app.example/return",
        })

        expect(result).toEqual({
            checkoutUrl: "https://checkout.example/session",
            sessionId: "cks_abc",
        })
        expect(client.checkoutSessions.create).toHaveBeenCalledWith({
            product_cart: [{ product_id: "pdt_from_env_200", quantity: 1 }],
            metadata: { userId: "user_1", packId: "pack_200" },
            customer: { email: "buyer@example.com" },
            return_url: "https://app.example/return",
        })
        const payload = client.checkoutSessions.create.mock.calls[0]![0] as Record<string, unknown>
        expect(payload).not.toHaveProperty("price")
        expect(payload).not.toHaveProperty("credits")
        expect(JSON.stringify(payload)).not.toMatch(/99999/)
    })

    it("omits customer when email is not provided", async () => {
        const client = makeMockClient()
        client.checkoutSessions.create.mockResolvedValue({
            checkout_url: "https://checkout.example/session",
            session_id: "cks_no_email",
        })

        const provider = createDodoPaymentProvider(client as never)
        await provider.createCheckout({
            userId: "user_2",
            pack: pack200,
            returnUrl: "https://app.example/return",
        })

        const payload = client.checkoutSessions.create.mock.calls[0]![0] as Record<string, unknown>
        expect(payload).not.toHaveProperty("customer")
    })

    it("throws ProviderApiError when checkout response is incomplete", async () => {
        const client = makeMockClient()
        client.checkoutSessions.create.mockResolvedValue({
            checkout_url: "",
            session_id: "cks_partial",
        })

        const provider = createDodoPaymentProvider(client as never)
        await expect(
            provider.createCheckout({
                userId: "user_1",
                pack: pack200,
                returnUrl: "https://app.example/return",
            }),
        ).rejects.toMatchObject({
            name: "ProviderApiError",
            message: "Checkout session missing checkout URL or session id",
        })
    })

    it("wraps SDK failures as ProviderApiError without leaking key material", async () => {
        const client = makeMockClient()
        client.checkoutSessions.create.mockRejectedValue(
            new Error("request failed sk_live_supersecret token"),
        )

        const provider = createDodoPaymentProvider(client as never)
        await expect(
            provider.createCheckout({
                userId: "user_1",
                pack: pack200,
                returnUrl: "https://app.example/return",
            }),
        ).rejects.toMatchObject({
            name: "ProviderApiError",
            message: "request failed [redacted] token",
        })
    })

    it("rethrows ProviderApiError from createCheckout", async () => {
        const client = makeMockClient()
        const original = new ProviderApiError("already sanitized")
        client.checkoutSessions.create.mockRejectedValue(original)

        const provider = createDodoPaymentProvider(client as never)
        await expect(
            provider.createCheckout({
                userId: "user_1",
                pack: pack200,
                returnUrl: "https://app.example/return",
            }),
        ).rejects.toBe(original)
    })

    it("maps retrieve payment_status values to internal status", async () => {
        const client = makeMockClient()
        const provider = createDodoPaymentProvider(client as never)

        const cases: Array<[string, string]> = [
            ["succeeded", PAYMENT_STATUS.COMPLETED],
            ["paid", PAYMENT_STATUS.COMPLETED],
            ["failed", PAYMENT_STATUS.FAILED],
            ["cancelled", PAYMENT_STATUS.FAILED],
            ["processing", PAYMENT_STATUS.PENDING],
        ]

        for (const [paymentStatus, expected] of cases) {
            client.checkoutSessions.retrieve.mockResolvedValueOnce({
                payment_id: "pay_1",
                payment_status: paymentStatus,
            })
            const status = await provider.getSessionStatus("cks_1")
            expect(status).toEqual({ paymentId: "pay_1", status: expected })
        }
    })

    it("treats non-string payment_id as null", async () => {
        const client = makeMockClient()
        client.checkoutSessions.retrieve.mockResolvedValue({
            payment_id: 123,
            payment_status: "succeeded",
        })
        const provider = createDodoPaymentProvider(client as never)
        const status = await provider.getSessionStatus("cks_1")
        expect(status.paymentId).toBeNull()
        expect(status.status).toBe(PAYMENT_STATUS.COMPLETED)
    })

    it("wraps retrieve failures as ProviderApiError", async () => {
        const client = makeMockClient()
        client.checkoutSessions.retrieve.mockRejectedValue(new Error("network down"))

        const provider = createDodoPaymentProvider(client as never)
        await expect(provider.getSessionStatus("cks_missing")).rejects.toMatchObject({
            name: "ProviderApiError",
            message: "network down",
        })
    })

    it("uses default message when retrieve rejection is not an Error", async () => {
        const client = makeMockClient()
        client.checkoutSessions.retrieve.mockRejectedValue("broken")

        const provider = createDodoPaymentProvider(client as never)
        await expect(provider.getSessionStatus("cks_missing")).rejects.toMatchObject({
            name: "ProviderApiError",
            message: "Dodo checkout session retrieve failed",
        })
    })

    it("uses default message when create rejection is not an Error", async () => {
        const client = makeMockClient()
        client.checkoutSessions.create.mockRejectedValue(null)

        const provider = createDodoPaymentProvider(client as never)
        await expect(
            provider.createCheckout({
                userId: "user_1",
                pack: pack200,
                returnUrl: "https://app.example/return",
            }),
        ).rejects.toMatchObject({
            name: "ProviderApiError",
            message: "Dodo checkout session creation failed",
        })
    })

    it("verifyAndParseWebhook rejects until Phase 4", () => {
        const provider = createDodoPaymentProvider(makeMockClient() as never)
        expect(() => provider.verifyAndParseWebhook(Buffer.from("{}"), {})).toThrow(
            InvalidSignatureError,
        )
    })

    it("builds a provider with createDodoClient when no client is injected", async () => {
        const client = makeMockClient()
        createDodoClient.mockReturnValue(client as never)
        client.checkoutSessions.create.mockResolvedValue({
            checkout_url: "https://checkout.example/injected",
            session_id: "cks_default_client",
        })

        const provider = createDodoPaymentProvider()
        await provider.createCheckout({
            userId: "user_default",
            pack: pack200,
            returnUrl: "https://app.example/return",
        })

        expect(createDodoClient).toHaveBeenCalledOnce()
    })
})

describe("dodopayments import architecture guard", () => {
    it("allows dodopayments only under payments/dodo/", () => {
        const apiSrc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
        const offenders: string[] = []

        function walk(dir: string) {
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, entry.name)
                if (entry.isDirectory()) {
                    if (entry.name === "node_modules") continue
                    walk(full)
                    continue
                }
                if (!entry.name.endsWith(".ts") || entry.name.endsWith(".test.ts")) continue
                const rel = path.relative(apiSrc, full).replace(/\\/g, "/")
                if (rel.startsWith("payments/dodo/")) continue
                const text = fs.readFileSync(full, "utf8")
                if (
                    /from\s+["']dodopayments["']/.test(text) ||
                    /require\s*\(\s*["']dodopayments["']\s*\)/.test(text)
                ) {
                    offenders.push(rel)
                }
            }
        }

        walk(apiSrc)
        expect(offenders).toEqual([])
    })
})
