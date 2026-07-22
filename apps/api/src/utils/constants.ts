import { RazorpayProduct } from "../types/index.js"

export const RAZORPAY_PRODUCTS: RazorpayProduct[] = [
    {
        id: 1,
        type: "single",
        credits: 200,
        price: 130,
        description: "200 credits",
        currency: "INR",
    },
    {
        id: 2,
        type: "single",
        credits: 450,
        price: 290,
        savings: "10%",
        description: "450 credits",
        currency: "INR",
    },
    {
        id: 3,
        type: "single",
        credits: 960,
        price: 500,
        savings: "20%",
        description: "960 credits",
        currency: "INR",
    },
    {
        id: 4,
        type: "single",
        credits: 2000,
        price: 900,
        savings: "30%",
        description: "2000 credits",
        currency: "INR",
    },
    {
        id: 5,
        type: "monthly",
        credits: 300,
        price: 100,
        description: "300 credits",
        currency: "INR",
    },
]
