# API Production-Readiness Review: `apps/api`

| | |
|---|---|
| **Date** | 2026-10-01 |
| **Branch** | `feature-enhancement` (HEAD `06ad57a`) |
| **Scope** | `apps/api/**`: 4,565 LOC across 50 source files, 50 test files, plus Dockerfile, compose and package config |
| **Method** | 5 parallel Sonnet reviewers (generation, payments/auth, content/media, platform/tooling, cross-cutting quality via `/review`). The Opus orchestrator then checked every Critical/High item against the code and ran small throwaway scripts (Express mount order, Mongoose filter casting). No project files were modified. No e2e or browser tests were run. |
| **Tooling** | `tsc --noEmit` ✅ 0 errors · `vitest run` ✅ 492/492 tests in 50 files |

---

## 1. Verdict

**Not production-ready.** Types are clean and all tests pass, but there are **6 Critical** money/identity defects that let users mint credits and act on other users' data. The test suite passes because it mostly asserts mock wiring, and in several places it **locks in the buggy behaviour** (see BE-046).

| Severity | Count | Meaning |
|---|---|---|
| 🔴 Critical | 6 | Exploitable now: free credits, cross-user data access, or unauthenticated user data |
| 🟠 High | 17 | Real money/data loss, outage risk, or a security gap needing one step from an attacker |
| 🟡 Medium | 25 | Correctness/reliability bugs, missing validation, ops gaps |
| ⚪ Low | 12 | Maintainability, duplication, naming, dead code |

### Orchestrator corrections to reviewer output (false positives removed)
- **Auth reach.** Two reviewers said *every* router after `routes/index.ts` is unauthenticated. A test script shows that `router.use(userRoutes, auth)` leaves **only `/users*`** open. The routers mounted after it are accidentally guarded by the *previous line's* Clerk middleware, which runs when `userRoutes` falls through. The fix is the same, but credits, payments, image, collections and explore are **reachable only by logged-in users**. The danger there is IDOR (BE-002), not anonymous access.
- **`/users/history`.** One reviewer said it is reachable. It is not: `GET /users/:id` is registered first and captures `history` as `:id` (verified).
- **`DELETE /users/:id`.** Mongoose 8.0 keeps `{ userId: undefined }` in the filter, so the driver sends `userId: null` and **nothing is deleted**. It cannot delete an arbitrary user. It still reports success and calls Clerk/Cloudinary with `undefined`.
- Unauthenticated requests currently get **HTTP 500 `{"error":"Unauthenticated"}`, not 401**. Clerk's `requireAuth` calls `next(new Error("Unauthenticated"))` (a plain `Error`), and the global handler maps anything that is not an `HttpError` to 500. This was added by the orchestrator under BE-014.

### Product decisions needed before fixing (ask the user)
| ID | Decision |
|---|---|
| D1 (BE-020) | Should the Explore feed be **public by default** or **opt-in** per generation? |
| D2 (BE-009) | Does credit cost **scale with `numOfOutputs`**, or should outputs be capped at 1 per credit cost? |
| D3 (BE-033) | Should moderation **fail closed** (block when the classifier errors) or fail open behind a flag? |
| D4 (BE-013) | Referral policy: **one referral per account**? Bonus amount = shared `REFERRAL_BONUS`? |
| D5 (BE-021) | Payments storage: a **standalone `Payment` collection** (recommended) or keep them embedded in `User`? |

---

## 2. How to read a finding

Each item has: **Evidence** (`path:line`, re-locate by symbol because lines drift) → **Problem** (concrete failure scenario) → **Fix guide** → **Test to add** → **Acceptance**. Paths are relative to `apps/api/src/` unless stated.

---

## 3. Findings

### 🔴 Critical

#### BE-001: `/users*` router is fully unauthenticated (auth mounted after routers)
- **Evidence:** `routes/index.ts:19-24`: `router.use(userRoutes, ClerkExpressRequireAuth({}) as any)` (and the same for 5 more routers). `routes/index.test.ts:45-52` asserts this exact order.
- **Problem:** Express runs `use(a, b)` in order. `userRoutes` answers matching requests before Clerk runs. Anonymous callers can `GET /users` (dumps **every user**: email, payments, history, referrals), `GET /users/:id`, `PUT /users/username|fullname`, `POST /users/apply-referral`, `POST /users/contact` and `DELETE /users/:id`. Other routers are protected only by accident: removing or reordering a line silently opens them.
- **Fix guide:** In `routes/index.ts`, mount the public routers first, then `router.use(requireAuth)` **once**, then all protected routers. Export a typed `requireAuth` from `middlewares/clerk.ts` and remove every `as any` / `@ts-ignore` (`routes/saved-prompts.ts:41,66,98`). Delete `GET /users` (no web caller) or gate it behind an admin check.
- **Test to add:** `routes/index.test.ts`: build a real express app from `router` with a stub auth that 401s. Assert `GET /users`, `PUT /users/username`, `GET /collections` and `POST /credits` → 401, and assert the handler spy was **not** called. Delete the mount-order assertion.
- **Acceptance:** Every non-public route returns 401 without a session. No `as any`/`@ts-ignore` remains around Clerk. Reordering routers cannot remove auth.

#### BE-002: Identity comes from the client (`userId` in body/query), not `req.auth.userId`: IDOR everywhere
- **Evidence:** `routes/generate.ts:84` (`body: req.body`) → `services/generation-service.ts:376` (`userId ?? ""`); `routes/credits.ts:13,23`; `routes/image.ts:16,25,38`; `routes/collections.ts:27,36,45,54,63,72`; `routes/users.ts:39,49,74,101,135`; `routes/payments.ts:25` (`req.body.id`); `routes/explore.ts:11` (`excludeUserId`); `middlewares/multer.ts:15` (`${body.userId}` in the Cloudinary folder). Only `routes/saved-prompts.ts:15-21` (`requireUserId`) does it correctly.
- **Problem:** Any logged-in user A sends `userId: "<B>"` and can spend B's credits on generations, read or rename/delete B's collections, favorite or delete B's images (including Cloudinary assets), rename B, and read B's balance. Ownership checks such as `assertOwnedCollection` compare against the attacker-supplied id, so they prove nothing. Victim ids leak publicly via `authorUserId` in the explore feed (BE-020).
- **Fix guide:** Move `requireUserId(req): string` from `routes/saved-prompts.ts` to `lib/auth.ts`; it throws `UnauthorizedError`. Every handler takes identity **only** from it, and `generate` jobs get `{ ...req.body, userId: requireUserId(req) }`. Remove `userId` from request schemas in `packages/shared` and update the web client callers (`apps/web/src/stores/*`, `utils/helpers.ts`, `utils/payment.ts`) so they stop sending it.
- **Test to add:** In each route test: "ignores body/query userId and uses req.auth.userId" (assert the service is called with the auth id when the body says `user_victim`).
- **Acceptance:** `grep -rnE "req\.(body|query|params)[^;]*userId|req\.body\.id" apps/api/src --include=*.ts | grep -v test` returns nothing. There is exactly one `requireUserId` definition.

