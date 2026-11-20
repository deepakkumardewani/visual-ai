import { beforeEach, describe, expect, it, vi } from "vitest"

const { findMock } = vi.hoisted(() => ({ findMock: vi.fn() }))

vi.mock("../../models/user.js", () => ({ UserModel: { find: findMock } }))

import {
    groupPendingBatches,
    isDeliverableEmail,
    loadEligibleRecipients,
    loadPendingBatches,
    selectRecipients,
    type UserCandidate,
} from "./recipients.js"

const user = (overrides: Partial<UserCandidate> = {}): UserCandidate => ({
    userId: "u1",
    email: "a@example.com",
    firstName: "Ann",
    ...overrides,
})

const pending = (userId: string, key: string, extra: Partial<UserCandidate> = {}) =>
    user({
        userId,
        email: `${userId}@x.com`,
        announcements: { v2: { pendingKey: key } },
        ...extra,
    })

describe("isDeliverableEmail", () => {
    it.each(["a@b.co", "  a@b.co  ", "first.last+tag@sub.example.org"])("accepts %j", (email) => {
        expect(isDeliverableEmail(email)).toBe(true)
    })

    it.each([undefined, null, "", "   ", "no-at.com", "a@b", "a b@c.com", "@b.com"])(
        "rejects %j",
        (email) => {
            expect(isDeliverableEmail(email)).toBe(false)
        },
    )
})

describe("selectRecipients", () => {
    it("returns an empty list for no users", () => {
        expect(selectRecipients([])).toEqual([])
    })

    it("maps an eligible user to a recipient", () => {
        expect(selectRecipients([user()])).toEqual([
            { userId: "u1", email: "a@example.com", firstName: "Ann" },
        ])
    })

    it("skips opted-out users", () => {
        expect(selectRecipients([user({ emailOptOut: true })])).toEqual([])
    })

    it("skips users already sent the announcement", () => {
        const sent = user({
            announcements: { v2: { sentAt: new Date("2026-01-01") } },
        })
        expect(selectRecipients([sent])).toEqual([])
    })

    it("keeps users whose announcement record has no sentAt", () => {
        expect(selectRecipients([user({ announcements: { v2: { sentAt: null } } })])).toHaveLength(
            1,
        )
        expect(selectRecipients([user({ announcements: { v2: null } })])).toHaveLength(1)
        expect(selectRecipients([user({ announcements: null })])).toHaveLength(1)
    })

    it("skips invalid or missing emails", () => {
        const users = [user({ email: "bad" }), user({ email: null }), user({ email: undefined })]
        expect(selectRecipients(users)).toEqual([])
    })

    it("dedupes emails case-insensitively keeping the first user", () => {
        const result = selectRecipients([
            user({ userId: "first", email: "Dup@Example.com" }),
            user({ userId: "second", email: " dup@example.com " }),
        ])
        expect(result).toEqual([{ userId: "first", email: "Dup@Example.com", firstName: "Ann" }])
    })

    it("does not select a second account sharing an already-mailed address", () => {
        const result = selectRecipients([
            user({
                userId: "mailed",
                email: "shared@example.com",
                announcements: { v2: { sentAt: new Date("2026-01-01") } },
            }),
            user({ userId: "second", email: "Shared@Example.com" }),
            user({ userId: "other", email: "other@example.com" }),
        ])
        expect(result.map((r) => r.userId)).toEqual(["other"])
    })

    it("does not select a second account sharing an opted-out address", () => {
        const result = selectRecipients([
            user({
                userId: "optout",
                email: "shared@example.com",
                emailOptOut: true,
            }),
            user({ userId: "second", email: "shared@example.com" }),
        ])
        expect(result).toEqual([])
    })

    it("excludes pending (reserved) users and their shared addresses", () => {
        const result = selectRecipients([
            user({
                userId: "pending",
                email: "p@example.com",
                announcements: { v2: { pendingKey: "k" } },
            }),
            user({ userId: "twin", email: "P@example.com" }),
            user({ userId: "ok", email: "ok@example.com" }),
        ])
        expect(result.map((r) => r.userId)).toEqual(["ok"])
    })

    it("lets a later sent account block an earlier unsent one sharing the address", () => {
        const result = selectRecipients([
            user({ userId: "a-unsent", email: "s@example.com" }),
            user({
                userId: "z-sent",
                email: "s@example.com",
                announcements: { v2: { sentAt: new Date() } },
            }),
        ])
        expect(result).toEqual([])
    })

    it("uses an empty first name when absent or blank", () => {
        const result = selectRecipients([
            user({ userId: "a", email: "a@x.com", firstName: null }),
            user({ userId: "b", email: "b@x.com", firstName: "   " }),
            user({ userId: "c", email: "c@x.com", firstName: undefined }),
        ])
        expect(result.map((r) => r.firstName)).toEqual(["", "", ""])
    })

    it("trims names and emails", () => {
        const [recipient] = selectRecipients([user({ email: " a@x.com ", firstName: " Bo " })])
        expect(recipient).toEqual({
            userId: "u1",
            email: "a@x.com",
            firstName: "Bo",
        })
    })
})

