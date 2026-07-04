import { redisClient } from "../config/redis.js"
import { JobStatus } from "../types/index.js"

export class RedisService {
    private readonly JOB_EXPIRY = 600 // 10 minutes in seconds

    private getKey(jobId: string): string {
        return `job_status:${jobId}`
    }

    async setStatus(jobId: string, status: JobStatus): Promise<void> {
        await redisClient.set(
            this.getKey(jobId),
            JSON.stringify(status),
            "EX",
            this.JOB_EXPIRY,
        )
    }

    async getStatus(jobId: string): Promise<JobStatus | null> {
        const status = await redisClient.get(this.getKey(jobId))
        return status ? JSON.parse(status) : null
    }

    async deleteStatus(jobId: string): Promise<void> {
        await redisClient.del(this.getKey(jobId))
    }
}
