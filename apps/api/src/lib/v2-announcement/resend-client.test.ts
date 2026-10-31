import { beforeEach, describe, expect, it, vi } from "vitest"

const { batchSend, emailsSend, ResendMock } = vi.hoisted(() => {
    const batchSend = vi.fn()
    const emailsSend = vi.fn()
    const ResendMock = vi.fn(function (this: unknown) {
        Object.assign(this as object, {
            batch: { send: batchSend },
            emails: { send: emailsSend },
        })
    })
    return { batchSend, emailsSend, ResendMock }
})

vi.mock("resend", () => ({ Resend: ResendMock }))

import { SendError } from "./batching.js"
import {
    ANNOUNCEMENT_SUBJECT,
    buildMessage,
    createBatchSender,
    sendTestMessage,
    type SenderConfig,
} from "./resend-client.js"

const config = (overrides: Partial<SenderConfig> = {}): SenderConfig => ({
    apiKey: "re_key",
    from: "Visual AI <hi@example.com>",
    unsubscribeUrlFor: (r) => `https://api.example.com/unsub?u=${r.userId}`,
    render: vi.fn(async ({ firstName, unsubscribeUrl }) => ({
        html: `<p>${firstName || "Hi there"} ${unsubscribeUrl}</p>`,
        text: `text ${firstName}`,
    })),
    ...overrides,
})

const ann = { userId: "u1", email: "ann@example.com", firstName: "Ann" }
const bob = { userId: "u2", email: "bob@example.com", firstName: "" }

beforeEach(() => {
    batchSend.mockReset()
    emailsSend.mockReset()
    ResendMock.mockClear()
})

describe("buildMessage", () => {
    it("builds a message with unsubscribe headers and rendered bodies", async () => {
        const message = await buildMessage(ann, config())

        expect(message).toEqual({
            from: "Visual AI <hi@example.com>",
            to: "ann@example.com",
            subject: ANNOUNCEMENT_SUBJECT,
            html: "<p>Ann https://api.example.com/unsub?u=u1</p>",
            text: "text Ann",
            headers: {
                "List-Unsubscribe": "<https://api.example.com/unsub?u=u1>",
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
        })
    })

    it("includes replyTo only when configured", async () => {
        const withReply = await buildMessage(ann, config({ replyTo: "support@example.com" }))
        const without = await buildMessage(ann, config())

        expect(withReply.replyTo).toBe("support@example.com")
        expect("replyTo" in without).toBe(false)
    })

    it("accepts a custom subject", async () => {
        expect((await buildMessage(ann, config(), "Custom")).subject).toBe("Custom")
    })
})

describe("createBatchSender", () => {
    it("sends all messages with the idempotency key and returns ids in order", async () => {
        batchSend.mockResolvedValue({
            data: { data: [{ id: "r1" }, { id: "r2" }] },
            error: null,
        })
        const send = createBatchSender(config())

        const ids = await send([ann, bob], "key-1")

        expect(ResendMock).toHaveBeenCalledWith("re_key")
        expect(ids).toEqual(["r1", "r2"])
        const [messages, options] = batchSend.mock.calls[0]!
        expect(messages.map((m: { to: string }) => m.to)).toEqual([
            "ann@example.com",
            "bob@example.com",
        ])
        expect(options).toEqual({ idempotencyKey: "key-1" })
    })

    it("returns no ids when the response has no data", async () => {
        batchSend.mockResolvedValue({ data: null, error: null })
        await expect(createBatchSender(config())([ann], "k")).resolves.toEqual([])
    })

    it("throws a SendError carrying the status code on API error", async () => {
        batchSend.mockResolvedValue({
            data: null,
            error: { message: "rate", statusCode: 429 },
        })

        const failure = await createBatchSender(config())([ann], "k").catch((e: unknown) => e)

        expect(failure).toBeInstanceOf(SendError)
        expect(failure).toMatchObject({ message: "rate", statusCode: 429 })
    })

    it("leaves statusCode undefined when the API error has none", async () => {
        batchSend.mockResolvedValue({
            data: null,
            error: { message: "x", statusCode: null },
        })

        const failure = await createBatchSender(config())([ann], "k").catch((e: unknown) => e)

        expect((failure as SendError).statusCode).toBeUndefined()
    })
})

describe("sendTestMessage", () => {
    it("sends one message to the address with an empty name and returns the id", async () => {
        emailsSend.mockResolvedValue({ data: { id: "t1" }, error: null })

        const id = await sendTestMessage(config(), "me@example.com")

        expect(id).toBe("t1")
        expect(emailsSend).toHaveBeenCalledWith(
            expect.objectContaining({
                to: "me@example.com",
                subject: ANNOUNCEMENT_SUBJECT,
            }),
        )
        expect(emailsSend.mock.calls[0]![0].html).toContain("Hi there")
    })

    it("throws a SendError with status on API error", async () => {
        emailsSend.mockResolvedValue({
            data: null,
            error: { message: "nope", statusCode: 500 },
        })

        await expect(sendTestMessage(config(), "me@example.com")).rejects.toMatchObject({
            name: "SendError",
            message: "nope",
            statusCode: 500,
        })
    })

    it("throws 'no response' when there is neither data nor error", async () => {
        emailsSend.mockResolvedValue({ data: null, error: null })

        await expect(sendTestMessage(config(), "me@example.com")).rejects.toMatchObject({
            message: "no response",
            statusCode: undefined,
        })
    })

    it("falls back to undefined status when the error has a null status", async () => {
        emailsSend.mockResolvedValue({
            data: null,
            error: { message: "e", statusCode: null },
        })

        await expect(sendTestMessage(config(), "me@example.com")).rejects.toMatchObject({
            statusCode: undefined,
        })
    })
})
