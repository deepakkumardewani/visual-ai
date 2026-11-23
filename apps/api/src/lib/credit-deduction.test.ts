import { beforeEach, describe, expect, it, vi } from "vitest"

const User = vi.hoisted(() => ({ findOneAndUpdate: vi.fn() }))
const logger = vi.hoisted(() => ({ debug: vi.fn(), error: vi.fn(), info: vi.fn() }))

vi.mock("../models/user.js", () => ({ UserModel: User }))
vi.mock("./logger.js", () => ({ createLogger: () => logger }))

const { updateAndGetUserCredits } = await import("./credit-deduction.js")

describe("updateAndGetUserCredits", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("returns the combined remaining credits after a deduction", async () => {
        User.findOneAndUpdate.mockResolvedValue({ dailyCredits: 5, credits: 20 })

        await expect(updateAndGetUserCredits("user_1", 10)).resolves.toBe(25)
    })

    it("filters on the user and requires enough combined credits in one atomic update", async () => {
        User.findOneAndUpdate.mockResolvedValue({ dailyCredits: 0, credits: 0 })

        await updateAndGetUserCredits("user_1", 7)

        const [filter, pipeline, options] = User.findOneAndUpdate.mock.calls[0]
        expect(filter.userId).toBe("user_1")
        expect(filter.$expr.$gte[1]).toBe(7)
        expect(Array.isArray(pipeline)).toBe(true)
        expect(options).toEqual({ new: true })
    })

    it("treats missing credit buckets as zero", async () => {
        User.findOneAndUpdate.mockResolvedValue({})

        await expect(updateAndGetUserCredits("user_1", 1)).resolves.toBe(0)
    })

    it("throws Insufficient credits when no user document matched", async () => {
        User.findOneAndUpdate.mockResolvedValue(null)

        await expect(updateAndGetUserCredits("user_1", 50)).rejects.toThrow("Insufficient credits")
        expect(logger.error).toHaveBeenCalledWith(
            { userId: "user_1", amount: 50 },
            "Insufficient credits for deduction",
        )
    })

    it("propagates database errors", async () => {
        User.findOneAndUpdate.mockRejectedValue(new Error("db down"))

        await expect(updateAndGetUserCredits("user_1", 1)).rejects.toThrow("db down")
    })
})
