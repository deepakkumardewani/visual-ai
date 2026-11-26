import { beforeEach, describe, expect, it, vi } from "vitest"

import { FeatureType } from "@visual-ai/shared"
import type { MediaAssetDto } from "@visual-ai/shared"

const runReplicate = vi.hoisted(() => vi.fn())
const User = vi.hoisted(() => ({ findOne: vi.fn() }))
const getJob = vi.hoisted(() => vi.fn())
const assetExists = vi.hoisted(() => vi.fn())
const redisSetStatus = vi.hoisted(() => vi.fn())
const uploadModel = vi.hoisted(() => ({
    findOne: vi.fn(),
    find: vi.fn(),
    deleteOne: vi.fn(),
}))
const deleteUploadedFile = vi.hoisted(() => vi.fn())
const loggerError = vi.hoisted(() => vi.fn())

vi.mock("../lib/replicate.js", () => ({ runReplicate }))
vi.mock("../models/media-upload.js", () => ({ MediaUploadModel: uploadModel }))
vi.mock("../lib/media-upload.js", () => ({ deleteUploadedFile }))
vi.mock("../models/user.js", () => ({ UserModel: User }))
vi.mock("../lib/credit-deduction.js", () => ({ updateAndGetUserCredits: vi.fn() }))
vi.mock("../models/media-asset.js", () => ({ MediaAssetModel: { exists: assetExists } }))
vi.mock("../queue/generation-queue.js", () => ({ generationQueue: { getJob } }))
// The Mongo/Cloudinary-backed persistence has its own seam; here it behaves as the over-cap path.
vi.mock("./media-asset-service.js", () => ({
    persistMediaAsset: vi.fn(
        async ({ jobId, modelKey, featureType, prompt, outputUrl, creditsCharged }) => ({
            id: jobId,
            type: "audio",
            feature: featureType,
            modelKey,
            title: prompt.slice(0, 60),
            url: outputUrl,
            prompt,
            creditsCharged,
            saved: false,
        }),
    ),
    copyMediaAssetToCloudinary: vi.fn(async (asset) => asset),
    discardMediaAsset: vi.fn(),
}))
vi.mock("./redis-service.js", () => ({
    RedisService: class {
        setStatus = redisSetStatus
    },
}))
vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({ debug: vi.fn(), error: loggerError, info: vi.fn() }),
    shortId: (id: string) => id.slice(0, 6),
}))

const {
    getAvailableCredits,
    getMusicCostInput,
    getMusicCreditCost,
    hasExistingJob,
    getSongCreditCost,
    getVideoCreditCost,
    processVideo,
    processImageWatermark,
    processVideoWatermark,
    processAutocaption,
    resolveToolUpload,
    getImageWatermarkCreditCost,
    getVideoWatermarkCreditCost,
    getAutocaptionCreditCost,
    resolveVideoAttachments,
    getSpeechCharCount,
    getSpeechCreditCost,
    processMusic,
    processSong,
    processSpeech,
    runMediaJob,
    SONG_MODEL_KEY,
} = await import("./media-service.js")

import type { MediaJobParams, MediaJobServices } from "./media-service.js"
import type { MediaJobBody } from "../queue/generation-queue.js"

const LYRIA_COST = 12
const OUTPUT_URL = "https://fake.invalid/out.mp3"

function makeServices(overrides: Partial<MediaJobServices> = {}) {
    const setStatus = vi.fn().mockResolvedValue(undefined)
    const services: MediaJobServices = {
        jobStatus: { setStatus },
        deductCredits: vi.fn().mockResolvedValue(88),
        persistAsset: vi.fn(
            async (args): Promise<MediaAssetDto> => ({
                id: "asset_1",
                type: "audio",
                feature: args.featureType,
                modelKey: args.modelKey,
                title: "t",
                url: args.outputUrl,
                saved: false,
                creditsCharged: 0,
            }),
        ),
        copyToCloudinary: vi.fn(async (asset) => ({ ...asset, url: "https://cdn.invalid/a.mp3" })),
        ...overrides,
    }
    return { services, setStatus }
}

const params: MediaJobParams = {
    jobId: "job_123456",
    userId: "user_1",
    modelKey: "LYRIA_2",
    featureType: FeatureType.MUSIC,
    input: { prompt: "calm" },
    prompt: "calm",
    creditCost: LYRIA_COST,
}

describe("music cost", () => {
    it("derives a file cost input for a per-file model", () => {
        expect(getMusicCostInput("LYRIA_2")).toEqual({ kind: "file" })
    })

    it("derives a run cost input for a flat per-run model", () => {
        expect(getMusicCostInput("IMAGE_WATERMARK")).toEqual({ kind: "run" })
    })

    it("rejects a model with no music pricing unit", () => {
        expect(() => getMusicCostInput("INWORLD_TTS_2")).toThrow(
            expect.objectContaining({ statusCode: 400 }),
        )
    })

    it("rejects an unknown model key", () => {
        expect(() => getMusicCostInput("NOPE" as never)).toThrow("has no music pricing")
    })

    it("prices Lyria from the server-side registry", () => {
        expect(getMusicCreditCost("LYRIA_2")).toBe(LYRIA_COST)
    })

    it("prices Stable Audio at its per-file rate", () => {
        expect(getMusicCreditCost("STABLE_AUDIO_25")).toBe(40)
    })
})

