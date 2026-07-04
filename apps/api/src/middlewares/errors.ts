import { NextFunction, Request, Response } from "express"

/* eslint-disable no-unused-vars */

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err)
    res.status(500).send({ errors: [{ message: "Something went wrong" }] })
}
/* eslint-disable no-unused-vars */