#### BE-003: Razorpay webhook has no signature verification: anyone can mint credits
- **Evidence:** `webhook/index.ts:76-104`: `webhookRouter.post("/webhooks/razorpay", express.json(), …)` reads `payment.entity.notes.{userId,credits}` and does `$inc: { credits }`. There is no `X-Razorpay-Signature` check.
- **Problem:** The route is public (mounted before auth). One forged POST with `notes: { userId, credits: 1000000 }` grants unlimited credits. A non-numeric `credits` makes `$inc` throw; a negative one drains a victim.
- **Fix guide:** Use `express.raw({ type: "application/json" })`. Compute an HMAC-SHA256 of the raw body with a **new** env var `RAZORPAY_WEBHOOK_SECRET` (zod-validated in `config/env.ts`) and compare it to the header with `crypto.timingSafeEqual` after a length check. Return 400 on mismatch, then `JSON.parse` and zod-validate. Credits come from the server-side order record (BE-004), never from `notes.credits`.
- **Test to add:** `webhook/index.test.ts`: "rejects missing/invalid signature with 400 and never touches User"; "valid signature credits the server-side pack value, ignoring notes.credits".
- **Acceptance:** Forged or unsigned requests change no DB state.

#### BE-004: Pricing is client-controlled: the client picks the order amount *and* the credits granted
- **Evidence:** `routes/payments.ts:47-52`: `const { amount, currency, receipt } = req.body; razorpay.orders.create({ amount: amount * 100, … })`. In the web client, `apps/web/src/utils/payment.ts:49-51` sets checkout `notes: { credits: product.credits }`, which the webhook trusts.
- **Problem:** Even with BE-003 fixed, a user edits the checkout payload: pays ₹1, sets `notes.credits = 100000`, and Razorpay delivers a **genuinely signed** capture. Also `amount * 100` on floats gives fractional paise (`0.1*100 = 10.000000000000002`), which Razorpay rejects.
- **Fix guide:** Define packs (`id`, `pricePaise`, `credits`) once in `packages/shared` (move from `utils/constants.ts`). `POST /payments/order/create` accepts only `{ packId }` (zod), creates the order with `amount: pack.pricePaise`, `currency: "INR"`, a server-generated `receipt`, and `notes: { userId: requireUserId(req), packId }`, and persists `{orderId, userId, packId, credits, amount, status:"created"}`. The webhook looks the order up by `payment.entity.order_id` and verifies amount and currency. Name `PAISE_PER_RUPEE` if it is still needed.
- **Test to add:** `routes/payments.test.ts`: "ignores client amount; uses pack price", "400 on unknown packId", "attaches auth userId in notes". `webhook/index.test.ts`: "credits come from the stored order, not payment notes".
- **Acceptance:** The only inputs that affect money are `packId` (client) and the signed Razorpay event (server).

#### BE-005: `GET /credits/daily/update` is an unlimited +5-credit faucet
- **Evidence:** `routes/credits.ts:20-26` → `services/user-service.ts:37-40` `$inc: { credits: 5 }`. There is no web caller (`grep -r credits/daily apps/web/src` → none).
- **Problem:** Any logged-in user loops this endpoint (GET with a JSON body is parsed by `express.json`) and mints persistent credits for any `userId`. Each credit is real Replicate spend. The real daily mechanism is the `dailyCredits` cron reset, so this is legacy code.
- **Fix guide:** Delete the route, `updateFreeUserCredits`, and their tests. Change `POST /credits` to `GET /credits` using `requireUserId(req)` that returns `{ credits, dailyCredits }`, and update the web caller.
- **Test to add:** `routes/credits.test.ts`: "returns balance for req.auth.userId only"; route-table test "no /credits/daily/update route".
- **Acceptance:** No endpoint increases credits except the verified webhook (BE-003/004) and the referral flow (BE-013).

#### BE-006: The client controls generation inputs that cost money (see BE-002); Cloudinary paths are injectable
Covered by BE-002 for identity. Listed separately because the **upload path** is its own exploit surface:
- **Evidence:** `middlewares/multer.ts:12-28`: `folder: \`${basePath}/${body.userId}/${body.feature}\``, `format: body.format`.
- **Problem:** A caller writes into another user's Cloudinary folder or into arbitrary nested paths (`feature: "../x"`), and sets any `format`. If multer streams the file part before the fields, `req.body` is still empty and the folder is `base/undefined/undefined`.
- **Fix guide:** Use `requireUserId(req)` for the folder, whitelist `feature` against `FeatureType`, and drop `format` (let Cloudinary detect it) or whitelist `png|jpg|webp`.
- **Test to add:** `middlewares/multer.test.ts`: invert the current case at `:53-66` to "folder uses req.auth.userId, ignores body.userId", plus "rejects unknown feature".
- **Acceptance:** The upload folder is derived only from the auth user and a whitelisted feature.

### 🟠 High

#### BE-007: Credits are charged *after* the paid Replicate call, with no reservation or refund
- **Evidence:** `services/generation-service.ts:237-282`. Order: `replicate.run` → `buildImageObject` → `storeImageInDB` → `updateAndGetUserCredits` → `uploadToCloudinary`. `storeImageInDB` (`:120`) logs and continues when the user is missing, and `generation-service.test.ts:231` asserts "still continues".
- **Problem:** A zero-credit user can submit unlimited jobs; each one calls Replicate, then the deduction throws "Insufficient credits" while the image **stays in history**. Parallel submits all pass. If the Cloudinary upload fails after the deduction, the user is charged, the job shows `error`, and history holds an expiring Replicate URL.
- **Fix guide:** Split `runGenerationJob` into `reserveCredits` → `runModel` → `uploadAssets` → `persistHistory` → `finalize`. Reserve atomically **before** `replicate.run` (reuse the guarded `updateAndGetUserCredits` pipeline, throwing a typed `InsufficientCreditsError` → 402). On any later failure, refund via an atomic `$inc` that records which bucket (daily/persistent) the credits came from. Persist history only after the upload succeeds. Fail fast with `NotFoundError` if the user doesn't exist. Add a cheap balance pre-check in the route so the user gets a 402 immediately.
- **Test to add:** `generation-service.test.ts`: "no replicate call when credits insufficient", "refunds when upload fails", "fails before replicate for unknown user" (replace the `:231` test).
- **Acceptance:** A zero-balance user makes no Replicate call and gets no history entry. A failed job leaves the balance unchanged.

