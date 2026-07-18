import { NextFunction, Request, Response } from "express"

import { createLogger } from "../lib/logger.js"

/* eslint-disable no-unused-vars */

const logger = createLogger("error-handler")

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error({ err, stack: err.stack }, "Request error")
    res.status(500).send({ errors: [{ message: "Something went wrong" }] })
}
/* eslint-disable no-unused-vars */
