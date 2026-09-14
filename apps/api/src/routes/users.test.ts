import { beforeEach, describe, expect, it, vi } from "vitest"

const {
    find,
    findOne,
    findById,
    findOneAndUpdate,
    deleteOne,
    updateUserPlan,
    deleteClerkUserData,
    deleteCloudinaryUserData,
    sendMail,
    createTransport,
} = vi.hoisted(() => {
    const sendMail = vi.fn()
    return {
        find: vi.fn(),
        findOne: vi.fn(),
        findById: vi.fn(),
        findOneAndUpdate: vi.fn(),
        deleteOne: vi.fn(),
        updateUserPlan: vi.fn(),
        deleteClerkUserData: vi.fn(),
        deleteCloudinaryUserData: vi.fn(),
        sendMail,
        createTransport: vi.fn(() => ({ sendMail })),
    }
})

vi.mock("../config/env.js", () => ({
    env: {
        EMAIL_USER: "support@visual-ai.app",
        EMAIL_PASSWORD: "mail-pass",
    },
}))

vi.mock("../models/user.js", () => ({
    UserModel: {
        find: (...args: unknown[]) => find(...args),
        findOne: (...args: unknown[]) => findOne(...args),
        findById: (...args: unknown[]) => findById(...args),
        findOneAndUpdate: (...args: unknown[]) => findOneAndUpdate(...args),
        deleteOne: (...args: unknown[]) => deleteOne(...args),
    },
}))

vi.mock("../services/user-service.js", () => ({
    updateUserPlan: (...args: unknown[]) => updateUserPlan(...args),
    deleteClerkUserData: (...args: unknown[]) => deleteClerkUserData(...args),
}))

vi.mock("../services/cloudinary-service.js", () => ({
    deleteCloudinaryUserData: (...args: unknown[]) => deleteCloudinaryUserData(...args),
}))

vi.mock("nodemailer", () => ({
    default: {
        createTransport: (...args: unknown[]) => createTransport(...args),
    },
}))

import { userRoutes } from "./users.js"

function findHandler(path: string, method: string) {
    const layer = (userRoutes as any).stack.find(
        (item: any) => item.route?.path === path && item.route.methods[method],
    )
    if (!layer) {
        throw new Error(`Missing ${method.toUpperCase()} ${path}`)
    }
    return layer.route.stack[0].handle
}

function mockRes() {
    return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
    }
}

async function invoke(handler: Function, req: any, res: any = mockRes()) {
    const next = vi.fn()
    handler(req, res, next)
    await new Promise((resolve) => setImmediate(resolve))
    await new Promise((resolve) => setImmediate(resolve))
    return { res, next }
}

function expectHttpError(next: ReturnType<typeof vi.fn>, name: string, message: string) {
    expect(next).toHaveBeenCalled()
    const error = next.mock.calls[0][0]
    expect(error.name).toBe(name)
    expect(error.message).toBe(message)
    expect(error.statusCode).toBeGreaterThanOrEqual(400)
}

