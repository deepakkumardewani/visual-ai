import { env } from "../config/env.js"
import { createLogger } from "./logger.js"

const logger = createLogger("lyrics-generator")

export interface LyricsSection {
    section: string
    lines: string[]
}

export interface GeneratedLyrics {
    sections: LyricsSection[]
}

export interface GenerateLyricsOptions {
    userId: string
}

/** Fixed fixture for e2e users so the lyrics flow runs with no DeepSeek call. */
export const FAKE_LYRICS: GeneratedLyrics = {
    sections: [
        { section: "Verse", lines: ["Fake verse line one", "Fake verse line two"] },
        { section: "Chorus", lines: ["Fake chorus line one", "Fake chorus line two"] },
    ],
}

/**
 * Only the e2e fake branch exists so far; the DeepSeek generator replaces the throw in the
 * lyrics task. Callers must pass the authenticated Clerk id, never a client value.
 */
export async function generateLyrics(options: GenerateLyricsOptions): Promise<GeneratedLyrics> {
    const { userId } = options
    if (userId && env.E2E_USER_IDS.includes(userId)) {
        logger.warn(`fake lyrics for e2e user ${userId}`)
        return structuredClone(FAKE_LYRICS)
    }
    throw new Error("Lyrics generation is not implemented yet")
}
