import { beforeEach, describe, expect, it, vi } from "vitest"

import { FeatureType } from "@visual-ai/shared"

import { PromptModerationError } from "../lib/prompt-moderation.js"

const replicateRun = vi.hoisted(() => vi.fn())
const preparePrompt = vi.hoisted(() => vi.fn())
const validateModelParams = vi.hoisted(() => vi.fn())
const buildModelInput = vi.hoisted(() => vi.fn())
const getModelReplicateId = vi.hoisted(() => vi.fn())
const getImageDetails = vi.hoisted(() => vi.fn())
const uploadToCloudinary = vi.hoisted(() => vi.fn())
const redisSetStatus = vi.hoisted(() => vi.fn())

const User = vi.hoisted(() => ({
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
    shortId: (id?: string) => (id ?? "id").slice(0, 8),
}))

vi.mock("../lib/replicate.js", () => ({
    replicate: { run: replicateRun },
}))

vi.mock("../lib/prompt-pipeline.js", () => ({
    preparePrompt,
}))

vi.mock("../lib/model-input.js", () => ({
    validateModelParams,
    buildModelInput,
    getModelReplicateId,
}))

vi.mock("../utils/cloudinary.js", () => ({
    getImageDetails,
    uploadToCloudinary,
}))

vi.mock("../models/user.js", () => ({
    UserModel: User,
}))

vi.mock("../models/image.js", () => ({
    ImageModel: class ImageModel {
        _id = { toString: () => "img_123" }

        constructor(doc: Record<string, unknown>) {
            Object.assign(this, doc)
        }

        toObject() {
            return { ...this, _id: this._id }
        }
    },
}))

vi.mock("./redis-service.js", () => ({
    RedisService: class RedisService {
        setStatus = redisSetStatus
    },
}))

const {
    calculateCreditCost,
    processImage,
    processUpscale,
    processRevive,
    processColorize,
    processRemoveBg,
    runGenerationJob,
} = await import("./generation-service.js")

function jobStatus() {
    return { setStatus: vi.fn().mockResolvedValue(undefined) }
}

function setupHappyPersist(credits = { dailyCredits: 4, credits: 6 }) {
    getImageDetails.mockResolvedValue({ width: 1024, height: 768, format: "png", bytes: 12 })
    User.findOneAndUpdate.mockResolvedValueOnce({ history: [] }).mockResolvedValueOnce(credits)
    User.findOne.mockResolvedValue({
        history: [{ _id: { toString: () => "img_123" }, prompt: "done" }],
    })
    uploadToCloudinary.mockResolvedValue(undefined)
}

describe("calculateCreditCost", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("IMAGE without modelKey defaults to 1 credit", () => {
        expect(calculateCreditCost(FeatureType.IMAGE)).toBe(1)
    })

    it("IMAGE with standard modelKey returns correct cost", () => {
        expect(calculateCreditCost(FeatureType.IMAGE, "FLUX_BASIC")).toBe(1)
    })

    it("IMAGE with premium modelKey returns correct cost", () => {
        expect(calculateCreditCost(FeatureType.IMAGE, "FLUX_PRO")).toBe(5)
    })

    it("utility models return registry costs", () => {
        expect(calculateCreditCost(FeatureType.UPSCALE, "UPSCALE_REAL_ESRGAN")).toBe(2)
        expect(calculateCreditCost(FeatureType.REVIVE, "REVIVE")).toBe(2)
        expect(calculateCreditCost(FeatureType.COLORIZE, "COLORIZE_BASIC")).toBe(2)
    })

    it("requires modelKey for utility operations", () => {
        expect(() => calculateCreditCost(FeatureType.UPSCALE)).toThrow(
            "modelKey is required for utility operations",
        )
    })

    it("throws on unknown modelKey", () => {
        expect(() => calculateCreditCost(FeatureType.IMAGE, "NOPE" as never)).toThrow()
    })
})

