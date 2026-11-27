import { FEEDBACK_GENERATION_THRESHOLD, FEEDBACK_HIGH_RATING_MIN } from "@visual-ai/shared"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
    const leanOf = (fn: ReturnType<typeof vi.fn>) => ({
        select: () => ({ lean: fn }),
        lean: fn,
    })
    return {
        userFindOne: vi.fn(),
        userLean: vi.fn(),
        userUpdateOne: vi.fn(),
        userFindOneAndUpdate: vi.fn(),
        feedbackCreate: vi.fn(),
        deliver: vi.fn(),
        renderAlert: vi.fn(),
        logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
        env: { E2E_USER_IDS: ["e2e_user"] as string[], APP_PUBLIC_URL: "https://app.test/" },
        leanOf,
    }
})

vi.mock("../config/env.js", () => ({ env: mocks.env }))
vi.mock("../lib/logger.js", () => ({ createLogger: () => mocks.logger }))
vi.mock("../lib/feedback/mailer.js", () => ({ deliverFeedbackEmail: mocks.deliver }))
vi.mock("@visual-ai/email", () => ({
    renderFeedbackAlert: mocks.renderAlert,
    feedbackAlertSubject: () => "ALERT SUBJECT",
}))
vi.mock("../models/user.js", () => ({
    UserModel: {
        findOne: (...args: unknown[]) => {
            mocks.userFindOne(...args)
            return mocks.leanOf(mocks.userLean)
        },
        updateOne: mocks.userUpdateOne,
        findOneAndUpdate: mocks.userFindOneAndUpdate,
    },
}))
vi.mock("../models/feedback.js", () => ({
    FeedbackModel: { create: mocks.feedbackCreate },
}))

const service = await import("./feedback-service.js")
const { FeatureType } = await import("../types/index.js")

const NOW = new Date("2026-06-15T12:00:00.000Z")
const OLD = new Date("2026-01-01T00:00:00.000Z")

beforeEach(() => {
    vi.clearAllMocks()
    mocks.renderAlert.mockResolvedValue({ html: "<p>a</p>", text: "a" })
    mocks.deliver.mockResolvedValue("logged")
    mocks.userUpdateOne.mockResolvedValue({})
})

describe("recordSuccessfulGeneration", () => {
    it("increments the counter for image generations", async () => {
        await service.recordSuccessfulGeneration("u1", FeatureType.IMAGE)
        expect(mocks.userUpdateOne).toHaveBeenCalledWith(
            { userId: "u1" },
            { $inc: { "feedback.successfulGenerations": 1 } },
        )
    })

    it("ignores upscale and other transforms", async () => {
        await service.recordSuccessfulGeneration("u1", FeatureType.UPSCALE)
        await service.recordSuccessfulGeneration("u1", FeatureType.REMOVE_BG)
        expect(mocks.userUpdateOne).not.toHaveBeenCalled()
    })

    it("logs and swallows a database failure", async () => {
        mocks.userUpdateOne.mockRejectedValue(new Error("db down"))
        await expect(
            service.recordSuccessfulGeneration("u1", FeatureType.IMAGE),
        ).resolves.toBeUndefined()
        expect(mocks.logger.error).toHaveBeenCalled()
    })
})