describe("getAvailableCredits", () => {
    beforeEach(() => vi.clearAllMocks())

    it("sums daily and persistent credits", async () => {
        User.findOne.mockResolvedValue({ dailyCredits: 4, credits: 6 })

        await expect(getAvailableCredits("user_1")).resolves.toBe(10)
        expect(User.findOne).toHaveBeenCalledWith(
            { userId: "user_1" },
            { credits: 1, dailyCredits: 1 },
        )
    })

    it("treats missing buckets as zero", async () => {
        User.findOne.mockResolvedValue({})
        await expect(getAvailableCredits("user_1")).resolves.toBe(0)
    })

    it("returns zero for an unknown user", async () => {
        User.findOne.mockResolvedValue(null)
        await expect(getAvailableCredits("ghost")).resolves.toBe(0)
    })
})

describe("hasExistingJob", () => {
    beforeEach(() => vi.clearAllMocks())

    it("is false when no job has that id", async () => {
        getJob.mockResolvedValue(undefined)
        assetExists.mockResolvedValue(null)
        await expect(hasExistingJob("j1", "user_1")).resolves.toBe(false)
    })

    it("is true when BullMQ has forgotten the job but a persisted asset carries the id", async () => {
        getJob.mockResolvedValue(undefined)
        assetExists.mockResolvedValue({ _id: "a1" })
        await expect(hasExistingJob("j1", "user_1")).resolves.toBe(true)
        expect(assetExists).toHaveBeenCalledWith({ jobId: "j1" })
    })

    it("is true when the same user already queued it", async () => {
        getJob.mockResolvedValue({ data: { body: { userId: "user_1" } } })
        await expect(hasExistingJob("j1", "user_1")).resolves.toBe(true)
    })

    it("rejects a jobId owned by another user without disclosing it", async () => {
        getJob.mockResolvedValue({ data: { body: { userId: "user_2" } } })
        await expect(hasExistingJob("j1", "user_1")).rejects.toMatchObject({
            statusCode: 400,
            message: "jobId: already in use",
        })
    })

    it("rejects an existing job with no owner", async () => {
        getJob.mockResolvedValue({ data: {} })
        await expect(hasExistingJob("j1", "user_1")).rejects.toThrow("already in use")
    })
})

describe("runMediaJob", () => {
    beforeEach(() => vi.clearAllMocks())

    it("runs, persists, deducts once, copies and completes with the Cloudinary asset", async () => {
        runReplicate.mockResolvedValue([OUTPUT_URL])
        const { services, setStatus } = makeServices()

        await runMediaJob(params, services)

        expect(runReplicate).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: "user_1",
                model: "google/lyria-2",
                input: { prompt: "calm" },
            }),
        )
        expect(services.deductCredits).toHaveBeenCalledTimes(1)
        expect(services.deductCredits).toHaveBeenCalledWith("user_1", LYRIA_COST)
        expect(setStatus.mock.calls.map(([, s]) => s.stage ?? s.status)).toEqual([
            "composing",
            "saving",
            "completed",
        ])
        expect(setStatus).toHaveBeenLastCalledWith("job_123456", {
            status: "completed",
            image: undefined,
            userCreditsRemaining: 88,
            assetId: "asset_1",
            asset: expect.objectContaining({ url: "https://cdn.invalid/a.mp3" }),
            credits: LYRIA_COST,
        })
    })

    it("accepts a single string output", async () => {
        runReplicate.mockResolvedValue(OUTPUT_URL)
        const { services } = makeServices()

        await runMediaJob(params, services)

        expect(services.persistAsset).toHaveBeenCalledWith(
            expect.objectContaining({ outputUrl: OUTPUT_URL, creditsCharged: LYRIA_COST }),
        )
    })

    it("tolerates Replicate progress callbacks", async () => {
        runReplicate.mockImplementation(async ({ onProgress }) => {
            onProgress({ status: "processing" })
            return OUTPUT_URL
        })
        const { services } = makeServices()

        await runMediaJob(params, services)

        expect(services.deductCredits).toHaveBeenCalledTimes(1)
    })

    it.each([
        ["NSFW content blocked", "CONTENT_SAFETY"],
        ["prediction timed out", "TIMEOUT"],
        ["request timeout", "TIMEOUT"],
        ["prediction was canceled", "CANCELED"],
        ["boom", "FAILED"],
    ])("charges nothing when Replicate fails with %s", async (message, reason) => {
        runReplicate.mockRejectedValue(new Error(message))
        const { services, setStatus } = makeServices()

        await runMediaJob(params, services)

        expect(services.deductCredits).not.toHaveBeenCalled()
        expect(setStatus).toHaveBeenLastCalledWith(
            "job_123456",
            expect.objectContaining({ status: "error", noCharge: true, reason }),
        )
    })

    it("shows a friendly message for a content-safety failure", async () => {
        runReplicate.mockRejectedValue(new Error("flagged as sensitive"))
        const { services, setStatus } = makeServices()

        await runMediaJob(params, services)

        expect(setStatus.mock.lastCall?.[1].message).toMatch(/flagged as sensitive/)
    })

    it("handles a non-Error rejection", async () => {
        runReplicate.mockRejectedValue("string failure")
        const { services, setStatus } = makeServices()

        await runMediaJob(params, services)

        expect(setStatus.mock.lastCall?.[1]).toMatchObject({ noCharge: true, reason: "FAILED" })
    })

    it("reports no-charge when the first status write fails", async () => {
        const { services, setStatus } = makeServices()
        setStatus.mockRejectedValueOnce(new Error("redis down")).mockResolvedValue(undefined)

        await runMediaJob(params, services)

        expect(runReplicate).not.toHaveBeenCalled()
        expect(services.deductCredits).not.toHaveBeenCalled()
        expect(setStatus.mock.lastCall?.[1]).toMatchObject({ noCharge: true, reason: "FAILED" })
    })

    it.each([[undefined], [[]], [[""]], [{ not: "a url" }], [""]])(
        "charges nothing when the output has no usable URL (%j)",
        async (output) => {
            runReplicate.mockResolvedValue(output)
            const { services, setStatus } = makeServices()

            await runMediaJob(params, services)

            expect(services.persistAsset).not.toHaveBeenCalled()
            expect(services.deductCredits).not.toHaveBeenCalled()
            expect(setStatus.mock.lastCall?.[1]).toMatchObject({ noCharge: true, reason: "FAILED" })
        },
    )

    it("charges nothing when persisting the record fails", async () => {
        runReplicate.mockResolvedValue(OUTPUT_URL)
        const { services, setStatus } = makeServices({
            persistAsset: vi.fn().mockRejectedValue(new Error("db")),
        })

        await runMediaJob(params, services)

        expect(services.deductCredits).not.toHaveBeenCalled()
        expect(setStatus.mock.lastCall?.[1]).toMatchObject({
            status: "error",
            noCharge: true,
            reason: "FAILED",
        })
    })

    it("delivers no asset and reports insufficient credits when the deduction is rejected", async () => {
        runReplicate.mockResolvedValue(OUTPUT_URL)
        const { services, setStatus } = makeServices({
            deductCredits: vi.fn().mockRejectedValue(new Error("Insufficient credits")),
        })

        await runMediaJob(params, services)

        expect(services.copyToCloudinary).not.toHaveBeenCalled()
        const last = setStatus.mock.lastCall?.[1]
        expect(last).toMatchObject({
            status: "error",
            noCharge: true,
            message: "Insufficient credits",
        })
        expect(last.asset).toBeUndefined()
    })

    it("does not report a charged job as free when the Cloudinary copy fails", async () => {
        runReplicate.mockResolvedValue(OUTPUT_URL)
        const { services, setStatus } = makeServices({
            copyToCloudinary: vi.fn().mockRejectedValue(new Error("cdn down")),
        })

        await runMediaJob(params, services)

        expect(services.deductCredits).toHaveBeenCalledTimes(1)
        const last = setStatus.mock.lastCall?.[1]
        expect(last).toEqual({ status: "error", image: undefined, userCreditsRemaining: null })
        expect(last.noCharge).toBeUndefined()
    })
})