describe("runGenerationJob", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getImageDetails.mockResolvedValue({ width: 10, height: 20, format: "jpg", bytes: 3 })
        uploadToCloudinary.mockResolvedValue(undefined)
    })

    it("skips duplicate and starting progress, then completes an IMAGE job", async () => {
        replicateRun.mockImplementation(async (_model, _opts, onProgress) => {
            onProgress?.({ status: "starting" })
            onProgress?.({ status: "starting" })
            onProgress?.({ status: "processing" })
            onProgress?.({ status: "processing" })
            onProgress?.({ status: "succeeded" })
            return "https://single.png"
        })
        setupHappyPersist()
        const services = { jobStatus: jobStatus() }

        await runGenerationJob(
            {
                model: "owner/model",
                input: { prompt: "cat" },
                jobId: "job_1",
                userId: "user_1",
                featureType: FeatureType.IMAGE,
                modelName: "FLUX_BASIC",
                aspectRatio: "1:1",
                prompt: "cat",
                creditCost: 1,
                buildCloudinaryPayload: (output, imageId) => ({ output, imageId }),
            } as never,
            services,
        )

        expect(services.jobStatus.setStatus).toHaveBeenCalledWith(
            "job_1",
            expect.objectContaining({ status: "processing", userCreditsRemaining: 10 }),
        )
        expect(services.jobStatus.setStatus).toHaveBeenCalledWith(
            "job_1",
            expect.objectContaining({ status: "completed" }),
        )
        expect(uploadToCloudinary).toHaveBeenCalledWith({
            output: "https://single.png",
            imageId: expect.anything(),
        })
    })

    it("builds enhanced-image fields for non-IMAGE features and array output", async () => {
        replicateRun.mockResolvedValue(["https://a.png", "https://b.png"])
        setupHappyPersist({ dailyCredits: 1, credits: undefined })
        const services = { jobStatus: jobStatus() }

        await runGenerationJob(
            {
                model: "owner/upscale",
                input: { image: "in.png" },
                jobId: "job_2",
                userId: "user_1",
                featureType: FeatureType.UPSCALE,
                filePath: "local.png",
                creditCost: 2,
                buildCloudinaryPayload: (output) => ({ output }),
            } as never,
            services,
        )

        expect(getImageDetails).toHaveBeenCalledTimes(2)
        expect(services.jobStatus.setStatus).toHaveBeenCalledWith(
            "job_2",
            expect.objectContaining({ status: "completed" }),
        )
    })

    it("sets error status when Replicate returns no output", async () => {
        replicateRun.mockResolvedValue("")
        const services = { jobStatus: jobStatus() }

        await runGenerationJob(
            {
                model: "owner/model",
                input: {},
                jobId: "job_empty",
                userId: "user_1",
                featureType: FeatureType.IMAGE,
                creditCost: 1,
                buildCloudinaryPayload: () => ({}),
            } as never,
            services,
        )

        expect(services.jobStatus.setStatus).toHaveBeenCalledWith("job_empty", {
            status: "error",
            image: undefined,
            userCreditsRemaining: null,
        })
        expect(uploadToCloudinary).not.toHaveBeenCalled()
    })

    it("logs when the user is missing during persist and still continues", async () => {
        replicateRun.mockResolvedValue("https://out.png")
        getImageDetails.mockResolvedValue({ width: 1, height: 1, format: "png", bytes: 1 })
        User.findOneAndUpdate.mockResolvedValueOnce(null).mockResolvedValueOnce({
            dailyCredits: 0,
            credits: 9,
        })
        User.findOne.mockResolvedValue(null)
        const services = { jobStatus: jobStatus() }

        await runGenerationJob(
            {
                model: "owner/model",
                input: {},
                jobId: "job_nouser",
                userId: "ghost",
                featureType: FeatureType.IMAGE,
                creditCost: 1,
                buildCloudinaryPayload: () => ({}),
            } as never,
            services,
        )

        expect(services.jobStatus.setStatus).toHaveBeenCalledWith(
            "job_nouser",
            expect.objectContaining({ status: "completed" }),
        )
    })

    it("maps insufficient credits into an error status", async () => {
        replicateRun.mockResolvedValue("https://out.png")
        getImageDetails.mockResolvedValue({ width: 1, height: 1, format: "png", bytes: 1 })
        User.findOneAndUpdate.mockResolvedValueOnce({ history: [] }).mockResolvedValueOnce(null)
        const services = { jobStatus: jobStatus() }

        await runGenerationJob(
            {
                model: "owner/model",
                input: {},
                jobId: "job_broke",
                userId: "user_1",
                featureType: FeatureType.IMAGE,
                creditCost: 99,
                buildCloudinaryPayload: () => ({}),
            } as never,
            services,
        )

        expect(services.jobStatus.setStatus).toHaveBeenCalledWith("job_broke", {
            status: "error",
            image: undefined,
            userCreditsRemaining: null,
            message: undefined,
        })
    })

    it("surfaces a friendly message for Replicate content-safety errors", async () => {
        replicateRun.mockRejectedValue(new Error("Prediction failed: flagged as sensitive E005"))
        const services = { jobStatus: jobStatus() }

        await runGenerationJob(
            {
                model: "owner/model",
                input: {},
                jobId: "job_nsfw",
                userId: "user_1",
                featureType: FeatureType.IMAGE,
                creditCost: 1,
                buildCloudinaryPayload: () => ({}),
            } as never,
            services,
        )

        expect(services.jobStatus.setStatus).toHaveBeenCalledWith(
            "job_nsfw",
            expect.objectContaining({
                status: "error",
                message:
                    "Your prompt or the generated image was flagged as sensitive. Please try a different prompt.",
            }),
        )
    })

    it("stringifies non-Error failures", async () => {
        replicateRun.mockRejectedValue("boom")
        const services = { jobStatus: jobStatus() }

        await runGenerationJob(
            {
                model: "owner/model",
                input: {},
                jobId: "job_str",
                userId: "user_1",
                featureType: FeatureType.IMAGE,
                creditCost: 1,
                buildCloudinaryPayload: () => ({}),
            } as never,
            services,
        )

        expect(services.jobStatus.setStatus).toHaveBeenCalledWith(
            "job_str",
            expect.objectContaining({ status: "error", message: undefined }),
        )
    })
})