#### BE-008: `/progress` SSE: unauthenticated, resets finished jobs, unhandled async rejections
- **Evidence:** `routes/generate.ts:28-75`. `authenticateProgress` (`middlewares/clerk.ts:31`) is never mounted. Line 40 calls `setStatus(jobId, {status:"processing"})` on every connect. The `setInterval(async …)` and the handler body have no try/catch. Cleanup calls `deleteStatus` on every close. `authorizedParties` is hard-coded at `middlewares/clerk.ts:21`.
- **Problem:** Anyone with a jobId can read another user's result or delete its status. A reconnect after completion overwrites `completed` with `processing`, so the client waits forever. A Redis error inside the interval is an unhandled rejection, which **crashes the Node process**.
- **Fix guide:** Mount `authenticateProgress`. Make it 401 when `token` isn't a string, set `req.auth = { userId: payload.sub }`, type `next: NextFunction`, and build `authorizedParties` from `env.ALLOWED_ORIGINS` (a shared constant with CORS). Store the job owner (`job_owner:<id>` or inside the status) and 403 a mismatch. Remove the line-40 `setStatus`. Wrap the interval body in try/catch. On a terminal status, write once, clear the interval and `res.end()`. Delete the status only after a terminal state.
- **Test to add:** `routes/generate.test.ts`: "401 without token", "403 for other user's job", "does not overwrite completed status on connect", "interval Redis failure does not reject". `middlewares/clerk.test.ts`: "401 without calling verifyToken when token missing".
- **Acceptance:** Reconnecting after completion immediately yields `completed`, and there are no unhandled rejections.

#### BE-009: Generation parameters are unvalidated (outputs, prompt length, format)
- **Evidence:** `lib/model-input.ts:63-71` only checks `numOfOutputs > 1 && !fields.numOutputs`; the registry's `numOutputs.max` is never read. `utils/credit-calculator.ts:13-22` ignores output count. `normalizeOutputFormat` passes unknown values through.
- **Problem:** `numOfOutputs: 1000` (or `-1`, or `"4"`) goes straight to Replicate, which either fails or produces N images for one credit cost. A 100 kB prompt is sent to DeepSeek, the enhancer and Replicate.
- **Fix guide:** In `validateModelParams`, require an integer in `[1, fields.numOutputs.max]`, validate `outputFormat` and `outputQuality` against the registry, and enforce a string prompt ≤ `MAX_PROMPT_LENGTH` (a shared constant used by the web input too). Apply decision **D2** in `calculateCreditCost`.
- **Test to add:** `lib/model-input.test.ts`: "rejects numOfOutputs above max / non-integer", "rejects unknown outputFormat", "rejects prompt over max length".
- **Acceptance:** Out-of-range input returns 400 and never reaches Replicate.

#### BE-010: Bulk image delete trusts client `publicIds`, so a caller can delete any user's Cloudinary assets
- **Evidence:** `services/image-service.ts:59-73`: `deleteImagesByPublicIds(publicIds)` takes ids straight from the body, independent of `imageIds`.
- **Problem:** `publicIds: ["<victim>/…"]` deletes another user's files. Non-array input → 500. More than 100 ids exceeds Cloudinary's batch limit, and the failure is swallowed.
- **Fix guide:** Accept only `imageIds` (zod: `array(objectId).min(1).max(100)`). Load the caller's matching history entries, derive public ids server-side with a pure `getPublicIds(imageObject)` helper (shared with `deleteImageByObject`), delete those, then `$pull`. Update the web caller (`apps/web/src/utils/helpers.ts`) to stop sending `publicIds`.
- **Test to add:** `image-service.test.ts`: "bulk delete never passes a publicId not owned by the user".
- **Acceptance:** The input to Cloudinary delete comes only from the caller's own history.

#### BE-011: Uploads have no size/type limits
- **Evidence:** `middlewares/multer.ts:30` `multer({ storage })` has no `limits` and no `fileFilter`. `memoryUpload` trusts the client `mimetype` prefix.
- **Problem:** Arbitrary file types and sizes are streamed to Cloudinary on your bill, via the four `/generate/*/image` routes.
- **Fix guide:** Add `limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 }` and a mimetype allow-list `fileFilter` (shared constant with `utils/cloudinary.ts`). Optionally sniff magic bytes for `memoryUpload`.
- **Test to add:** `multer.test.ts`: "rejects >MAX_UPLOAD_BYTES", "rejects non-image mimetype".
- **Acceptance:** Oversize and non-image uploads get 400/413 before reaching Cloudinary.

#### BE-012: `routes/users.ts` has broken and half-baked routes
- **Evidence:** `routes/users.ts`:
  - `:24` `GET /users/:id` is registered before `:46` `GET /users/history`, so history is unreachable (verified). History also uses `findById(clerkId)`, which raises a CastError.
  - `:59-66` `DELETE /users/:id` reads `req.params.userId`, which is always `undefined`. It deletes nothing, calls Cloudinary/Clerk with `undefined`, and returns success. `users.test.ts:173-184` passes `params.userId` and so asserts the bug.
  - `:36-43` `GET /users/update/plan` mutates on GET, and `plan` is not in the schema, so it is a silent no-op that returns `"success"` (`services/user-service.ts:28-31`).
  - None of `/users/history`, `/users/update/plan` or `GET /users` has a web caller.
- **Fix guide:** Delete `GET /users`, `/users/history`, `/users/update/plan` and `updateUserPlan`. Make account deletion `DELETE /users/me` using `requireUserId`. Run Clerk → Cloudinary → DB in order and propagate errors (BE-029). Return a public projection for `GET /users/:id`, or replace it with `/users/me`. Move the logic into `services/user-service.ts`.
- **Test to add:** `routes/users.test.ts` (real router dispatch): "DELETE /users/me deletes the auth user", "unknown routes 404".
- **Acceptance:** No route reports success for a write that did nothing.

#### BE-013: Referral apply is non-atomic, replayable and farmable
- **Evidence:** `routes/users.ts:131-193`. It does a read-then-check (`referralsUsed.includes`) followed by two separate `findOneAndUpdate` calls with a hard-coded `$inc: { credits: 50 }` (twice). `userEmail`/`userName` come from the body. The required `referral.timestamp` is never set.
- **Problem:** Concurrent requests both pass the check and double-credit both parties. One account can apply unlimited different codes. The first update can succeed while the second fails (half-applied). Spoofed PII gets written onto the referrer's document.
- **Fix guide:** Create `services/referral-service.ts` `applyReferral({ userId, referralCode })`. Use one guarded update (`{ userId, referralsUsed: { $size: 0 } }` per D4), then credit the referrer only on a non-null result, inside a transaction if the cluster supports it. Use shared `REFERRAL_BONUS`. Take referee name/email from the DB, set `timestamp`, and zod-validate the code.
- **Test to add:** `referral-service.test.ts`: "second/concurrent apply returns 400 and grants nothing", "uses REFERRAL_BONUS".
- **Acceptance:** N concurrent applies produce exactly one grant to each party.

