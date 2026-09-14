import { beforeEach, describe, expect, it, vi } from "vitest"

const userSave = vi.hoisted(() => vi.fn())
const User = vi.hoisted(() => {
    const Model = vi.fn().mockImplementation(function UserDoc(
        this: Record<string, unknown>,
        doc: object,
    ) {
        Object.assign(this, doc)
        this.save = userSave
    })
    return Object.assign(Model, {
        findOne: vi.fn(),
        findOneAndUpdate: vi.fn(),
    })
})

const clerkClient = vi.hoisted(() => ({
    users: { deleteUser: vi.fn() },
}))

vi.mock("../lib/logger.js", () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}))

vi.mock("../models/user.js", () => ({
    UserModel: User,
}))

vi.mock("../middlewares/clerk.js", () => ({
    clerkClient,
}))

const {
    generateUsername,
    getUserOrThrow,
    updateUserPlan,
    updateFreeUserCredits,
    signUpHandler,
    deleteClerkUserData,
} = await import("./user-service.js")

describe("generateUsername", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("combines first and last name with the id suffix", () => {
        expect(generateUsername("user123abc", "John", "Doe")).toBe("john_doe_123abc")
    })

    it("falls back to first name only when last name is absent", () => {
        expect(generateUsername("user123abc", "John", undefined)).toBe("john_123abc")
    })

    it("falls back to the id when no name is provided", () => {
        expect(generateUsername("user123abc", undefined, undefined)).toBe("123abc")
    })

    it("falls back to the id when names are empty strings", () => {
        expect(generateUsername("user123abc", "", "")).toBe("123abc")
    })

    it("falls back to the id when only the last name is provided", () => {
        expect(generateUsername("user123abc", undefined, "Doe")).toBe("123abc")
    })
})

describe("getUserOrThrow", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("returns the user document when found", async () => {
        const user = { userId: "clerk_1" }
        User.findOne.mockResolvedValue(user)

        await expect(getUserOrThrow("clerk_1")).resolves.toBe(user)
        expect(User.findOne).toHaveBeenCalledWith({ userId: "clerk_1" })
    })

    it("throws NotFoundError when missing", async () => {
        User.findOne.mockResolvedValue(null)

        await expect(getUserOrThrow("missing")).rejects.toMatchObject({
            statusCode: 404,
            message: "User not found",
        })
    })
})

describe("updateUserPlan", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("updates the plan field", async () => {
        User.findOneAndUpdate.mockResolvedValue({})

        await updateUserPlan("user_1", "pro")

        expect(User.findOneAndUpdate).toHaveBeenCalledWith(
            { userId: "user_1" },
            { plan: "pro" },
            { new: true },
        )
    })
})

describe("updateFreeUserCredits", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("increments credits by 5", async () => {
        User.findOneAndUpdate.mockResolvedValue({})

        await updateFreeUserCredits("user_1")

        expect(User.findOneAndUpdate).toHaveBeenCalledWith(
            { userId: "user_1" },
            { $inc: { credits: 5 } },
            { new: true },
        )
    })
})

describe("signUpHandler", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        userSave.mockResolvedValue(undefined)
    })

    it("throws when Clerk user id is missing", async () => {
        await expect(
            signUpHandler({ data: { email_addresses: [{ email_address: "a@b.com" }] } } as never),
        ).rejects.toThrow("User ID is required")
    })

    it("returns early when the user already exists", async () => {
        User.findOne.mockResolvedValue({ userId: "user_abc123" })

        await signUpHandler({
            data: {
                id: "user_abc123",
                first_name: "Ada",
                last_name: "Lovelace",
                email_addresses: [{ email_address: "ada@example.com" }],
            },
        } as never)

        expect(User).not.toHaveBeenCalled()
        expect(userSave).not.toHaveBeenCalled()
    })

    it("creates a user and warns when email is missing", async () => {
        User.findOne.mockResolvedValue(null)

        await signUpHandler({
            data: {
                id: "user_abc123",
                first_name: "Ada",
                last_name: "Lovelace",
                email_addresses: [],
            },
        } as never)

        expect(User).toHaveBeenCalledWith({
            userName: "ada_lovelace_abc123",
            email: "",
            userId: "user_abc123",
            firstName: "Ada",
            lastName: "Lovelace",
            fullName: "Ada Lovelace",
            referralCode: "abc123",
        })
        expect(userSave).toHaveBeenCalled()
    })

    it("uses empty name fallbacks when names are omitted", async () => {
        User.findOne.mockResolvedValue(null)

        await signUpHandler({
            data: {
                id: "user_zzz999",
                email_addresses: [{ email_address: "z@example.com" }],
            },
        } as never)

        expect(User).toHaveBeenCalledWith(
            expect.objectContaining({
                userName: "zzz999",
                firstName: "",
                lastName: "",
                fullName: "",
                email: "z@example.com",
            }),
        )
    })

    it("re-throws persistence errors", async () => {
        User.findOne.mockResolvedValue(null)
        userSave.mockRejectedValue(new Error("duplicate key"))

        await expect(
            signUpHandler({
                data: {
                    id: "user_abc123",
                    email_addresses: [{ email_address: "a@b.com" }],
                },
            } as never),
        ).rejects.toThrow("duplicate key")
    })
})

describe("deleteClerkUserData", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("deletes the Clerk user", async () => {
        clerkClient.users.deleteUser.mockResolvedValue({ id: "user_1" })

        await deleteClerkUserData("user_1")

        expect(clerkClient.users.deleteUser).toHaveBeenCalledWith("user_1")
    })

    it("swallows Clerk API errors", async () => {
        clerkClient.users.deleteUser.mockRejectedValue(new Error("clerk down"))

        await expect(deleteClerkUserData("user_1")).resolves.toBeUndefined()
    })
})
