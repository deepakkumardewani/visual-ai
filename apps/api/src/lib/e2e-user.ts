import { env } from "../config/env.js"

/**
 * True for the e2e Clerk users, who must never reach paid or real third-party services.
 * The list is read from env at startup, so changing E2E_USER_IDS requires an API restart.
 * Callers must pass a server-trusted userId (the authenticated Clerk id), never a client value.
 */
export function isE2eUser(userId: string | undefined): boolean {
    return Boolean(userId) && env.E2E_USER_IDS.includes(userId as string)
}