describe("runMediaJob default services", () => {
    beforeEach(() => vi.clearAllMocks())

    it("completes with an unsaved asset and the shared Redis status writer", async () => {
        runReplicate.mockResolvedValue([OUTPUT_URL])
        const { updateAndGetUserCredits } = await import("../lib/credit-deduction.js")
        vi.mocked(updateAndGetUserCredits).mockResolvedValue(50)
        redisSetStatus.mockResolvedValue(undefined)

        await runMediaJob({ ...params, prompt: "x".repeat(100) })

        expect(updateAndGetUserCredits).toHaveBeenCalledWith("user_1", LYRIA_COST)
        expect(redisSetStatus.mock.lastCall?.[1]).toMatchObject({
            status: "completed",
            assetId: "job_123456",
            asset: {
                id: "job_123456",
                type: "audio",
                feature: "music",
                modelKey: "LYRIA_2",
                title: "x".repeat(60),
                url: OUTPUT_URL,
                creditsCharged: LYRIA_COST,
                saved: false,
            },
        })
    })
})

describe("processMusic", () => {
    beforeEach(() => vi.clearAllMocks())

    it("builds the Replicate input from model params only and recomputes the cost", async () => {
        runReplicate.mockResolvedValue(OUTPUT_URL)
        const { services } = makeServices()

        await processMusic(
            {
                jobId: "job_123456",
                userId: "user_1",
                modelKey: "LYRIA_2",
                prompt: "calm piano",
                seed: 3,
            },
            services,
        )

        expect(runReplicate.mock.calls[0][0].input).toEqual({ prompt: "calm piano", seed: 3 })
        expect(services.deductCredits).toHaveBeenCalledWith("user_1", LYRIA_COST)
        expect(services.persistAsset).toHaveBeenCalledWith(
            expect.objectContaining({ featureType: "music", prompt: "calm piano" }),
        )
    })

    it("uses an empty prompt when the body prompt is not a string", async () => {
        runReplicate.mockResolvedValue(OUTPUT_URL)
        const { services } = makeServices()

        await processMusic(
            { jobId: "job_123456", userId: "user_1", modelKey: "LYRIA_2", prompt: 5 },
            services,
        )

        expect(services.persistAsset).toHaveBeenCalledWith(expect.objectContaining({ prompt: "" }))
    })
})

describe("song cost", () => {
    it("always renders with Minimax Music 2.6", () => {
        expect(SONG_MODEL_KEY).toBe("MINIMAX_MUSIC_26")
    })

    it("charges the fixed per-file price from the server-side registry", () => {
        expect(getSongCreditCost()).toBe(30)
    })
})

