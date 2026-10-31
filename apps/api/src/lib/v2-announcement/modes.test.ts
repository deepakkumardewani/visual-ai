import { describe, expect, it, vi } from "vitest"

import { DEFAULT_DAILY_CAP, PENDING_REPLAY_RETENTION_MS, SendError } from "./batching.js"
import {
    assertRealSendAllowed,
    CliError,
    parseCli,
    PLACEHOLDERS,
    pickRunRecipients,
    runCli,
    USAGE,
    type CliOptions,
    type RunDeps,
} from "./modes.js"
import type { Recipient } from "./recipients.js"

const FULL_ENV = {
    MAIL_FROM: "Visual AI <hi@example.com>",
    MAIL_POSTAL_ADDRESS: "1 Main St",
    RESEND_API_KEY: "re_key",
    UNSUBSCRIBE_SECRET: "secret",
    API_PUBLIC_URL: "https://api.example.com",
}

const recipients = (n: number): Recipient[] =>
    Array.from({ length: n }, (_, i) => ({
        userId: `u${i}`,
        email: `u${i}@example.com`,
        firstName: i === 0 ? "" : `Name${i}`,
    }))

function makeDeps(eligible: Recipient[], overrides: Partial<RunDeps> = {}) {
    const logs: string[] = []
    const deps = {
        loadRecipients: vi.fn(async () => eligible),
        loadPendingBatches: vi.fn(async () => []),
        reserveBatch: vi.fn(async () => undefined),
        renderFor: vi.fn(async () => ({ html: "<p>hi</p>", text: "hi" })),
        writePreview: vi.fn(async () => "/tmp/preview.html"),
        sendBatch: vi.fn(async (batch: Recipient[], _key: string) =>
            batch.map((r) => `id-${r.userId}`),
        ),
        sendTest: vi.fn(async () => "test-id"),
        markBatchSent: vi.fn(async () => undefined),
        env: FULL_ENV as Record<string, string | undefined>,
        log: (line: string) => void logs.push(line),
        ...overrides,
    } satisfies RunDeps
    return { deps, logs }
}

describe("parseCli", () => {
    it("parses --dry-run with defaults", () => {
        expect(parseCli(["--dry-run"])).toEqual({
            mode: { kind: "dry-run" },
            dailyCap: DEFAULT_DAILY_CAP,
        })
    })

    it("parses --test-to with its value", () => {
        expect(parseCli(["--test-to", "me@example.com"]).mode).toEqual({
            kind: "test",
            to: "me@example.com",
        })
    })

    it("parses --confirm with --limit and --daily-cap", () => {
        expect(parseCli(["--confirm", "--limit", "5", "--daily-cap", "50"])).toEqual({
            mode: { kind: "send" },
            dailyCap: 50,
            limit: 5,
        })
    })

    it("accepts the cap boundary of 100", () => {
        expect(parseCli(["--confirm", "--daily-cap", "100"]).dailyCap).toBe(100)
    })

    it("rejects a daily cap above 100", () => {
        expect(() => parseCli(["--confirm", "--daily-cap", "101"])).toThrow(
            "--daily-cap may not exceed 100",
        )
    })

    it.each(["0", "-3", "1.5", "abc"])("rejects invalid --limit %s", (value) => {
        expect(() => parseCli(["--confirm", "--limit", value])).toThrow(CliError)
    })

    it.each([
        [["--confirm", "--limit"], "--limit requires a value"],
        [["--confirm", "--limit", "--dry-run"], "--limit requires a value"],
        [["--test-to"], "--test-to requires a value"],
        [["--confirm", "--daily-cap"], "--daily-cap requires a value"],
    ])("rejects missing flag value %j", (argv, message) => {
        expect(() => parseCli(argv)).toThrow(message)
    })

    it("rejects unknown arguments", () => {
        expect(() => parseCli(["--dry-run", "--bogus"])).toThrow('Unknown argument "--bogus"')
    })

    it.each([[[]], [["--dry-run", "--confirm"]], [["--test-to", "a@b.co", "--confirm"]]])(
        "requires exactly one mode, got %j",
        (argv) => {
            expect(() => parseCli(argv)).toThrow("Choose exactly one of")
        },
    )
})

