import { v2 as cloudinary } from "cloudinary"
import cookieParser from "cookie-parser"
import cors from "cors"
import "dotenv/config"
import express, { Application, NextFunction, Request, Response } from "express"

import { connectDB } from "./config/mongo.js"
import { redisClient } from "./config/redis.js"
import { healthCheckRoute } from "./routes/healthcheck.js"
import { router } from "./routes/index.js"
import { periodicHealthCheckService } from "./services/periodic-health-check-service.js"
import "./utils/cronJobs.js"
import { webhookRouter } from "./webhook/index.js"

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env

const app: Application = express()

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "https://visual-ai.app",
    "https://www.visual-ai.app",
]

const corsOptions = {
    origin: function (origin: any, callback: any) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin) // Return the matching origin
        } else {
            callback(new Error("Not allowed by CORS"))
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Accept",
        "Content-Type",
        "Authorization",
        "Mode",
        "X-Requested-With",
    ],
    credentials: true,
}

app.use(cors(corsOptions))
app.options("*", cors(corsOptions)) // Preflight response for all routes

// CORS configuration
// const corsOptions = {
//     origin: ["http://localhost:3000", "https://visual-ai.app"], // Allow requests from your frontend domain
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
//     allowedHeaders: [
//         "Content-Type",
//         "Accept",
//         "Authorization",
//         "Mode",
//         "X-Requested-With",
//     ], // Include Authorization header
// }

app.use("/", webhookRouter)
app.use("/", healthCheckRoute)

// Connect to the database
connectDB()

// Start periodic health check
periodicHealthCheckService.startPeriodicHealthCheck()

// Middlewares
app.use(express.json())
app.use(
    express.urlencoded({
        extended: true,
    }),
)
app.use(cookieParser() as any)
// app.use(errorHandler)

// Routes
router.use(express.json())
app.use("/", router)

// eslint-disable-next-line no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("====error====", err, err.stack)
    res.status(401).send("Unauthenticated request!")
})

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
})

// Add this to your shutdown handling
process.on("SIGTERM", async () => {
    console.log("SIGTERM signal received.")
    await redisClient.quit()
})

export { app }
