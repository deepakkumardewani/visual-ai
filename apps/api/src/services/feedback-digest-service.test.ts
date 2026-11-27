import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
    find: vi.fn(),
    deliver: vi.fn(),
    render: vi.fn(),
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
}))
vi.mock("../lib/feedback/mailer.js", () => ({ deliverFeedbackEmail: mocks.deliver }))
vi.mock("@visual-ai/email", () => ({
    renderFeedbackDigest: mocks.render,
    feedbackDigestSubject: () => "DIGEST SUBJECT",
}))
vi.mock("../models/feedback.js", () => ({
    FeedbackModel: {
        find: (...args: unknown[]) => {
            mocks.find(...args)
            const chain = { sort: () => chain, select: () => chain, lean: async () => [] }
            return chain
        },
    },
}))
vi.mock("./feedback-service.js", () => ({
    feedbackAdminUrl: () => "https://app.test/admin/feedback",
}))

const { sendFeedbackDigest } = await import("./feedback-digest-service.js")

beforeEach(() => {
    vi.clearAllMocks()
    mocks.render.mockResolvedValue({ html: "<p>d</p>", text: "d" })
    mocks.deliver.mockResolvedValue("logged")
})

describe("sendFeedbackDigest", () => {
    it("queries both windows and delivers the rendered digest", async () => {
        const now = new Date("2026-06-15T09:00:00.000Z")
        await expect(sendFeedbackDigest({ now })).resolves.toBe("logged")

        expect(mocks.find).toHaveBeenCalledTimes(2)
        expect(mocks.deliver).toHaveBeenCalledWith(
            { label: "digest", subject: "DIGEST SUBJECT", html: "<p>d</p>", text: "d" },
            { forceLog: false },
        )
    })

    it("forces log behaviour on a dry run", async () => {
        await sendFeedbackDigest({ dryRun: true })
        expect(mocks.deliver).toHaveBeenCalledWith(expect.anything(), { forceLog: true })
    })
})