describe("assertRealSendAllowed", () => {
    it("passes with the full env", () => {
        expect(() => assertRealSendAllowed(FULL_ENV)).not.toThrow()
    })

    it("lists every missing or blank variable", () => {
        expect(() =>
            assertRealSendAllowed({
                ...FULL_ENV,
                MAIL_FROM: "  ",
                RESEND_API_KEY: undefined,
            }),
        ).toThrow("Refusing to send: missing env MAIL_FROM, RESEND_API_KEY")
    })
})

describe("pickRunRecipients", () => {
    const options = (overrides: Partial<CliOptions> = {}): CliOptions => ({
        mode: { kind: "send" },
        dailyCap: 100,
        ...overrides,
    })

    it("caps at the daily cap when no limit is given", () => {
        expect(pickRunRecipients(recipients(150), options())).toHaveLength(100)
    })

    it("applies --limit when stricter than the cap", () => {
        expect(pickRunRecipients(recipients(150), options({ limit: 7 }))).toHaveLength(7)
    })

    it("never exceeds the cap even when the limit is larger", () => {
        expect(
            pickRunRecipients(recipients(150), options({ limit: 500, dailyCap: 20 })),
        ).toHaveLength(20)
    })

    it("returns everyone when fewer are eligible", () => {
        expect(pickRunRecipients(recipients(3), options())).toHaveLength(3)
    })
})

describe("runCli dry-run", () => {
    it("reports counts and samples, writes a preview, and sends nothing", async () => {
        const { deps, logs } = makeDeps(recipients(150))

        const code = await runCli(["--dry-run"], deps)

        expect(code).toBe(0)
        expect(logs[0]).toBe("DRY RUN: 150 eligible recipients, 100 would be sent this run")
        expect(logs.filter((l) => l.startsWith("  sample:"))).toEqual([
            "  sample: u0@example.com (Hi there)",
            "  sample: u1@example.com (Name1)",
            "  sample: u2@example.com (Name2)",
        ])
        expect(logs).toContain("Preview HTML: /tmp/preview.html")
        expect(deps.writePreview).toHaveBeenCalledWith("<p>hi</p>")
        expect(deps.sendBatch).not.toHaveBeenCalled()
        expect(deps.sendTest).not.toHaveBeenCalled()
        expect(deps.markBatchSent).not.toHaveBeenCalled()
    })

    it("renders a placeholder sample when nobody is eligible", async () => {
        const { deps, logs } = makeDeps([])

        const code = await runCli(["--dry-run"], deps)

        expect(code).toBe(0)
        expect(deps.renderFor).toHaveBeenCalledWith({
            userId: "sample",
            email: "sample@example.com",
            firstName: "",
        })
        expect(logs[0]).toBe("DRY RUN: 0 eligible recipients, 0 would be sent this run")
    })

    it("does not require the real-send env", async () => {
        const { deps } = makeDeps(recipients(1), { env: {} })
        await expect(runCli(["--dry-run"], deps)).resolves.toBe(0)
    })
})

describe("runCli test mode", () => {
    it("sends one test message and marks nobody", async () => {
        const { deps, logs } = makeDeps(recipients(5))

        const code = await runCli(["--test-to", "me@example.com"], deps)

        expect(code).toBe(0)
        expect(deps.sendTest).toHaveBeenCalledWith("me@example.com")
        expect(logs).toEqual([
            "Test message sent to me@example.com (resend id test-id); no user was marked",
        ])
        expect(deps.markBatchSent).not.toHaveBeenCalled()
        expect(deps.sendBatch).not.toHaveBeenCalled()
    })
})