describe("processSong", () => {
    beforeEach(() => vi.clearAllMocks())

    const songBody: MediaJobBody = {
        jobId: "job_123456",
        userId: "user_1",
        modelKey: "LYRIA_2",
        stylePrompt: "upbeat indie pop",
        lyrics: "[Verse]\nWalking home",
    }

    it("maps style and lyrics to the Minimax input, ignoring the queued modelKey", async () => {
        runReplicate.mockResolvedValue(OUTPUT_URL)
        const { services } = makeServices()

        await processSong(songBody, services)

        expect(runReplicate.mock.calls[0][0].input).toEqual({
            prompt: "upbeat indie pop",
            lyrics: "[Verse]\nWalking home",
        })
        expect(runReplicate.mock.calls[0][0].input).not.toHaveProperty("audio_format")
        expect(services.persistAsset).toHaveBeenCalledWith(
            expect.objectContaining({
                modelKey: "MINIMAX_MUSIC_26",
                featureType: FeatureType.SONG,
                prompt: "upbeat indie pop",
            }),
        )
    })

    it("deducts the fixed per-file cost exactly once on success", async () => {
        runReplicate.mockResolvedValue(OUTPUT_URL)
        const { services } = makeServices()

        await processSong(songBody, services)

        expect(services.deductCredits).toHaveBeenCalledTimes(1)
        expect(services.deductCredits).toHaveBeenCalledWith("user_1", 30)
    })

    it("deducts nothing when generation fails", async () => {
        runReplicate.mockRejectedValue(new Error("replicate down"))
        const { services } = makeServices()

        await processSong(songBody, services)

        expect(services.deductCredits).not.toHaveBeenCalled()
        expect(services.persistAsset).not.toHaveBeenCalled()
    })

    it("uses an empty prompt when the style is not a string", async () => {
        runReplicate.mockResolvedValue(OUTPUT_URL)
        const { services } = makeServices()

        await processSong({ ...songBody, stylePrompt: 5 }, services)

        expect(services.persistAsset).toHaveBeenCalledWith(expect.objectContaining({ prompt: "" }))
    })
})

describe("speech cost", () => {
    it("counts the characters of the final serialized text", () => {
        expect(getSpeechCharCount("Hello <#0.5#> world")).toBe(19)
    })

    it("counts an empty text as zero characters", () => {
        expect(getSpeechCharCount("")).toBe(0)
    })

    it("prices Minimax HD at 20 credits per 1000 characters", () => {
        expect(getSpeechCreditCost("MINIMAX_SPEECH_28_HD", "a".repeat(1000))).toBe(20)
        expect(getSpeechCreditCost("MINIMAX_SPEECH_28_HD", "a".repeat(2500))).toBe(50)
    })

    it("prices Minimax Turbo cheaper than HD for the same text", () => {
        expect(getSpeechCreditCost("MINIMAX_SPEECH_28_TURBO", "a".repeat(1000))).toBe(12)
    })

    it("rejects a model that has no character pricing", () => {
        expect(() => getSpeechCreditCost("LYRIA_2", "hello")).toThrow()
    })
})

describe("processSpeech", () => {
    beforeEach(() => vi.clearAllMocks())

    const text = "a".repeat(1000)
    const speechBody: MediaJobBody = {
        jobId: "job_123456",
        userId: "user_1",
        modelKey: "MINIMAX_SPEECH_28_HD",
        text,
        voice: "Calm_Woman",
        speed: 1.2,
    }

    it("maps text and voice to Replicate input, excluding envelope fields", async () => {
        runReplicate.mockResolvedValue(OUTPUT_URL)
        const { services } = makeServices()

        await processSpeech(speechBody, services)

        expect(runReplicate.mock.calls[0][0].input).toEqual({
            text,
            voice_id: "Calm_Woman",
            speed: 1.2,
        })
        expect(services.persistAsset).toHaveBeenCalledWith(
            expect.objectContaining({
                modelKey: "MINIMAX_SPEECH_28_HD",
                featureType: FeatureType.SPEECH,
                prompt: text,
            }),
        )
    })

    it("charges the server-computed cost once and ignores a client-sent cost", async () => {
        runReplicate.mockResolvedValue(OUTPUT_URL)
        const { services } = makeServices()

        await processSpeech({ ...speechBody, creditCost: 1, chars: 1 }, services)

        expect(services.deductCredits).toHaveBeenCalledTimes(1)
        expect(services.deductCredits).toHaveBeenCalledWith("user_1", 20)
    })

    it("deducts nothing when generation fails", async () => {
        runReplicate.mockRejectedValue(new Error("replicate down"))
        const { services } = makeServices()

        await processSpeech(speechBody, services)

        expect(services.deductCredits).not.toHaveBeenCalled()
        expect(services.persistAsset).not.toHaveBeenCalled()
    })

    it("treats a non-string text as empty", async () => {
        runReplicate.mockResolvedValue(OUTPUT_URL)
        const { services } = makeServices()

        await processSpeech({ ...speechBody, text: 5 }, services)

        expect(services.persistAsset).toHaveBeenCalledWith(expect.objectContaining({ prompt: "" }))
    })
})

const IMAGE_ID = "665f1f77bcf86cd799439011"
const AUDIO_ID = "665f1f77bcf86cd799439012"
const leanOf = <T>(value: T) => ({ lean: vi.fn().mockResolvedValue(value) })
const storedUpload = (overrides: Record<string, unknown> = {}) => ({
    _id: "u1",
    url: "https://cdn.invalid/u1",
    publicId: "pid",
    mime: "image/png",
    ...overrides,
})

