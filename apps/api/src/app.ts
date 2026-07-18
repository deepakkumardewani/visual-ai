import { v2 as cloudinary } from "cloudinary"
import cookieParser from "cookie-parser"
import cors from "cors"
import "dotenv/config"
import express, { Application } from "express"
import pinoHttp from "pino-http"
import { v4 as uuidv4 } from "uuid"

import { connectDB } from "./config/mongo.js"
import { env } from "./config/env.js"
import { logger } from "./lib/logger.js"
import { healthCheckRoute } from "./routes/healthcheck.js"
import { router } from "./routes/index.js"
import { periodicHealthCheckService } from "./services/periodic-health-check-service.js"
import "./utils/cronJobs.js"
import { webhookRouter } from "./webhook/index.js"

const app: Application = express()

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3005",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "https://visual-ai.app",
    "https://www.visual-ai.app",
]

const corsOptions = {
    origin: function (origin: any, callback: any) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin)
        } else {
            callback(new Error("Not allowed by CORS"))
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Accept", "Content-Type", "Authorization", "Mode", "X-Requested-With"],
    credentials: true,
}

app.use(cors(corsOptions))
app.options("*", cors(corsOptions))

// HTTP request logging with request ID
app.use(
    pinoHttp({
        logger,
        genReqId: () => uuidv4(),
    }),
)

// Webhook routes must come before body-parsing middleware to preserve raw body
app.use("/", webhookRouter)
app.use("/", healthCheckRoute)

// Connect to the database
connectDB()

// Start periodic health check
periodicHealthCheckService.startPeriodicHealthCheck()

// Body parsing middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser() as any)

// Application routes
router.use(express.json())
app.use("/", router)

// Cloudinary configuration
cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
})

export { app }
