import { beforeEach, describe, expect, it, vi } from "vitest"

const replicateState = vi.hoisted(() => {
    const run = vi.fn().mockResolvedValue(["https://out.png"])
    const constructed: Array<{ auth?: string }> = []
    class Replicate {
        run = run
        constructor(options: { auth?: string }) {
            constructed.push(options)
        }
    }
    return { run, constructed, Replicate }
})

vi.mock("replicate", () => ({
    default: replicateState.Replicate,
}))

const { replicate, buildModelInput, getModelReplicateId } = await import("./replicate.js")

const BASE_PARAMS = {
    prompt: "a photo of a cat",
    aspectRatio: "16:9",
    outputFormat: "jpg",
    outputQuality: 80,
    numOfOutputs: 2,
}

describe("replicate client wrapper", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("constructs the SDK client with the Replicate API token", () => {
        expect(replicateState.constructed).toHaveLength(1)
        expect(replicateState.constructed[0]?.auth).toEqual(expect.any(String))
        expect(replicateState.constructed[0]?.auth?.length).toBeGreaterThan(0)
    })

    it("exposes a runnable client instance", async () => {
        await expect(
            replicate.run("owner/model" as never, { input: { prompt: "x" } }),
        ).resolves.toEqual(["https://out.png"])
        expect(replicateState.run).toHaveBeenCalled()
    })
})

describe("buildModelInput re-export", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("FLUX_QUICK includes prompt/format/quality/num_outputs but excludes aspect_ratio", () => {
        const input = buildModelInput("FLUX_QUICK", BASE_PARAMS)
        expect(input.prompt).toBe("a photo of a cat")
        expect(input.output_format).toBe("jpg")
        expect(input.output_quality).toBe(80)
        expect(input.num_outputs).toBe(2)
        expect(input.aspect_ratio).toBeUndefined()
    })

    it("FLUX_BASIC includes aspect_ratio, num_outputs, and output_quality", () => {
        const input = buildModelInput("FLUX_BASIC", BASE_PARAMS)
        expect(input.aspect_ratio).toBe("16:9")
        expect(input.num_outputs).toBe(2)
        expect(input.output_quality).toBe(80)
    })

    it("FLUX_PRO excludes num_outputs and output_quality (registry constraint)", () => {
        const input = buildModelInput("FLUX_PRO", BASE_PARAMS)
        expect(input.aspect_ratio).toBe("16:9")
        expect(input.output_format).toBe("jpg")
        expect(input.num_outputs).toBeUndefined()
        expect(input.output_quality).toBeUndefined()
    })

    it("FLUX_1_1_PRO has the same constraints as FLUX_PRO", () => {
        const input = buildModelInput("FLUX_1_1_PRO", BASE_PARAMS)
        expect(input.aspect_ratio).toBe("16:9")
        expect(input.num_outputs).toBeUndefined()
        expect(input.output_quality).toBeUndefined()
    })

    it("FLUX_REALISM includes num_outputs but excludes aspect_ratio", () => {
        const input = buildModelInput("FLUX_REALISM", BASE_PARAMS)
        expect(input.num_outputs).toBe(2)
        expect(input.aspect_ratio).toBeUndefined()
    })

    it("defaults a missing prompt to an empty string", () => {
        const input = buildModelInput("FLUX_BASIC", {})
        expect(input.prompt).toBe("")
    })

    it("throws for an unknown model key", () => {
        expect(() => {
            // @ts-expect-error intentional bad key
            buildModelInput("NONEXISTENT", {})
        }).toThrow()
    })
})

describe("getModelReplicateId re-export", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("returns the FLUX_BASIC replicateId", () => {
        expect(getModelReplicateId("FLUX_BASIC")).toBe("black-forest-labs/flux-dev")
    })

    it("returns the FLUX_REALISM replicateId including version hash", () => {
        expect(getModelReplicateId("FLUX_REALISM").startsWith("xlabs-ai/flux-dev-realism:")).toBe(
            true,
        )
    })

    it("throws for an unknown model key", () => {
        expect(() => {
            // @ts-expect-error intentional bad key
            getModelReplicateId("DOES_NOT_EXIST")
        }).toThrow()
    })
})