describe("video cost", () => {
    it.each([
        ["P_VIDEO", "720p", false, 5, 20],
        ["P_VIDEO", "1080p", false, 5, 40],
        ["P_VIDEO", "720p", true, 5, 5],
        ["P_VIDEO", "1080p", true, 5, 10],
        ["WAN_3", "480p", false, 5, 35],
        ["WAN_3", "720p", false, 5, 70],
        ["WAN_3", "1080p", false, 5, 140],
    ] as const)(
        "prices %s %s draft=%s for %is at %i credits",
        (key, resolution, draft, sec, cost) => {
            expect(getVideoCreditCost(key, { durationSec: sec, resolution, draft })).toBe(cost)
        },
    )

    it("scales linearly with duration", () => {
        expect(getVideoCreditCost("P_VIDEO", { durationSec: 1, resolution: "720p" })).toBe(4)
        expect(getVideoCreditCost("P_VIDEO", { durationSec: 20, resolution: "720p" })).toBe(80)
    })

    it("bills audio-driven runs on the rounded-up stored audio length", () => {
        expect(
            getVideoCreditCost("P_VIDEO", {
                durationSec: 5,
                resolution: "720p",
                audioDurationSec: 10.2,
            }),
        ).toBe(44)
    })

    it("clamps the audio billable length to 20 seconds", () => {
        expect(
            getVideoCreditCost("P_VIDEO", {
                durationSec: 5,
                resolution: "720p",
                audioDurationSec: 90,
            }),
        ).toBe(80)
    })

    it("rejects a draft price that does not exist", () => {
        expect(() =>
            getVideoCreditCost("WAN_3", { durationSec: 5, resolution: "720p", draft: true }),
        ).toThrow()
    })
})

