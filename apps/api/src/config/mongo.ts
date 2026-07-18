import mongoose from "mongoose"

import { env } from "./env.js"
import { createLogger } from "../lib/logger.js"

const logger = createLogger("mongo")
mongoose.Promise = global.Promise

export const connectDB = () => {
    mongoose
        .connect(env.MONGO_URI)
        .then(() => {
            logger.info("Successfully connected to Mongo")
        })
        .catch((error: any) => {
            logger.error({ err: error }, "Database connection failed")
            process.exit(1)
        })
}
