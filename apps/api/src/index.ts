import { NextFunction, Request, Response } from "express"

import { app } from "./app.js"

const { APP_PORT, APP_SERVER } = process.env

// eslint-disable-next-line no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack)
    res.status(401).send("Unauthenticated!")
})

/* catch 404 and forward to error handler */
app.use((_, res) => {
    res.status(404).json({
        message: "404 - Not Found",
    })
})

app.listen(APP_PORT, () => {
    console.log("===========================")
    console.log(`API running at ${APP_SERVER}:${APP_PORT}`)
    console.log("===========================")
})