#### BE-014: Error handling leaks internals, returns 500 for unauthenticated requests, and uses three competing handlers
- **Evidence:**
  - `app.ts:95-100` returns `{ error: err.message }` for every error, including 500s.
  - `index.ts:11-26` has a second handler that is never reached.
  - `middlewares/errors.ts:9` `errorHandler` is unused (only its test imports it).
  - The 404 handler lives in `index.ts`, so it is absent from `app` in tests.
  - Clerk's `next(new Error("Unauthenticated"))` → **500**.
  - CORS rejection `app.ts:33-39` `callback(new Error(...))` → 500.
  - Body-parser errors → 500.
- **Problem:** Mongo, Cloudinary and Razorpay messages (hostnames, validation internals) reach clients. Clients cannot distinguish 401 from a crash. Every module uses a different error shape (`{error}`, `{message,status}`, `{errors:[]}`, `{message}`).
- **Fix guide:** Keep one `errorHandler` + `notFoundHandler` in `middlewares/errors.ts`, registered in `app.ts`. It maps `HttpError` to its status, Clerk `Unauthenticated` to 401, body-parser `err.type` to 400/413, and everything else to a generic `"Internal server error"`, logging with `req.id`. Pick one shape, `{ message, status }`, and check `apps/web` interceptors for the field they read. Delete the handler in `index.ts`. Make CORS call `callback(null, false)` and type it with `CorsOptions`.
- **Test to add:** `middlewares/errors.test.ts`: "Error('mongo://secret') → 500 generic body", "Unauthenticated → 401", "malformed JSON → 400". `app.test.ts`: "disallowed origin → no ACAO header, not 500".
- **Acceptance:** One handler is registered, no 500 body contains a raw message, and an unauthenticated request returns 401.

#### BE-015: Shutdown, timeouts and process-level errors
- **Evidence:** `index.ts:38-50` calls `worker.close()` → `redis.quit()` → `exit(0)`. The result of `app.listen` is discarded. Mongoose, `queueConnection` and the cron/periodic tasks are never closed. There are no `unhandledRejection`/`uncaughtException` handlers. `replicate.run` (`generation-service.ts:237`) has no timeout or signal. `connectDB()` is not awaited before `listen` (`app.ts:78`).
- **Problem:** On SIGTERM, in-flight requests and SSE streams are cut. `worker.close()` waits indefinitely on a hung prediction, so the orchestrator SIGKILLs mid-job, which then re-runs as a stalled job (BE-018).
- **Fix guide:** In `index.ts`: `await connectDB()` → `const server = app.listen(...)`. Add a re-entry-guarded `shutdown()` that runs `server.close()` → `worker.close()` → `generationQueue.close()` / `queueConnection.quit()` → `mongoose.connection.close()` → `redisClient.quit()` → stop cron tasks, with a `SHUTDOWN_TIMEOUT_MS` force-exit (code 1). Add process handlers that log via pino and call shutdown. Pass `AbortSignal.timeout(REPLICATE_TIMEOUT_MS)` to `replicate.run`. Make `stopPeriodicHealthCheck` actually `.stop()` the stored task (it is a placeholder at `periodic-health-check-service.ts:53-57`).
- **Test to add:** `index.test.ts`: "SIGTERM closes server, worker, queue, mongo, redis", "forces exit after timeout". `generation-service.test.ts`: "error status when replicate exceeds timeout".
- **Acceptance:** SIGTERM exits cleanly within the timeout, and a hung prediction frees its slot.

#### BE-016: No helmet, rate limiting or trust-proxy, on routes that spend paid APIs
- **Evidence:** No `helmet`/`rate-limit`/`trust proxy` anywhere in `src` or `package.json`. `/generate/*`, `/prompt/*` (DeepSeek/Anthropic; `describe` accepts up to 10 MB images) and `/users/contact` (Gmail SMTP) are unthrottled. `app.ts:89` has a redundant `router.use(express.json())`. The `withTimeout` helpers in `prompt-actions.ts`/`prompt-moderation.ts` don't abort the upstream call and leak timers.
- **Problem:** One valid (or stolen) token can burn the LLM, Replicate and Gmail quotas. Behind nginx, `req.ip` is the proxy's address.
- **Fix guide:** Add `helmet()`, `app.disable("x-powered-by")` and `app.set("trust proxy", TRUST_PROXY_HOPS)`. Add `express-rate-limit` with a Redis store: a global limit plus stricter limits on generate/prompt/contact/payments, keyed by auth userId (fallback IP). Set an explicit JSON body limit constant. Replace both `withTimeout` copies with one `lib/timeout.ts` built on `AbortSignal.timeout` and passed to `generateText`.
- **Test to add:** `app.test.ts`: "sets security headers", "429 after N /prompt calls".
- **Acceptance:** Bursts get 429, headers are present, and a timed-out LLM call is aborted.

#### BE-017: Container healthchecks probe a route that doesn't exist
- **Evidence:** `apps/api/Dockerfile:62` and `infra/docker-compose.yml:48,79` probe `http://localhost:3001/health`. The only route is `/healthcheck` (`routes/healthcheck.ts:11`). `APP_PORT` defaults to 8080.
- **Problem:** The containers are permanently `unhealthy`, so `depends_on: service_healthy` and any orchestrator restart policy misbehave.
- **Fix guide:** Add `GET /health` (static liveness, no dependencies). Keep `/healthcheck` as readiness (BE-037). Use `process.env.APP_PORT` in the probes and align the port defaults.
- **Test to add:** `routes/healthcheck.test.ts`: "GET /health 200 without touching mongo/redis".
- **Acceptance:** `docker inspect` reports `healthy`.

