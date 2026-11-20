import { createHmac, timingSafeEqual } from "node:crypto"

import { env } from "../config/env.js"

export const UNSUBSCRIBE_PURPOSE = "unsubscribe"

const SEPARATOR = "."

function sign(payload: string, secret: string) {
    return createHmac("sha256", secret).update(payload).digest()
}

/**
 * Stateless, non-expiring token binding a userId to a purpose.
 * Format: base64url(`userId.purpose`) + "." + base64url(hmac).
 */
export function signUnsubscribeToken(
    userId: string,
    purpose: string = UNSUBSCRIBE_PURPOSE,
): string {
    const secret = env.UNSUBSCRIBE_SECRET
    if (!secret) {
        throw new Error("UNSUBSCRIBE_SECRET is not set")
    }
    const payload = Buffer.from(`${userId}${SEPARATOR}${purpose}`).toString("base64url")
    return `${payload}${SEPARATOR}${sign(payload, secret).toString("base64url")}`
}

/** Returns the userId when the token is authentic for `purpose`, otherwise null. */
export function verifyUnsubscribeToken(
    token: string,
    purpose: string = UNSUBSCRIBE_PURPOSE,
): string | null {
    const secret = env.UNSUBSCRIBE_SECRET
    if (!secret) {
        return null
    }
    const [payload, signature, ...extra] = token.split(SEPARATOR)
    if (!payload || !signature || extra.length > 0) {
        return null
    }
    const expected = new Uint8Array(sign(payload, secret))
    const provided = new Uint8Array(Buffer.from(signature, "base64url"))
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
        return null
    }
    const decoded = Buffer.from(payload, "base64url").toString()
    const splitAt = decoded.lastIndexOf(SEPARATOR)
    if (splitAt <= 0 || decoded.slice(splitAt + 1) !== purpose) {
        return null
    }
    return decoded.slice(0, splitAt)
}
