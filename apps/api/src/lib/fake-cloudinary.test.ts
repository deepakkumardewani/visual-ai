import { describe, expect, it } from "vitest"

import {
    FAKE_IMAGE_SIZE_PX,
    FAKE_UPLOAD_DURATION_SEC,
    fakeMediaUpload,
    isFakeCloudinaryId,
} from "./fake-cloudinary.js"

describe("fakeMediaUpload", () => {
    it("gives audio and video a duration and no dimensions", () => {
        for (const kind of ["audio", "video"] as const) {
            const r = fakeMediaUpload(kind, 10)
            expect(r.durationSec).toBe(FAKE_UPLOAD_DURATION_SEC)
            expect(r.width).toBeUndefined()
            expect(r.bytes).toBe(10)
        }
    })

    it("gives images dimensions and no duration", () => {
        const r = fakeMediaUpload("image")
        expect(r.width).toBe(FAKE_IMAGE_SIZE_PX)
        expect(r.durationSec).toBeUndefined()
    })

    it("mints unique ids on the .invalid host that are recognised as fake", () => {
        const a = fakeMediaUpload("audio")
        const b = fakeMediaUpload("audio")
        expect(a.publicId).not.toBe(b.publicId)
        expect(a.url).toContain("fake-cloudinary.invalid")
        expect(isFakeCloudinaryId(a.publicId)).toBe(true)
        expect(isFakeCloudinaryId("base/user/real")).toBe(false)
    })
})