describe("resolveVideoAttachments", () => {
    beforeEach(() => vi.clearAllMocks())

    it("returns nothing when no upload is attached", async () => {
        await expect(resolveVideoAttachments("user_1", {})).resolves.toEqual({
            imageUrl: undefined,
            audioUrl: undefined,
            audioDurationSec: undefined,
        })
        expect(uploadModel.findOne).not.toHaveBeenCalled()
    })

    it("resolves urls and the stored audio duration, scoped to the owner and purpose", async () => {
        uploadModel.findOne
            .mockReturnValueOnce(leanOf(storedUpload({ url: "https://cdn.invalid/i.png" })))
            .mockReturnValueOnce(
                leanOf(storedUpload({ url: "https://cdn.invalid/a.mp3", durationSec: 12.5 })),
            )

        const result = await resolveVideoAttachments("user_1", {
            imageUploadId: IMAGE_ID,
            audioUploadId: AUDIO_ID,
        })

        expect(result).toEqual({
            imageUrl: "https://cdn.invalid/i.png",
            audioUrl: "https://cdn.invalid/a.mp3",
            audioDurationSec: 12.5,
        })
        expect(uploadModel.findOne).toHaveBeenCalledWith(
            expect.objectContaining({ _id: IMAGE_ID, userId: "user_1", purpose: "video-image" }),
        )
        expect(uploadModel.findOne).toHaveBeenCalledWith(
            expect.objectContaining({ _id: AUDIO_ID, userId: "user_1", purpose: "video-audio" }),
        )
    })

    it("rejects audio with no stored duration rather than billing the client's length", async () => {
        uploadModel.findOne.mockReturnValue(leanOf(storedUpload({ durationSec: null })))

        await expect(
            resolveVideoAttachments("user_1", { audioUploadId: AUDIO_ID }),
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    it("rejects an upload that is missing, foreign, consumed or expired with a field-level 400", async () => {
        uploadModel.findOne.mockReturnValue(leanOf(null))

        await expect(
            resolveVideoAttachments("user_1", { imageUploadId: IMAGE_ID }),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "imageUploadId: upload not found or expired",
        })
    })

    it("rejects a malformed id without querying the database", async () => {
        await expect(
            resolveVideoAttachments("user_1", { audioUploadId: "not-an-object-id" }),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "audioUploadId: upload not found or expired",
        })
        expect(uploadModel.findOne).not.toHaveBeenCalled()
    })
})

describe("processVideo", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        uploadModel.findOne.mockReturnValue(leanOf(null))
        uploadModel.find.mockReturnValue(leanOf([]))
        deleteUploadedFile.mockResolvedValue(undefined)
        uploadModel.deleteOne.mockResolvedValue(undefined)
    })

    const videoBody: MediaJobBody = {
        jobId: "job_123456",
        userId: "user_1",
        modelKey: "P_VIDEO",
        prompt: "a fox running",
        durationSec: 5,
        resolution: "720p",
    }

    it("charges the server-computed cost once and ignores a client-sent cost", async () => {
        runReplicate.mockResolvedValue("https://fake.invalid/out.mp4")
        const { services } = makeServices()

        await processVideo({ ...videoBody, creditCost: 1 }, services)

        expect(services.deductCredits).toHaveBeenCalledTimes(1)
        expect(services.deductCredits).toHaveBeenCalledWith("user_1", 20)
    })

    it("charges the draft rate when draft is set", async () => {
        runReplicate.mockResolvedValue("https://fake.invalid/out.mp4")
        const { services } = makeServices()

        await processVideo({ ...videoBody, draft: true }, services)

        expect(services.deductCredits).toHaveBeenCalledWith("user_1", 5)
    })

    it("persists a video asset under the video feature with the prompt", async () => {
        runReplicate.mockResolvedValue("https://fake.invalid/out.mp4")
        const { services } = makeServices()

        await processVideo(videoBody, services)

        expect(services.persistAsset).toHaveBeenCalledWith(
            expect.objectContaining({
                modelKey: "P_VIDEO",
                featureType: FeatureType.VIDEO,
                prompt: "a fox running",
                outputUrl: "https://fake.invalid/out.mp4",
            }),
        )
    })

    it("uses an empty prompt when none is a string", async () => {
        runReplicate.mockResolvedValue("https://fake.invalid/out.mp4")
        const { services } = makeServices()

        await processVideo({ ...videoBody, prompt: 5 }, services)

        expect(services.persistAsset).toHaveBeenCalledWith(expect.objectContaining({ prompt: "" }))
    })

    it("sends attachment urls to Replicate and bills the stored audio length, not a client value", async () => {
        runReplicate.mockResolvedValue("https://fake.invalid/out.mp4")
        uploadModel.findOne
            .mockReturnValueOnce(leanOf(storedUpload({ url: "https://cdn.invalid/i.png" })))
            .mockReturnValueOnce(
                leanOf(storedUpload({ url: "https://cdn.invalid/a.mp3", durationSec: 60 })),
            )
        const { services } = makeServices()

        await processVideo(
            { ...videoBody, imageUploadId: IMAGE_ID, audioUploadId: AUDIO_ID, audioDurationSec: 1 },
            services,
        )

        const input = runReplicate.mock.calls[0][0].input
        expect(input).toMatchObject({
            image: "https://cdn.invalid/i.png",
            audio: "https://cdn.invalid/a.mp3",
        })
        expect(input).not.toHaveProperty("imageUploadId")
        expect(input).not.toHaveProperty("audioUploadId")
        expect(services.deductCredits).toHaveBeenCalledWith("user_1", 80)
    })

    it("deletes the used uploads after a delivered final render", async () => {
        runReplicate.mockResolvedValue("https://fake.invalid/out.mp4")
        const row = storedUpload()
        uploadModel.findOne.mockReturnValue(leanOf(row))
        uploadModel.find.mockReturnValue(leanOf([row]))
        const { services } = makeServices()

        await processVideo({ ...videoBody, imageUploadId: IMAGE_ID }, services)

        expect(uploadModel.find).toHaveBeenCalledWith({
            _id: { $in: [IMAGE_ID] },
            userId: "user_1",
        })
        expect(deleteUploadedFile).toHaveBeenCalledWith(row)
        expect(uploadModel.deleteOne).toHaveBeenCalledWith({ _id: "u1" })
    })

    it("keeps the uploads after a draft so Render final can reuse them", async () => {
        runReplicate.mockResolvedValue("https://fake.invalid/out.mp4")
        uploadModel.findOne.mockReturnValue(leanOf(storedUpload()))
        const { services } = makeServices()

        await processVideo({ ...videoBody, draft: true, imageUploadId: IMAGE_ID }, services)

        expect(deleteUploadedFile).not.toHaveBeenCalled()
        expect(uploadModel.deleteOne).not.toHaveBeenCalled()
    })

    it("keeps the uploads and deducts nothing when generation fails", async () => {
        runReplicate.mockRejectedValue(new Error("replicate down"))
        uploadModel.findOne.mockReturnValue(leanOf(storedUpload()))
        const { services } = makeServices()

        await processVideo({ ...videoBody, imageUploadId: IMAGE_ID }, services)

        expect(services.deductCredits).not.toHaveBeenCalled()
        expect(services.persistAsset).not.toHaveBeenCalled()
        expect(uploadModel.find).not.toHaveBeenCalled()
        expect(deleteUploadedFile).not.toHaveBeenCalled()
    })

    it("logs and continues when removing one upload fails, still removing the next", async () => {
        runReplicate.mockResolvedValue("https://fake.invalid/out.mp4")
        const first = storedUpload({ _id: "u1" })
        const second = storedUpload({ _id: "u2" })
        uploadModel.findOne.mockReturnValue(leanOf(first))
        uploadModel.find.mockReturnValue(leanOf([first, second]))
        deleteUploadedFile.mockRejectedValueOnce(new Error("cloudinary down"))
        const { services } = makeServices()

        await processVideo({ ...videoBody, imageUploadId: IMAGE_ID }, services)

        expect(loggerError).toHaveBeenCalledWith(
            expect.objectContaining({ uploadId: "u1" }),
            "Failed to delete used upload",
        )
        expect(uploadModel.deleteOne).toHaveBeenCalledTimes(1)
        expect(uploadModel.deleteOne).toHaveBeenCalledWith({ _id: "u2" })
    })

    it("rejects before generating when an attachment is not the caller's", async () => {
        const { services } = makeServices()

        await expect(
            processVideo({ ...videoBody, imageUploadId: IMAGE_ID }, services),
        ).rejects.toMatchObject({ statusCode: 400 })
        expect(runReplicate).not.toHaveBeenCalled()
        expect(services.deductCredits).not.toHaveBeenCalled()
    })

    it("uses the default services when none are injected", async () => {
        runReplicate.mockRejectedValue(new Error("down"))

        await processVideo(videoBody)

        expect(redisSetStatus).toHaveBeenCalled()
    })
})

const TOOL_ID = "665f1f77bcf86cd799439021"
const VIDEO_URL = "https://cdn.invalid/clip.mp4"
const IMAGE_URL = "https://cdn.invalid/pic.png"

