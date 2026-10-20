import { describe, expect, it, vi } from "vitest"

const mockEnv = vi.hoisted(() => ({
    DODO_PRODUCT_ID_PACK_200: "pdt_env_200",
    DODO_PRODUCT_ID_PACK_450: "pdt_env_450",
    DODO_PRODUCT_ID_PACK_960: "pdt_env_960",
    DODO_PRODUCT_ID_PACK_2000: "pdt_env_2000",
}))

vi.mock("../../config/env.js", () => ({
    env: mockEnv,
}))

import { getDodoProductIdForPack } from "./productMap.js"

describe("getDodoProductIdForPack", () => {
    it("returns the env-mapped product id for each pack", () => {
        expect(getDodoProductIdForPack("pack_200")).toBe("pdt_env_200")
        expect(getDodoProductIdForPack("pack_450")).toBe("pdt_env_450")
        expect(getDodoProductIdForPack("pack_960")).toBe("pdt_env_960")
        expect(getDodoProductIdForPack("pack_2000")).toBe("pdt_env_2000")
    })

    it("throws when the env product id is missing", () => {
        mockEnv.DODO_PRODUCT_ID_PACK_200 = ""
        expect(() => getDodoProductIdForPack("pack_200")).toThrow(
            "Missing Dodo product id for pack pack_200",
        )
        mockEnv.DODO_PRODUCT_ID_PACK_200 = "pdt_env_200"
    })
})
