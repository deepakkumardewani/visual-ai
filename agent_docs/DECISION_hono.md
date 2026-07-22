# Hono Migration Decision

**Date:** 2026-07-18  
**Branch:** backend-migration-hono  
**Author:** Phase 4 spike  
**Status:** RECOMMENDATION BELOW

---

## Context

The API is an Express 4.x app running on Bun. Phases 1–3 have already refactored it into thin routes + service layer + pino logging + zod schemas + env config. The question is whether migrating to Hono is worth the disruption.

Current dependencies relevant to this evaluation:

| Concern              | Express package                                           |
| -------------------- | --------------------------------------------------------- |
| Auth                 | `@clerk/clerk-sdk-node` (`createClerkExpressRequireAuth`) |
| Webhook verification | `svix` (raw body)                                         |
| Payment webhook      | Razorpay (JSON body)                                      |
| File upload          | `multer` + `multer-storage-cloudinary`                    |
| CORS                 | `cors`                                                    |
| Cookies              | `cookie-parser`                                           |
| Scheduling           | `node-cron`                                               |
| Health check         | Express route                                             |
| Graceful shutdown    | `SIGTERM` in `index.ts`                                   |
| HTTP logging         | `pino-http`                                               |

---

## Gate 1 — Clerk Auth Parity via `@hono/clerk-auth`

**Verdict: PASS (with caveats)**

`@hono/clerk-auth` is an official Hono middleware published by the Hono team. It wraps Clerk's `@clerk/backend` `authenticateRequest()` and attaches the auth object to Hono context via `getAuth(c)`.

**Current implementation (`middlewares/clerk.ts`):**

```ts
// Uses @clerk/clerk-sdk-node (legacy SDK)
createClerkExpressRequireAuth({ clerkClient });
// Also uses clerkClient.verifyToken() for SSE progress endpoint
```

**Hono equivalent:**

```ts
import { clerkMiddleware, getAuth } from '@hono/clerk-auth';
app.use('*', clerkMiddleware());
// In handler:
const auth = getAuth(c);
if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);
```

**Gaps to resolve:**

1. `authenticateProgress` uses `clerkClient.verifyToken(token)` for SSE query-param token. Hono middleware only inspects the `Authorization` header. This endpoint would need manual `verifyToken` via `@clerk/backend` directly — which is fully supported.
2. The existing code uses `@clerk/clerk-sdk-node` (deprecated legacy SDK). Migration to Hono would force the upgrade to `@clerk/backend` — this is actually a positive cleanup.
3. `StrictAuthProp` global augmentation is Express-specific; Hono uses `c.get('clerkAuth')` typed generics instead.

**Conclusion:** Auth parity is achievable. The SSE endpoint requires one extra `verifyToken` call, same as today.

---

## Gate 2 — Svix + Razorpay Raw-Body Signature Verification Parity

**Verdict: PASS**

**Svix (Clerk webhooks):**

The current code uses `express.raw({ type: "application/json" })` before the JSON middleware to preserve the raw body for `wh.verify(payload, headers)`. In Hono, `await c.req.raw.arrayBuffer()` or `await c.req.text()` gives the raw body without any middleware ordering trick. Svix's `verify()` accepts `string | Buffer` — Hono's `c.req.text()` returns a string directly, so this is simpler:

```ts
app.post('/webhooks/clerk', async (c) => {
  const rawBody = await c.req.text();
  const wh = new Webhook(env.WEBHOOK_SECRET);
  const evt = wh.verify(rawBody, {
    'svix-id': c.req.header('svix-id') ?? '',
    'svix-timestamp': c.req.header('svix-timestamp') ?? '',
    'svix-signature': c.req.header('svix-signature') ?? '',
  });
  // ...
});
```

The Express ordering problem (`express.raw` before `express.json`) disappears entirely — Hono doesn't parse the body until you ask for it.

**Razorpay webhook:**

Currently uses `express.json()` middleware inline on the route. In Hono, `await c.req.json()` does the same per-handler. No signature verification is implemented today (Razorpay webhooks are unauthenticated in the current code), so parity is trivially achieved.

**Conclusion:** Svix raw-body verification is actually easier in Hono. No ordering gotchas.

---

## Gate 3 — Multer Replacement (`c.req.parseBody()` + Cloudinary Streaming)

**Verdict: FAIL — Significant work, no drop-in replacement**

**Current setup:**

- `multer` with `multer-storage-cloudinary` (`CloudinaryStorage`)
- Storage adapter streams directly to Cloudinary during upload — no temp disk writes
- Field name: `image` (single file)
- Format/folder derived from `req.body` fields (`userId`, `feature`, `format`)
- Used in 3 routes: `/generate/upscale/image`, `/generate/revive/image`, `/generate/colorize/image`

**Hono equivalent:**

Hono's `c.req.parseBody()` parses `multipart/form-data` and returns a `File` object (Web API `File`, not Node `Buffer`). There is **no** Hono equivalent of `multer-storage-cloudinary` — that package is tightly coupled to multer's `StorageEngine` interface.

To port, you would need to:

1. Call `c.req.parseBody()` to get the `File` object
2. Convert `File` to a `Buffer` or `stream` manually
3. Call `cloudinary.uploader.upload_stream()` or `cloudinary.uploader.upload()` with the buffer
4. Reconstruct the folder/public_id logic currently embedded in the storage adapter's `params()` callback

This is 30–50 lines of plumbing per upload handler (or one shared utility function), replacing 2 lines of `upload.single("image")` middleware. It is doable and arguably more explicit, but it is **not** a simple drop-in.

