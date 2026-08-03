import { generateText } from "ai"
import { deepseek } from "@ai-sdk/deepseek"

import { env } from "../config/env.js"
import type { StylePreset } from "@visual-ai/shared"

/**
 * Threshold for determining if a prompt should be auto-enhanced.
 * Prompts with fewer than this many words will be enhanced when mode is 'auto'.
 */
export const AUTO_ENHANCE_WORD_THRESHOLD = 12

/**
 * System prompt that guides the LLM to expand prompts without changing their core intent.
 */
const ENHANCE_SYSTEM_PROMPT = `You are a prompt enhancement specialist for image generation models.
Your task is to expand and improve user prompts to be more descriptive and detailed,
while preserving the original intent and meaning.

Guidelines:
- Add visual details, composition hints, and quality descriptors
- Don't change the core subject or intent
- Never introduce a person, character, animal, or object that is not present in the original
  prompt — enrich only what is already described
- Keep the result concise but richer
- Avoid words that could trigger image-generation content-safety filters: no graphic violence, gore,
  weapons, nudity, sexual content, self-harm, hate symbols, or real public figures — favor neutral,
  family-friendly descriptors (lighting, color, mood, style, composition) over intense or graphic terms
- Output ONLY the enhanced prompt, no explanations or preamble`

/**
 * Build the style directive appended to the system prompt when a style preset is active.
 * Instructs the LLM to weave the style through the whole rewrite rather than tagging it on.
 * The raw promptSuffix is deliberately NOT included: re-emitting descriptor tags at the end
 * of the rewrite makes the model read them as scene content and invent matching subjects.
 */
function buildStyleDirective(style: StylePreset): string {
    return `
Style requirement — the user selected the "${style.label}" style:
- Rewrite the prompt so the entire scene is described as ${style.styleDescription}
- Weave the style's medium, lighting, and composition naturally throughout the description
- Apply the style to the subjects already in the prompt — do not add new subjects to suit the style`
}

/**
 * Initialize and return the LLM model for prompt enhancement.
 * DEEPSEEK_API_KEY and ENHANCE_MODEL are validated at boot in config/env.ts.
 */
function createEnhancer() {
    // The API key is automatically picked up from the DEEPSEEK_API_KEY environment variable
    return deepseek(env.ENHANCE_MODEL)
}

/**
 * Check if a prompt should be auto-enhanced based on its word count.
 * Returns true for prompts with fewer than AUTO_ENHANCE_WORD_THRESHOLD words.
 * Returns false for empty, whitespace-only, or sufficiently long prompts.
 *
 * @param prompt - The input prompt to check
 * @returns true if auto-enhancement is recommended, false otherwise
 */
export function shouldEnhance(prompt: string): boolean {
    if (!prompt || !prompt.trim()) {
        return false
    }

    const wordCount = prompt.trim().split(/\s+/).length
    return wordCount < AUTO_ENHANCE_WORD_THRESHOLD
}

/**
 * Enhance a prompt using the configured LLM.
 * Calls the DeepSeek model with a ~8 second timeout via Promise.race.
 * Errors propagate up to the caller (the pipeline handles fallback).
 *
 * @param prompt - The input prompt to enhance
 * @param style - Optional style preset; when provided, the rewrite integrates the style
 * @returns Promise resolving to the enhanced prompt (trimmed)
 * @throws Error if the LLM call fails or times out
 */
export async function enhancePrompt(prompt: string, style?: StylePreset): Promise<string> {
    const model = createEnhancer()

    const system =
        style && style.promptSuffix
            ? `${ENHANCE_SYSTEM_PROMPT}\n${buildStyleDirective(style)}`
            : ENHANCE_SYSTEM_PROMPT

    // Create a timeout promise that rejects after ~8 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Prompt enhancement timeout")), 8000)
    })

    // Race the generateText call against the timeout
    const result = await Promise.race([
        generateText({
            model,
            system,
            prompt,
            temperature: 0.7,
            // Reasoning-capable models (e.g. deepseek-v4-flash) can spend part of this
            // budget on internal reasoning tokens before emitting the final answer, so
            // keep enough headroom that reasoning doesn't crowd out the actual output.
            maxOutputTokens: 800,
        }),
        timeoutPromise,
    ])

    const text = result.text.trim()
    if (!text) {
        console.error("[prompt-enhancer] Empty completion from DeepSeek", {
            finishReason: result.finishReason,
            usage: result.usage,
        })
    }

    return text
}