#### BE-018: Job retries and stalled jobs can double-run Replicate, double-store and double-charge
- **Evidence:** `queue/generation-queue.ts:23` `attempts: 2`. The catch block `setStatus` in `generation-service.ts:287-298` is unguarded. Deterministic validation errors are retried. Nothing marks a job as "already charged".
- **Problem:** A Redis blip in the catch block, or a worker killed mid-job, causes BullMQ to re-run the job: a second Replicate call, a second history entry, a second deduction.
- **Fix guide:** Add an idempotency marker (`SET NX job_charged:<jobId>` at reservation, checked before reserve/persist). Throw bullmq `UnrecoverableError` for validation errors. Wrap the catch-block `setStatus` in try/catch.
- **Test to add:** `generation-service.test.ts`: "second run of same jobId neither charges nor stores". `generation-worker.test.ts`: "validation error is UnrecoverableError".
- **Acceptance:** Running the same jobId twice produces one charge and one history entry.

#### BE-019: Explore feed scans every user's whole history on every page
- **Evidence:** `services/explore-service.ts:112-118,146-157`: the pipeline is `User.aggregate([{ $unwind: "$history" }, { $match }, { $sort }, { $limit }])`, with no leading `$match`, no index and no `allowDiskUse`. `getExploreItemById` has the same shape.
- **Problem:** Each request is O(all images). Once the data grows, the in-memory `$sort` passes 100 MB and errors ("Sort exceeded memory limit").
- **Fix guide:** Short term: add a leading `$match` on indexed fields plus an index on `history._id` / `history.createdAt`, and lead `getExploreItemById` with `$match: {"history._id": oid}`. Proper fix: a feed collection, or the unused `ImageModel`, written at generation time with a `{createdAt:-1,_id:-1}` index. This also solves BE-020 and BE-047.
- **Test to add:** `explore-service.test.ts`: "first pipeline stage is $match".
- **Acceptance:** `explain()` shows IXSCAN with no in-memory sort.

#### BE-020: Explore publishes every user's prompts, names and internal Clerk id with no opt-in *(decision D1)*
- **Evidence:** `services/explore-service.ts:28-40,95-99`. There is no visibility field in `models/image.ts`. `GET /explore/items/:id` returns any generation.
- **Problem:** Private prompts and full names become public, and `authorUserId` feeds the IDOR in BE-002.
- **Fix guide:** Add `isPublic` (default per D1) and filter on it in both queries. Return an opaque author handle and username (not the full name), and never `authorUserId`.
- **Test to add:** `explore-service.test.ts`: "excludes non-public items", "response has no authorUserId".
- **Acceptance:** Private generations never appear, and no internal ids are exposed.

#### BE-021: Billing history is always empty; `/payments/:id` is an IDOR *(decision D5)*
- **Evidence:** `routes/payments.ts:22-40`: `Payment.find({ userId })`, but the `Payment` schema has no `userId` field and **nothing writes to the collection**. The webhook only `$push`es embedded copies into `User.payments` (`webhook/index.ts:87,100`). `Payment.findById(id)` has no owner check. The web client (`components/Profile/Payments.vue`) uses this endpoint.
- **Problem:** Users never see their purchases, and any user can fetch any payment by id.
- **Fix guide:** Per D5, create a standalone `Payment` collection (`userId` indexed, `transactionId` unique, `orderId`, `amount` in integer paise, `currency`, `credits`, `status`). The webhook inserts into it (which also gives idempotency for BE-022). `GET /payments` → `find({ userId: requireUserId(req) })`; `GET /payments/:id` → `findOne({ _id, userId })`, 404 when null.
- **Test to add:** `payments.test.ts`: "lists only the auth user's payments", "404 for another user's payment".
- **Acceptance:** A purchase via the webhook appears in billing history.

#### BE-022: Razorpay webhook is not idempotent: retries double-credit
- **Evidence:** `webhook/index.ts:97-104`: an unconditional `$push` + `$inc`, with no processed-event check. A 404 for an unknown user makes Razorpay retry forever.
- **Problem:** Razorpay retries on timeouts and non-2xx responses, and can deliver duplicates. Each delivery adds the credits again.
- **Fix guide:** Insert the `Payment` (unique `transactionId`) first. On E11000, respond 200 and do nothing. Only then `$inc`. Respond 200 for unknown users after logging, so retries don't loop.
- **Test to add:** `webhook/index.test.ts`: "same payment id delivered twice credits once".
- **Acceptance:** N deliveries of one event produce exactly one increment.

#### BE-023: Contact form is an open, unthrottled mail relay
- **Evidence:** `routes/users.ts:195-222`: `from: email` (client input), no validation or length cap, a new SMTP transporter per request, and the endpoint is unauthenticated (BE-001).
- **Problem:** Spam and quota abuse can get the Gmail account suspended. Gmail rewrites `from`, so replies are lost anyway.
- **Fix guide:** Create `services/contact-service.ts` using one shared transporter (exported from `email-notification-service.ts`) with `from: env.EMAIL_USER`, `replyTo: email`. Zod-validate (`email()`, max lengths) and apply a strict rate limit (BE-016).
- **Test to add:** "rejects invalid email", "from is the service account; replyTo is user email".
- **Acceptance:** Malformed input → 400, bursts → 429.

### 🟡 Medium

