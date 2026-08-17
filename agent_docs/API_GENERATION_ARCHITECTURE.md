# Backend API: Image Generation Architecture Report

**Scope:** `/Users/deepakdewani1/Documents/Programs/vue/text-to-image/visual-ai/apps/api`  
**Date:** 2026-08-12

---

## 1. End-to-end image generation flow

### Entry points (routes)

File: `apps/api/src/routes/generate.ts`  
Mounted via `apps/api/src/routes/index.ts` → `app.use("/", router)` in `apps/api/src/app.ts`.

| Method | Path                        | Handler                       | Auth          | Upload        |
| ------ | --------------------------- | ----------------------------- | ------------- | ------------- |
| GET    | `/progress?jobId=`          | SSE progress stream           | none on route | —             |
| POST   | `/generate/image`           | `void processImage(req.body)` | Clerk         | —             |
| POST   | `/generate/upscale/image`   | `void processUpscale(props)`  | Clerk         | multer single |
| POST   | `/generate/revive/image`    | `void processRevive(props)`   | Clerk         | multer        |
| POST   | `/generate/colorize/image`  | `void processColorize(props)` | Clerk         | multer        |
| POST   | `/generate/remove-bg/image` | `void processRemoveBg(props)` | Clerk         | multer        |

**Pattern:** Fire-and-forget. Route starts the async job with `void processX(...)` and immediately returns **202**:

```typescript
// generate.ts ~88–95
generateRoute.post(
  '/generate/image',
  ClerkExpressRequireAuth({}),
  asyncHandler(async (req, res) => {
    void processImage(req.body);
    acceptResponse(res); // 202 { message: "Processing started", status: "processing" }
  }),
);
```

### Progress delivery (client-facing)

`GET /progress` opens an **SSE** connection. Every **1 second** it reads Redis job status and writes `data: {...}\n\n`. On connection close it deletes the Redis key.

```typescript
// generate.ts ~35–83
res.writeHead(200, { "Content-Type": "text/event-stream", ... })
const interval = setInterval(async () => {
  const status = await jobStatusService.getStatus(jobId)
  if (status) res.write(`data: ${JSON.stringify(status)}\n\n`)
}, 1000)
res.on("close", cleanup) // clearInterval + deleteStatus(jobId)
```

### Core job pipeline

File: `apps/api/src/services/generation-service.ts`

Feature wrappers (`processImage`, `processUpscale`, …) validate/build model input, then call shared **`runGenerationJob`**:

1. **`replicate.run(model, { input }, progressCb)`** — Replicate JS SDK blocks until prediction finishes; progress callback logs status changes (`processing` / `succeeded`). This is **SDK-internal polling**, not app webhooks.
2. **Build image object** (`buildImageObject`) — may probe image dimensions from Replicate URLs.
3. **DB write** — `storeImageInDB`: `$push` new image onto `User.history` (MongoDB/Mongoose).
4. **Credit deduct** — `updateAndGetUserCredits`: `$inc: { credits: -amount }`.
5. **Redis status** — set `status: "completed"` (or intermediate with credits) via `RedisService`.
6. **Cloudinary upload** — `uploadToCloudinary(...)`.
7. **`finalizeJob`** — re-read user history entry, set Redis `status: "completed"` with full image payload.

On failure: catch in `runGenerationJob`, set Redis `status: "error"` (optional content-safety message). Errors are swallowed (fire-and-forget).

```typescript
// generation-service.ts ~184–195
const output = await replicate.run(model, { input }, (p: Prediction) => {
  if (p.status === lastReplicateStatus || p.status === 'starting') return;
  logger.info(`gen progress job=${jid} replicate=${p.status}`);
});
```

```typescript
// generation-service.ts ~113–120
await User.findOneAndUpdate({ userId }, { $push: { history: newImage } }, { new: true });
```

### Webhooks vs polling

| Concern                         | Mechanism                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| Replicate prediction completion | **Polling inside `replicate.run()`** (SDK). No Replicate webhook route.                     |
| Client progress UX              | **SSE** polling Redis every 1s                                                              |
| Auth / payments                 | Webhooks: `/webhooks/clerk` (Svix), `/webhooks/razorpay` in `apps/api/src/webhook/index.ts` |

Replicate client singleton: `apps/api/src/lib/replicate.ts`.

---

## 2. Queuing mechanism?

**No real job queue.** Grep found no BullMQ, Bull, p-limit, or worker queue libraries in `apps/api`.

What exists:

| Piece                                | Role                                      | File                        |
| ------------------------------------ | ----------------------------------------- | --------------------------- |
| In-process Promise (`void processX`) | “background” work on the Node event loop  | `routes/generate.ts`        |
| Redis `job_status:{jobId}`           | Progress/status cache only (TTL **600s**) | `services/redis-service.ts` |
| `ioredis` client                     | Connection                                | `config/redis.ts`           |

