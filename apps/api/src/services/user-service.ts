import { createLogger } from "../lib/logger.js"
import { NotFoundError } from "../lib/errors.js"
import { UserModel as User } from "../models/user.js"
import { clerkClient } from "../middlewares/clerk.js"
import { ClerkUserEvent } from "../types/index.js"

const logger = createLogger("user-service")

/**
 * Fetch a user by Clerk userId, throw HttpError(404) if not found
 * @param clerkUserId - The Clerk user ID
 * @returns The user document
 * @throws NotFoundError if user not found
 */
export async function getUserOrThrow(clerkUserId: string) {
    const user = await User.findOne({ userId: clerkUserId })
    if (!user) {
        throw new NotFoundError("User not found")
    }
    return user
}

function clerkApiUserToSignUpEvent(user: {
    id: string
    firstName: string | null
    lastName: string | null
    emailAddresses: { id: string; emailAddress: string }[]
    primaryEmailAddressId: string | null
}): ClerkUserEvent {
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

/**
 * Returns the Mongo user for a Clerk id, creating the document from Clerk when missing.
 * Used when local dev (or missed webhooks) skips POST /webhooks/clerk user.created.
 */
export async function ensureUserFromClerk(clerkUserId: string, projection?: Record<string, 0>) {
    let user = await User.findOne({ userId: clerkUserId }, projection)
    if (user) {
        return user
    }

    try {
        const clerkUser = await clerkClient.users.getUser(clerkUserId)
        await signUpHandler(clerkApiUserToSignUpEvent(clerkUser))
    } catch (error) {
        logger.error({ err: error, userId: clerkUserId }, "Failed to sync user from Clerk")
        throw new NotFoundError("User not found")
    }

    user = await User.findOne({ userId: clerkUserId }, projection)
    if (!user) {
        throw new NotFoundError("User not found")
    }
    return user
}

/**
 * Update a user's plan
 * @param userId - The user ID
 * @param plan - The plan to set
 */
export async function updateUserPlan(userId: string, plan: string) {
    logger.debug({ userId, plan }, "Updating user plan")
    await User.findOneAndUpdate({ userId }, { plan }, { new: true })
}

/**
 * Update free user credits (daily limit)
 * @param userId - The user ID
 */
export async function updateFreeUserCredits(userId: string) {
    logger.debug({ userId }, "Updating free user credits")
    await User.findOneAndUpdate({ userId }, { $inc: { credits: 5 } }, { new: true })
}

/**
 * Generates a username based on available user data
 * @param id - The user ID from Clerk
 * @param firstName - Optional first name
 * @param lastName - Optional last name
 * @returns The generated username
 */
export function generateUsername(id: string, firstName?: string, lastName?: string): string {
    if (firstName && lastName) {
        return `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${id.toLowerCase().slice(-6)}`
    }
    if (firstName) {
        return `${firstName.toLowerCase()}_${id.toLowerCase().slice(-6)}`
    }
    return id.toLowerCase().slice(-6)
}

/**
 * Handles user signup events from Clerk
 * @param evt The Clerk webhook event containing user data
 * @throws Error if user creation fails
 */
export async function signUpHandler(evt: ClerkUserEvent): Promise<void> {
    try {
        const { first_name, last_name, email_addresses, id } = evt.data

        if (!id) {
            throw new Error("User ID is required")
        }

        // Generate username with fallbacks
        const userName = generateUsername(id, first_name, last_name)

        // Get primary email with validation
        const email = email_addresses?.[0]?.email_address ?? ""
        if (!email) {
            logger.warn({ userId: id }, "No email provided for user")
        }

        // Check if user already exists
        const existingUser = await User.findOne({ userId: id })
        if (existingUser) {
            logger.warn({ userId: id }, "User already exists")
            return
        }

        // Create new user with validated data
        const newUser = new User({
            userName,
            email,
            userId: id,
            firstName: first_name ?? "",
            lastName: last_name ?? "",
            fullName: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
            referralCode: id.toLowerCase().slice(-6),
        })

        await newUser.save()
        logger.info({ userId: id }, "User created successfully")
    } catch (error) {
        logger.error({ err: error }, "Failed to create user")
        throw error // Re-throw to be handled by the webhook error handler
    }
}

/**
 * Deletes user data from Clerk
 * @param userId - The Clerk user ID
 */
export async function deleteClerkUserData(userId: string) {
    logger.debug({ userId }, "Deleting Clerk user data")
    try {
        const result = await clerkClient.users.deleteUser(userId)
        logger.debug({ result }, "Clerk deletion result")
    } catch (error) {
        logger.error({ err: error }, "Error deleting Clerk user data")
    }
}
