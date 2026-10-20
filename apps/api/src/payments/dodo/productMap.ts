import type { CreditPackId } from "@visual-ai/shared"

import { env } from "../../config/env.js"

export function getDodoProductIdForPack(packId: CreditPackId): string {
    const productIdByPack: Record<CreditPackId, string | undefined> = {
        pack_200: env.DODO_PRODUCT_ID_PACK_200,
        pack_450: env.DODO_PRODUCT_ID_PACK_450,
        pack_960: env.DODO_PRODUCT_ID_PACK_960,
        pack_2000: env.DODO_PRODUCT_ID_PACK_2000,
    }
    const productId = productIdByPack[packId]
    if (!productId) {
        throw new Error(`Missing Dodo product id for pack ${packId}`)
    }
    return productId
}
