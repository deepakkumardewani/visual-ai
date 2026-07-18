import { NextFunction, Request, Response } from "express"

/**
 * Async route handler wrapper that catches errors and passes them to Express error handler
 * This removes the need for try/catch boilerplate in every route
 * @param fn - Async route handler function
 */
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}