| ID | Title | Evidence | Fix guide (short) | Test / Acceptance |
|---|---|---|---|---|
| BE-024 | `verify-payment` uses a non-constant-time compare and creates two sources of truth | `routes/payments.ts:59-72` (`===`; not `asyncHandler`). Web `utils/payment.ts:77-87` adds credits locally on success. | Validate the three strings and use `crypto.timingSafeEqual` after a length check. Confirm the order belongs to `requireUserId`. Make it a status check that returns the **server** balance; the web client must refetch credits, not add them locally. Remove the `crypto` npm dependency (BE-041). | "mismatched-length signature → 400, no throw"; the client shows the server balance. |
| BE-025 | Razorpay webhook leaks the user document and hangs on other events | `webhook/index.ts:111-122`: `json({ user })`; `else { return }` sends no response | Always reply 200 `{ received: true }` and never return user data. Extract `handlePaymentCaptured()` into a service. | "ignored event → 200 immediately", "body has no user". |
| BE-026 | Clerk webhook: `new Response` never sent, unhandled rejection, handles every event type | `webhook/index.ts:20-67`: `return new Response(...)`; `await signUpHandler(evt)` outside try/catch; `evt: any`; error text echoed | Use `res.status(400).json`, wrap in `asyncHandler`, type with `WebhookEvent`. Create users only on `user.created`, handle `user.deleted`/`user.updated`. Upsert with `$setOnInsert` (idempotent). Don't echo messages. | "missing svix headers → 400 JSON", "user.updated does not create", "duplicate user.created is a no-op". |
| BE-027 | Email-less sign-ups collide on the unique index | `models/user.ts:23` `unique: true, default: ""` | Drop the default and use `sparse: true` (or a partial index). Set `email` only when present and pick the primary email via `primary_email_address_id`. | Two email-less users can be created. |
| BE-028 | Payment schema enums don't match what is written | `models/payment.ts:32-51`: enum `credit_card/paypal/stripe` vs Razorpay values; `humanReadableDate: default: moment().format()` is evaluated **once at module load** (same in `models/image.ts:33`) | Use Razorpay enums (method, status). Delete `humanReadableDate` (derive from `createdAt`), `moment` and the commented-out interface. | `validateSync` passes on a real capture fixture, and the default date is per-document. |
| BE-029 | User deletion swallows errors and runs out of order | `services/user-service.ts:111-118` (Clerk error logged, swallowed); `services/cloudinary-service.ts:27-34` | Propagate errors (502). Order Clerk → Cloudinary → DB, or soft-delete plus a cleanup job. Keep payment records. | "Clerk failure → non-2xx". |
| BE-030 | Daily reset: host timezone, no catch-up, import side effect | `utils/cronJobs.ts:11-22`: `cron.schedule("0 0 * * *")` with no timezone; `import "./utils/cronJobs.js"` in `app.ts`; `ENABLE_CRON` also toggles emails | Pass `{ timezone: "UTC" }` and add a lazy reset on deduction (`dailyCreditsResetAt`). Export `startCronJobs()`, called from `index.ts`. Split `ENABLE_CRON`/`ENABLE_ALERT_EMAILS`. Rename to `cron-jobs.ts`. | "schedules with explicit timezone", "missed reset recovered on next deduct". |
| BE-031 | Client-controlled `jobId`: duplicates are a silent no-op that resets status | `queue/generation-queue.ts:36-42` sets status then `add({ jobId })`; `routes/generate.ts:84` | Generate the jobId server-side (uuid) and return it in the 202. Set status only after a successful `add`. Return 409 on an existing job. Update the web client to use the returned id. | "duplicate jobId → 409, status untouched". |
| BE-032 | `/prompt/*` has no input cap | `routes/prompt.ts:24-30`: any non-empty string; `describe` accepts any mimetype | Apply `MAX_PROMPT_LENGTH` (shared with BE-009) and a mimetype allow-list. Rate limiting is in BE-016. | "prompt over max → 400". |
| BE-033 | Moderation fails open and skips the enhanced prompt *(D3)* | `lib/prompt-moderation.ts:104-108` returns `{safe:true}` on error; `lib/prompt-pipeline.ts:73,97-100` moderates only the raw prompt | Apply policy D3. Re-run `checkObviousTerms` on the enhanced text. Delimit user text in the classifier prompt. Clear timers (BE-016 helper). | "rejects enhanced prompt with blocked term", plus a policy test. |
| BE-034 | Invalid ObjectId → 500 with a CastError message | `services/collection-service.ts:52-54,127,145,171`; `routes/collections.ts:15-21` `routeParam()` returns `""` | Create `lib/object-id.ts` `parseObjectId()` (regex `/^[a-f\d]{24}$/i`; throws `BadRequestError`). Use one ownership-scoped `findOne({ _id, userId })`. | "malformed id → 400" for rename, delete, add and remove. |
| BE-035 | Deleting images leaves ghost ids in collections and orphaned Cloudinary assets | `services/image-service.ts:48-50,67-69`; `cloudinary-service.ts:27-34` swallows errors; strict `featureType === IMAGE` misses legacy `"Image"` | After `$pull` from history, run `CollectionModel.updateMany({userId},{$pull:{imageIds:{$in}}})`. Inspect the `delete_resources` result and log failed ids. Normalise the feature type, or collect every `*PublicId`. | "removes deleted ids from collections", "legacy 'Image' type deletes aiImagePublicId". |
| BE-036 | Favorite toggle is a read-modify-write by array index | `services/image-service.ts:18-30`: `history.${index}.isFavorite` | Client sends the desired `isFavorite`. Use `updateOne({ userId, "history._id": id }, { $set: { "history.$.isFavorite": v } })`. | "update filter targets _id, not index". |
| BE-037 | Health check leaks error text and returns 503 for the first 10s | `services/health-check-service.ts` (`uptime < 10`, RSS > 1024 → unhealthy); `routes/healthcheck.ts:19` returns `error.message` | Return only per-dependency `status` publicly and log the details. Add per-dependency timeouts. Make memory/uptime warnings use named constants. Periodic alert: initial `lastHealthStatus` `null` → treat as healthy so a boot failure alerts. | "public body has no error strings". |
| BE-038 | Image routes have no input validation | `routes/image.ts:16,25-26,38`: `image._id` on an undefined body → TypeError 500; echoes the client body | Add zod schemas in `packages/shared` (`ToggleFavoriteSchema`, `DeleteImageSchema {imageId}`, `BulkDeleteSchema`). Return `{ success }` only. | "missing body → 400". |
| BE-039 | Collections and saved prompts are unbounded | `services/collection-service.ts:79` (no `.lean()`, no limit, sort with no index); shared `imageIdsSchema` has no `.max`; `routes/saved-prompts.ts:11,45-48`: unlimited creates, list silently capped at 100 | `MAX_COLLECTIONS_PER_USER`, `imageIds.max(500)`, a `{userId:1,updatedAt:-1}` index, `.lean()`. Cap saved prompts on create (409) or paginate with a cursor + `hasMore`. | "create rejected at cap", "every stored prompt reachable". |
| BE-040 | `uploadToCloudinary` reliability | `utils/cloudinary.ts:16-19,54-65,111-122`: no `response.ok`; `Promise.all` leaves orphans on partial failure; `updateOne` `matchedCount` unchecked; downloads twice | Check `response.ok`. On failure, delete the already-uploaded ids. Check `matchedCount`. Probe from the downloaded buffer once. (The refactor is BE-049.) | "cleans up uploads when one fails", "non-2xx download throws". |
| BE-041 | Dependency hygiene | `package.json`: `crypto` (npm placeholder package), unused `body-parser`, `moment`, `@types/express@5` vs `express@4`, `@types/node@17` vs Node 20, stub `@types/sharp`/`@types/ioredis`, `tsx`/`typescript` in `dependencies`, two coverage providers, pinned `mongoose@8.0.0`, `multer@1.x`; `@clerk/clerk-sdk-node` is deprecated in favour of `@clerk/express` | Remove the unused packages and stubs, move tooling to devDeps, align `@types/*`, bump mongoose 8.x and multer 2.x, and plan the `@clerk/express` migration (it can be done with BE-001). | `bun install` clean, tsc + vitest green. |
| BE-042 | Dockerfile ships dev dependencies; the prune step is a no-op | `Dockerfile:50-52` `find … -prune` without `-delete`; full `bun install` | Add a prod stage with `bun install --production --frozen-lockfile`, copying manifests first for layer caching. Delete the bogus `find`. | The image contains no vitest/tsx/typescript. |
| BE-043 | `apps/api/docker-compose.yml` is stale and exposes Redis | Missing required env (boot exits); wrong build context; `redis:latest` on `0.0.0.0:6379` with no password and `allkeys-lru` (evicts BullMQ keys) | Delete it (`infra/docker-compose.yml` is canonical) or fix it: `redis:7-alpine`, `127.0.0.1` bind, `requirepass`, `noeviction`. | `docker compose config` succeeds, or the file is removed. |
| BE-044 | Logger redaction is incomplete; no correlation id | `lib/logger.ts:13-18` redacts 4 header paths only; `err.config.headers.*` is not covered; `genReqId` is never returned | Add redact paths (`err.config.headers.authorization`, `*.password`, `*.token`, `res.headers["set-cookie"]`). Set an `X-Request-Id` response header and include `req.id` in error logs. | "redacts nested authorization". |
| BE-045 | `stopPeriodicHealthCheck` is a placeholder; `LOG_LEVEL` is unvalidated | `periodic-health-check-service.ts:53-57`; `config/env.ts` | Store the cron task and `.stop()` it (BE-015). Use `LOG_LEVEL: z.enum([...])`. | "invalid LOG_LEVEL fails with a clear message". |
| BE-046 | **Tests lock in bugs and assert mock wiring** | `routes/index.test.ts:45-52` (asserts the insecure order); `routes/users.test.ts:173-184` (asserts the `params.userId` bug); `middlewares/multer.test.ts:53-66` (asserts body.userId drives the folder); `routes/collections.test.ts:134-178` (asserts userId from body). Route tests poke `router.stack` directly, bypassing middleware and path matching. 297 of 476 cases are `toHaveBeenCalled*`. Schema-restating tests in `models/*.test.ts` and `utils/constants.test.ts`. | Add `test/helpers/http-app.ts`: a real `app`/`router`, mocked services, and a Clerk stub that 401s by default or sets `req.auth`. Dispatch HTTP via `supertest` (add as devDep). Rewrite the four bug-locking tests. Add a 401 test and a cross-user test per router. Delete pure schema- or constant-restating tests. | Every router has an unauthenticated-401 test and a cross-user test, and those tests **fail on the current code**. |
| BE-047 | Users schema: unbounded embedded arrays, no `min: 0` on credits | `models/user.ts:18-35` (`history`, `payments`, `activities` embedded); dead commented pre-save block | Add `min: 0` to `credits`/`dailyCredits`. Use projections (`select("-history -payments")`) on reads. Delete the dead block. Long term, history/payments get their own collections (BE-019/021). | "rejects negative credits". |
| BE-048 | Explore `nextCursor` is null after a page of unrenderable rows | `services/explore-service.ts:123-128`; test pins it at `explore-service.test.ts:160` | Build the cursor from the last **raw** row. | "continues paging past unrenderable page". |

