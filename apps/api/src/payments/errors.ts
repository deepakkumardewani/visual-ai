const SECRET_PATTERN = /(?:whsec_|sk_|bearer\s)[^\s'"]+/gi

function sanitizeProviderMessage(message: string): string {
    return message.replace(SECRET_PATTERN, "[redacted]")
}

export class InvalidSignatureError extends Error {
    constructor(message = "Invalid webhook signature", options?: { cause?: unknown }) {
        super(message, options)
        this.name = "InvalidSignatureError"
    }
}

export class UnknownPackError extends Error {
    constructor(packId: string) {
        super(`Unknown credit pack: ${packId}`)
        this.name = "UnknownPackError"
    }
}

export class ProviderApiError extends Error {
    constructor(message: string, options?: { cause?: unknown }) {
        super(sanitizeProviderMessage(message), options)
        this.name = "ProviderApiError"
    }
}

export function asProviderApiError(error: unknown, fallbackMessage: string): ProviderApiError {
    if (error instanceof ProviderApiError) {
        return error
    }
    const message = error instanceof Error ? error.message : fallbackMessage
    return new ProviderApiError(message, { cause: error })
}
