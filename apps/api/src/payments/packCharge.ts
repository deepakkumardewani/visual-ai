import {
    getCreditPack,
    isPackCurrency,
    type CreditPack,
    type PackCurrency,
} from "@visual-ai/shared"

/** What one pack purchase costs and grants; the unit the webhook validates and records. */
export interface PackCharge {
    packId: string
    credits: number
    amountMinor: number
    currency: string
    description: string
}

const LEGACY_PACK_CURRENCY = "INR"

/**
 * Retired INR-only packs. A checkout opened before the pack change can still fire its webhook,
 * which must credit what was paid for then. Never listed or purchasable; webhook use only.
 */
const LEGACY_PACK_CHARGES: Readonly<Record<string, PackCharge>> = {
    pack_200: legacyCharge("pack_200", 200, 13_000),
    pack_450: legacyCharge("pack_450", 450, 29_000),
    pack_960: legacyCharge("pack_960", 960, 50_000),
    pack_2000: legacyCharge("pack_2000", 2000, 90_000),
}

function legacyCharge(packId: string, credits: number, amountMinor: number): PackCharge {
    return {
        packId,
        credits,
        amountMinor,
        currency: LEGACY_PACK_CURRENCY,
        description: `${credits} credits`,
    }
}

export function packCharge(pack: CreditPack, currency: PackCurrency): PackCharge {
    return {
        packId: pack.id,
        credits: pack.credits,
        amountMinor: pack.prices[currency],
        currency,
        description: pack.description,
    }
}

/**
 * Expected charge for a webhook, from the pack id and currency the server stamped into checkout
 * metadata. Legacy checkouts carry no currency and resolve to their fixed INR price.
 */
export function resolveWebhookCharge(
    packId: string,
    checkoutCurrency: string | null,
): PackCharge | undefined {
    if (Object.hasOwn(LEGACY_PACK_CHARGES, packId)) {
        return LEGACY_PACK_CHARGES[packId]
    }
    const pack = getCreditPack(packId)
    if (!pack || !checkoutCurrency || !isPackCurrency(checkoutCurrency)) {
        return undefined
    }
    return packCharge(pack, checkoutCurrency)
}