```typescript
// redis-service.ts
private readonly JOB_EXPIRY = 600 // 10 minutes
await redisClient.set(this.getKey(jobId), JSON.stringify(status), "EX", this.JOB_EXPIRY)
```

Redis is **not** used as a work queue (no LPUSH/BRPOP, no Bull streams).

---

## 3. Concurrent requests / rate limiting / workers

- **No** `express-rate-limit`, **no** p-limit, **no** cluster/pm2 workers in this package.
- Each POST spawns an unbounded in-process async task. Concurrency = Node’s ability to hold many pending `replicate.run()` awaits.
- Single Express process (`app.listen` in `src/index.ts`).
- Cron (`src/utils/cronJobs.ts`, imported from `app.ts`): daily free-credit top-up + monthly pro credit grant — **not** generation workers.
- Periodic health check service runs on a timer — not a job worker.

---

## 4. Server restart mid-generation

**No resume / recovery path.**

| Stage at crash                                               | Outcome                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| During `replicate.run`                                       | In-process Promise dies. Replicate may still finish on their side; result is **orphaned** (never stored). Redis may stay `processing` until TTL (10 min) or SSE cleanup. Client SSE ends. Credits **not** deducted yet (deduction is after successful output + DB store). |
| After DB `$push` / credit `$inc`, before Cloudinary/finalize | Partial: history/credits may already be updated; Redis may never reach `completed`.                                                                                                                                                                                       |
| After finalize                                               | Durable in Mongo + Cloudinary; only Redis ephemeral status lost.                                                                                                                                                                                                          |

Graceful shutdown only quits Redis on `SIGTERM` (`index.ts`); it does **not** drain in-flight generations.

---

## 5. Tech stack & deployment

| Layer       | Choice                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------- |
| Runtime     | **Node.js** (`tsx watch` dev, `node dist/index.js` prod). Not Bun for the API process (despite monorepo `bun.lock`). |
| Framework   | **Express 4**                                                                                                        |
| Language    | TypeScript (ESM `"type": "module"`)                                                                                  |
| DB          | **MongoDB** via **mongoose** 8 (`MONGO_URI`)                                                                         |
| Redis       | **ioredis** — job status cache; compose service `redis:latest`                                                       |
| Image gen   | **replicate** npm SDK                                                                                                |
| Storage/CDN | **Cloudinary**                                                                                                       |
| Auth        | **Clerk** (+ Svix webhook)                                                                                           |
| Payments    | **Razorpay** webhook                                                                                                 |
| Prompt AI   | DeepSeek + Anthropic (env)                                                                                           |
| Logging     | pino / pino-http                                                                                                     |
| Cron        | node-cron                                                                                                            |

### Dockerfile (`apps/api/Dockerfile`)

- `FROM node:20-alpine`
- `yarn install` → copy source → `yarn build` (tsc)
- `EXPOSE` app port; `CMD ["npm", "run", "start"]`

### docker-compose (`apps/api/docker-compose.yml`)

- Service `backend` (build local Dockerfile, `restart: always`, depends_on redis)
- Service `redis` with AOF, maxmemory 128mb, `allkeys-lru`
- Env passed through for Replicate, Mongo, Clerk, Cloudinary, Razorpay, Redis, email, etc.

### Key env vars (`config/env.ts` + `.env.example`)

`APP_PORT`, `APP_SERVER`, `NODE_ENV`, `MONGO_URI`, `REDIS_HOST`, `REDIS_PORT`, `REPLICATE_API_TOKEN`, `CLOUDINARY_*`, `CLERK_*`, `WEBHOOK_SECRET`, `RAZORPAY_*`, `EMAIL_*`, `DEEPSEEK_API_KEY`, `ANTHROPIC_API_KEY`, …

---

## Architecture diagram (logical)

```
Client
  │ POST /generate/*  ──► Express (202) ──► void process*(...) [in-process]
  │                                         │
  │                                         ├─ replicate.run()  [SDK polls Replicate]
  │                                         ├─ MongoDB User.history + credits
  │                                         ├─ Redis job_status:{id} (TTL 600s)
  │                                         └─ Cloudinary upload
  │
  └─ GET /progress?jobId  (SSE) ──► poll Redis every 1s

Webhooks (unrelated to gen): /webhooks/clerk, /webhooks/razorpay
```

## Bottom line

Generation is **synchronous-to-Replicate inside an async fire-and-forget request handler**, with Redis + SSE for progress UX. There is **no durable queue, no concurrency limiter, and no restart recovery** for in-flight jobs.
