import { describe, expect, it } from "vitest"

import { FeedbackModel } from "./feedback.js"

describe("FeedbackModel validation", () => {
    const base = { userId: "u1", source: "menu", type: "bug", message: "broken" }

    it("accepts feedback from a user without an email", () => {
        expect(new FeedbackModel({ ...base, email: "" }).validateSync()).toBeUndefined()
        expect(new FeedbackModel(base).validateSync()).toBeUndefined()
    })

    it("defaults a missing email to an empty string", () => {
        expect(new FeedbackModel(base).email).toBe("")
    })

    it("still requires userId", () => {
        const error = new FeedbackModel({ ...base, userId: undefined }).validateSync()
        expect(error?.errors.userId).toBeDefined()
    })
})
