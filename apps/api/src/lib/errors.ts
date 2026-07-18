/**
 * Application-specific error with HTTP status code
 */
export class HttpError extends Error {
    constructor(
        public statusCode: number,
        message: string,
    ) {
        super(message)
        this.name = "HttpError"
        Object.setPrototypeOf(this, HttpError.prototype)
    }
}

/**
 * 400 Bad Request error
 */
export class BadRequestError extends HttpError {
    constructor(message: string) {
        super(400, message)
        this.name = "BadRequestError"
    }
}

/**
 * 401 Unauthorized error
 */
export class UnauthorizedError extends HttpError {
    constructor(message: string = "Unauthorized") {
        super(401, message)
        this.name = "UnauthorizedError"
    }
}

/**
 * 403 Forbidden error
 */
export class ForbiddenError extends HttpError {
    constructor(message: string = "Forbidden") {
        super(403, message)
        this.name = "ForbiddenError"
    }
}

/**
 * 404 Not Found error
 */
export class NotFoundError extends HttpError {
    constructor(message: string = "Not found") {
        super(404, message)
        this.name = "NotFoundError"
    }
}

/**
 * Check if an error is an HttpError
 */
export function isHttpError(error: unknown): error is HttpError {
    return error instanceof HttpError
}
