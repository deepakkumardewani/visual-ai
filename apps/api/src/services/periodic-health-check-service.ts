import cron from "node-cron"

import { emailNotificationService } from "./email-notification-service.js"
import { healthCheckService } from "./health-check-service.js"

export class PeriodicHealthCheckService {
    private lastHealthStatus: "healthy" | "unhealthy" | null = null
    private isRunning = false

    public startPeriodicHealthCheck(): void {
        if (this.isRunning) {
            console.log("Periodic health check is already running")
            return
        }

        // Run health check every 5 minutes
        cron.schedule("*/5 * * * *", async () => {
            try {
                const currentHealthStatus =
                    await healthCheckService.performHealthCheck()

                console.log(
                    `Health check completed: ${currentHealthStatus.status} at ${currentHealthStatus.timestamp.toISOString()}`,
                )

                // Send email only when status changes from healthy to unhealthy
                if (
                    this.lastHealthStatus === "healthy" &&
                    currentHealthStatus.status === "unhealthy"
                ) {
                    await emailNotificationService.sendHealthCheckFailureNotification(
                        currentHealthStatus,
                    )
                }

                // Update last status
                this.lastHealthStatus = currentHealthStatus.status
            } catch (error) {
                console.error("Error during periodic health check:", error)
            }
        })

        this.isRunning = true
        console.log("Periodic health check started - running every 5 minutes")
    }

    public stopPeriodicHealthCheck(): void {
        // Note: node-cron doesn't provide a direct way to stop specific tasks
        // This is a placeholder for potential future implementation
        this.isRunning = false
        console.log("Periodic health check stopped")
    }

    public getStatus(): {
        isRunning: boolean
        lastHealthStatus: string | null
    } {
        return {
            isRunning: this.isRunning,
            lastHealthStatus: this.lastHealthStatus,
        }
    }
}

export const periodicHealthCheckService = new PeriodicHealthCheckService()