describe("userRoutes", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        createTransport.mockReturnValue({ sendMail })
    })

    it("lists all users", async () => {
        const users = [{ userId: "u1" }]
        find.mockResolvedValue(users)

        const { res } = await invoke(findHandler("/users", "get"), {})

        expect(find).toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(users)
    })

    it("returns a user by id", async () => {
        const user = { userId: "u1", userName: "ada" }
        findOne.mockResolvedValue(user)

        const { res } = await invoke(findHandler("/users/:id", "get"), { params: { id: "u1" } })

        expect(findOne).toHaveBeenCalledWith({ userId: "u1" }, { collection: 0, activities: 0 })
        expect(res.json).toHaveBeenCalledWith(user)
    })

    it("throws NotFoundError when the user id does not exist", async () => {
        findOne.mockResolvedValue(null)

        const { next } = await invoke(findHandler("/users/:id", "get"), {
            params: { id: "missing" },
        })

        expectHttpError(next, "NotFoundError", "User not found")
    })

    it("updates a user plan from query params", async () => {
        updateUserPlan.mockResolvedValue(undefined)

        const { res } = await invoke(findHandler("/users/update/plan", "get"), {
            query: { userId: "u1", plan: "free" },
        })

        expect(updateUserPlan).toHaveBeenCalledWith("u1", "free")
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.send).toHaveBeenCalledWith("success")
    })

    it("returns populated history for an existing user", async () => {
        const history = [{ _id: "h1" }]
        findById.mockReturnValue({
            populate: vi.fn().mockResolvedValue({ history }),
        })

        const { res } = await invoke(findHandler("/users/history", "get"), {
            query: { userId: "u1" },
        })

        expect(findById).toHaveBeenCalledWith("u1")
        expect(res.json).toHaveBeenCalledWith(history)
    })

    it("throws NotFoundError when history user is missing", async () => {
        findById.mockReturnValue({
            populate: vi.fn().mockResolvedValue(null),
        })

        const { next } = await invoke(findHandler("/users/history", "get"), {
            query: { userId: "missing" },
        })

        expectHttpError(next, "NotFoundError", "User not found")
    })

    it("deletes mongo, cloudinary, and clerk data using params.userId", async () => {
        deleteOne.mockResolvedValue({ deletedCount: 1 })
        deleteCloudinaryUserData.mockResolvedValue(undefined)
        deleteClerkUserData.mockResolvedValue(undefined)

        const { res } = await invoke(findHandler("/users/:id", "delete"), {
            params: { userId: "u1" },
        })

        expect(deleteOne).toHaveBeenCalledWith({ userId: "u1" })
        expect(deleteCloudinaryUserData).toHaveBeenCalledWith("u1")
        expect(deleteClerkUserData).toHaveBeenCalledWith("u1")
        expect(res.json).toHaveBeenCalledWith({ message: "User deleted successfully" })
    })

    it("rejects a username update without a username", async () => {
        const { next } = await invoke(findHandler("/users/username", "put"), {
            body: { userId: "u1" },
        })

        expectHttpError(next, "BadRequestError", "Username is required")
    })

    it("rejects a username that already belongs to another user", async () => {
        findOne.mockResolvedValue({ userId: "other", userName: "ada" })

        const { next } = await invoke(findHandler("/users/username", "put"), {
            body: { userId: "u1", userName: "ada" },
        })

        expectHttpError(next, "BadRequestError", "Username already exists")
    })

    it("updates a username when it is available", async () => {
        findOne.mockResolvedValue(null)
        const updatedUser = { userId: "u1", userName: "ada" }
        findOneAndUpdate.mockResolvedValue(updatedUser)

        const { res } = await invoke(findHandler("/users/username", "put"), {
            body: { userId: "u1", userName: "ada" },
        })

        expect(findOneAndUpdate).toHaveBeenCalledWith(
            { userId: "u1" },
            { userName: "ada" },
            { new: true },
        )
        expect(res.json).toHaveBeenCalledWith({
            message: "Username updated successfully",
            user: updatedUser,
        })
    })

    it("throws NotFoundError when the username target user is missing", async () => {
        findOne.mockResolvedValue({ userId: "u1", userName: "ada" })
        findOneAndUpdate.mockResolvedValue(null)

        const { next } = await invoke(findHandler("/users/username", "put"), {
            body: { userId: "u1", userName: "ada" },
        })

        expectHttpError(next, "NotFoundError", "User not found")
    })

    it("rejects a full name update when either name is missing", async () => {
        const { next } = await invoke(findHandler("/users/fullname", "put"), {
            body: { userId: "u1", firstName: "Ada" },
        })

        expectHttpError(next, "BadRequestError", "Both first name and last name are required")
    })

    it("rejects a full name already used by another user", async () => {
        findOne.mockResolvedValue({ userId: "other", fullName: "Ada Lovelace" })

        const { next } = await invoke(findHandler("/users/fullname", "put"), {
            body: { userId: "u1", firstName: "Ada", lastName: "Lovelace" },
        })

        expectHttpError(next, "BadRequestError", "A user with this full name already exists")
    })

    it("updates first, last, and full name together", async () => {
        findOne.mockResolvedValue(null)
        const updatedUser = { userId: "u1", fullName: "Ada Lovelace" }
        findOneAndUpdate.mockResolvedValue(updatedUser)

        const { res } = await invoke(findHandler("/users/fullname", "put"), {
            body: { userId: "u1", firstName: "Ada", lastName: "Lovelace" },
        })

        expect(findOneAndUpdate).toHaveBeenCalledWith(
            { userId: "u1" },
            { firstName: "Ada", lastName: "Lovelace", fullName: "Ada Lovelace" },
            { new: true },
        )
        expect(res.json).toHaveBeenCalledWith({
            message: "Full name updated successfully",
            user: updatedUser,
        })
    })

    it("throws NotFoundError when the full name target user is missing", async () => {
        findOne.mockResolvedValue(null)
        findOneAndUpdate.mockResolvedValue(null)

        const { next } = await invoke(findHandler("/users/fullname", "put"), {
            body: { userId: "missing", firstName: "Ada", lastName: "Lovelace" },
        })

        expectHttpError(next, "NotFoundError", "User not found")
    })

    it("requires a user id and referral code", async () => {
        const { next } = await invoke(findHandler("/users/apply-referral", "post"), { body: {} })

        expectHttpError(next, "BadRequestError", "User ID and referral code are required")
    })

    it("throws when the applying user does not exist", async () => {
        findOne.mockResolvedValueOnce(null)

        const { next } = await invoke(findHandler("/users/apply-referral", "post"), {
            body: { userId: "u1", referralCode: "CODE1" },
        })

        expectHttpError(next, "NotFoundError", "User not found")
    })

    it("rejects a referral code the user already used", async () => {
        findOne.mockResolvedValueOnce({ userId: "u1", referralsUsed: ["CODE1"] })

        const { next } = await invoke(findHandler("/users/apply-referral", "post"), {
            body: { userId: "u1", referralCode: "CODE1" },
        })

        expectHttpError(next, "BadRequestError", "You have already used this referral code.")
    })

    it("rejects an invalid referral code", async () => {
        findOne
            .mockResolvedValueOnce({ userId: "u1", referralsUsed: [] })
            .mockResolvedValueOnce(null)

        const { next } = await invoke(findHandler("/users/apply-referral", "post"), {
            body: { userId: "u1", referralCode: "MISSING" },
        })

        expectHttpError(next, "BadRequestError", "Invalid referral code.")
    })

    it("rejects self-referral", async () => {
        findOne
            .mockResolvedValueOnce({ userId: "u1", referralsUsed: [] })
            .mockResolvedValueOnce({ userId: "u1", referralCode: "CODE1" })

        const { next } = await invoke(findHandler("/users/apply-referral", "post"), {
            body: { userId: "u1", referralCode: "CODE1" },
        })

        expectHttpError(next, "BadRequestError", "You cannot use your own referral code.")
    })

    it("grants 50 credits to both users and does not set a pro plan", async () => {
        findOne
            .mockResolvedValueOnce({ userId: "u1", referralsUsed: [] })
            .mockResolvedValueOnce({ userId: "u2", referralCode: "CODE1" })
        const updatedUser = { userId: "u1", credits: 100 }
        findOneAndUpdate.mockResolvedValue(updatedUser)

        const { res } = await invoke(findHandler("/users/apply-referral", "post"), {
            body: {
                userId: "u1",
                userEmail: "ada@example.com",
                userName: "ada",
                referralCode: "CODE1",
            },
        })

        expect(findOneAndUpdate).toHaveBeenNthCalledWith(
            1,
            { userId: "u1" },
            { $inc: { credits: 50 }, $push: { referralsUsed: "CODE1" } },
            { new: true },
        )
        expect(findOneAndUpdate).toHaveBeenNthCalledWith(
            2,
            { referralCode: "CODE1" },
            {
                $inc: { credits: 50 },
                $push: {
                    referrals: {
                        userId: "u1",
                        userEmail: "ada@example.com",
                        userName: "ada",
                    },
                },
            },
            { new: true },
        )
        expect(JSON.stringify(findOneAndUpdate.mock.calls[1][1])).not.toContain("isPro")
        expect(JSON.stringify(findOneAndUpdate.mock.calls[1][1])).not.toContain('"plan"')
        expect(res.json).toHaveBeenCalledWith({
            message: "Referral code applied successfully",
            credits: 100,
            user: updatedUser,
        })
    })

    it("requires every contact form field", async () => {
        const { next } = await invoke(findHandler("/users/contact", "post"), {
            body: { name: "Ada", email: "ada@example.com" },
        })

        expectHttpError(next, "BadRequestError", "All fields are required.")
    })

    it("sends the contact email through gmail", async () => {
        sendMail.mockResolvedValue({ accepted: ["support@visual-ai.app"] })

        const { res } = await invoke(findHandler("/users/contact", "post"), {
            body: {
                name: "Ada",
                email: "ada@example.com",
                subject: "Help",
                message: "Please help",
            },
        })

        expect(createTransport).toHaveBeenCalledWith({
            service: "gmail",
            auth: { user: "support@visual-ai.app", pass: "mail-pass" },
        })
        expect(sendMail).toHaveBeenCalledWith({
            from: "ada@example.com",
            to: "support@visual-ai.app",
            subject: "Help",
            text: "Please help",
        })
        expect(res.send).toHaveBeenCalledWith({ success: "Form submitted successfully!" })
    })
})
