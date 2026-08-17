import { v2 as cloudinary } from "cloudinary"
import multer from "multer"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import { v1 as uuidv1 } from "uuid"

/* eslint-disable no-unused-vars */

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, _) => {
        const body = await req.body
        const fileName = `original-${uuidv1()}`
        const basePath = `private/development/uploads/${body.userId}`

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

export const upload = multer({ storage: storage })

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
