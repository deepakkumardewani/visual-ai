import { SONG_LYRICS_LIMITS, type LyricsRequest } from "@visual-ai/shared"
import { Output, generateText, type LanguageModel } from "ai"
import { deepseek } from "@ai-sdk/deepseek"
import { z } from "zod"

import { env } from "../config/env.js"
import { HttpError } from "./errors.js"
import { createLogger } from "./logger.js"
import { checkPromptSafety } from "./prompt-moderation.js"

const logger = createLogger("lyrics-generator")

export const LYRICS_TIMEOUT_MS = 20000
export const LYRICS_TIMEOUT_MESSAGE = "Lyrics took too long to write. Try again."
export const LYRICS_REJECTED_MESSAGE = "This text can't be used. Try rephrasing it."
const LYRICS_FAILED_MESSAGE = "Couldn't write lyrics. Try again."
const LYRICS_MAX_OUTPUT_TOKENS = 1600
const LYRICS_TEMPERATURE = 0.8

export interface LyricsSection {
    section: string
    lines: string[]
}

export interface GeneratedLyrics {
    sections: LyricsSection[]
}

export interface GenerateLyricsOptions {
    userId: string
    request: LyricsRequest
    /** Test seam: replaces the DeepSeek model so unit tests never reach the network. */
    model?: LanguageModel
}

/** The model output was unsafe; the text is never returned to the caller. */
export class LyricsRejectedError extends Error {
    constructor() {
        super(LYRICS_REJECTED_MESSAGE)
        this.name = "LyricsRejectedError"
    }
}

/** Fixed fixture for e2e users so the lyrics flow runs with no DeepSeek call. */
export const FAKE_LYRICS: GeneratedLyrics = {
    sections: [
        { section: "Verse", lines: ["Fake verse line one", "Fake verse line two"] },
        { section: "Chorus", lines: ["Fake chorus line one", "Fake chorus line two"] },
    ],
}

const lyricsOutputSchema = z.object({
    sections: z.array(
        z.object({
            section: z.string().describe("Section name such as Verse, Chorus or Bridge"),
            lines: z.array(z.string()),
        }),
    ),
})

const BASE_SYSTEM_PROMPT = `You are a songwriter. Return lyrics as structured sections.
Rules:
- Use section names such as Intro, Verse, Chorus, Bridge, Outro (no brackets)
- One lyric line per array item, no numbering, no commentary
- Keep it family-friendly: no graphic violence, hate, sexual content or real public figures
- Never exceed ${SONG_LYRICS_LIMITS.max} characters in total`

const MODE_INSTRUCTIONS = {
    full: "Write complete song lyrics (verses, a chorus and a bridge) about the user's theme.",
    section:
        "Rewrite only the single section the user provides, keeping its role in the song. Return exactly one section.",
    condense: `Shorten the user's lyrics to fit well under ${SONG_LYRICS_LIMITS.max} characters. Keep the structure and the strongest lines; remove whole lines, never cut a line in half.`,
} as const

function buildUserPrompt(request: LyricsRequest): string {
    if (request.mode === "full") {
        return request.theme
    }
    if (request.mode === "section") {
        return request.theme
            ? `Theme: ${request.theme}\n\nSection:\n${request.section}`
            : request.section
    }
    return request.lyrics
}

function requestSafetyText(request: LyricsRequest): string {
    return request.mode === "condense" ? "" : buildUserPrompt(request)
}

/** Renders sections as `[Tag]` blocks, the format the Song composer and the model expect. */
export function formatLyrics(lyrics: GeneratedLyrics): string {
    return lyrics.sections
        .filter((entry) => entry.lines.some((line) => line.trim()))
        .map((entry) => {
            const lines = entry.lines.map((line) => line.trim()).filter(Boolean)
            return `[${entry.section.trim()}]\n${lines.join("\n")}`
        })
        .join("\n\n")
}

/** Drops whole trailing lines until the text fits, so output never ends mid-line. */
export function clampToLineBoundary(text: string, max: number): string {
    if (text.length <= max) {
        return text
    }
    const lines = text.split("\n")
    while (lines.length > 0 && lines.join("\n").length > max) {
        lines.pop()
    }
    return lines.join("\n").trimEnd()
}

function withTimeout<T>(run: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
    const controller = new AbortController()
    let timer: NodeJS.Timeout | undefined
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
            controller.abort()
            reject(new HttpError(504, LYRICS_TIMEOUT_MESSAGE))
        }, ms)
    })
    return Promise.race([run(controller.signal), timeout]).finally(() => clearTimeout(timer))
}

/**
 * Only name, status and message are logged: AI SDK errors carry requestBodyValues (the user's
 * lyrics) and the raw model text, which the pino error serializer would otherwise write out.
 */
function safeErrorFields(error: unknown): {
    errName: string
    statusCode?: number
    message: string
} {
    if (!(error instanceof Error)) {
        return { errName: "UnknownError", message: String(error) }
    }
    const statusCode = (error as { statusCode?: unknown }).statusCode
    return {
        errName: error.name,
        statusCode: typeof statusCode === "number" ? statusCode : undefined,
        message: error.message,
    }
}

async function runModel(options: GenerateLyricsOptions): Promise<GeneratedLyrics> {
    const { request, model = deepseek(env.ENHANCE_MODEL) } = options
    const { output } = await withTimeout(
        (signal) =>
            generateText({
                model,
                system: `${BASE_SYSTEM_PROMPT}\n${MODE_INSTRUCTIONS[request.mode]}`,
                prompt: buildUserPrompt(request),
                temperature: LYRICS_TEMPERATURE,
                maxOutputTokens: LYRICS_MAX_OUTPUT_TOKENS,
                output: Output.object({ schema: lyricsOutputSchema }),
                abortSignal: signal,
            }),
        LYRICS_TIMEOUT_MS,
    )
    return output
}

/**
 * Generates song lyrics for one of three modes and returns safe, length-clamped `[Tag]` text.
 * Callers must pass the authenticated Clerk id, never a client value. Lyrics text is never
 * logged. Throws HttpError(504) on timeout and LyricsRejectedError when the output is unsafe.
 */
export async function generateLyrics(options: GenerateLyricsOptions): Promise<string> {
    const { userId, request } = options
    if (userId && env.E2E_USER_IDS.includes(userId)) {
        logger.warn(`fake lyrics for e2e user ${userId}`)
        return clampToLineBoundary(formatLyrics(FAKE_LYRICS), SONG_LYRICS_LIMITS.max)
    }

    const safetyText = requestSafetyText(request)
    if (safetyText && !(await checkPromptSafety(safetyText)).safe) {
        throw new LyricsRejectedError()
    }

    let generated: GeneratedLyrics
    try {
        generated = await runModel(options)
    } catch (error) {
        if (error instanceof HttpError) {
            throw error
        }
        logger.error({ mode: request.mode, ...safeErrorFields(error) }, "Lyrics generation failed")
        throw new HttpError(502, LYRICS_FAILED_MESSAGE)
    }

    const text = clampToLineBoundary(formatLyrics(generated), SONG_LYRICS_LIMITS.max)
    if (!text) {
        throw new HttpError(502, LYRICS_FAILED_MESSAGE)
    }
    if (!(await checkPromptSafety(text)).safe) {
        throw new LyricsRejectedError()
    }
    return text
}
