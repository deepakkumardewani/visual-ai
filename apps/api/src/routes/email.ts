import { Router, type Request, type Response } from "express"

import { asyncHandler } from "../lib/async-handler.js"
import { verifyUnsubscribeToken } from "../lib/unsubscribe-token.js"
import { UserModel } from "../models/user.js"

export const emailRoutes = Router()

const UNSUBSCRIBE_PATH = "/email/unsubscribe"
const HTTP_BAD_REQUEST = 400

interface PageContent {
    testId: string
    title: string
    message: string
    /** Extra markup rendered below the message (static, never user input). */
    extra?: string
}

function renderPage({ testId, title, message, extra = "" }: PageContent): string {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title} - Visual AI</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f1ec;color:#1f1b16;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
main{box-sizing:border-box;width:100%;max-width:440px;margin:16px;padding:32px 24px;background:#fff;border-radius:12px;text-align:center}
h1{font-size:22px;margin:0 0 12px}
p{font-size:16px;line-height:24px;color:#6b6258;margin:0 0 20px}
button{background:#c98a5a;color:#fff;border:0;border-radius:8px;padding:12px 28px;font-size:16px;font-weight:700;cursor:pointer}
</style>
</head>
<body>
<main data-testid="${testId}">
<h1>${title}</h1>
<p>${message}</p>
${extra}
</main>
</body>
</html>`
}

const invalidLinkPage = renderPage({
    testId: "unsubscribe-invalid",
    title: "This link is not valid",
    message:
        "The unsubscribe link is missing, damaged or out of date. Please use the link in the latest email we sent you.",
})

function readToken(req: Request): string | null {
    const { token } = req.query
    return typeof token === "string" && token.length > 0 ? token : null
}

function sendHtml(res: Response, status: number, html: string): void {
    res.status(status)
        .set({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" })
        .send(html)
}

function confirmPage(token: string): string {
    const action = `${UNSUBSCRIBE_PATH}?token=${encodeURIComponent(token)}`
    return renderPage({
        testId: "unsubscribe-confirm",
        title: "Unsubscribe from Visual AI emails?",
        message: "You will no longer receive product announcements from us.",
        extra: `<form method="post" action="${action}"><button type="submit" data-testid="unsubscribe-submit">Unsubscribe</button></form>`,
    })
}

emailRoutes.get(UNSUBSCRIBE_PATH, (req: Request, res: Response) => {
    const token = readToken(req)
    if (!token || !verifyUnsubscribeToken(token)) {
        return sendHtml(res, HTTP_BAD_REQUEST, invalidLinkPage)
    }
    sendHtml(res, 200, confirmPage(token))
})

// Also the RFC 8058 one-click target, so it must work without a body or cookies.
emailRoutes.post(
    UNSUBSCRIBE_PATH,
    asyncHandler(async (req: Request, res: Response) => {
        const token = readToken(req)
        const userId = token ? verifyUnsubscribeToken(token) : null
        if (!userId) {
            return sendHtml(res, HTTP_BAD_REQUEST, invalidLinkPage)
        }
        await UserModel.updateOne({ userId }, { $set: { emailOptOut: true } })
        sendHtml(
            res,
            200,
            renderPage({
                testId: "unsubscribe-success",
                title: "You are unsubscribed",
                message: "We will not send you product announcements again.",
            }),
        )
    }),
)
