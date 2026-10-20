import { env } from "../config/env.js"
import { PAYMENT_PROVIDER_DODO } from "./constants.js"
import { createDodoPaymentProvider } from "./dodo/adapter.js"
import type { PaymentProvider } from "./types.js"

export function getPaymentProvider(): PaymentProvider {
    switch (env.PAYMENT_PROVIDER) {
        case PAYMENT_PROVIDER_DODO:
            return createDodoPaymentProvider()
        default:
            throw new Error(`Unsupported PAYMENT_PROVIDER: ${env.PAYMENT_PROVIDER}`)
    }
}
