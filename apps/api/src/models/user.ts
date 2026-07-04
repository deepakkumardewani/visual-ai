import mongoose from "mongoose"
import { v4 as uuidv4 } from "uuid"

import { ImageObjectSchema } from "./image.js"
import { PaymentSchema } from "./payment.js"

const Schema = mongoose.Schema

const ReferralSchema = new Schema({
    userId: { type: String, required: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    timestamp: { type: Date, required: true },
})
const UserSchema = new Schema(
    {
        userId: { type: String, required: true, unique: true, default: uuidv4 },
        userName: { type: String, required: true, unique: true },
        firstName: { type: String, required: false, default: "" },
        lastName: { type: String, required: false, default: "" },
        fullName: { type: String, required: false, default: "" },
        email: { type: String, required: false, unique: true, default: "" },
        plan: { type: String, enum: ["free", "pro"], default: "free" },
        subscriptionId: { type: String, required: false, default: "" },
        subscriptionStatus: {
            type: String,
            enum: ["active", "inactive"],
            default: "inactive",
        },
        credits: { type: Number, default: 20 },
        monthlyCredits: { type: Number, default: 1000 },
        referralCode: {
            type: String,
            unique: true,
            sparse: true,
        },
        referralsUsed: { type: [String], default: [] },
        referrals: {
            type: [ReferralSchema],
            default: [],
        },

        isPro: { type: Boolean, default: false },
        subscriptionEnd: { type: Date },
        payments: { type: [PaymentSchema], required: false, default: [] },
        history: { type: [ImageObjectSchema], required: true, default: [] },
        activities: [
            {
                action: {
                    type: String,
                    required: true,
                },
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
                image: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Image",
                },
            },
        ],
    },
    { timestamps: true },
)

// Add this pre-save hook
// UserSchema.pre("save", async function (next: () => void) {
//     if (this.isNew || this.isModified("userName")) {
//         const User = this.constructor as typeof UserModel
//         let userName = this.userName
//         let exists = await User.exists({ userName })

//         while (exists) {
//             const randomNum = Math.floor(10000 + Math.random() * 90000)
//             userName = `${this.userName}${randomNum}`
//             exists = await User.exists({ userName })
//         }

//         this.userName = userName
//     }
//     next()
// })

export const UserModel = mongoose.model("User", UserSchema)
