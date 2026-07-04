import nodemailer from "nodemailer"

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

export class EmailNotificationService {
    private transporter: nodemailer.Transporter
    private targetEmail = "visual.ai.app@gmail.com"

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        })
    }

    private formatHealthStatus(healthStatus: HealthStatus): string {
        let html = `
            <h2>🚨 Health Check Failed</h2>
            <p><strong>Timestamp:</strong> ${healthStatus.timestamp.toISOString()}</p>
            <p><strong>Overall Status:</strong> ${healthStatus.status}</p>
            
            <h3>Service Status:</h3>
            <ul>
        `

        Object.entries(healthStatus.services).forEach(([serviceName, status]) => {
            const icon = status.status === "healthy" ? "✅" : "❌"
            const responseTime = status.responseTime ? ` (${status.responseTime}ms)` : ""
            html += `<li>${icon} <strong>${serviceName.toUpperCase()}:</strong> ${status.status}${responseTime}`

            if (status.error) {
                html += `<br/>&nbsp;&nbsp;&nbsp;&nbsp;Error: ${status.error}`
            }
            html += `</li>`
        })

        html += `
            </ul>
            
            ${
                healthStatus.errors?.length
                    ? `
                <h3>Errors:</h3>
                <ul>
                    ${healthStatus.errors.map((error) => `<li>${error}</li>`).join("")}
                </ul>
            `
                    : ""
            }
            
            <p><em>This is an automated health check notification.</em></p>
        `

        return html
    }

    public async sendHealthCheckFailureNotification(healthStatus: HealthStatus): Promise<void> {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: this.targetEmail,
                subject: `🚨 Health Check Failed - ${new Date().toISOString()}`,
                html: this.formatHealthStatus(healthStatus),
            }

            await this.transporter.sendMail(mailOptions)
            console.log("Health check failure notification sent successfully")
        } catch (error) {
            console.error("Failed to send health check notification:", error)
        }
    }
}

export const emailNotificationService = new EmailNotificationService()
