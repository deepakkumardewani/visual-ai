import moment from "moment"
import mongoose from "mongoose"

const Schema = mongoose.Schema

// interface IPayment {
//     userId: string
//     amount: number
//     currency: string
//     status: "created" | "completed" | "failed"
//     type: "subscription" | "credits"
//     subscriptionId?: string
//     metadata?: Record<string, any>
//     createdAt: Date
//     updatedAt: Date
// }

export const PaymentSchema = new Schema({
    transactionId: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        default: 0,
    },
    description: {
        type: String,
        default: "Credit Purchase",
    },
    status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
    },
    paymentMethod: {
        type: String,
        enum: ["credit_card", "paypal", "stripe"],
        required: true,
        default: "",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    humanReadableDate: {
        type: String,
        required: true,
        default: moment().format("MM/DD/YYYY"),
    },
})

export const PaymentModel = mongoose.model("Payment", PaymentSchema)