describe("claimFeedbackPrompt", () => {
    const eligibleUser = {
        createdAt: OLD,
        feedback: { successfulGenerations: FEEDBACK_GENERATION_THRESHOLD, lastPromptedAt: null },
    }

    it("claims atomically with a compare-and-set on lastPromptedAt", async () => {
        mocks.userLean.mockResolvedValue(eligibleUser)
        mocks.userFindOneAndUpdate.mockResolvedValue({ _id: "x" })

        await expect(service.claimFeedbackPrompt("u1", "generation", NOW)).resolves.toBe(true)
        expect(mocks.userFindOneAndUpdate).toHaveBeenCalledWith(
            { userId: "u1", "feedback.lastPromptedAt": null },
            { $set: { "feedback.lastPromptedAt": NOW } },
            expect.any(Object),
        )
    })

    it("loses the race when another tab already claimed", async () => {
        mocks.userLean.mockResolvedValue(eligibleUser)
        mocks.userFindOneAndUpdate.mockResolvedValue(null)
        await expect(service.claimFeedbackPrompt("u1", "generation", NOW)).resolves.toBe(false)
    })

    it("does not claim in the first session", async () => {
        mocks.userLean.mockResolvedValue({ ...eligibleUser, createdAt: NOW })
        await expect(service.claimFeedbackPrompt("u1", "generation", NOW)).resolves.toBe(false)
        expect(mocks.userFindOneAndUpdate).not.toHaveBeenCalled()
    })

    it("does not claim below the threshold but does for downloads", async () => {
        const few = { createdAt: OLD, feedback: { successfulGenerations: 0, lastPromptedAt: null } }
        mocks.userLean.mockResolvedValue(few)
        await expect(service.claimFeedbackPrompt("u1", "generation", NOW)).resolves.toBe(false)

        mocks.userFindOneAndUpdate.mockResolvedValue({ _id: "x" })
        await expect(service.claimFeedbackPrompt("u1", "download", NOW)).resolves.toBe(true)
    })

    it("does not claim during the cooldown", async () => {
        mocks.userLean.mockResolvedValue({
            createdAt: OLD,
            feedback: {
                successfulGenerations: 10,
                lastPromptedAt: new Date(NOW.getTime() - 24 * 60 * 60 * 1000),
            },
        })
        await expect(service.claimFeedbackPrompt("u1", "generation", NOW)).resolves.toBe(false)
        expect(mocks.userFindOneAndUpdate).not.toHaveBeenCalled()
    })

    it("treats an unknown user as not eligible", async () => {
        mocks.userLean.mockResolvedValue(null)
        await expect(service.claimFeedbackPrompt("ghost", "download", NOW)).resolves.toBe(false)
    })
})

describe("shouldAlert", () => {
    it("alerts on low ratings and bugs only", () => {
        expect(service.shouldAlert({ type: "rating", rating: 2 })).toBe(true)
        expect(service.shouldAlert({ type: "rating", rating: 3 })).toBe(false)
        expect(service.shouldAlert({ type: "bug" })).toBe(true)
        expect(service.shouldAlert({ type: "idea" })).toBe(false)
    })
})

