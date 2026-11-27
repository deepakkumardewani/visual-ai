import type { NextFunction, Request, Response } from "express"

import { env } from "../config/env.js"

export function isAdminUser(userId: string | null | undefined): boolean {
    if (!userId) return false
    return env.ADMIN_USER_IDS.includes(userId)
}

/** Must run after requireAuth. Anyone not listed in ADMIN_USER_IDS gets 403. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
    if (!isAdminUser(req.auth?.userId)) {
        res.status(403).json({ error: "Forbidden" })
        return
    }
    next()
}
