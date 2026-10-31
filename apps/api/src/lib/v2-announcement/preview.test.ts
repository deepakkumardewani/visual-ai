import { readFile, rm } from "node:fs/promises"
import { dirname, basename } from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import { writePreviewFile } from "./preview.js"

const created: string[] = []

afterEach(async () => {
    await Promise.all(created.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe("writePreviewFile", () => {
    it("writes the html to preview.html in a fresh temp directory", async () => {
        const html = "<p>héllo</p>"
        const path = await writePreviewFile(html)
        created.push(dirname(path))

        expect(basename(path)).toBe("preview.html")
        expect(basename(dirname(path))).toMatch(/^v2-announcement-/)
        expect(await readFile(path, "utf8")).toBe(html)
    })

    it("uses a distinct directory per call", async () => {
        const a = await writePreviewFile("a")
        const b = await writePreviewFile("b")
        created.push(dirname(a), dirname(b))

        expect(dirname(a)).not.toBe(dirname(b))
    })
})