describe("tool cost", () => {
    it("charges one credit per watermark run", () => {
        expect(getImageWatermarkCreditCost()).toBe(1)
        expect(getVideoWatermarkCreditCost()).toBe(1)
    })

    it.each([
        [1, 11],
        [30, 11],
        [31, 22],
        [60, 22],
        [120, 44],
    ])(
        "bills autocaption for %is of video at %i credits (per started 30s block)",
        (sec, credits) => {
            expect(getAutocaptionCreditCost(sec)).toBe(credits)
        },
    )
})

describe("resolveToolUpload", () => {
    beforeEach(() => vi.clearAllMocks())

    it("returns only the url for an image, scoped to owner and tool-image purpose", async () => {
        uploadModel.findOne.mockReturnValue(leanOf(storedUpload({ url: IMAGE_URL })))

        await expect(resolveToolUpload("user_1", TOOL_ID, "image")).resolves.toEqual({
            url: IMAGE_URL,
        })
        expect(uploadModel.findOne).toHaveBeenCalledWith(
            expect.objectContaining({ _id: TOOL_ID, userId: "user_1", purpose: "tool-image" }),
        )
    })

    it("returns the url and stored duration for a video, under the tool-video purpose", async () => {
        uploadModel.findOne.mockReturnValue(
            leanOf(storedUpload({ url: VIDEO_URL, durationSec: 45 })),
        )

        await expect(resolveToolUpload("user_1", TOOL_ID, "video")).resolves.toEqual({
            url: VIDEO_URL,
            durationSec: 45,
        })
        expect(uploadModel.findOne).toHaveBeenCalledWith(
            expect.objectContaining({ purpose: "tool-video" }),
        )
    })

    it("accepts a video of exactly the 120 second cap", async () => {
        uploadModel.findOne.mockReturnValue(leanOf(storedUpload({ durationSec: 120 })))

        await expect(resolveToolUpload("user_1", TOOL_ID, "video")).resolves.toMatchObject({
            durationSec: 120,
        })
    })

    it.each([
        ["just over the cap", 120.01],
        ["zero", 0],
        ["missing", undefined],
        ["null", null],
    ])(
        "rejects a video whose stored duration is %s with the limit copy",
        async (_label, durationSec) => {
            uploadModel.findOne.mockReturnValue(leanOf(storedUpload({ durationSec })))

            await expect(resolveToolUpload("user_1", TOOL_ID, "video")).rejects.toMatchObject({
                statusCode: 400,
                message: "uploadId: Videos up to 2 minutes and 100 MB",
            })
        },
    )

    it("rejects a missing, foreign or expired upload with a field-level 400", async () => {
        uploadModel.findOne.mockReturnValue(leanOf(null))

        await expect(resolveToolUpload("user_1", TOOL_ID, "image")).rejects.toMatchObject({
            statusCode: 400,
            message: "uploadId: upload not found or expired",
        })
    })

    it("rejects a malformed id without querying the database", async () => {
        await expect(resolveToolUpload("user_1", "nope", "image")).rejects.toMatchObject({
            statusCode: 400,
        })
        expect(uploadModel.findOne).not.toHaveBeenCalled()
    })
})

