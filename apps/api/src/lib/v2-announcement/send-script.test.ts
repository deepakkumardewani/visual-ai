import { beforeEach, describe, expect, it, vi } from "vitest"

import type { RunDeps } from "./modes.js"

const mocks = vi.hoisted(() => ({
    bulkWrite: vi.fn(),
    updateMany: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    runCli: vi.fn(),
    loadEligible: vi.fn(async () => []),
    loadPending: vi.fn(async () => []),
}))

vi.mock("dotenv/config", () => ({}))
vi.mock("@visual-ai/email", () => ({ renderV2Announcement: vi.fn() }))
vi.mock("mongoose", () => ({
    default: { connect: mocks.connect, disconnect: mocks.disconnect },
}))
vi.mock("../../models/user.js", () => ({
    UserModel: { bulkWrite: mocks.bulkWrite, updateMany: mocks.updateMany },
}))
vi.mock("./recipients.js", () => ({
    loadEligibleRecipients: mocks.loadEligible,
    loadPendingBatches: mocks.loadPending,
}))
vi.mock("./modes.js", async (importOriginal) => ({
    ...(await importOriginal<typeof import("./modes.js")>()),
    runCli: mocks.runCli,
}))

async function loadWiredDeps(): Promise<RunDeps> {
    vi.resetModules()
    mocks.runCli.mockResolvedValue(0)
    await import("../../../scripts/send-v2-announcement.js")
    return mocks.runCli.mock.calls[0]![1] as RunDeps
}

describe("send-v2-announcement CLI wiring", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("records a whole batch with one bulkWrite carrying the provider ids", async () => {
        const deps = await loadWiredDeps()
        mocks.bulkWrite.mockResolvedValue(undefined)

        await deps.markBatchSent([
            {
                item: { userId: "u1", email: "a@x.com", firstName: "" },
                providerId: "r1",
            },
            {
                item: { userId: "u2", email: "b@x.com", firstName: "B" },
                providerId: "r2",
            },
        ])

        expect(mocks.bulkWrite).toHaveBeenCalledOnce()
        const ops = mocks.bulkWrite.mock.calls[0]![0] as {
            updateOne: {
                filter: { userId: string }
                update: {
                    $set: { "announcements.v2": { sentAt: Date; resendId: string } }
                }
            }
        }[]
        expect(ops.map((op) => op.updateOne.filter)).toEqual([{ userId: "u1" }, { userId: "u2" }])
        expect(ops.map((op) => op.updateOne.update.$set["announcements.v2"].resendId)).toEqual([
            "r1",
            "r2",
        ])
        const sentAts = ops.map((op) => op.updateOne.update.$set["announcements.v2"].sentAt)
        expect(sentAts[0]).toBeInstanceOf(Date)
        expect(sentAts[1]).toBe(sentAts[0])
    })

    it("reserves a batch by stamping its key on every member before sending", async () => {
        const deps = await loadWiredDeps()
        mocks.updateMany.mockResolvedValue(undefined)

        await deps.reserveBatch(
            [
                { userId: "u1", email: "a@x.com", firstName: "" },
                { userId: "u2", email: "b@x.com", firstName: "B" },
            ],
            "v2-announce-abc",
        )

        expect(mocks.updateMany).toHaveBeenCalledWith(
            { userId: { $in: ["u1", "u2"] } },
            {
                $set: {
                    "announcements.v2.pendingKey": "v2-announce-abc",
                    "announcements.v2.pendingAt": expect.any(Date),
                },
            },
        )
    })

    it("propagates a bulkWrite failure so the batcher can report it", async () => {
        const deps = await loadWiredDeps()
        mocks.bulkWrite.mockRejectedValue(new Error("mongo down"))

        await expect(
            deps.markBatchSent([
                {
                    item: { userId: "u1", email: "a@x.com", firstName: "" },
                    providerId: "r1",
                },
            ]),
        ).rejects.toThrow("mongo down")
    })

    it("disconnects mongoose after the run", async () => {
        await loadWiredDeps()

        expect(mocks.disconnect).toHaveBeenCalledOnce()
    })

    it("does not connect to Mongo at script start", async () => {
        await loadWiredDeps()

        expect(mocks.connect).not.toHaveBeenCalled()
    })

    it("connects once, before the pending-batch query, and reuses the connection", async () => {
        const order: string[] = []
        mocks.connect.mockImplementation(async () => void order.push("connect"))
        mocks.loadPending.mockImplementation(async () => (order.push("pending"), []))
        mocks.loadEligible.mockImplementation(async () => (order.push("eligible"), []))
        const deps = await loadWiredDeps()

        await deps.loadPendingBatches()
        await deps.loadRecipients()

        expect(order).toEqual(["connect", "pending", "eligible"])
        expect(mocks.connect).toHaveBeenCalledOnce()
    })
})
