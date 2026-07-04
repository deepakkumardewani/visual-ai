import mongoose from "mongoose"

import { redisClient } from "../config/redis.js"

interface HealthStatus {
    status: "healthy" | "unhealthy"
    timestamp: Date
    services: {
        mongodb: ServiceStatus
        redis: ServiceStatus
        nodejs: ServiceStatus
    }
    errors?: string[]
}

interface ServiceStatus {
    status: "healthy" | "unhealthy"
    responseTime?: number
    error?: string
}

export class HealthCheckService {
    private async checkMongoDB(): Promise<ServiceStatus> {
        const startTime = Date.now()
        try {
            await mongoose.connection.db.admin().ping()
            return {
                status: "healthy",
                responseTime: Date.now() - startTime,
            }
        } catch (error) {
            return {
                status: "unhealthy",
                responseTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : "Unknown error",
            }
        }
    }

    private async checkRedis(): Promise<ServiceStatus> {
        const startTime = Date.now()
        try {
            await redisClient.ping()
            return {
                status: "healthy",
                responseTime: Date.now() - startTime,
            }
        } catch (error) {
            return {
                status: "unhealthy",
                responseTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : "Unknown error",
            }
        }
    }

    private checkNodeJS(): ServiceStatus {
        const memoryUsage = process.memoryUsage()
        const memoryUsageInMB = memoryUsage.rss / 1024 / 1024
        const uptime = process.uptime()

        // Consider unhealthy if memory usage > 1GB or uptime < 10 seconds
        if (memoryUsageInMB > 1024 || uptime < 10) {
            return {
                status: "unhealthy",
                error: `High memory usage: ${memoryUsageInMB.toFixed(2)}MB or low uptime: ${uptime}s`,
            }
        }

        return {
            status: "healthy",
            responseTime: 0,
        }
    }

    public async performHealthCheck(): Promise<HealthStatus> {
        const [mongoStatus, redisStatus, nodeStatus] = await Promise.all([
            this.checkMongoDB(),
            this.checkRedis(),
            Promise.resolve(this.checkNodeJS()),
        ])

        const services = {
            mongodb: mongoStatus,
            redis: redisStatus,
            nodejs: nodeStatus,
        }

        const isHealthy = Object.values(services).every(
            (service) => service.status === "healthy",
        )

        const errors = Object.values(services)
            .filter((service) => service.error)
            .map((service) => service.error!)

        return {
            status: isHealthy ? "healthy" : "unhealthy",
            timestamp: new Date(),
            services,
            errors: errors.length > 0 ? errors : undefined,
        }
    }
}

export const healthCheckService = new HealthCheckService()
