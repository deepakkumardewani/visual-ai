import type { FxRates } from "@visual-ai/shared"

import { redisClient } from "../config/redis.js"
import { createLogger } from "../lib/logger.js"

const logger = createLogger("payments-fx")

export const FX_CACHE_KEY = "payments:fx:usd"
export const FX_SOURCE_URL = "https://open.er-api.com/v6/latest/USD"
export const FX_REFRESH_AFTER_MS = 24 * 60 * 60 * 1000
export const FX_MAX_AGE_MS = 48 * 60 * 60 * 1000
export const FX_FETCH_TIMEOUT_MS = 3000
const FX_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60

interface FxSnapshot {
    rates: FxRates
    fetchedAt: number
}

async function readSnapshot(): Promise<FxSnapshot | undefined> {
    try {
        const raw = await redisClient.get(FX_CACHE_KEY)
        return raw ? (JSON.parse(raw) as FxSnapshot) : undefined
    } catch (err) {
        logger.warn({ err }, "FX cache read failed")
        return undefined
    }
}

async function fetchSnapshot(now: number): Promise<FxSnapshot | undefined> {
    try {
        const response = await fetch(FX_SOURCE_URL, {
            signal: AbortSignal.timeout(FX_FETCH_TIMEOUT_MS),
        })
        if (!response.ok) {
            logger.warn({ status: response.status }, "FX source returned non-OK")
            return undefined
        }
        const body = (await response.json()) as { rates?: FxRates }
        if (!body.rates) {
            logger.warn("FX source response had no rates")
            return undefined
        }
        return { rates: body.rates, fetchedAt: now }
    } catch (err) {
        logger.warn({ err }, "FX refresh failed")
        return undefined
    }
}

async function writeSnapshot(snapshot: FxSnapshot): Promise<void> {
    try {
        await redisClient.set(FX_CACHE_KEY, JSON.stringify(snapshot), "EX", FX_CACHE_TTL_SECONDS)
    } catch (err) {
        logger.warn({ err }, "FX cache write failed")
    }
}

/** Rates per 1 USD, refreshed lazily once a day. Undefined when no snapshot is under 48h old (callers fall back to USD). */
export async function getFxRates(now: number = Date.now()): Promise<FxRates | undefined> {
    const cached = await readSnapshot()
    if (cached && now - cached.fetchedAt < FX_REFRESH_AFTER_MS) {
        return cached.rates
    }

    const fresh = await fetchSnapshot(now)
    if (fresh) {
        await writeSnapshot(fresh)
        return fresh.rates
    }

    return cached && now - cached.fetchedAt < FX_MAX_AGE_MS ? cached.rates : undefined
}
