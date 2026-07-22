/**
 * Unit tests for buildModelInput and getModelReplicateId
 * Each model's input is asserted against expected registry-driven behavior.
 */

import { buildModelInput, getModelReplicateId } from "./model-input.js"

const PASS = (msg: string) => console.log(`PASS: ${msg}`)
const FAIL = (msg: string) => {
    console.error(`FAIL: ${msg}`)
    process.exit(1)
}

function assert(condition: boolean, msg: string) {
    if (condition) PASS(msg)
    else FAIL(msg)
}

// ---------------------------------------------------------------------------
// buildModelInput
// ---------------------------------------------------------------------------

const BASE_PARAMS = {
    prompt: "a photo of a cat",
    aspectRatio: "16:9",
    outputFormat: "jpg",
    outputQuality: 80,
    numOfOutputs: 2,
}

// FLUX_QUICK — has numOutputs, no aspectRatio
;(() => {
    const input = buildModelInput("FLUX_QUICK", BASE_PARAMS)
    assert(input.prompt === "a photo of a cat", "FLUX_QUICK: prompt included")
    assert(input.output_format === "jpg", "FLUX_QUICK: output_format included")
    assert(input.output_quality === 80, "FLUX_QUICK: output_quality included")
    assert(input.num_outputs === 2, "FLUX_QUICK: num_outputs included")
    assert(input.aspect_ratio === undefined, "FLUX_QUICK: aspect_ratio excluded (not in registry)")
})()

// FLUX_BASIC — has aspect_ratio and num_outputs
;(() => {
    const input = buildModelInput("FLUX_BASIC", BASE_PARAMS)
    assert(input.aspect_ratio === "16:9", "FLUX_BASIC: aspect_ratio included")
    assert(input.num_outputs === 2, "FLUX_BASIC: num_outputs included")
    assert(input.output_quality === 80, "FLUX_BASIC: output_quality included")
})()

// FLUX_PRO — no numOutputs, no outputQuality
;(() => {
    const input = buildModelInput("FLUX_PRO", BASE_PARAMS)
    assert(input.aspect_ratio === "16:9", "FLUX_PRO: aspect_ratio included")
    assert(input.output_format === "jpg", "FLUX_PRO: output_format included")
    assert(input.num_outputs === undefined, "FLUX_PRO: num_outputs excluded (registry constraint)")
    assert(
        input.output_quality === undefined,
        "FLUX_PRO: output_quality excluded (registry constraint)",
    )
})()

// FLUX_1_1_PRO — same constraints as FLUX_PRO
;(() => {
    const input = buildModelInput("FLUX_1_1_PRO", BASE_PARAMS)
    assert(input.aspect_ratio === "16:9", "FLUX_1_1_PRO: aspect_ratio included")
    assert(input.num_outputs === undefined, "FLUX_1_1_PRO: num_outputs excluded")
    assert(input.output_quality === undefined, "FLUX_1_1_PRO: output_quality excluded")
})()

// FLUX_REALISM — has numOutputs but no aspectRatio
;(() => {
    const input = buildModelInput("FLUX_REALISM", BASE_PARAMS)
    assert(input.num_outputs === 2, "FLUX_REALISM: num_outputs included")
    assert(input.aspect_ratio === undefined, "FLUX_REALISM: aspect_ratio excluded")
})()

// Missing prompt defaults to empty string
;(() => {
    const input = buildModelInput("FLUX_BASIC", {})
    assert(input.prompt === "", "missing prompt defaults to empty string")
})()

// Unknown model key throws
;(() => {
    try {
        // @ts-expect-error intentional bad key
        buildModelInput("NONEXISTENT", {})
        FAIL("unknown key should throw")
    } catch {
        assert(true, "unknown model key throws")
    }
})()

// ---------------------------------------------------------------------------
// getModelReplicateId
// ---------------------------------------------------------------------------

;(() => {
    assert(
        getModelReplicateId("FLUX_BASIC") === "black-forest-labs/flux-dev",
        "FLUX_BASIC replicateId",
    )
    assert(
        getModelReplicateId("FLUX_REALISM").startsWith("xlabs-ai/flux-dev-realism:"),
        "FLUX_REALISM replicateId includes version hash",
    )
})()

;(() => {
    try {
        // @ts-expect-error intentional bad key
        getModelReplicateId("DOES_NOT_EXIST")
        FAIL("unknown key should throw")
    } catch {
        assert(true, "unknown model key throws in getModelReplicateId")
    }
})()

console.log("\nAll replicate.test.ts assertions passed.")
