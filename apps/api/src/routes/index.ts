import express from "express"

import { requireAuth } from "../middlewares/clerk.js"
import { collectionRoutes } from "../routes/collections.js"
import { emailRoutes } from "../routes/email.js"
import { creditsRoute } from "../routes/credits.js"
import { exploreRoutes } from "../routes/explore.js"
import { generateRoute } from "../routes/generate.js"
import { imageRoutes } from "../routes/image.js"
import { paymentsApiRouter } from "../payments/router.js"
import { promptRoutes } from "../routes/prompt.js"
import { savedPromptsRoutes } from "../routes/saved-prompts.js"
import { sttRoute } from "../routes/stt.js"
import { userRoutes } from "../routes/users.js"

export const router = express.Router()

router.use(generateRoute)
router.use(promptRoutes)
router.use(sttRoute)
router.use(savedPromptsRoutes)
// Public (signed-token) unsubscribe: must stay above the requireAuth mounts below
router.use(emailRoutes)
router.use(requireAuth as any, userRoutes)
router.use(requireAuth as any, exploreRoutes)
router.use(requireAuth as any, creditsRoute)
router.use(requireAuth as any, imageRoutes)
router.use(requireAuth as any, collectionRoutes)
router.use(requireAuth as any, paymentsApiRouter)
