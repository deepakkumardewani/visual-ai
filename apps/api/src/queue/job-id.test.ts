import { describe, expect, it } from "vitest"

import type { GenerationJobData } from "./generation-queue.js"

import { getJobId } from "./job-id.js"

const MEDIA_KINDS = [
    "song",
    "music",
    "speech",
    "video",
    "image-watermark",
    "video-watermark",
    "autocaption",
    "voice-clone",
] as const

describe("getJobId", () => {
    it("reads body.jobId for image jobs", () => {
        const data = { kind: "image", body: { jobId: "img_1" }, isPro: false } as unknown
        expect(getJobId(data as GenerationJobData)).toBe("img_1")
    })

    it.each(["upscale", "revive", "colorize", "remove-bg"])(
        "reads props.body.jobId for %s jobs",
        (kind) => {
            const data = { kind, props: { body: { jobId: `${kind}_1` } }, isPro: false } as unknown
            expect(getJobId(data as GenerationJobData)).toBe(`${kind}_1`)
        },
    )

    it.each(MEDIA_KINDS)("reads body.jobId for %s jobs", (kind) => {
        const data = {
            kind,
            body: { jobId: `${kind}_1`, userId: "u", modelKey: "LYRIA_2" },
            isPro: true,
        } as GenerationJobData

        expect(getJobId(data)).toBe(`${kind}_1`)
    })

    it("throws on an unknown kind", () => {
        const data = { kind: "mystery", isPro: false } as unknown as GenerationJobData

        expect(() => getJobId(data)).toThrow("Unknown generation job kind")
    })
})
