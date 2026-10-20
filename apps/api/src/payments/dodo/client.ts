import DodoPayments from "dodopayments"

import { env } from "../../config/env.js"

export type DodoClient = DodoPayments

export function createDodoClient(): DodoClient {
    return new DodoPayments({
        bearerToken: env.DODO_PAYMENTS_API_KEY,
        environment: env.DODO_PAYMENTS_ENVIRONMENT,
        webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY,
    })
}
