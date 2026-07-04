import cloudinary from "cloudinary"

import { clerkClient } from "../middlewares/clerk.js"
import { UserModel as User } from "../models/user.js"
import { ClerkUserEvent } from "../types"

export const deleteCloudinaryUserData = async (userId: string) => {
    console.log("deleteCloudinaryUserData", userId)
    try {
        const result = await cloudinary.v2.api.delete_resources_by_prefix(`${userId}/`)
        console.log("cloudinary result======", result)
    } catch (error) {
        console.log(error)
    }
}

export const deleteClerkUserData = async (userId: string) => {
    console.log("deleteClerkUserData", userId)
    try {
        const result = await clerkClient.users.deleteUser(userId)
        console.log("clerk result======", result)
    } catch (error) {
        console.log(error)
    }
}

/**
 * Handles user signup events from Clerk
 * @param evt The Clerk webhook event containing user data
 * @throws Error if user creation fails
 */
export const signUpHandler = async (evt: ClerkUserEvent): Promise<void> => {
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
            console.warn(`No email provided for user ${id}`)
        }

        // Check if user already exists
        const existingUser = await User.findOne({ userId: id })
        if (existingUser) {
            console.warn(`User ${id} already exists`)
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
        console.log(`User ${id} created successfully`)
    } catch (error) {
        console.error("Failed to create user:", error)
        throw error // Re-throw to be handled by the webhook error handler
    }
}

/**
 * Generates a username based on available user data
 */
export const generateUsername = (id: string, firstName?: string, lastName?: string): string => {
    if (firstName && lastName) {
        return `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${id.toLowerCase().slice(-6)}`
    }
    if (firstName) {
        return `${firstName.toLowerCase()}_${id.toLowerCase().slice(-6)}`
    }
    return id.toLowerCase().slice(-6)
}

export const updateUserPlan = async (userId: string, plan: string) => {
    const user = await User.findOne({ userId })

    if (!user) {
        return
    }

    if (plan === "pro") {
        user.plan = "pro"
        user.credits += 1000 // Add monthly credits
        user.isPro = true
        user.subscriptionEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // One month from now
    } else {
        user.plan = "free"
        user.credits = 10 // Reset to free credits
        user.isPro = false
        user.subscriptionEnd = null // Reset subscription end date for free users
    }

    await user.save()
}