describe("runCli send mode", () => {
    it("refuses without all required env, sending nothing (exit 2)", async () => {
        const { deps, logs } = makeDeps(recipients(2), {
            env: { ...FULL_ENV, RESEND_API_KEY: "" },
        })

        const code = await runCli(["--confirm"], deps)

        expect(code).toBe(2)
        expect(logs[0]).toContain("Refusing to send: missing env RESEND_API_KEY")
        expect(logs[0]).toContain(USAGE)
        expect(deps.loadRecipients).not.toHaveBeenCalled()
        expect(deps.sendBatch).not.toHaveBeenCalled()
    })

    it("sends to eligible recipients, marks each, and exits 0", async () => {
        const { deps, logs } = makeDeps(recipients(3))

        const code = await runCli(["--confirm"], deps)

        expect(code).toBe(0)
        expect(logs[0]).toBe(
            "SEND SUMMARY: 3 of 3 eligible recipients (cap 100, from Visual AI <hi@example.com>)",
        )
        expect(logs).toContain("Sent 3, failed 0, remaining 0")
        expect(deps.markBatchSent).toHaveBeenCalledOnce()
        expect(deps.markBatchSent).toHaveBeenCalledWith(
            expect.arrayContaining([
                {
                    item: expect.objectContaining({ userId: "u1" }),
                    providerId: "id-u1",
                },
            ]),
        )
    })

    it("honours --limit and reports the remainder", async () => {
        const { deps, logs } = makeDeps(recipients(10))

        await runCli(["--confirm", "--limit", "4"], deps)

        expect(vi.mocked(deps.sendBatch).mock.calls[0]![0]).toHaveLength(4)
        expect(logs).toContain("Sent 4, failed 0, remaining 6")
    })

    it("never sends more than the daily cap", async () => {
        const { deps, logs } = makeDeps(recipients(250))

        await runCli(["--confirm"], deps)

        expect(deps.sendBatch).toHaveBeenCalledOnce()
        expect(vi.mocked(deps.markBatchSent).mock.calls[0]![0]).toHaveLength(100)
        expect(logs).toContain("Sent 100, failed 0, remaining 150")
    })

    it("exits 1 and lists failures when the provider rejects (non-retryable)", async () => {
        const { deps, logs } = makeDeps(recipients(2), {
            sendBatch: vi.fn().mockRejectedValue(new SendError("invalid", 422)),
        })

        const code = await runCli(["--confirm"], deps)

        expect(code).toBe(1)
        expect(logs).toContain("Sent 0, failed 2, remaining 2")
        expect(logs).toContain("  FAILED u0: invalid")
        expect(deps.markBatchSent).not.toHaveBeenCalled()
    })

    it("rerun after a crash mails nobody twice: the sent users are no longer eligible", async () => {
        const all = recipients(4)
        const sentIds = new Set<string>()
        const eligible = async () => all.filter((r) => !sentIds.has(r.userId))
        const mailed: string[] = []
        const base = {
            loadRecipients: vi.fn(eligible),
            sendBatch: vi.fn(async (batch: Recipient[]) => {
                mailed.push(...batch.map((r) => r.userId))
                return batch.map((r) => `id-${r.userId}`)
            }),
            markBatchSent: vi.fn(async (sent: { item: Recipient }[]) =>
                sent.forEach(({ item }) => void sentIds.add(item.userId)),
            ),
        }

        await runCli(["--confirm", "--limit", "2"], makeDeps(all, base).deps)
        await runCli(["--confirm"], makeDeps(all, base).deps)

        expect(mailed).toEqual(["u0", "u1", "u2", "u3"])
    })
})

