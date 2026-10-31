import { mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const PREVIEW_DIR_PREFIX = "v2-announcement-"
const PREVIEW_FILE_NAME = "preview.html"

/** Writes the HTML to a fresh temp directory and returns the file path. */
export async function writePreviewFile(html: string): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), PREVIEW_DIR_PREFIX))
    const filePath = join(dir, PREVIEW_FILE_NAME)
    await writeFile(filePath, html, "utf8")
    return filePath
}
