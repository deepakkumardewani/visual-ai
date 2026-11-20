import {
    CREDIT_PACKS,
    CREDIT_PACK_CURRENCY,
    FALLBACK_CURRENCY,
    PRO_PRICE_USD_MONTHLY,
    convertMinor,
    currencyForCountry,
    type FxRates,
    type SupportedCurrency,
} from "@visual-ai/shared"

import { MINOR_UNITS_PER_MAJOR } from "./constants.js"

export interface PriceEntry {
    amountMinor: number
    currency: string
}

export interface PricesResponse {
    country: string | null
    currency: string
    isEstimate: true
    pro: PriceEntry
    packs: Array<PriceEntry & { id: string }>
}

const PRO_BASE_MINOR = PRO_PRICE_USD_MONTHLY * MINOR_UNITS_PER_MAJOR

/**
 * Last-known INR per USD, used only when live FX has no usable INR rate so INR-priced packs
 * can still be shown in USD instead of mixing currencies in one response.
 */
const FALLBACK_INR_PER_USD = 83

function withInrRate(rates: FxRates | undefined): FxRates {
    const inr = rates?.[CREDIT_PACK_CURRENCY]
    const usable = inr !== undefined && Number.isFinite(inr) && inr > 0
    return usable && rates ? rates : { ...rates, [CREDIT_PACK_CURRENCY]: FALLBACK_INR_PER_USD }
}

function convertTo(
    amountMinor: number,
    from: string,
    to: SupportedCurrency,
    rates: FxRates,
): PriceEntry {
    const converted = convertMinor(amountMinor, from, to, rates)
    if (converted === undefined) {
        throw new Error(`No FX path from ${from} to ${to}`)
    }
    return { amountMinor: converted, currency: to }
}

function pickTargetCurrency(
    country: string | undefined,
    rates: FxRates | undefined,
): SupportedCurrency {
    const wanted = currencyForCountry(country)
    const hasRate =
        rates !== undefined && convertMinor(1, FALLBACK_CURRENCY, wanted, rates) !== undefined
    return hasRate ? wanted : FALLBACK_CURRENCY
}

/**
 * Display-only estimate; checkout never reads this. Without usable FX every entry is USD
 * (packs converted from INR at the last-known rate), never a mix of currencies.
 */
export function buildPrices(
    country: string | undefined,
    rates: FxRates | undefined,
): PricesResponse {
    const effectiveRates = withInrRate(rates)
    const target = pickTargetCurrency(country, rates)
    const pro = convertTo(PRO_BASE_MINOR, FALLBACK_CURRENCY, target, effectiveRates)
    const packs = CREDIT_PACKS.map((pack) => ({
        id: pack.id,
        ...convertTo(pack.priceMinor, CREDIT_PACK_CURRENCY, target, effectiveRates),
    }))

    return {
        country: country ?? null,
        currency: pro.currency,
        isEstimate: true,
        pro,
        packs,
    }
}
