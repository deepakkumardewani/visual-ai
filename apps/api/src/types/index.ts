export interface RazorpayProduct {
    id: number
    type: string
    credits: number
    price: number
    savings?: string
    description: string
    currency: string
}

export enum FeatureType {
    IMAGE = "image",
    UPSCALE = "upscale",
    COLORIZE = "colorize",
    REVIVE = "revive",
}

// Image
export interface IImage {
    name: string
    aiImagePublicId?: string
    originalPublicId?: string
    enhancedPublicId?: string
    aiImageUrl?: string
    originalImageUrl?: string
    enhancedImageUrl?: string
    resolution: string
    aspectRatio: string
    width: number
    height: number
    format: string
    bytes: number
}
export interface IImageObject {
    _id?: string
    userId: string
    prompt: string
    featureType: FeatureType
    modelName?: string
    imageType?: string
    isFavorite?: boolean
    images: IImage[]
    humanReadableDate?: string
    createdAt?: Date
}

// Payment
export interface IPayment {
    transactionId: string
    amount: number
    description: string
    status: string
    paymentMethod: string
    createdAt: Date
    humanReadableDate: string
}

export interface IReferral {
    userId: string
    userEmail: string
    userName: string
    timestamp: Date
}

export interface IUser {
    userId: string
    userName: string
    firstName: string
    lastName: string
    fullName: string
    email: string
    plan: string
    subscriptionId: string
    credits: number
    monthlyCredits: number
    isPro: boolean
    referralCode: string
    referrals: IReferral[]
    subscriptionEnd: Date
    payments: IPayment[]
    history: IImageObject[]
    favorites: IImageObject[]
    activities: { action: string; timestamp: Date; image: IImageObject }[]
}

// Clerk

export interface ClerkUserEvent {
    data: {
        backup_code_enabled: boolean
        banned: boolean
        create_organization_enabled: boolean
        created_at: number
        delete_self_enabled: boolean
        email_addresses: EmailAddress[]
        enterprise_accounts: any[]
        external_accounts: ExternalAccount[]
        external_id: string | null
        first_name: string
        has_image: boolean
        id: string
        image_url: string
        last_active_at: number
        last_name: string
        last_sign_in_at: string | null
        legal_accepted_at: string | null
        locked: boolean
        lockout_expires_in_seconds: number | null
        mfa_disabled_at: string | null
        mfa_enabled_at: string | null
        object: string
        passkeys: any[]
        password_enabled: boolean
        phone_numbers: any[]
        primary_email_address_id: string
        primary_phone_number_id: string | null
        primary_web3_wallet_id: string | null
        private_metadata: Record<string, any>
        profile_image_url: string
        public_metadata: Record<string, any>
        saml_accounts: any[]
        totp_enabled: boolean
        two_factor_enabled: boolean
        unsafe_metadata: Record<string, any>
        updated_at: number
        username: string | null
        verification_attempts_remaining: number
        web3_wallets: any[]
    }
    event_attributes: {
        http_request: {
            client_ip: string
            user_agent: string
        }
    }
    object: string
    timestamp: number
    type: string
}

interface EmailAddress {
    created_at: number
    email_address: string
    id: string
    linked_to: LinkedAccount[]
    matches_sso_connection: boolean
    object: string
    reserved: boolean
    updated_at: number
    verification: Verification
}

interface LinkedAccount {
    id: string
    type: string
}

interface Verification {
    attempts: number | null
    expire_at: number | null
    status: string
    strategy: string
}

interface ExternalAccount {
    approved_scopes: string
    created_at: number
    email_address: string
    family_name: string
    given_name: string
    google_id: string
    id: string
    label: string | null
    object: string
    picture: string
    public_metadata: Record<string, any>
    updated_at: number
    username: string | null
    verification: Verification
}

export interface JobStatus {
    status: string
    image: IImageObject | undefined
    userCreditsRemaining: number | null
    progress?: number
}

export interface Body {
    userId: string
    jobId: string
    modelId?: string
    filePath?: string
    name?: string
    aiImagePublicId?: string
    modelName?: string
    numOfOutputs?: number
    outputQuality?: number
    outputFormat?: string
    originalPublicId?: string
    enhancedPublicId?: string
    imageType?: string
    resolution?: string
    aspectRatio?: string
    width?: number
    height?: number
    format?: string
    bytes?: number
    prompt?: string
    creativity?: number
    scale?: number
    negativePrompt?: string
}

export interface Props {
    body: Body
    filePath: string
    fileName: string
}
// Interface for AI image generation input parameters
export interface AIImageInput {
    prompt: string
    output_quality: number
    num_outputs?: number
    aspect_ratio: string
    output_format: string
}

export interface UpscaleInput {
    image: string
    prompt: string
    creativity: number
    scale_factor: number
    negative_prompt: string
    output_format: string
}

export interface ColorizeInput {
    image: string
}

export interface ReviveInput {
    img: string
}
