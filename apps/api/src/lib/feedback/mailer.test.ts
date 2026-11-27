import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
    send: vi.fn(),
    ResendCtor: vi.fn(),
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
    env: {
        NODE_ENV: "development",
        FEEDBACK_NOTIFY_EMAIL: "owner@example.com" as string | undefined,
        FEEDBACK_EMAIL_MODE: "log" as "log" | "send",
        RESEND_API_KEY: "re_test" as string | undefined,
        MAIL_FROM: "Visual AI <hi@example.com>" as string | undefined,
        EMAIL_REPLY_TO: undefined as string | undefined,
    },
}))

vi.mock("resend", () => ({
    Resend: vi.fn(function (this: unknown) {
        mocks.ResendCtor()
        Object.assign(this as object, { emails: { send: mocks.send } })
    }),
}))
vi.mock("node:fs/promises", () => ({ mkdir: mocks.mkdir, writeFile: mocks.writeFile }))
vi.mock("../logger.js", () => ({ createLogger: () => mocks.logger }))
vi.mock("../../config/env.js", () => ({ env: mocks.env }))

const { deliverFeedbackEmail, FeedbackMailError } = await import("./mailer.js")

const email = { label: "alert", subject: "Subject", html: "<p>hi</p>", text: "hi" }

beforeEach(() => {
    vi.clearAllMocks()
    mocks.env.NODE_ENV = "development"
    mocks.env.FEEDBACK_NOTIFY_EMAIL = "owner@example.com"
    mocks.env.FEEDBACK_EMAIL_MODE = "log"
    mocks.env.RESEND_API_KEY = "re_test"
    mocks.env.MAIL_FROM = "Visual AI <hi@example.com>"
    mocks.send.mockResolvedValue({ data: { id: "1" }, error: null })
    mocks.mkdir.mockResolvedValue(undefined)
    mocks.writeFile.mockResolvedValue(undefined)
})

describe("deliverFeedbackEmail", () => {
    it("log mode never touches Resend and writes the HTML preview", async () => {
        const outcome = await deliverFeedbackEmail(email)

        expect(outcome).toBe("logged")
        expect(mocks.ResendCtor).not.toHaveBeenCalled()
        expect(mocks.send).not.toHaveBeenCalled()
        expect(mocks.writeFile).toHaveBeenCalledWith(
            expect.stringContaining("feedback-emails"),
            "<p>hi</p>",
            "utf8",
        )
        expect(mocks.logger.info).toHaveBeenCalledWith(
            { to: "owner@example.com", subject: "Subject" },
            expect.stringContaining("log mode"),
        )
    })

    it("does not write a preview file in production", async () => {
        mocks.env.NODE_ENV = "production"
        await deliverFeedbackEmail(email)
        expect(mocks.writeFile).not.toHaveBeenCalled()
        expect(mocks.send).not.toHaveBeenCalled()
    })

    it("logs a warning, not an error, when the preview cannot be written", async () => {
        mocks.writeFile.mockRejectedValue(new Error("disk full"))
        await expect(deliverFeedbackEmail(email)).resolves.toBe("logged")
        expect(mocks.logger.warn).toHaveBeenCalled()
    })

    it("skips when FEEDBACK_NOTIFY_EMAIL is unset, even in send mode", async () => {
        mocks.env.FEEDBACK_NOTIFY_EMAIL = undefined
        mocks.env.FEEDBACK_EMAIL_MODE = "send"
        await expect(deliverFeedbackEmail(email)).resolves.toBe("skipped")
        expect(mocks.send).not.toHaveBeenCalled()
    })

    it("forceLog overrides send mode", async () => {
        mocks.env.FEEDBACK_EMAIL_MODE = "send"
        await expect(deliverFeedbackEmail(email, { forceLog: true })).resolves.toBe("logged")
        expect(mocks.send).not.toHaveBeenCalled()
    })

    it("never sends under NODE_ENV=test even when mode is send", async () => {
        mocks.env.NODE_ENV = "test"
        mocks.env.FEEDBACK_EMAIL_MODE = "send"
        await expect(deliverFeedbackEmail(email)).resolves.toBe("logged")
        expect(mocks.ResendCtor).not.toHaveBeenCalled()
        expect(mocks.send).not.toHaveBeenCalled()
    })

    it("send mode calls Resend with the recipient", async () => {
        mocks.env.FEEDBACK_EMAIL_MODE = "send"
        await expect(deliverFeedbackEmail(email)).resolves.toBe("sent")
        expect(mocks.send).toHaveBeenCalledWith(
            expect.objectContaining({ to: "owner@example.com", subject: "Subject" }),
        )
    })

    it("send mode throws FeedbackMailError on a Resend error or missing config", async () => {
        mocks.env.FEEDBACK_EMAIL_MODE = "send"
        mocks.send.mockResolvedValue({ data: null, error: { message: "rejected" } })
        await expect(deliverFeedbackEmail(email)).rejects.toBeInstanceOf(FeedbackMailError)

        mocks.env.RESEND_API_KEY = undefined
        await expect(deliverFeedbackEmail(email)).rejects.toThrow("RESEND_API_KEY")
    })
})
