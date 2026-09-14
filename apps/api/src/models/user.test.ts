import { describe, expect, it } from "vitest"
import { DAILY_CREDITS, SIGNUP_CREDITS } from "@visual-ai/shared"

import { UserModel } from "./user.js"

describe("UserModel schema", () => {
    it("registers the User model name", () => {
        expect(UserModel.modelName).toBe("User")
    })

    it("enables timestamps", () => {
        expect(UserModel.schema.get("timestamps")).toBe(true)
    })

    it("requires unique userName and unique userId", () => {
        const userId = UserModel.schema.path("userId")
        const userName = UserModel.schema.path("userName")

        expect(userId.isRequired).toBe(true)
        expect(userId.options.unique).toBe(true)
        expect(typeof userId.options.default).toBe("function")

        expect(userName.isRequired).toBe(true)
        expect(userName.options.unique).toBe(true)
    })

    it("defaults name fields and email to empty strings", () => {
        expect(UserModel.schema.path("firstName").options.default).toBe("")
        expect(UserModel.schema.path("lastName").options.default).toBe("")
        expect(UserModel.schema.path("fullName").options.default).toBe("")
        expect(UserModel.schema.path("email").options.default).toBe("")
        expect(UserModel.schema.path("email").options.unique).toBe(true)
    })

    it("defaults credits from shared constants", () => {
        expect(UserModel.schema.path("credits").options.default).toBe(SIGNUP_CREDITS)
        expect(UserModel.schema.path("dailyCredits").options.default).toBe(DAILY_CREDITS)
    })

    it("keeps referralCode unique and sparse", () => {
        const referralCode = UserModel.schema.path("referralCode")
        expect(referralCode.options.unique).toBe(true)
        expect(referralCode.options.sparse).toBe(true)
    })

    it("defaults referralsUsed, referrals, payments, and history to empty arrays", () => {
        expect(UserModel.schema.path("referralsUsed").options.default).toEqual([])
        expect(UserModel.schema.path("referrals").options.default).toEqual([])
        expect(UserModel.schema.path("payments").options.default).toEqual([])
        expect(UserModel.schema.path("history").isRequired).toBe(true)
        expect(UserModel.schema.path("history").options.default).toEqual([])
    })

    it("embeds referral documents with required identity fields", () => {
        const referrals = UserModel.schema.path("referrals")
        const nested = referrals.schema

        expect(nested.path("userId").isRequired).toBe(true)
        expect(nested.path("userEmail").isRequired).toBe(true)
        expect(nested.path("userName").isRequired).toBe(true)
        expect(nested.path("timestamp").isRequired).toBe(true)
    })

    it("defines activities with required action and Image ref", () => {
        const activities = UserModel.schema.path("activities")
        const nested = activities.schema

        expect(nested.path("action").isRequired).toBe(true)
        expect(nested.path("image").options.ref).toBe("Image")
        expect(nested.path("timestamp").options.default).toBe(Date.now)
    })
})