describe("tool processors", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        uploadModel.findOne.mockReturnValue(leanOf(null))
        uploadModel.find.mockReturnValue(leanOf([]))
        deleteUploadedFile.mockResolvedValue(undefined)
        uploadModel.deleteOne.mockResolvedValue(undefined)
    })

    const base = { jobId: "job_123456", userId: "user_1", uploadId: TOOL_ID }
    const imageBody: MediaJobBody = {
        ...base,
        modelKey: "IMAGE_WATERMARK",
        watermarkText: "(c) Me",
        position: "center",
        scale: 0.2,
        opacity: 0.5,
    }
    const videoBody: MediaJobBody = {
        ...base,
        modelKey: "VIDEO_WATERMARK",
        watermarkText: "Me",
        size: 40,
    }
    const captionBody: MediaJobBody = { ...base, modelKey: "AUTOCAPTION" }

    describe("processImageWatermark", () => {
        it("sends the stored url and the user's text, charges once and persists a watermark asset", async () => {
            uploadModel.findOne.mockReturnValue(leanOf(storedUpload({ url: IMAGE_URL })))
            runReplicate.mockResolvedValue("https://fake.invalid/out.png")
            const { services } = makeServices()

            await processImageWatermark(imageBody, services)

            const { input } = runReplicate.mock.calls[0][0]
            expect(input).toMatchObject({
                image: IMAGE_URL,
                watermark_text: "(c) Me",
                position: "center",
                scale: 0.2,
                opacity: 0.5,
            })
            expect(input).not.toHaveProperty("uploadId")
            expect(services.deductCredits).toHaveBeenCalledTimes(1)
            expect(services.deductCredits).toHaveBeenCalledWith("user_1", 1)
            expect(services.persistAsset).toHaveBeenCalledWith(
                expect.objectContaining({
                    modelKey: "IMAGE_WATERMARK",
                    featureType: FeatureType.WATERMARK_IMAGE,
                    prompt: "(c) Me",
                }),
            )
        })

        it("deletes the consumed upload once the result is delivered", async () => {
            const row = storedUpload()
            uploadModel.findOne.mockReturnValue(leanOf(row))
            uploadModel.find.mockReturnValue(leanOf([row]))
            runReplicate.mockResolvedValue("https://fake.invalid/out.png")
            const { services } = makeServices()

            await processImageWatermark(imageBody, services)

            expect(uploadModel.find).toHaveBeenCalledWith({
                _id: { $in: [TOOL_ID] },
                userId: "user_1",
            })
            expect(deleteUploadedFile).toHaveBeenCalledWith(row)
            expect(uploadModel.deleteOne).toHaveBeenCalledWith({ _id: "u1" })
        })

        it("keeps the upload and charges nothing when generation fails", async () => {
            uploadModel.findOne.mockReturnValue(leanOf(storedUpload()))
            runReplicate.mockRejectedValue(new Error("replicate down"))
            const { services } = makeServices()

            await processImageWatermark(imageBody, services)

            expect(services.deductCredits).not.toHaveBeenCalled()
            expect(deleteUploadedFile).not.toHaveBeenCalled()
        })

        it("rejects before generating when the upload is not the caller's", async () => {
            const { services } = makeServices()

            await expect(processImageWatermark(imageBody, services)).rejects.toMatchObject({
                statusCode: 400,
            })
            expect(runReplicate).not.toHaveBeenCalled()
        })

        it("uses the default services when none are injected", async () => {
            uploadModel.findOne.mockReturnValue(leanOf(storedUpload()))
            runReplicate.mockRejectedValue(new Error("down"))

            await processImageWatermark(imageBody)

            expect(redisSetStatus).toHaveBeenCalled()
        })
    })

    describe("processVideoWatermark", () => {
        it("sends the stored video url, text and size, and charges the flat rate once", async () => {
            uploadModel.findOne.mockReturnValue(
                leanOf(storedUpload({ url: VIDEO_URL, durationSec: 100 })),
            )
            runReplicate.mockResolvedValue("https://fake.invalid/out.mp4")
            const { services } = makeServices()

            await processVideoWatermark(videoBody, services)

            expect(runReplicate.mock.calls[0][0].input).toMatchObject({
                video: VIDEO_URL,
                watermark: "Me",
                size: 40,
            })
            expect(services.deductCredits).toHaveBeenCalledTimes(1)
            expect(services.deductCredits).toHaveBeenCalledWith("user_1", 1)
            expect(services.persistAsset).toHaveBeenCalledWith(
                expect.objectContaining({
                    featureType: FeatureType.WATERMARK_VIDEO,
                    prompt: "Me",
                }),
            )
        })

        it("refuses an over-long stored video before generating or charging", async () => {
            uploadModel.findOne.mockReturnValue(leanOf(storedUpload({ durationSec: 121 })))
            const { services } = makeServices()

            await expect(processVideoWatermark(videoBody, services)).rejects.toMatchObject({
                statusCode: 400,
            })
            expect(runReplicate).not.toHaveBeenCalled()
            expect(services.deductCredits).not.toHaveBeenCalled()
        })
    })

    describe("processAutocaption", () => {
        it.each([
            [30, 11],
            [31, 22],
            [120, 44],
        ])(
            "bills a %is video at %i credits from the stored duration",
            async (durationSec, credits) => {
                uploadModel.findOne.mockReturnValue(
                    leanOf(storedUpload({ url: VIDEO_URL, durationSec })),
                )
                runReplicate.mockResolvedValue([
                    "https://fake.invalid/c.mp4",
                    "https://fake.invalid/t.txt",
                ])
                const { services } = makeServices()

                await processAutocaption({ ...captionBody, durationSec: 1 }, services)

                expect(runReplicate.mock.calls[0][0].input).toMatchObject({
                    video_file_input: VIDEO_URL,
                })
                expect(services.deductCredits).toHaveBeenCalledTimes(1)
                expect(services.deductCredits).toHaveBeenCalledWith("user_1", credits)
            },
        )

        it("keeps the transcript, the second output, with the asset", async () => {
            uploadModel.findOne.mockReturnValue(leanOf(storedUpload({ durationSec: 10 })))
            runReplicate.mockResolvedValue([
                "https://fake.invalid/c.mp4",
                "https://fake.invalid/t.txt",
            ])
            const { services } = makeServices()

            await processAutocaption(captionBody, services)

            expect(services.persistAsset).toHaveBeenCalledWith(
                expect.objectContaining({
                    featureType: FeatureType.AUTOCAPTION,
                    prompt: "Captioned video",
                    outputUrl: "https://fake.invalid/c.mp4",
                    transcriptUrl: "https://fake.invalid/t.txt",
                }),
            )
        })

        it("stores no transcript when the model returns a single output", async () => {
            uploadModel.findOne.mockReturnValue(leanOf(storedUpload({ durationSec: 10 })))
            runReplicate.mockResolvedValue("https://fake.invalid/c.mp4")
            const { services } = makeServices()

            await processAutocaption(captionBody, services)

            expect(services.persistAsset).toHaveBeenCalledWith(
                expect.objectContaining({ transcriptUrl: undefined }),
            )
        })

        it("ignores a transcript that is not an https url", async () => {
            uploadModel.findOne.mockReturnValue(leanOf(storedUpload({ durationSec: 10 })))
            runReplicate.mockResolvedValue(["https://fake.invalid/c.mp4", "javascript:alert(1)"])
            const { services } = makeServices()

            await processAutocaption(captionBody, services)

            expect(services.persistAsset).toHaveBeenCalledWith(
                expect.objectContaining({ transcriptUrl: undefined }),
            )
        })
    })
})