describe("runCli crash-and-rerun", () => {
    const RESEND_KEY_TTL_MS = 24 * 60 * 60 * 1000

    /** In-memory Resend (dedupes by idempotency key, forgets keys after a TTL) and Mongo (sent/pending/opt-out state). */
    function makeWorld(all: Recipient[]) {
        const sent = new Set<string>()
        const optedOut = new Set<string>()
        const pendingKey = new Map<string, string>()
        const pendingAt = new Map<string, Date>()
        const clock = { ms: Date.UTC(2026, 0, 1) }
        const keyTtlMs = RESEND_KEY_TTL_MS
        const acceptedAt = new Map<string, number>()
        const accepted = new Map<string, string[]>()
        const mailedBy = new Map<string, Set<string>>()
        const delivered = (userId: string) => [...(mailedBy.get(userId) ?? [])]
        const world = {
            sent,
            optedOut,
            pendingKey,
            clock,
            now: () => new Date(clock.ms),
            accepted,
            delivered,
            loadRecipients: vi.fn(async () =>
                all.filter(
                    (r) =>
                        !sent.has(r.userId) && !pendingKey.has(r.userId) && !optedOut.has(r.userId),
                ),
            ),
            loadPendingBatches: vi.fn(async () => {
                const byKey = new Map<string, Recipient[]>()
                for (const r of all) {
                    const key = pendingKey.get(r.userId)
                    if (key && !sent.has(r.userId)) byKey.set(key, [...(byKey.get(key) ?? []), r])
                }
                return [...byKey].map(([key, items]) => ({
                    key,
                    items,
                    reservedAt: pendingAt.get(items[0]!.userId)!,
                }))
            }),
            reserveBatch: vi.fn(async (batch: Recipient[], key: string) =>
                batch.forEach((r) => {
                    pendingKey.set(r.userId, key)
                    pendingAt.set(r.userId, new Date(clock.ms))
                }),
            ),
            sendBatch: vi.fn(async (batch: Recipient[], key: string) => {
                // Resend replays an identical key without delivering twice, but only while it
                // still remembers the key; after keyTtlMs the same key is a brand-new send.
                const remembered = clock.ms - (acceptedAt.get(key) ?? -Infinity) < keyTtlMs
                if (!remembered) {
                    acceptedAt.set(key, clock.ms)
                    accepted.set(
                        key,
                        batch.map((r) => r.userId),
                    )
                    batch.forEach((r) => {
                        mailedBy.set(r.userId, (mailedBy.get(r.userId) ?? new Set()).add(key))
                    })
                }
                return batch.map((r) => `id-${r.userId}`)
            }),
            markBatchSent: vi.fn(async (entries: { item: Recipient }[]) =>
                entries.forEach(({ item }) => {
                    sent.add(item.userId)
                    pendingKey.delete(item.userId)
                    pendingAt.delete(item.userId)
                }),
            ),
        }
        return world
    }

    const crashingMark = () => vi.fn().mockRejectedValue(new Error("process killed"))
    const sendKeys = (world: ReturnType<typeof makeWorld>) =>
        world.sendBatch.mock.calls.map((call) => call[1])

    it("replays the identical batch and key after a crash between send and record", async () => {
        const all = recipients(5)
        const world = makeWorld(all)

        const code1 = await runCli(
            ["--confirm"],
            makeDeps(all, { ...world, markBatchSent: crashingMark() }).deps,
        )
        expect(code1).toBe(1)
        expect(world.sent.size).toBe(0)

        const second = makeDeps(all, world)
        const code2 = await runCli(["--confirm"], second.deps)

        const keys = sendKeys(world)
        expect(code2).toBe(0)
        expect(keys).toHaveLength(2)
        expect(keys[1]).toBe(keys[0])
        expect(world.accepted.size).toBe(1)
        expect(second.logs).toContain("Replaying 5 recipients from interrupted batch(es) first")
        all.forEach((r) => expect(world.delivered(r.userId)).toEqual([keys[0]]))
        expect(world.sent.size).toBe(5)
    })

    it("sends no duplicates when a recipient opts out between the crash and the rerun", async () => {
        const all = recipients(5)
        const world = makeWorld(all)
        await runCli(["--confirm"], makeDeps(all, { ...world, markBatchSent: crashingMark() }).deps)

        world.optedOut.add("u2")
        const code = await runCli(["--confirm"], makeDeps(all, world).deps)

        const keys = sendKeys(world)
        expect(code).toBe(0)
        expect(keys[1]).toBe(keys[0])
        expect(world.accepted.size).toBe(1)
        all.forEach((r) => expect(world.delivered(r.userId)).toHaveLength(1))
    })

    it("sends no duplicates when the rerun uses different flags (--limit 2, then plain --confirm)", async () => {
        const all = recipients(5)
        const world = makeWorld(all)
        await runCli(
            ["--confirm", "--limit", "2"],
            makeDeps(all, { ...world, markBatchSent: crashingMark() }).deps,
        )

        const code = await runCli(["--confirm"], makeDeps(all, world).deps)

        const keys = sendKeys(world)
        expect(code).toBe(0)
        expect(world.accepted.get(keys[0]!)).toEqual(["u0", "u1"])
        expect(keys[1]).toBe(keys[0])
        expect(world.accepted.size).toBe(2)
        all.forEach((r) => expect(world.delivered(r.userId)).toHaveLength(1))
        expect(world.sent.size).toBe(5)
    })

    const HOUR_MS = 60 * 60 * 1000

    it("replays within the retention window even after hours pass; Resend dedupes", async () => {
        const all = recipients(5)
        const world = makeWorld(all)
        await runCli(["--confirm"], makeDeps(all, { ...world, markBatchSent: crashingMark() }).deps)
        world.clock.ms += PENDING_REPLAY_RETENTION_MS - HOUR_MS

        const code = await runCli(["--confirm"], makeDeps(all, world).deps)

        expect(code).toBe(0)
        expect(sendKeys(world)).toHaveLength(2)
        all.forEach((r) => expect(world.delivered(r.userId)).toHaveLength(1))
        expect(world.sent.size).toBe(5)
    })

    it("does not replay past the window; reports it and keeps those users out of fresh sends", async () => {
        const all = recipients(5)
        const world = makeWorld(all)
        await runCli(
            ["--confirm", "--limit", "2"],
            makeDeps(all, { ...world, markBatchSent: crashingMark() }).deps,
        )
        // Past Resend's own TTL: a replay would be delivered a second time.
        world.clock.ms += RESEND_KEY_TTL_MS + HOUR_MS

        const second = makeDeps(all, world)
        const code = await runCli(["--confirm"], second.deps)

        expect(code).toBe(1)
        expect(second.logs.join("\n")).toMatch(
            /DELIVERY UNKNOWN, reconcile manually: batch v2-announce-\w+ .*Users: u0, u1/,
        )
        // u0/u1 were mailed once and never again; u2..u4 are sent fresh.
        ;["u0", "u1"].forEach((id) => expect(world.delivered(id)).toHaveLength(1))
        ;["u2", "u3", "u4"].forEach((id) => expect(world.delivered(id)).toHaveLength(1))
        expect(world.sent.has("u0")).toBe(false)
        expect(world.pendingKey.has("u0")).toBe(true)
    })

    it("never mails a member who opted out after a stale crash", async () => {
        const all = recipients(3)
        const world = makeWorld(all)
        await runCli(["--confirm"], makeDeps(all, { ...world, markBatchSent: crashingMark() }).deps)
        world.optedOut.add("u1")
        world.clock.ms += RESEND_KEY_TTL_MS + HOUR_MS

        await runCli(["--confirm"], makeDeps(all, world).deps)

        expect(sendKeys(world)).toHaveLength(1)
        all.forEach((r) => expect(world.delivered(r.userId)).toHaveLength(1))
    })

    it("treats a batch without a reservation time as stale", async () => {
        const all = recipients(2)
        const { deps, logs } = makeDeps(all, {
            loadRecipients: vi.fn(async () => []),
            loadPendingBatches: vi.fn(async () => [{ key: "k-legacy", items: all }]),
        })

        const code = await runCli(["--confirm"], deps)

        expect(code).toBe(1)
        expect(deps.sendBatch).not.toHaveBeenCalled()
        expect(logs.join("\n")).toContain("reserved at an unknown time")
    })

    it("still sends fresh recipients when a stale batch sits alongside them", async () => {
        const all = recipients(4)
        const stale = {
            key: "k-stale",
            items: all.slice(0, 2),
            reservedAt: new Date(Date.UTC(2020, 0, 1)),
        }
        const { deps } = makeDeps(all, {
            loadRecipients: vi.fn(async () => all.slice(2)),
            loadPendingBatches: vi.fn(async () => [stale]),
            now: () => new Date(Date.UTC(2026, 0, 1)),
        })

        await runCli(["--confirm", "--daily-cap", "2"], deps)

        expect(deps.sendBatch).toHaveBeenCalledOnce()
        expect(deps.sendBatch).toHaveBeenCalledWith(all.slice(2), expect.any(String))
    })

    it("counts the replayed batch against the daily cap", async () => {
        const all = recipients(6)
        const world = makeWorld(all)
        await runCli(
            ["--confirm", "--limit", "2"],
            makeDeps(all, { ...world, markBatchSent: crashingMark() }).deps,
        )

        await runCli(["--confirm", "--daily-cap", "3"], makeDeps(all, world).deps)

        expect(world.sent.size).toBe(3)
    })

    it("sends nothing new when the replay alone exhausts the cap", async () => {
        const all = recipients(4)
        const world = makeWorld(all)
        await runCli(
            ["--confirm", "--limit", "3"],
            makeDeps(all, { ...world, markBatchSent: crashingMark() }).deps,
        )

        await runCli(["--confirm", "--daily-cap", "2"], makeDeps(all, world).deps)

        expect(world.sent.size).toBe(3)
        expect(world.delivered("u3")).toEqual([])
    })

    it("mails nobody a second time once the batch was recorded", async () => {
        const all = recipients(3)
        const world = makeWorld(all)

        await runCli(["--confirm"], makeDeps(all, world).deps)
        await runCli(["--confirm"], makeDeps(all, world).deps)

        expect(world.sendBatch).toHaveBeenCalledOnce()
    })

    it("does not send when the batch cannot be reserved", async () => {
        const all = recipients(2)
        const world = makeWorld(all)
        const reserveBatch = vi.fn().mockRejectedValue(new Error("mongo down"))

        const code = await runCli(["--confirm"], makeDeps(all, { ...world, reserveBatch }).deps)

        expect(code).toBe(1)
        expect(world.sendBatch).not.toHaveBeenCalled()
    })

    it("reports the whole batch as sent-but-unrecorded and exits 1 when recording fails", async () => {
        const { deps, logs } = makeDeps(recipients(3), {
            markBatchSent: vi.fn().mockRejectedValue(new Error("mongo down")),
        })

        const code = await runCli(["--confirm"], deps)

        expect(code).toBe(1)
        expect(logs).toContain("Sent 0, failed 3, remaining 3")
        for (const id of ["u0", "u1", "u2"]) {
            expect(logs).toContain(`  FAILED ${id}: sent but not recorded: mongo down`)
        }
    })
})

