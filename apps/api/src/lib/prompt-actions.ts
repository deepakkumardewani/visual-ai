import { generateText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { deepseek } from "@ai-sdk/deepseek"

import { env } from "../config/env.js"
import { createLogger } from "./logger.js"

const logger = createLogger("prompt-actions")

const IMPROVE_TIMEOUT_MS = 8000
const RANDOM_TIMEOUT_MS = 8000
const DESCRIBE_TIMEOUT_MS = 15000

const IMPROVE_SYSTEM_PROMPT = `You are a prompt enhancement specialist for image generation models.
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

const RANDOM_SYSTEM_PROMPT = `You create fresh, creative prompts for AI image generation models.

Guidelines:
- Invent ONE original image-generation prompt
- Vary subject, setting, style, lighting, and mood so results feel different each time
- Keep it concise but vivid and usable as a standalone generation prompt
- Avoid graphic violence, gore, weapons, nudity, sexual content, self-harm, hate symbols, or real public figures
- Output ONLY the prompt, no explanations or preamble`

const DESCRIBE_INSTRUCTION = `Write a reusable image-generation prompt that describes this image.
Cover composition, lighting, subject, and style so another model could recreate a similar scene.
Output ONLY the prompt, no explanations or preamble.`

function createDeepSeekModel() {
    return deepseek(env.ENHANCE_MODEL)
}

function createDescribeModel() {
    return anthropic(env.DESCRIBE_MODEL)
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(message)), ms)
    })
    return Promise.race([promise, timeoutPromise])
}

/**
 * Improve/enrich an image-generation prompt while preserving intent.
 */
export async function improveUserPrompt(prompt: string): Promise<string> {
    const model = createDeepSeekModel()

    const result = await withTimeout(
        generateText({
            model,
            system: IMPROVE_SYSTEM_PROMPT,
            prompt,
            temperature: 0.7,
            maxOutputTokens: 800,
        }),
        IMPROVE_TIMEOUT_MS,
        "Prompt improve timeout",
    )

    const text = result.text.trim()
    if (!text) {
        logger.error(
            { finishReason: result.finishReason, usage: result.usage },
            "Empty completion from DeepSeek (improve)",
        )
        throw new Error("Empty completion from improve prompt")
    }

    return text
}

/**
 * Generate one fresh creative image-generation prompt.
 */
export async function generateRandomPrompt(): Promise<string> {
    const model = createDeepSeekModel()

    const result = await withTimeout(
        generateText({
            model,
            system: RANDOM_SYSTEM_PROMPT,
            prompt: "Generate one fresh creative image-generation prompt.",
            temperature: 1.0,
            maxOutputTokens: 800,
        }),
        RANDOM_TIMEOUT_MS,
        "Random prompt timeout",
    )

    const text = result.text.trim()
    if (!text) {
        logger.error(
            { finishReason: result.finishReason, usage: result.usage },
            "Empty completion from DeepSeek (random)",
        )
        throw new Error("Empty completion from random prompt")
    }

    return text
}

/**
 * Describe an image buffer as a reusable image-generation prompt (Claude vision).
 */
export async function describeImageFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
    const model = createDescribeModel()

    const result = await withTimeout(
        generateText({
            model,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "file",
                            data: buffer,
                            mediaType: mimeType.startsWith("image/") ? mimeType : "image/jpeg",
                        },
                        { type: "text", text: DESCRIBE_INSTRUCTION },
                    ],
                },
            ],
            temperature: 0.7,
            maxOutputTokens: 800,
        }),
        DESCRIBE_TIMEOUT_MS,
        "Image describe timeout",
    )

    const text = result.text.trim()
    if (!text) {
        logger.error(
            { finishReason: result.finishReason, usage: result.usage },
            "Empty completion from Anthropic (describe)",
        )
        throw new Error("Empty completion from describe image")
    }

    return text
}
