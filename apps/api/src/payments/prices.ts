import {
    CREDIT_PACKS,
    FALLBACK_CURRENCY,
    PRO_PRICE_USD_MONTHLY,
    packCurrencyForCountry,
    type PackCurrency,
} from "@visual-ai/shared"

import { MINOR_UNITS_PER_MAJOR } from "./constants.js"

export interface PriceEntry {
    amountMinor: number
    currency: string
}

export interface PricesResponse {
    country: string | null
    /** Pack currency for this country: INR for India, USD everywhere else. */
    currency: PackCurrency
    pro: PriceEntry
    packs: Array<PriceEntry & { id: string }>
}

/** Pro is one USD product, so every country sees and pays the same $5. */
const PRO_PRICE: PriceEntry = {
    amountMinor: PRO_PRICE_USD_MONTHLY * MINOR_UNITS_PER_MAJOR,
    currency: FALLBACK_CURRENCY,
}

/** Exact prices the buyer will pay; checkout resolves the same currency from the same country. */
export function buildPrices(country: string | undefined): PricesResponse {
    const currency = packCurrencyForCountry(country)
    return {
        country: country ?? null,
        currency,
        pro: PRO_PRICE,
        packs: CREDIT_PACKS.map((pack) => ({
            id: pack.id,
            amountMinor: pack.prices[currency],
            currency,
        })),
    }
}