describe("runCli errors", () => {
    it("prints usage and exits 2 on bad arguments", async () => {
        const { deps, logs } = makeDeps([])

        const code = await runCli(["--nope"], deps)

        expect(code).toBe(2)
        expect(logs[0]).toBe(`Unknown argument "--nope"\n${USAGE}`)
    })

    it("rethrows unexpected errors", async () => {
        const { deps } = makeDeps([], {
            loadRecipients: vi.fn().mockRejectedValue(new Error("db")),
        })

        await expect(runCli(["--dry-run"], deps)).rejects.toThrow("db")
    })
})

describe("PLACEHOLDERS", () => {
    it("exposes preview-safe placeholders", () => {
        expect(PLACEHOLDERS.unsubscribeUrl).toMatch(/^https:\/\/example\.invalid\//)
        expect(PLACEHOLDERS.postalAddress).toContain("MAIL_POSTAL_ADDRESS")
    })
})

describe("pickRunRecipients with queued replays", () => {
    const options: CliOptions = { mode: { kind: "send" }, dailyCap: 10 }

    it("subtracts already-queued recipients from the allowance", () => {
        expect(pickRunRecipients(recipients(20), options, 4)).toHaveLength(6)
    })

    it("never goes negative", () => {
        expect(pickRunRecipients(recipients(20), options, 99)).toEqual([])
    })
})
