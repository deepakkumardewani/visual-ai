import { beforeEach, describe, expect, it, vi } from "vitest"

import { FeatureType } from "../types/index.js"
import { calculateCreditCost } from "./credit-calculator.js"

describe("calculateCreditCost", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("returns 1 credit for IMAGE generation when no model is specified", () => {
        expect(calculateCreditCost(FeatureType.IMAGE)).toBe(1)
    })

    it("uses the shared model cost for IMAGE generation when a model is provided", () => {
        expect(calculateCreditCost(FeatureType.IMAGE, "FLUX_QUICK")).toBe(1)
        expect(calculateCreditCost(FeatureType.IMAGE, "FLUX_PRO")).toBe(5)
        expect(calculateCreditCost(FeatureType.IMAGE, "IMAGEN_4_ULTRA")).toBe(4)
    })

    it("throws when a utility feature is missing a modelKey", () => {
        expect(() => calculateCreditCost(FeatureType.UPSCALE)).toThrow(
            "modelKey is required for utility operations",
        )
        expect(() => calculateCreditCost(FeatureType.COLORIZE)).toThrow(
            "modelKey is required for utility operations",
        )
        expect(() => calculateCreditCost(FeatureType.REVIVE)).toThrow(
            "modelKey is required for utility operations",
        )
        expect(() => calculateCreditCost(FeatureType.REMOVE_BG)).toThrow(
            "modelKey is required for utility operations",
        )
    })

    it("returns the shared utility cost when a modelKey is provided", () => {
        expect(calculateCreditCost(FeatureType.UPSCALE, "UPSCALE_IMAGE")).toBe(2)
        expect(calculateCreditCost(FeatureType.UPSCALE, "UPSCALE_TOPAZ")).toBe(4)
        expect(calculateCreditCost(FeatureType.COLORIZE, "COLORIZE_BASIC")).toBe(2)
        expect(calculateCreditCost(FeatureType.REMOVE_BG, "BACKGROUND_REMOVER")).toBe(2)
    })
})
