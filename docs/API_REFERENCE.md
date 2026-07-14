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

## Payments — [routes/payments.ts](../apps/api/src/routes/payments.ts)

| POST `/payments/subscription/create` | Razorpay subscription |
| POST `/payments/subscription/cancel` | Cancel (resets to free) |
| POST `/payments/order/create` | One-time credit order |
| POST `/payments/verify-payment` | Signature verification |
| POST `/payments` / GET `/payments/:id` | Record / fetch payment |

## Webhooks — [webhook/index.ts](../apps/api/src/webhook/index.ts)

| POST `/webhooks/...` (svix) | Clerk user lifecycle |
| POST `/webhooks/razorpay` | Payment/subscription events (+1000 credits monthly; reset to 10 on cancel) |

## Health

| GET `/healthcheck` | Liveness |

## Cron ([utils/cronJobs.ts](../apps/api/src/utils/cronJobs.ts))

- Daily 00:00 — free users with <20 credits reset to 20.
- Monthly 1st — pro users +500 credits, capped at 2000.
