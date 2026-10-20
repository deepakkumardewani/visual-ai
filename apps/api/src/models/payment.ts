import moment from "moment"
import mongoose from "mongoose"

const Schema = mongoose.Schema

/**
 * Payment rows for checkout history and webhook idempotency.
 * Embedded user payment arrays cannot carry a cross-document unique index;
 * atomic credit grants rely on conditional updates on the user document (see spec 5.5).
 */
export const PaymentSchema = new Schema({
    userId: {
        type: String,
        index: true,
    },
    transactionId: {
        type: String,
        required: true,
    },
    provider: {
        type: String,
        enum: ["razorpay", "dodo"],
        default: "razorpay",
    },
    providerPaymentId: {
        type: String,
    },
    providerSessionId: {
        type: String,
        index: true,
        sparse: true,
    },
    packId: {
        type: String,
    },
    credits: {
        type: Number,
    },
    currency: {
        type: String,
        default: "INR",
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
        enum: ["credit_card", "paypal", "stripe", "card", "upi", "other"],
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
