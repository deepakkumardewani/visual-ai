/**
 * Ensures the E2E test user has a Mongo document in the local DB.
 *
 * Reuses signUpHandler, which is a no-op when the user already exists, so an
 * existing document (credits, history, ...) is never overwritten. Credits come
 * from the schema defaults and are therefore only set on insert.
 *
 * Usage (from apps/api): bun run seed:e2e-user
 */
import mongoose from "mongoose"

import { env } from "../src/config/env.js"
import { clerkClient } from "../src/middlewares/clerk.js"
import { UserModel } from "../src/models/user.js"
import { signUpHandler } from "../src/services/user-service.js"
import { ClerkUserEvent } from "../src/types/index.js"

const E2E_USER_ID = process.env.E2E_CLERK_USER_ID ?? "user_3K9cU9AoSCfly17t5EfB8YyA3cs"

async function buildSignUpEvent(userId: string): Promise<ClerkUserEvent> {
    const user = await clerkClient.users.getUser(userId)
    // signUpHandler reads email_addresses[0], so put the primary address first.
    const emails = [...user.emailAddresses].sort(
        (a, b) =>
            Number(b.id === user.primaryEmailAddressId) -
            Number(a.id === user.primaryEmailAddressId),
    )

    return {
        data: {
            id: user.id,
            first_name: user.firstName ?? "",
            last_name: user.lastName ?? "",
            email_addresses: emails.map((e) => ({ email_address: e.emailAddress })),
        },
    } as unknown as ClerkUserEvent
}

async function main() {
    await mongoose.connect(env.MONGO_URI)
    try {
        const existed = await UserModel.exists({ userId: E2E_USER_ID })
        if (existed) {
            console.log(`User ${E2E_USER_ID} already exists in Mongo - no changes made`)
            return
        }

        await signUpHandler(await buildSignUpEvent(E2E_USER_ID))
        console.log(`User ${E2E_USER_ID} created in Mongo`)
    } finally {
        await mongoose.disconnect()
    }
}

main().catch((error) => {
    console.error("seed-e2e-user failed:", error)
    process.exit(1)
})
