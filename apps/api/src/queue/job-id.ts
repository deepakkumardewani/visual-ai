import type { GenerationJobData } from "./generation-queue.js"

/** The one place a job's id is derived from its payload (used for dedupe and status keys). */
export function getJobId(data: GenerationJobData): string {
    switch (data.kind) {
        case "image":
        case "song":
        case "music":
        case "speech":
        case "video":
        case "image-watermark":
        case "video-watermark":
        case "autocaption":
        case "voice-clone":
            return data.body.jobId
        case "upscale":
        case "revive":
        case "colorize":
        case "remove-bg":
            return data.props.body.jobId
        default: {
            const _exhaustive: never = data
            throw new Error(`Unknown generation job kind: ${JSON.stringify(_exhaustive)}`)
        }
    }
}
