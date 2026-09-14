import { describe, expect, it } from "vitest"

import {
    BadRequestError,
    ForbiddenError,
    HttpError,
    NotFoundError,
    UnauthorizedError,
    isHttpError,
} from "./errors.js"

describe("HttpError", () => {
    it("stores the status code and message", () => {
        const error = new HttpError(418, "I am a teapot")

        expect(error).toBeInstanceOf(Error)
        expect(error).toBeInstanceOf(HttpError)
        expect(error.statusCode).toBe(418)
        expect(error.message).toBe("I am a teapot")
        expect(error.name).toBe("HttpError")
    })
})

describe("BadRequestError", () => {
    it("uses status 400 and the provided message", () => {
        const error = new BadRequestError("Username is required")

        expect(error).toBeInstanceOf(HttpError)
        expect(error.statusCode).toBe(400)
        expect(error.message).toBe("Username is required")
        expect(error.name).toBe("BadRequestError")
    })
})

describe("UnauthorizedError", () => {
    it("defaults the message to Unauthorized", () => {
        const error = new UnauthorizedError()

        expect(error.statusCode).toBe(401)
        expect(error.message).toBe("Unauthorized")
        expect(error.name).toBe("UnauthorizedError")
    })

    it("accepts a custom message", () => {
        const error = new UnauthorizedError("Token expired")

        expect(error.statusCode).toBe(401)
        expect(error.message).toBe("Token expired")
    })
})

describe("ForbiddenError", () => {
    it("defaults the message to Forbidden", () => {
        const error = new ForbiddenError()

        expect(error.statusCode).toBe(403)
        expect(error.message).toBe("Forbidden")
        expect(error.name).toBe("ForbiddenError")
    })

    it("accepts a custom message", () => {
        const error = new ForbiddenError("Admins only")

        expect(error.message).toBe("Admins only")
    })
})

describe("NotFoundError", () => {
    it("defaults the message to Not found", () => {
        const error = new NotFoundError()

        expect(error.statusCode).toBe(404)
        expect(error.message).toBe("Not found")
        expect(error.name).toBe("NotFoundError")
    })

    it("accepts a custom message", () => {
        const error = new NotFoundError("User not found")

        expect(error.message).toBe("User not found")
    })
})

describe("isHttpError", () => {
    it("returns true for HttpError and subclasses", () => {
        expect(isHttpError(new HttpError(500, "fail"))).toBe(true)
        expect(isHttpError(new BadRequestError("bad"))).toBe(true)
        expect(isHttpError(new NotFoundError())).toBe(true)
    })

    it("returns false for generic errors and non-errors", () => {
        expect(isHttpError(new Error("plain"))).toBe(false)
        expect(isHttpError("string")).toBe(false)
        expect(isHttpError(null)).toBe(false)
        expect(isHttpError(undefined)).toBe(false)
    })
})
