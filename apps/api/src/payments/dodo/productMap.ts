import type { CreditPackId, PackCurrency } from "@visual-ai/shared"

import { env } from "../../config/env.js"

export function getDodoProductIdForPro(): string {
    const productId = env.DODO_PRODUCT_ID_PRO
    if (!productId) {
        throw new Error("Missing Dodo product id for Pro subscription")
    }
    return productId
}

/** One Dodo product per pack and currency, each with its own fixed price. */
function productIdsByPack(): Record<CreditPackId, Record<PackCurrency, string | undefined>> {
    return {
        pack_300: {
            USD: env.DODO_PRODUCT_ID_PACK_300_USD,
            INR: env.DODO_PRODUCT_ID_PACK_300_INR,
        },
        pack_700: {
            USD: env.DODO_PRODUCT_ID_PACK_700_USD,
            INR: env.DODO_PRODUCT_ID_PACK_700_INR,
        },
        pack_1600: {
            USD: env.DODO_PRODUCT_ID_PACK_1600_USD,
            INR: env.DODO_PRODUCT_ID_PACK_1600_INR,
        },
        pack_4500: {
            USD: env.DODO_PRODUCT_ID_PACK_4500_USD,
            INR: env.DODO_PRODUCT_ID_PACK_4500_INR,
        },
    }
}

export function getDodoProductIdForPack(packId: CreditPackId, currency: PackCurrency): string {
    const productId = productIdsByPack()[packId]?.[currency]
    if (!productId) {
        throw new Error(`Missing Dodo product id for pack ${packId} in ${currency}`)
    }
    return productId
}
