import { Router } from "express"
import { Request, Response } from "express"
import nodemailer from "nodemailer"

import { env } from "../config/env.js"
import { asyncHandler } from "../lib/async-handler.js"
import { BadRequestError, NotFoundError } from "../lib/errors.js"
import { UserModel as User } from "../models/user.js"
import { updateUserPlan, deleteClerkUserData } from "../services/user-service.js"
import { deleteCloudinaryUserData } from "../services/cloudinary-service.js"

export const userRoutes = Router()

// Get all users
userRoutes.get(
    "/users",
    asyncHandler(async (_, res: Response) => {
        const users = await User.find()
        res.status(200).json(users)
    }),
)

// Get user by id
userRoutes.get(
    "/users/:id",
    asyncHandler(async (req: Request, res: Response) => {
        const user = await User.findOne({ userId: req.params.id }, { collection: 0, activities: 0 })
        if (!user) {
            throw new NotFoundError("User not found")
        }
        res.status(200).json(user)
    }),
)

// Update a user's plan
userRoutes.get(
    "/users/update/plan",
    asyncHandler(async (req: Request, res: Response) => {
        const { userId, plan } = req.query
        await updateUserPlan(userId as string, plan as string)
        res.status(200).send("success")
    }),
)

// Get the history of all images created by the user
userRoutes.get(
    "/users/history",
    asyncHandler(async (req: Request, res: Response) => {
        const { userId } = req.query
        const user = await User.findById(userId).populate("history")
        if (!user) {
            throw new NotFoundError("User not found")
        }
        res.json(user.history)
    }),
)

// Delete a user
userRoutes.delete(
    "/users/:id",
    asyncHandler(async (req: Request, res: Response) => {
        const userId = req.params.userId as string
        await User.deleteOne({ userId })
        await deleteCloudinaryUserData(userId)
        await deleteClerkUserData(userId)
        res.status(200).json({ message: "User deleted successfully" })
    }),
)

// Update user's userName
userRoutes.put(
    "/users/username",
    asyncHandler(async (req: Request, res: Response) => {
        const { userName, userId } = req.body
        if (!userName) {
            throw new BadRequestError("Username is required")
        }

        const existingUser = await User.findOne({ userName })
        if (existingUser && existingUser.userId !== userId) {
            throw new BadRequestError("Username already exists")
        }

        const updatedUser = await User.findOneAndUpdate({ userId }, { userName }, { new: true })

        if (!updatedUser) {
            throw new NotFoundError("User not found")
        }

        res.status(200).json({
            message: "Username updated successfully",
            user: updatedUser,
        })
    }),
)

// Update user's fullName
userRoutes.put(
    "/users/fullname",
    asyncHandler(async (req: Request, res: Response) => {
        const { firstName, lastName, userId } = req.body

        if (!firstName || !lastName) {
            throw new BadRequestError("Both first name and last name are required")
        }

        const fullName = `${firstName} ${lastName}`

        const existingUser = await User.findOne({ fullName })
        if (existingUser && existingUser.userId !== userId) {
            throw new BadRequestError("A user with this full name already exists")
        }

        const updatedUser = await User.findOneAndUpdate(
            { userId },
            { firstName, lastName, fullName },
            { new: true },
        )

        if (!updatedUser) {
            throw new NotFoundError("User not found")
        }

        res.status(200).json({
            message: "Full name updated successfully",
            user: updatedUser,
        })
    }),
)

// Apply referral code
userRoutes.post(
    "/users/apply-referral",
    asyncHandler(async (req: Request, res: Response) => {
        const { userId, userEmail, userName, referralCode } = req.body

        if (!userId || !referralCode) {
            throw new BadRequestError("User ID and referral code are required")
        }

        // Find the current user
        const currentUser = await User.findOne({ userId })
        if (!currentUser) {
            throw new NotFoundError("User not found")
        }

        // Check if user has already used this referral code
        if (currentUser.referralsUsed?.includes(referralCode)) {
            throw new BadRequestError("You have already used this referral code.")
        }

        // Find the referrer user
        const referrerUser = await User.findOne({ referralCode })
        if (!referrerUser) {
            throw new BadRequestError("Invalid referral code.")
        }

        // Prevent self-referral
        if (referrerUser.userId === userId) {
            throw new BadRequestError("You cannot use your own referral code.")
        }

        // Update current user's credits and add referral code to their list
        const updatedUser = await User.findOneAndUpdate(
            { userId },
            {
                $inc: { credits: 50 },
                $push: { referralsUsed: referralCode },
            },
            { new: true },
        )
        const referral = {
            userId,
            userEmail,
            userName,
        }
        // Update referrer's credits (credits only, no Pro upgrade)
        await User.findOneAndUpdate(
            { referralCode },
            {
                $inc: { credits: 50 },
                $push: { referrals: referral },
            },
            { new: true },
        )

        res.status(200).json({
            message: "Referral code applied successfully",
            credits: updatedUser?.credits,
            user: updatedUser,
        })
    }),
)

// Contact form endpoint
userRoutes.post(
    "/users/contact",
    asyncHandler(async (req: Request, res: Response) => {
        const { name, email, subject, message } = req.body

        if (!name || !email || !subject || !message) {
            throw new BadRequestError("All fields are required.")
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: env.EMAIL_USER,
                pass: env.EMAIL_PASSWORD,
            },
        })

        const mailOptions = {
            from: email,
            to: env.EMAIL_USER,
            subject: subject,
            text: message,
        }

        await transporter.sendMail(mailOptions)

        res.status(200).send({ success: "Form submitted successfully!" })
    }),
)