### ⚪ Low (maintainability, duplication, hygiene)

| ID | Title | Evidence | Fix guide |
|---|---|---|---|
| BE-049 | `uploadToCloudinary` is a 182-line god function with `data: any` | `utils/cloudinary.ts:37-218`: 4 near-identical `User.updateOne` blocks; string literals instead of `FeatureType`; an unused `image` object; a `utils` file doing DB writes | Add a discriminated `CloudinaryUploadPayload` in `types/index.ts`. Split into `uploadFromUrl`, `uploadOriginal`, `persistUploadResult`. Move DB writes to `image-service`. Each function < 30 lines. |
| BE-050 | Cloudinary logic is split between `services/` and `utils/` | `services/cloudinary-service.ts` (`{ v2 }` import) vs `utils/cloudinary.ts` (default import); public-id field knowledge duplicated across upload and delete | One `services/cloudinary-service.ts`, `lib/image-probe.ts` for `getImageDetails`, and a pure `getPublicIds(image)` helper (also used by BE-010). |
| BE-051 | `process*` wrappers duplicate the job shape; long functions | `services/generation-service.ts:307` `processImage` (97 lines), `runGenerationJob` (~90), `updateAndGetUserCredits` (58); Revive/Colorize pass `output` unwrapped while Upscale/RemoveBg take `output[0]` (latent bug); `new RedisService()` inline bypasses DI; `"REVIVE" as ModelKey` | `firstOutput()` and `buildUtilityPayload(featureType, …)` helpers. Extract `validateAndBuildImageInput`. Move credits to `services/credit-service.ts`. Inject `jobStatus`. Each function < 30 lines. |
| BE-052 | `generate.ts` defines five near-identical POST handlers | `routes/generate.ts:79-171` | Build the routes from a table `{ path, kind, upload }`. |
| BE-053 | Request coercion and ObjectId validation are duplicated | `routes/collections.ts:15-21`, `routes/explore.ts:11-14`, `routes/saved-prompts.ts:103`, `services/explore-service.ts:95,191`; `as string` casts in `users.ts:40`, `generate.ts:29` | Add `lib/request.ts` (`queryString`, `pathParam`, `parseLimit`), `lib/object-id.ts`, and a `validateBody(schema)` middleware. |
| BE-054 | Layering: routes do DB work | `routes/users.ts` (whole file), `routes/saved-prompts.ts:44-90` | `user-service`, `referral-service`, `contact-service`, `saved-prompt-service`. Routes import no models. |
| BE-055 | Inconsistent response envelopes | `{success:true,…}` (collections, image, saved-prompts), bare docs (users, explore), `send("success")` (`users.ts:41`, `credits.ts:25`), `{ success: "Form submitted…" }` | Success returns the resource; errors are thrown `HttpError`s. Response types go in `packages/shared/src/types/api.ts`, applied with `satisfies`. |
| BE-056 | Magic numbers and duplicated constants | `5` (`user-service.ts:39`), `50` ×2 (`users.ts`), `amount * 100`, `"0 0 * * *"`, retry numbers in `generation-queue.ts:19-24`, `authorizedParties` duplicating CORS origins, `return 1` in `credit-calculator.ts:21`, `8000` in `prompt-enhancer.ts:91` | Named constants in `packages/shared` or `config/`, with a single origins source. |
| BE-057 | `console.error`, `any`, `@ts-ignore`, `Function` type | `lib/prompt-pipeline.ts:66,102,109`, `prompt-moderation.ts:105`, `prompt-enhancer.ts:111`; `any` in `app.ts:33,86`, `config/mongo.ts:15`, `lib/async-handler.ts:9`, `model-input.ts:76,85`, `generation-service.ts:38,345`, `webhook/index.ts:40`; `@ts-ignore` ×3 in `saved-prompts.ts`; `next: Function` in `clerk.ts:31` | Use the pino logger. Use concrete types (`Promise<unknown>`, `readonly string[]`, `CorsOptions`, `NextFunction`). |
| BE-058 | Dead or test-only exports | `middlewares/errors.ts errorHandler` (until BE-014 adopts it), `ImageModel`, `CollectionSchema`, `AUTO_ENHANCE_WORD_THRESHOLD`, `generateUsername`, the `calculateCreditCost` re-export in `generation-service.ts`; duplicated `express` import lines | Delete or un-export. Each export must have a non-test importer. |
| BE-059 | Naming, boundaries and import side effects | `utils/cronJobs.ts` (camelCase); `services/user-service.ts` imports `clerkClient` from a middleware; `app.ts:78-82` connects to the DB, starts cron and health checks, and configures Cloudinary on import; `utils/constants.ts` holds priced products | Use kebab-case. Move `clerkClient` to `config/clerk.ts`. Export `createApp()` and start side effects in `index.ts`. Products go to shared (BE-004). |
| BE-060 | Stray tooling and repo hygiene | Tracked stale `apps/api/vitest.config.js`; root `build:api` runs `bun build` (the bundler, not the script); `scripts/copy-env.sh` hard-codes the prod IP `root@159.89.45.226` + key path; one-line `README.md`; tsconfig `target: ES6`; email alert recipient hard-coded (`email-notification-service.ts:58`) with unescaped HTML | `git rm` the `.js` config. Change the script to `bun run --cwd apps/api build`. Parametrise the deploy script with env vars. Write a README (env, scripts, endpoints). Target ES2022. Use an `ALERT_EMAIL` env var plus `escapeHtml`. |

