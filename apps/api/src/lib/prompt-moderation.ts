import { generateText, Output } from "ai"
import { deepseek } from "@ai-sdk/deepseek"
import { z } from "zod"

import { env } from "../config/env.js"

/** How long to wait for the moderation classification before failing open. */
const MODERATION_TIMEOUT_MS = 5000

/**
 * Thrown when a prompt is classified as unsafe. Callers should surface `reason`
 * to the user instead of a generic error message.
 */
export class PromptModerationError extends Error {
    constructor(public readonly reason: string) {
        super(`Prompt rejected by moderation: ${reason}`)
        this.name = "PromptModerationError"
    }
}

const MODERATION_SYSTEM_PROMPT = `You are a content moderation classifier for an image-generation app.
Classify whether the given prompt requests or clearly implies any of:
- sexual content involving minors
- non-consensual sexual content or pornography
- graphic violence, gore, or torture
- self-harm or suicide
- hate speech or content demeaning a protected group
- real, identifiable public figures depicted in a harmful, sexual, or defamatory way
- instructions or depictions of weapons/explosives intended to cause harm

Be lenient: everyday creative, artistic, fantasy, or violent-adjacent-but-non-graphic prompts
(e.g. "a knight fighting a dragon", "a war memorial", "a horror movie poster") are SAFE.
Only mark unsafe when the prompt clearly falls into one of the categories above.`

const moderationSchema = z.object({
    safe: z.boolean(),
    reason: z.string().optional(),
})

/**
 * Fast, fail-closed backstop for blatant cases. Catches the obvious terms
 * a fragile LLM classifier can fail to classify (e.g. it may refuse to
 * produce structured output at all for very short explicit prompts, which
 * would otherwise fail open). Intentionally short and blunt — nuanced
 * judgment is left to the LLM classifier below.
 */
const OBVIOUS_UNSAFE_TERMS =
    /\b(sex|porn|nude|naked|nsfw|rape|incest|bestiality|child\s*porn|cp|gore|beheading)\b/i

function checkObviousTerms(prompt: string): { safe: boolean; reason?: string } {
    if (OBVIOUS_UNSAFE_TERMS.test(prompt)) {
        return { safe: false, reason: "This prompt contains explicit or disallowed content." }
    }
    return { safe: true }
}

function createModerationModel() {
    return deepseek(env.ENHANCE_MODEL)
}

/**
 * Classifies a prompt as safe or unsafe.
 * Runs a fast keyword pre-check first (fail-closed for blatant cases), then
 * an LLM classifier for nuanced judgment. The LLM step fails open (returns
 * safe: true) on timeout/error so moderation-service outages never block
 * legitimate generations — Replicate's own content filter remains the last
 * line of defense for anything that slips through.
 *
 * @param prompt - The input prompt to classify
 * @returns Promise resolving to the safety classification
 */
export async function checkPromptSafety(
    prompt: string,
): Promise<{ safe: boolean; reason?: string }> {
    if (!prompt || !prompt.trim()) {
        return { safe: true }
    }

    const keywordResult = checkObviousTerms(prompt)
    if (!keywordResult.safe) {
        return keywordResult
    }

    const model = createModerationModel()

    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Prompt moderation timeout")), MODERATION_TIMEOUT_MS)
    })

    try {
        const { output } = await Promise.race([
            generateText({
                model,
                system: MODERATION_SYSTEM_PROMPT,
                prompt,
                temperature: 0,
                maxOutputTokens: 200,
                output: Output.object({ schema: moderationSchema }),
            }),
            timeoutPromise,
        ])

        return output
    } catch (error) {
        console.error("[prompt-moderation] Classification failed, failing open", {
            error: error instanceof Error ? error.message : String(error),
        })
        return { safe: true }
    }
}

/** Patterns matching Replicate's own content-safety rejection messages (e.g. E005, NSFW filter). */
const REPLICATE_CONTENT_SAFETY_PATTERN = /nsfw|flagged as sensitive|E005/i

/**
 * Checks whether a Replicate prediction failure message is a content-safety
 * rejection, so callers can surface a friendly, specific message instead of
 * a generic error — this is the last line of defense when our own
 * pre-generation moderation check misses something.
 *
 * @param message - The error message from a failed Replicate prediction
 */
export function isContentSafetyError(message: string): boolean {
    return REPLICATE_CONTENT_SAFETY_PATTERN.test(message)
}
