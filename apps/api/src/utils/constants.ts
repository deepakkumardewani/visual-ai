import { RazorpayProduct } from "../types/index.js"

export const MODEL_IDS = {
    FLUX_QUICK: `black-forest-labs/flux-schnell`,
    FLUX_BASIC: `black-forest-labs/flux-dev`,
    FLUX_PRO: `black-forest-labs/flux-pro`,
    FLUX_1_1_PRO: `black-forest-labs/flux-1.1-pro`,
    FLUX_REALISM: `xlabs-ai/flux-dev-realism:39b3434f194f87a900d1bc2b6d4b983e90f0dde1d5022c27b52c143d670758fa`,
    UPSCALE_IMAGE:
        "philz1337x/clarity-upscaler:dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e",
    COLORIZE_BASIC:
        "arielreplicate/deoldify_image:0da600fab0c45a66211339f1c16b71345d22f26ef5fea3dca1bb90bb5711e950",
    COLORIZE_ADVANCED:
        "piddnad/ddcolor:ca494ba129e44e45f661d6ece83c4c98a9a7c774309beca01429b58fce8aa695",
    REVIVE: `tencentarc/gfpgan:0fbacf7afc6c144e5be9767cff80f25aff23e52b0708f17e20f9879b2f21516c`,
    OLD_PHOTOS: `microsoft/bringing-old-photos-back-to-life:c75db81db6cbd809d93cc3b7e7a088a351a3349c9fa02b6d393e35e0d51ba799`,
}

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