---

## 4. Fix order & dependencies

Batches are sequential; items inside a batch can run in parallel only when they don't share files (see the ownership notes).

**Batch 1: Stop the bleeding (security & money)**
- [ ] BE-001 auth mounting + typed `requireAuth` *(owns `routes/index.ts`, `middlewares/clerk.ts`, `routes/saved-prompts.ts` ts-ignores)*
- [ ] BE-002 + BE-006 `requireUserId` everywhere *(depends on BE-001; touches every route file, `multer.ts`, `generation-service.ts` userId, and web callers)*
- [ ] BE-003 + BE-004 + BE-022 + BE-025 + BE-021 payments rewrite *(needs D5; owns `webhook/index.ts` Razorpay part, `routes/payments.ts`, `models/payment.ts`, the shared packs, `apps/web/src/utils/payment.ts`)*
- [ ] BE-024 verify-payment *(same package as above)*
- [ ] BE-005 delete the faucet *(`routes/credits.ts`, `services/user-service.ts`)*
- [ ] BE-010 bulk delete ownership *(`services/image-service.ts`, `routes/image.ts`, web `helpers.ts`)*
- [ ] BE-012 + BE-013 + BE-023 users routes → services *(`routes/users.ts`, new services; needs D4)*
- [ ] BE-014 single error handler, 401 mapping *(`app.ts`, `index.ts`, `middlewares/errors.ts`)*

**Batch 2: Generation correctness**
- [ ] BE-007 reserve/refund credits *(`generation-service.ts`)*, then BE-018 idempotency, then BE-051 split
- [ ] BE-008 progress SSE *(`routes/generate.ts`, `middlewares/clerk.ts`; after BE-001)*
- [ ] BE-009 + BE-032 input validation *(needs D2; `lib/model-input.ts`, `credit-calculator.ts`, `routes/prompt.ts`)*
- [ ] BE-031 server jobId *(`queue/generation-queue.ts`, `routes/generate.ts` → after BE-008)*
- [ ] BE-011 upload limits *(`middlewares/multer.ts`; after BE-006)*
- [ ] BE-033 moderation policy *(needs D3)*

**Batch 3: Platform & ops**
- [ ] BE-015 shutdown/timeouts, BE-045 *(`index.ts`, `periodic-health-check-service.ts`)*
- [ ] BE-016 helmet/rate limit/timeout helper *(`app.ts` → after BE-014)*
- [ ] BE-017 + BE-037 health endpoints *(`routes/healthcheck.ts`, `health-check-service.ts`, Dockerfile, `infra/docker-compose.yml`)*
- [ ] BE-041 + BE-042 + BE-043 deps & Docker
- [ ] BE-044 logger, BE-030 cron

**Batch 4: Data integrity & content**
- [ ] BE-019 + BE-020 explore (needs D1), BE-048
- [ ] BE-026 + BE-027 Clerk webhook & email index
- [ ] BE-028, BE-029, BE-034, BE-035, BE-036, BE-038, BE-039, BE-040, BE-047

**Batch 5: Maintainability & tests**
- [ ] BE-046 HTTP-level test harness. *Start the harness in Batch 1 so Batch 1 fixes get real 401/IDOR tests; finish the cleanup here.*
- [ ] BE-049 + BE-050 Cloudinary consolidation (after BE-040), BE-052, BE-053, BE-054, BE-055, BE-056, BE-057, BE-058, BE-059, BE-060

**Cross-app note:** BE-002, BE-004, BE-005, BE-010, BE-012, BE-024 and BE-031 change request contracts. Update the matching `apps/web` callers in the **same** package so the app keeps working.

---

## 5. What was checked and is fine
- `updateAndGetUserCredits` is a single atomic guarded pipeline update, and the daily/persistent split math is correct.
- The Clerk svix webhook gets the raw body (mounted before `express.json`, uses `express.raw`). The verify-payment HMAC construction matches Razorpay's spec.
- Saved prompts: per-route auth, `req.auth` identity, ObjectId validation, zod-bounded input, matching indexes.
- Explore: `limit` is clamped, the cursor is validated, and the sort key is stable.
- Collection add path verifies image ids against the user's history and uses `$addToSet`/`$pull`.
- BullMQ: `maxRetriesPerRequest: null`, retention configured, worker `error` listener, exhaustive `kind` switch.
- LLM helpers have timeouts, and enhancement failures fall back to the original prompt.
- Env is zod-validated and fails fast. CORS is an allow-list (no wildcard + credentials). Dockerfile is multi-stage and runs as non-root.
- No `$regex` with user input; no SSRF reachable today (fetch URLs come from provider output).
- `dist/` and `coverage/` are not committed. Only `.env.example` is tracked.

## 6. Revision log
- **Rev 1 (2026-10-01):** Initial review. The orchestrator verified every Critical and High item, corrected the auth-reach, `/users/history`, and `DELETE /users/:id` claims, and added the Clerk-401→500 finding.
