import { v2 as cloudinary } from "cloudinary"
import multer from "multer"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import { v1 as uuidv1 } from "uuid"
import { BadRequestError } from "../lib/errors.js"
import { maxBytesForKind, uploadTooLargeError } from "../lib/media-upload.js"
import type { UploadKind, UploadPurpose } from "../lib/media-upload.js"

import { isAcceptedImageMime, MAX_IMAGE_BYTES, MAX_REFERENCE_IMAGE_COUNT } from "@visual-ai/shared"

import { env } from "../config/env.js"

/* eslint-disable no-unused-vars */

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, _) => {
        const body = await req.body
        const fileName = `original-${uuidv1()}`
        const basePath = `${env.CLOUDINARY_BASE_PATH}/${body.userId}`

        return {
            folder: `${basePath}/${body.feature}`,
            format: body.format,
            public_id: fileName,
            unique_filename: false,
            use_filename: true,
        }
    },
})
/* eslint-disable no-unused-vars */

function referenceImageFileFilter(
    _req: unknown,
    file: { mimetype: string },
    cb: (error: Error | null, acceptFile?: boolean) => void,
) {
    if (!isAcceptedImageMime(file.mimetype)) {
        cb(new Error("Only JPG, PNG, and WEBP images are allowed"))
        return
    }
    cb(null, true)
}

export const upload = multer({ storage: storage })

export const referenceImagesUpload = multer({
    storage,
    limits: { fileSize: MAX_IMAGE_BYTES },
    fileFilter: referenceImageFileFilter,
})

export const MAX_REFERENCE_IMAGES_PER_REQUEST = MAX_REFERENCE_IMAGE_COUNT

const MAX_MEMORY_UPLOAD_BYTES = 10 * 1024 * 1024 // 10MB

export const memoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_MEMORY_UPLOAD_BYTES },
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            cb(new Error("Only image files are allowed"))
            return
        }
        cb(null, true)
    },
})

// The purpose decides the exact cap and allowed types; these instances only bound the request
// (memory kinds) or spool to disk (video) so a large file never sits in memory.
function createKindUpload(kind: UploadKind, storage: multer.StorageEngine) {
    return multer({ storage, limits: { fileSize: maxBytesForKind(kind), files: 1 } })
}

export const audioUpload = createKindUpload("audio", multer.memoryStorage())
export const toolImageUpload = createKindUpload("image", multer.memoryStorage())
export const videoUpload = createKindUpload("video", multer.diskStorage({}))

export const UPLOAD_BY_KIND: Record<UploadKind, multer.Multer> = {
    audio: audioUpload,
    image: toolImageUpload,
    video: videoUpload,
}

/** Maps Multer's size error to the 413 the client shows copy for; other Multer errors become 400. */
export function mapUploadError(err: unknown, purpose: UploadPurpose): unknown {
    if (!(err instanceof multer.MulterError)) return err
    if (err.code === "LIMIT_FILE_SIZE") return uploadTooLargeError(purpose)
    return new BadRequestError(`file: ${err.message}`)
}