describe("loadEligibleRecipients", () => {
    beforeEach(() => findMock.mockReset())

    it("queries eligible users in _id order and applies the pure filter", async () => {
        const lean = vi
            .fn()
            .mockResolvedValue([
                user({ userId: "u1", email: "a@x.com" }),
                user({ userId: "u2", email: "a@x.com" }),
                user({ userId: "u3", email: "c@x.com", emailOptOut: true }),
            ])
        const sort = vi.fn().mockReturnValue({ lean })
        const select = vi.fn().mockReturnValue({ sort })
        findMock.mockReturnValue({ select })

        const result = await loadEligibleRecipients()

        expect(findMock).toHaveBeenCalledWith({ email: { $nin: ["", null] } })
        expect(sort).toHaveBeenCalledWith({ _id: 1 })
        expect(result).toEqual([{ userId: "u1", email: "a@x.com", firstName: "Ann" }])
    })
})

describe("groupPendingBatches", () => {
    it("groups reserved users by key, keeping opted-out members for an exact replay", () => {
        const batches = groupPendingBatches([
            pending("a", "k1"),
            pending("b", "k2"),
            pending("c", "k1", { emailOptOut: true }),
        ])
        expect(batches.map((b) => [b.key, b.items.map((r) => r.userId)])).toEqual([
            ["k1", ["a", "c"]],
            ["k2", ["b"]],
        ])
    })

    it("ignores users without a key, already sent, or without a deliverable email", () => {
        const batches = groupPendingBatches([
            user({ userId: "none" }),
            pending("sent", "k", {
                announcements: { v2: { pendingKey: "k", sentAt: new Date() } },
            }),
            pending("bad", "k", { email: "bad" }),
        ])
        expect(batches).toEqual([])
    })
})

describe("groupPendingBatches reservation time", () => {
    const at = (iso: string) => new Date(iso)
    const reserved = (id: string, pendingAt?: Date) =>
        pending(id, "k", {
            announcements: { v2: { pendingKey: "k", ...(pendingAt && { pendingAt }) } },
        })

    it("uses the oldest member reservation time", () => {
        const [batch] = groupPendingBatches([
            reserved("a", at("2026-01-02T00:00:00Z")),
            reserved("b", at("2026-01-01T00:00:00Z")),
        ])
        expect(batch?.reservedAt).toEqual(at("2026-01-01T00:00:00Z"))
    })

    it("leaves the time unknown when any member lacks one", () => {
        const [batch] = groupPendingBatches([
            reserved("a", at("2026-01-01T00:00:00Z")),
            reserved("b"),
        ])
        expect(batch?.reservedAt).toBeUndefined()
    })
})

describe("loadPendingBatches", () => {
    it("queries users holding a pending key in _id order", async () => {
        const lean = vi.fn().mockResolvedValue([pending("a", "k1")])
        const sort = vi.fn().mockReturnValue({ lean })
        const select = vi.fn().mockReturnValue({ sort })
        findMock.mockReset()
        findMock.mockReturnValue({ select })

        const result = await loadPendingBatches()

        expect(findMock).toHaveBeenCalledWith({
            "announcements.v2.pendingKey": { $exists: true, $ne: null },
        })
        expect(sort).toHaveBeenCalledWith({ _id: 1 })
        expect(result).toEqual([
            {
                key: "k1",
                items: [{ userId: "a", email: "a@x.com", firstName: "Ann" }],
            },
        ])
    })
})
