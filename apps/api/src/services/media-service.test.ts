import { beforeEach, describe, expect, it, vi } from "vitest"

import { FeatureType } from "@visual-ai/shared"
import type { MediaAssetDto } from "@visual-ai/shared"

const runReplicate = vi.hoisted(() => vi.fn())
const User = vi.hoisted(() => ({ findOne: vi.fn() }))
const getJob = vi.hoisted(() => vi.fn())
const assetExists = vi.hoisted(() => vi.fn())
const redisSetStatus = vi.hoisted(() => vi.fn())

vi.mock("../lib/replicate.js", () => ({ runReplicate }))
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
    createLogger: () => ({ debug: vi.fn(), error: vi.fn(), info: vi.fn() }),
    shortId: (id: string) => id.slice(0, 6),
}))

const {
    getAvailableCredits,
    getMusicCostInput,
    getMusicCreditCost,
    hasExistingJob,
    getSongCreditCost,
    processMusic,
    processSong,
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