describe("processImage", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        validateModelParams.mockReturnValue(undefined)
        buildModelInput.mockReturnValue({ prompt: "p" })
        getModelReplicateId.mockReturnValue("owner/flux")
        preparePrompt.mockResolvedValue("prepared prompt")
        replicateRun.mockResolvedValue("https://out.png")
        setupHappyPersist()
    })

    it("prepares a prompt and unwraps a single-item output array for Cloudinary", async () => {
        replicateRun.mockResolvedValue(["https://only.png"])

        await processImage({
            userId: "user_1",
            jobId: "job_img",
            modelId: "FLUX_BASIC",
            modelName: "Flux",
            imageType: "generated",
            prompt: "a cat",
            numOfOutputs: 1,
            outputQuality: 80,
            aspectRatio: "1:1",
            outputFormat: "png",
        } as never)

        expect(preparePrompt).toHaveBeenCalled()
        expect(uploadToCloudinary).toHaveBeenCalledWith(
            expect.objectContaining({
                type: FeatureType.IMAGE,
                imageUrl: "https://only.png",
                prompt: "prepared prompt",
            }),
        )
        expect(redisSetStatus).toHaveBeenCalledWith(
            "job_img",
            expect.objectContaining({ status: "completed" }),
        )
    })

    it("passes through a multi-output array and skips prepare when prompt is empty", async () => {
        replicateRun.mockResolvedValue(["https://a.png", "https://b.png"])

        await processImage({
            jobId: "job_multi",
            modelId: "FLUX_BASIC",
            prompt: "",
        } as never)

        expect(preparePrompt).not.toHaveBeenCalled()
        expect(uploadToCloudinary).toHaveBeenCalledWith(
            expect.objectContaining({
                imageUrl: ["https://a.png", "https://b.png"],
                userId: undefined,
            }),
        )
    })

    it("records PromptModerationError reason and does not run generation", async () => {
        validateModelParams.mockImplementation(() => {
            throw new PromptModerationError("unsafe prompt")
        })

        await processImage({
            userId: "user_1",
            jobId: "job_mod",
            modelId: "FLUX_BASIC",
            prompt: "ok",
        } as never)

        expect(replicateRun).not.toHaveBeenCalled()
        expect(redisSetStatus).toHaveBeenCalledWith("job_mod", {
            status: "error",
            image: undefined,
            userCreditsRemaining: null,
            message: "unsafe prompt",
        })
    })

    it("records a generic validation failure without a user message", async () => {
        validateModelParams.mockImplementation(() => {
            throw "bad params"
        })

        await processImage({
            jobId: "job_bad",
            modelId: "FLUX_BASIC",
            prompt: "ok",
        } as never)

        expect(redisSetStatus).toHaveBeenCalledWith("job_bad", {
            status: "error",
            image: undefined,
            userCreditsRemaining: null,
            message: undefined,
        })
    })
})