**Risk:** The `multer-storage-cloudinary` adapter handles edge cases (format coercion, duplicate filenames) that would need to be re-verified manually.

**Conclusion:** Multer replacement requires non-trivial work. No ecosystem equivalent exists for Hono. Manual streaming to Cloudinary is the only path.

---

## Gate 4 — cookie-parser / CORS / node-cron / health-check / SIGTERM Equivalents

**Verdict: PASS**

| Concern                     | Hono equivalent                          | Notes                                                                                        |
| --------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `cors`                      | `@hono/cors`                             | Built-in, same options shape (`origin`, `allowedHeaders`, `credentials`)                     |
| `cookie-parser`             | `hono/cookie` (`getCookie`, `setCookie`) | No separate middleware needed; access cookies per-handler                                    |
| `node-cron`                 | `node-cron` unchanged                    | Framework-agnostic; zero changes needed                                                      |
| Health check route          | `app.get("/health", ...)`                | Trivial port                                                                                 |
| SIGTERM / graceful shutdown | `process.on("SIGTERM", ...)`             | Framework-agnostic; zero changes needed                                                      |
| `pino-http`                 | `hono-pino` or manual middleware         | `hono-pino` is a community package; alternatively wrap pino in a Hono middleware (~10 lines) |
| SSE (progress endpoint)     | `streamSSE` from `hono/streaming`        | Explicit helper vs. `res.write()` raw; cleaner API but requires refactor                     |

**CORS note:** The current origin whitelist function (`callback(null, origin)`) maps directly to Hono's `@hono/cors` `origin` option which accepts a function returning `string | null | undefined`.

**Cookie note:** Cookies are currently used by `cookie-parser` but not actually read in any visible route handler — likely legacy. If needed, `getCookie(c, "name")` is the Hono API.

**Conclusion:** All four concerns have first-party or trivially-equivalent Hono solutions.

---

## Gate 5 — `Bun.serve` Benefit (Nice-to-Have)

**Verdict: PASS (marginal uplift, low priority)**

The project already uses Bun as the runtime. Hono has a first-class Bun adapter:

```ts
import { Hono } from 'hono';
const app = new Hono();
export default app; // Bun.serve picks this up automatically
```

**Theoretical benefits:**

- Hono on Bun is benchmarked at ~2–4x req/s vs Express on Node in synthetic benchmarks
- `Bun.serve` supports HTTP/2 and WebSockets natively
- Bun's `fetch`-based HTTP client is used internally by Hono's test utilities

**Practical reality for this app:**

- The bottleneck is Replicate AI inference + Cloudinary upload, not HTTP routing
- No WebSockets are used (SSE only)
- HTTP/2 is terminated at the reverse proxy (nginx/Caddy), not the app
- The app already runs Bun — there is no Node-to-Bun migration to capture

**Conclusion:** The performance benefit is real but irrelevant at this traffic profile. Not a compelling migration driver.

---

## Summary Matrix

| Gate                                        | Verdict | Effort to port                 |
| ------------------------------------------- | ------- | ------------------------------ |
| 1. Clerk auth via `@hono/clerk-auth`        | PASS    | Medium (SDK upgrade required)  |
| 2. Svix + Razorpay raw-body verification    | PASS    | Low (simpler than Express)     |
| 3. Multer + Cloudinary streaming            | FAIL    | High (no ecosystem equivalent) |
| 4. CORS / cookies / cron / health / SIGTERM | PASS    | Low                            |
| 5. `Bun.serve` benefit                      | PASS    | Zero (already on Bun)          |

---

## Recommendation: **STAY on Express**

**Do not migrate to Hono at this time.**

### Rationale

Gate 3 is a hard blocker for a clean migration. `multer-storage-cloudinary` has no Hono equivalent. Three upload routes would require manual Cloudinary streaming code. This is solvable engineering work but not "free" — and it introduces risk in the upload path, which is the most business-critical part of the app (failed uploads = failed AI jobs).

The other four gates are PASS, but "four of five gates pass" is not sufficient justification when:

1. **The app already works.** Phases 1–3 have delivered the structural improvements (service layer, typed config, pino, zod) without touching the framework. The Express version is now clean.
2. **The bottleneck isn't the framework.** Latency is dominated by Replicate inference (seconds). HTTP routing overhead (microseconds) is immaterial.
3. **Migration cost is non-zero.** Clerk SDK upgrade + multer removal + SSE refactor + CORS/pino re-wiring = ~1–2 days of careful work plus regression testing on all upload endpoints.
4. **Risk surface.** Any change to webhook body parsing (Gate 2) risks breaking Clerk user sync if raw-body handling is misimplemented.

### When to revisit

Migrate to Hono if any of the following become true:

- The team starts a new service from scratch (Hono is the right default for greenfield Bun services)
- HTTP routing becomes a measurable bottleneck (profile first)
- `@clerk/clerk-sdk-node` reaches end-of-life and forces a migration anyway (at that point, route through `@hono/clerk-auth` is a natural fit)
- `multer-storage-cloudinary` drops maintenance (at that point, manual streaming is unavoidable regardless of framework)

### Task 4.2 Status

**PENDING USER SIGN-OFF.** Per the task definition, Task 4.2 (executing the migration) is gated on:

1. This DECISION doc recommending "migrate" — **this doc recommends STAY**
2. Explicit user approval

Because this evaluation recommends staying on Express, Task 4.2 should **not** be executed unless the user overrides this recommendation after reviewing the evidence above.
