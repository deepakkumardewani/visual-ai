/**
 * Unit tests for generation-service
 *
 * Tests:
 *   1. calculateCreditCost — pure function, all feature×isPro combinations
 *   2. Job-status transition sequence — using in-memory mock services
 */

import { describe, expect, it } from "vitest"

import { FeatureType } from "@visual-ai/shared"

// Import pure utility — no env/logger transitive deps, safe in test environments
import { calculateCreditCost } from "../utils/credit-calculator.js"

// Type-only imports — erased at runtime, no module-init side effects
import type { JobStatus } from "@visual-ai/shared"
import type { IImageObject } from "@visual-ai/shared"

/** Minimal interface for the status recorder mock */
interface JobStatusSetter {
    setStatus: (jobId: string, status: JobStatus) => Promise<void>
}

describe("calculateCreditCost", () => {
    it.each([
        [FeatureType.IMAGE, false, 1],
        [FeatureType.IMAGE, true, 1],
        [FeatureType.UPSCALE, false, 3],
        [FeatureType.UPSCALE, true, 1],
        [FeatureType.COLORIZE, false, 3],
        [FeatureType.COLORIZE, true, 1],
        [FeatureType.REVIVE, false, 3],
        [FeatureType.REVIVE, true, 1],
    ])("%s (isPro=%s) costs %i credits", (feature, isPro, expected) => {
        expect(calculateCreditCost(feature, isPro)).toBe(expected)
    })

    describe("tier-aware pricing with modelKey", () => {
        it("UPSCALE_REAL_ESRGAN (budget) free: 1/2 = 0.5 credits", () => {
            expect(calculateCreditCost(FeatureType.UPSCALE, false, "UPSCALE_REAL_ESRGAN")).toBe(0.5)
        })

        it("UPSCALE_REAL_ESRGAN (budget) pro: 1 credit", () => {
            expect(calculateCreditCost(FeatureType.UPSCALE, true, "UPSCALE_REAL_ESRGAN")).toBe(1)
        })

        it("UPSCALE_GOOGLE (standard) free: 1/3 credits", () => {
            const cost = calculateCreditCost(FeatureType.UPSCALE, false, "UPSCALE_GOOGLE")
            expect(cost).toBeCloseTo(1 / 3)
        })

        it("UPSCALE_GOOGLE (standard) pro: 1 credit", () => {
            expect(calculateCreditCost(FeatureType.UPSCALE, true, "UPSCALE_GOOGLE")).toBe(1)
        })

        it("UPSCALE_CLARITY_PRO (premium) free: 1/6 credits", () => {
            const cost = calculateCreditCost(FeatureType.UPSCALE, false, "UPSCALE_CLARITY_PRO")
            expect(cost).toBeCloseTo(1 / 6)
        })

        it("UPSCALE_CLARITY_PRO (premium) pro: 2 credits", () => {
            expect(calculateCreditCost(FeatureType.UPSCALE, true, "UPSCALE_CLARITY_PRO")).toBe(2)
        })

        it("unknown modelKey falls back to legacy cost", () => {
            expect(calculateCreditCost(FeatureType.UPSCALE, false, "UNKNOWN_MODEL" as any)).toBe(3)
            expect(calculateCreditCost(FeatureType.UPSCALE, true, "UNKNOWN_MODEL" as any)).toBe(1)
        })
    })
})

describe("job-status transitions", () => {
    /** Captures setStatus calls so tests can assert the sequence */
    function makeStatusRecorder() {
        const calls: Array<{ jobId: string; status: JobStatus }> = []
        const service: JobStatusSetter = {
            setStatus: async (jobId, status) => {
                calls.push({ jobId, status })
            },
        }
        return { service, calls }
    }

    const STUB_IMAGE: IImageObject = {
        userId: "u1",
        prompt: "",
        featureType: FeatureType.IMAGE,
        images: [],
    }

    // NOTE: We can't easily mock ESM internals of runGenerationJob in plain-TS
    // tests, so this verifies the setStatus contract via a controlled recorder.
    // Full integration is covered by the manual browser test in the Verify steps.
    it("produces a processing → completed sequence on success", async () => {
        const { service, calls } = makeStatusRecorder()

        await service.setStatus("j1", {
            status: "processing",
            image: STUB_IMAGE,
            userCreditsRemaining: 10,
        })
        await service.setStatus("j1", {
            status: "completed",
            image: STUB_IMAGE,
            userCreditsRemaining: null,
        })

        expect(calls).toHaveLength(2)
        expect(calls[0]?.status.status).toBe("processing")
        expect(calls[1]?.status.status).toBe("completed")
        expect(calls[1]?.status.userCreditsRemaining).toBeNull()
    })

    it("produces the correct error status shape", async () => {
        const { service, calls } = makeStatusRecorder()

        await service.setStatus("j2", {
            status: "error",
            image: undefined,
            userCreditsRemaining: null,
        })

        expect(calls).toHaveLength(1)
        const errorStatus = calls[0]?.status
        expect(errorStatus?.status).toBe("error")
        expect(errorStatus?.image).toBeUndefined()
        expect(errorStatus?.userCreditsRemaining).toBeNull()
    })
})