describe("processUpscale", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        validateModelParams.mockReturnValue(undefined)
        buildModelInput.mockReturnValue({ image: "in.png" })
        getModelReplicateId.mockReturnValue("owner/upscale")
        replicateRun.mockResolvedValue(["https://up.png"])
        setupHappyPersist()
    })

    it("throws for an unknown model key", async () => {
        await expect(
            processUpscale({
                body: { userId: "u", jobId: "j", model: "NOT_A_MODEL" },
                filePath: "in.png",
                fileName: "in",
            } as never),
        ).rejects.toMatchObject({ statusCode: 400, message: 'Unknown model key: "NOT_A_MODEL"' })
    })

    it("throws when the model is not a utility model", async () => {
        await expect(
            processUpscale({
                body: { userId: "u", jobId: "j", model: "FLUX_BASIC" },
                filePath: "in.png",
                fileName: "in",
            } as never),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: 'Model "FLUX_BASIC" is not a utility model',
        })
    })

    it("defaults to UPSCALE_IMAGE and uploads the first array output", async () => {
        await processUpscale({
            body: { userId: "user_1", jobId: "job_up", outputFormat: "png", scale: "2" },
            filePath: "in.png",
            fileName: "orig",
        } as never)

        expect(validateModelParams).toHaveBeenCalledWith(
            "UPSCALE_IMAGE",
            expect.objectContaining({ imageUrl: "in.png", scale: 2 }),
        )
        expect(uploadToCloudinary).toHaveBeenCalledWith(
            expect.objectContaining({
                type: FeatureType.UPSCALE,
                imageUrl: "https://up.png",
                originalPublicId: "orig",
            }),
        )
    })
})

describe("processRevive", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getModelReplicateId.mockReturnValue("owner/revive")
        replicateRun.mockResolvedValue("https://rev.png")
        setupHappyPersist()
    })

    it("runs revive with the source image path", async () => {
        await processRevive({
            body: { userId: "user_1", jobId: "job_rev" },
            filePath: "old.png",
            fileName: "old",
        } as never)

        expect(replicateRun).toHaveBeenCalledWith(
            "owner/revive",
            { input: { img: "old.png" } },
            expect.any(Function),
        )
        expect(uploadToCloudinary).toHaveBeenCalledWith(
            expect.objectContaining({ type: FeatureType.REVIVE, imageUrl: "https://rev.png" }),
        )
    })
})

describe("processColorize", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getModelReplicateId.mockReturnValue("owner/color")
        replicateRun.mockResolvedValue("https://col.png")
        setupHappyPersist()
    })

    it("runs colorize for the requested model", async () => {
        await processColorize({
            body: { userId: "user_1", jobId: "job_col", modelId: "COLORIZE_BASIC" },
            filePath: "bw.png",
            fileName: "bw",
        } as never)

        expect(getModelReplicateId).toHaveBeenCalledWith("COLORIZE_BASIC")
        expect(uploadToCloudinary).toHaveBeenCalledWith(
            expect.objectContaining({ type: FeatureType.COLORIZE, original: "bw.png" }),
        )
    })
})

describe("processRemoveBg", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getModelReplicateId.mockReturnValue("owner/bg")
        replicateRun.mockResolvedValue(["https://cut.png"])
        setupHappyPersist()
    })

    it("runs background removal with png/rgba defaults", async () => {
        await processRemoveBg({
            body: { userId: "user_1", jobId: "job_bg" },
            filePath: "subj.png",
            fileName: "subj",
        } as never)

        expect(replicateRun).toHaveBeenCalledWith(
            "owner/bg",
            { input: { image: "subj.png", format: "png", background_type: "rgba" } },
            expect.any(Function),
        )
        expect(uploadToCloudinary).toHaveBeenCalledWith(
            expect.objectContaining({
                type: FeatureType.REMOVE_BG,
                imageUrl: "https://cut.png",
            }),
        )
    })
})
