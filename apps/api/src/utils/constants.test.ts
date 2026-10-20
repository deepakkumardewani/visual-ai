import { describe, expect, it } from "vitest"

describe("utils/constants", () => {
    it("loads the module", async () => {
        await expect(import("./constants.js")).resolves.toBeDefined()
    })
})
