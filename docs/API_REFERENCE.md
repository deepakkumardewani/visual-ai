# Visual AI — API Endpoint Reference

Express API in [apps/api/src](../apps/api/src). All routes mounted in [routes/index.ts](../apps/api/src/routes/index.ts). Auth = Clerk (`ClerkExpressRequireAuth`) — note the mounting-order caveat in ARCHITECTURE.md §8.

## Generate — [routes/generate.ts](../apps/api/src/routes/generate.ts)

| Method | Path                 | Purpose                                                                                                           |
| ------ | -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| GET    | `/progress?jobId=`   | Poll generation progress (Redis)                                                                                  |
| POST   | `/generate/image`    | Text→image (body: jobId, userId, modelId, modelName, prompt, imageType, numOfOutputs, outputQuality, imageFormat) |
| POST   | `/generate/upscale`  | Upscale an image                                                                                                  |
| POST   | `/generate/colorize` | Colorize (basic/advanced)                                                                                         |
| POST   | `/generate/revive`   | Restore old photos                                                                                                |

(Exact paths for the three utility POSTs: see lines 72–170 of generate.ts.)

## Users — [routes/users.ts](../apps/api/src/routes/users.ts)

| Method | Path                                  | Purpose               |
| ------ | ------------------------------------- | --------------------- |
| GET    | `/users`                              | List users            |
| GET    | `/users/:id`                          | Get user              |
| GET    | `/users/update/plan`                  | Update plan           |
| GET    | `/users/history`                      | Generation history    |
| DELETE | `/users/:id`                          | Delete account        |
| PUT    | `/users/username` / `/users/fullname` | Profile edits         |
| POST   | `/users/apply-referral`               | Referral credit grant |
| POST   | `/users/contact`                      | Contact form → email  |

## Credits — [routes/credits.ts](../apps/api/src/routes/credits.ts)

| POST `/credits` | Get balance (body: userId) |
| GET `/credits/daily/update` | +5 credit top-up |

## Images — [routes/image.ts](../apps/api/src/routes/image.ts)

| PUT `/image/favorite` | Toggle favorite |
| DELETE `/image/delete` | Delete one |
| DELETE `/image/delete/bulk` | Bulk delete |

## Payments — [payments/router.ts](../apps/api/src/payments/router.ts) (Clerk auth required)

| POST `/payments/checkout` | Start Dodo checkout for `{ packId }`; returns checkout URL / session id |
| GET `/payments` | List the caller's payment records (newest first) |
| GET `/payments/checkout/:sessionId/status` | Poll checkout status for a session owned by the caller |

## Webhooks

| POST `/webhooks/clerk` ([webhook/index.ts](../apps/api/src/webhook/index.ts), svix) | Clerk user lifecycle |
| POST `/webhooks/payments` ([payments/webhookRouter.ts](../apps/api/src/payments/webhookRouter.ts), raw body) | Dodo `payment.succeeded` / `payment.failed`; idempotent credit grant |

## Health

| GET `/healthcheck` | Liveness |

## Cron ([utils/cronJobs.ts](../apps/api/src/utils/cronJobs.ts))

- Daily 00:00 — free users with <20 credits reset to 20.
- Monthly 1st — pro users +500 credits, capped at 2000.
