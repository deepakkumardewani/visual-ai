// Re-export shared domain types
export { FeatureType } from "@visual-ai/shared"

export type {
    IImage,
    IImageObject,
    ExploreFeedItem,
    ExploreFeedResponse,
    JobStatus,
    RazorpayProduct,
    IPayment,
    IReferral,
    IUser,
} from "@visual-ai/shared"

export type {
    AIImageInput,
    UpscaleInput,
    ColorizeInput,
    RemoveBgInput,
    ReviveInput,
    Body,
    Props,
} from "@visual-ai/shared"

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
