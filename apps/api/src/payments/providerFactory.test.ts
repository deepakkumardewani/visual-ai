import { beforeEach, describe, expect, it, vi } from "vitest"

const mockEnv = vi.hoisted(() => ({
    PAYMENT_PROVIDER: "dodo" as string,
}))

vi.mock("../config/env.js", () => ({
    env: mockEnv,
}))

const createDodoPaymentProvider = vi.hoisted(() =>
    vi.fn(() => ({
        name: "dodo",
        createCheckout: vi.fn(),
        getSessionStatus: vi.fn(),
        verifyAndParseWebhook: vi.fn(),
    })),
)

vi.mock("./dodo/adapter.js", () => ({
    createDodoPaymentProvider,
}))

const { getPaymentProvider } = await import("./providerFactory.js")

describe("getPaymentProvider", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockEnv.PAYMENT_PROVIDER = "dodo"
    })

    it("returns the Dodo provider when PAYMENT_PROVIDER is dodo", () => {
        const provider = getPaymentProvider()
        expect(createDodoPaymentProvider).toHaveBeenCalledOnce()
        expect(provider.name).toBe("dodo")
    })

    it("throws for an unsupported PAYMENT_PROVIDER value", () => {
        mockEnv.PAYMENT_PROVIDER = "stripe"
        expect(() => getPaymentProvider()).toThrow("Unsupported PAYMENT_PROVIDER: stripe")
    })
})
