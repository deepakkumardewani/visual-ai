import { normalizeCountryCode } from "@visual-ai/shared"
import type { Request } from "express"

import { createLogger } from "../lib/logger.js"

const logger = createLogger("payments-geo")

/** Checked in order; the production proxy header is unconfirmed (Cloudflare sets the first). */
export const GEO_COUNTRY_HEADERS = [
    "cf-ipcountry",
    "cloudfront-viewer-country",
    "x-vercel-ip-country",
] as const
export const IP_LOOKUP_URL = "https://ipapi.co"
export const IP_LOOKUP_TIMEOUT_MS = 2000

function countryFromHeaders(req: Request): string | undefined {
    for (const name of GEO_COUNTRY_HEADERS) {
        const value = req.headers[name]
        const country = normalizeCountryCode(Array.isArray(value) ? value[0] : value)
        if (country) return country
    }
    return undefined
}

async function countryFromIp(ip: string | undefined): Promise<string | undefined> {
    if (!ip) return undefined
    try {
        const response = await fetch(`${IP_LOOKUP_URL}/${encodeURIComponent(ip)}/country/`, {
            signal: AbortSignal.timeout(IP_LOOKUP_TIMEOUT_MS),
        })
        if (!response.ok) return undefined
        return normalizeCountryCode(await response.text())
    } catch (err) {
        logger.warn({ err }, "IP country lookup failed")
        return undefined
    }
}

/** Geo header wins; the IP lookup runs only when no header yields a country. Undefined means unknown. */
export async function resolveCountry(req: Request): Promise<string | undefined> {
    return countryFromHeaders(req) ?? (await countryFromIp(req.ip))
}
