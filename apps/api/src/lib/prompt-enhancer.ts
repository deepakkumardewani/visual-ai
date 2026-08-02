import { generateText } from "ai"
import { deepseek } from "@ai-sdk/deepseek"

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
- Keep the result concise but richer
- Output ONLY the enhanced prompt, no explanations or preamble`

/**
 * Initialize and return the LLM model for prompt enhancement.
 * Uses environment variables for configuration:
 * - DEEPSEEK_API_KEY: required, the API key for DeepSeek
 * - ENHANCE_MODEL: optional, the model name (defaults to 'deepseek-chat')
 *
 * Throws if DEEPSEEK_API_KEY is not set.
 */
function createEnhancer() {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
        throw new Error("DEEPSEEK_API_KEY environment variable is required for prompt enhancement")
    }

    const modelName = process.env.ENHANCE_MODEL || "deepseek-chat"

    // Create a configured deepseek model instance
    // The API key is automatically picked up from the DEEPSEEK_API_KEY environment variable
    const model = deepseek(modelName)

    return model
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
 * @returns Promise resolving to the enhanced prompt (trimmed)
 * @throws Error if the LLM call fails or times out
 */
export async function enhancePrompt(prompt: string): Promise<string> {
    const model = createEnhancer()

    // Create a timeout promise that rejects after ~8 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Prompt enhancement timeout")), 8000)
    })

    // Race the generateText call against the timeout
    const result = await Promise.race([
        generateText({
            // @ts-expect-error - LanguageModel version compatibility
            model,
            system: ENHANCE_SYSTEM_PROMPT,
            prompt,
            temperature: 0.7,
            maxTokens: 200,
        }),
        timeoutPromise,
    ])

    return result.text.trim()
}
