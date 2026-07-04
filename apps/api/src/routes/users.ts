import { Router } from "express";
import { Request, Response } from "express";
import nodemailer from "nodemailer";

import {
  deleteClerkUserData,
  deleteCloudinaryUserData,
  updateUserPlan,
} from "../helpers/userRouteHelpers.js";
import { UserModel as User } from "../models/user.js";

export const userRoutes = Router();

// Get all users
userRoutes.get("/users", async (_, res: Response) => {
  try {
    const users = await User.find();
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).send(error);
  }
});
// Get user by id
userRoutes.get("/users/:id", async (req: Request, res: Response) => {
  try {
    const user = await User.findOne(
      { userId: req.params.id },
      { collection: 0, activities: 0 },
    );
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Update a user's plan
userRoutes.get("/users/update/plan", async (req: Request, res: Response) => {
  try {
    const { userId, plan } = req.query;
    updateUserPlan(userId as string, plan as string);
    return res.status(200).send("success");
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Get the history of all images created by the user
userRoutes.get("/users/history", async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const user = await User.findById(userId).populate("history");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(user.history);
  } catch (error) {
    console.error("Error fetching user history:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Delete a user
userRoutes.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    console.log("userId", userId);

    await User.deleteOne({ userId });
    await deleteCloudinaryUserData(userId);
    await deleteClerkUserData(userId);

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Update user's userName
userRoutes.put("/users/username", async (req: Request, res: Response) => {
  try {
    const { userName, userId } = req.body;
    if (!userName) {
      return res.status(400).json({ message: "Username is required" });
    }

    const existingUser = await User.findOne({ userName });
    if (existingUser && existingUser.userId !== userId) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { userName },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Username updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating username:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Update user's fullName
userRoutes.put("/users/fullname", async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, userId } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({
        message: "Both first name and last name are required",
      });
    }

    const fullName = `${firstName} ${lastName}`;

    const existingUser = await User.findOne({ fullName });
    if (existingUser && existingUser.userId !== userId) {
      return res.status(409).json({
        message: "A user with this full name already exists",
      });
    }

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { firstName, lastName, fullName },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Full name updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating full name:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Apply referral code
userRoutes.post(
  "/users/apply-referral",
  async (req: Request, res: Response) => {
    try {
      const { userId, userEmail, userName, referralCode } = req.body;

      if (!userId || !referralCode) {
        return res.status(400).json({
          message: "User ID and referral code are required",
        });
      }

      // Find the current user
      const currentUser = await User.findOne({ userId });
      if (!currentUser) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // Check if user has already used this referral code
      if (currentUser.referralsUsed?.includes(referralCode)) {
        return res.status(400).json({
          message: "You have already used this referral code.",
        });
      }

      // Find the referrer user
      const referrerUser = await User.findOne({ referralCode });
      if (!referrerUser) {
        return res.status(400).json({
          message: "Invalid referral code.",
        });
      }

      // Update current user's credits and add referral code to their list
      const updatedUser = await User.findOneAndUpdate(
        { userId },
        {
          $inc: { credits: 50 },
          $push: { referralsUsed: referralCode },
        },
        { new: true },
      );
      const referral = {
        userId,
        userEmail,
        userName,
      };
      // Update referrer's credits
      await User.findOneAndUpdate(
        { referralCode },
        {
          $inc: { credits: 50 },
          $push: { referrals: referral },
          $set: { plan: "pro", isPro: true },
        },
        { new: true },
      );

      return res.status(200).json({
        message: "Referral code applied successfully",
        credits: updatedUser?.credits,
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error applying referral code:", error);
      return res.status(500).json({ message: "Server error" });
    }
  },
);

userRoutes.post("/users/contact", async (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).send({ error: "All fields are required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: email,
      to: process.env.EMAIL_USER,
      subject: subject,
      text: message,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).send({ success: "Form submitted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error: "Failed to send the message. Try again later.",
    });
  }
});