describe("submitFeedback", () => {
    const created = (overrides: object = {}) => ({
        _id: "507f1f77bcf86cd799439011",
        toObject: () => ({
            userId: "u1",
            email: "u@example.com",
            source: "popup",
            type: "rating",
            rating: 1,
            message: "bad",
            context: { route: "/create" },
            ...overrides,
        }),
    })

    it("takes the email from the user record and alerts on a low rating", async () => {
        mocks.userLean.mockResolvedValue({ email: "u@example.com" })
        mocks.feedbackCreate.mockResolvedValue(created())

        const id = await service.submitFeedback("u1", { source: "popup", rating: 1 })

        expect(id).toBe("507f1f77bcf86cd799439011")
        expect(mocks.feedbackCreate).toHaveBeenCalledWith(
            expect.objectContaining({ userId: "u1", email: "u@example.com", type: "rating" }),
        )
        expect(mocks.deliver).toHaveBeenCalledWith(
            expect.objectContaining({ subject: "ALERT SUBJECT", label: "alert" }),
        )
    })

    it("does not alert for a high rating", async () => {
        mocks.userLean.mockResolvedValue({ email: "u@example.com" })
        mocks.feedbackCreate.mockResolvedValue(created({ rating: 5 }))
        await service.submitFeedback("u1", { source: "popup", rating: 5 })
        expect(mocks.deliver).not.toHaveBeenCalled()
    })

    it("never alerts for e2e users", async () => {
        mocks.userLean.mockResolvedValue({ email: "e@example.com" })
        mocks.feedbackCreate.mockResolvedValue(created({ userId: "e2e_user", type: "bug" }))
        await service.submitFeedback("e2e_user", { source: "menu", type: "bug", message: "x" })
        expect(mocks.deliver).not.toHaveBeenCalled()
    })

    it("logs and swallows a mail failure so the request still succeeds", async () => {
        mocks.userLean.mockResolvedValue({ email: "u@example.com" })
        mocks.feedbackCreate.mockResolvedValue(created())
        mocks.deliver.mockRejectedValue(new Error("resend down"))

        await expect(service.submitFeedback("u1", { source: "popup", rating: 1 })).resolves.toBe(
            "507f1f77bcf86cd799439011",
        )
        expect(mocks.logger.error).toHaveBeenCalled()
    })

    it("stores menu feedback without testimonial consent", async () => {
        mocks.userLean.mockResolvedValue({ email: "u@example.com" })
        mocks.feedbackCreate.mockResolvedValue(created({ type: "idea", rating: undefined }))
        await service.submitFeedback("u1", { source: "menu", type: "idea", message: "more" })
        expect(mocks.feedbackCreate).toHaveBeenCalledWith(
            expect.objectContaining({ type: "idea", testimonialConsent: false, message: "more" }),
        )
    })

    it("stores consent and display name for a high rating", async () => {
        mocks.userLean.mockResolvedValue({ email: "u@example.com" })
        mocks.feedbackCreate.mockResolvedValue(created({ rating: 4 }))
        await service.submitFeedback("u1", {
            source: "popup",
            rating: FEEDBACK_HIGH_RATING_MIN,
            testimonialConsent: true,
            displayName: "Ada",
        })
        expect(mocks.feedbackCreate).toHaveBeenCalledWith(
            expect.objectContaining({ testimonialConsent: true, displayName: "Ada" }),
        )
    })

    it("drops consent and display name below the high-rating minimum", async () => {
        mocks.userLean.mockResolvedValue({ email: "u@example.com" })
        mocks.feedbackCreate.mockResolvedValue(created())
        await service.submitFeedback("u1", {
            source: "popup",
            rating: FEEDBACK_HIGH_RATING_MIN - 1,
            testimonialConsent: true,
            displayName: "Ada",
        })
        const stored = mocks.feedbackCreate.mock.calls[0][0]
        expect(stored.testimonialConsent).toBe(false)
        expect(stored).not.toHaveProperty("displayName")
    })

    it("shows the plan from the user record, not the client context", async () => {
        mocks.userLean.mockResolvedValue({ email: "u@example.com", plan: "free" })
        mocks.feedbackCreate.mockResolvedValue(created({ context: { plan: "pro" } }))
        await service.submitFeedback("u1", { source: "popup", rating: 1 })
        expect(mocks.renderAlert).toHaveBeenCalledWith(expect.objectContaining({ plan: "free" }))
    })

    it("omits the plan from the alert when the user record has none", async () => {
        mocks.userLean.mockResolvedValue({ email: "u@example.com" })
        mocks.feedbackCreate.mockResolvedValue(created({ context: { plan: "pro" } }))
        await service.submitFeedback("u1", { source: "popup", rating: 1 })
        expect(mocks.renderAlert.mock.calls[0][0]).not.toHaveProperty("plan")
    })

    it("rejects an unknown user", async () => {
        mocks.userLean.mockResolvedValue(null)
        await expect(
            service.submitFeedback("ghost", { source: "popup", rating: 5 }),
        ).rejects.toThrow("User not found")
    })
})

describe("feedbackAdminUrl", () => {
    it("joins the public url without a double slash", () => {
        expect(service.feedbackAdminUrl()).toBe("https://app.test/admin/feedback")
    })
})
