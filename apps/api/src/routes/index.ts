import express from "express"

import { ClerkExpressRequireAuth } from "../middlewares/clerk.js"
import { creditsRoute } from "../routes/credits.js"
import { generateRoute } from "../routes/generate.js"
import { imageRoutes } from "../routes/image.js"
import { paymentsRoute } from "../routes/payments.js"
import { userRoutes } from "../routes/users.js"

export const router = express.Router()

router.use(generateRoute)
router.use(userRoutes, ClerkExpressRequireAuth({}) as any)
router.use(creditsRoute, ClerkExpressRequireAuth({}) as any)
router.use(imageRoutes, ClerkExpressRequireAuth({}) as any)
router.use(paymentsRoute, ClerkExpressRequireAuth({}) as any)
