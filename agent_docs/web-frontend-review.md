# Frontend Review — `apps/web` (production-readiness audit)

| | |
|---|---|
| **Date** | 2026-10-01 |
| **Branch** | `feature-enhancement` @ `06ad57a` |
| **Scope** | `apps/web/src/**` (~29k lines, 157 components, 11 stores, 17 composables, 19 utils), `apps/web` build/deploy config. `apps/api` was read only to confirm API contracts. |
| **Method** | 5 parallel Sonnet reviewers, each covering one area and using the five-axis `/review` checklist (correctness, readability, architecture, security, performance) plus a scan for half-baked code. Then 1 independent Sonnet verifier re-traced every Critical/High finding. Opus orchestrated, de-duplicated and merged. |
| **Not done** | No e2e, Playwright or browser testing (by request). `vp build` was not run because it launches a Chromium prerender. |
| **Status** | Read-only review. No source files were changed. |

---

## 1. Verdict

**Not production-ready.** The core text-to-image flow works, but:

- **Payments.** A user can obtain credits without paying for them (FE-001). The buy dialog reports success before payment completes (FE-004). Payment failures are silent (FE-011).
- **Broken features.**
  - Every upscale from the sidebar fails (FE-003).
  - Upscale, remove-bg, colorize and revive failures hang the UI forever (FE-005).
  - "Send to Upscale" and "Send to Remove BG" always fail (FE-007).
  - Users with only daily credits are blocked (FE-009).
  - "Delete account" claims success and does nothing (FE-010).
- **Security.** `/users*` API routes are unauthenticated (FE-002).
- **Deploy.** The Dockerfile cannot build (FE-012). The quality gates (`vp check`, typecheck) are broken or missing, which is how 28 production type errors built up unnoticed (FE-026, FE-027).

The good parts:
- **Tests:** 1,003 unit tests pass and they are real tests, not stubs.
- **Cleanup:** GSAP, Lenis, ScrollTrigger and observer cleanup is correct, and reduced motion is respected.
- **Data:** model and credit data comes from `packages/shared`.
- **Secrets:** none are committed.
- **Logging:** the logger is level-gated.

### 1.1 Scorecard

| Severity | Count | Meaning |
|---|---|---|
| 🔴 Critical | 4 | Money or security loss, or a main feature 100% broken |
| 🟠 High | 10 | A user-visible feature broken on a common path |
| 🟡 Medium | 30 | An edge-case bug, a missing error/empty state, or significant duplication or maintainability debt |
| ⚪ Low | 18 | Cleanup and polish |
| **Total** | **62** | After merging 23 duplicate reports and dropping 19 suspected issues that did not survive verification (§8) |

### 1.2 Tool results (from `apps/web`)

| Check | Result |
|---|---|
| `vp test run` (unit) | ✅ 187 files / 1,003 tests pass |
| `vp lint` (no `--fix`) | ⚠️ 95 errors / 9 warnings, **all in `*.test.ts`**; production source is clean |
| `bunx vue-tsc --noEmit` | ❌ 122 errors: **28 in production source** (FE-026), ~94 in tests (FE-033) |
| `vp check` | ❌ Aborts with "Formatting failed" while formatting `dist/*.html` (FE-027) |
| `vp build` | Not run (Chromium prerender) |
| `grep console.log / debugger` | ✅ none |
| Committed secrets | ✅ none (`.env.*` untracked; only publishable keys) |

### 1.3 Themes

1. **Async state machines that only reset on the happy path (or only on the error path).** These cause stuck flags, stuck spinners, wrong ids, swallowed errors, and errors that can never fire because `isEmpty(Error)` is `true`. Covered by FE-005, 008, 015, 016 and 011.
2. **Payment and credit trust boundary.** The client decides the price and credit grant, success UI is fabricated, and credits are computed client-side instead of fetched. Covered by FE-001, 004, 011 and 009.
3. **Transform-job plumbing copy-pasted 5–7 times.** This covers the five `*Aside.vue` files, 7 progress-URL builders, divergent localStorage keys, and an SSE handler in the wrong store. It is the root cause of several bugs above. Covered by FE-024 and FE-029.
4. **Deploy and quality gates rotted.** The Dockerfile uses yarn, nginx has no headers, `vp check` is broken, and there is no typecheck script. Covered by FE-012, 027 and 028.
5. **Marketing copy drifts from the source of truth.** Savings figures are invented, credit ranges are wrong, legal pages still describe subscriptions, and the same number is hard-coded about 12 times. Covered by FE-014, 038 and 040.
6. **A11y of custom overlays and widgets.** Focus traps, keyboard menus and nested interactive elements are missing or broken. Covered by FE-042 and 043.

---

## 2. How to read a finding

Each item has these fields:
- **Severity**, **Area**, and **Sources**: the original reviewer IDs, for traceability.
- **Evidence**: `file:line` paths relative to `apps/web/src/` unless prefixed. **Line numbers drift.** Re-locate the code by symbol or grep before editing.
- **Problem**: the concrete failure scenario.
- **Fix guide**: what to change.
- **Test to add**: a sibling `*.test.ts` file, following the project convention.
- **Acceptance**: checkable criteria.

Items marked 🧩 **API** need a change in `apps/api` as well. Items marked ❓ **Decision** need product or owner input first (see §6).

---

## 3. Findings

### 🔴 Critical

#### FE-001 — Credits can be minted: client sets price and credit grant; webhook is unsigned and not idempotent 🧩 API ❓ Decision
- **Sources:** STATE-02, UI-03, XC-01 · **Category:** security
- **Evidence:**
  - `utils/payment.ts:49-52` sends `notes: { userId, credits: product.credits }`, and `:128-130` sends `amount: product.price`.
  - `apps/api/src/routes/payments.ts:47-50` computes `amount: amount * 100` straight from `req.body`.
  - `apps/api/src/webhook/index.ts:72-120` has no `X-Razorpay-Signature` check, does `$inc: { credits }` from `payment.entity.notes`, and has no dedupe on `payment.id`.
- **Problem:**
  - A user can create a ₹1 order with `notes.credits = 100000` and the webhook grants it.
  - Anyone can POST a forged `payment.captured` event to `/webhooks/razorpay` and credit any `userId`.
  - A redelivered webhook double-credits.
- **Fix guide:**
  1. Move `RAZORPAY_PRODUCTS` (id → price, credits) to `packages/shared`.
  2. In the web app, `initiatePayment` sends only `{ productId }`, and stops sending `amount` and `notes.credits`.
  3. The API looks up the product, builds `amount` and `notes: { userId: req.auth.userId, productId }` itself, and generates the receipt.
  4. In the webhook, verify the HMAC signature over the **raw body** with the webhook secret and reject with 401 on mismatch. Derive credits from `notes.productId` via the shared catalog. Make the grant idempotent with a unique index on `paymentId` in a payments collection, and insert before `$inc`.
- **Test to add:**
  - `apps/api/src/webhook/index.test.ts`: an unsigned or forged request returns 401 and credits are unchanged; replaying the same `payment.id` credits once.
  - `apps/api/src/routes/payments.test.ts`: the amount is derived from `productId`, and a tampered body `amount` is ignored.
  - `utils/payment.test.ts`: the request body contains only `productId`.
- **Acceptance:** the credits granted always equal the catalog value of the paid product. Forged and replayed webhooks are no-ops.

#### FE-002 — `/users*` API routes are unauthenticated; other routes trust a body `userId` (IDOR) 🧩 API
- **Sources:** UI-18 (scope corrected by the verifier) · **Category:** security
- **Evidence:** `apps/api/src/routes/index.ts:19-24` does `router.use(userRoutes, ClerkExpressRequireAuth({}))`. Express runs handlers in argument order, so a matching `/users*` route responds before the auth middleware runs. Other routers fall through to the middleware and are authenticated, but they read `userId` from the body or params rather than from `req.auth`.
- **Problem:** without a session, anyone can list all users, change a plan, apply referrals and edit names through `/users*`. On authenticated routes, a signed-in user can act on another user's id.
- **Fix guide:**
  - Mount the auth middleware first: `router.use(ClerkExpressRequireAuth({}))`, then the protected routers. Keep the webhook and public routes mounted before it, explicitly.
  - In every protected handler, derive `userId` from `req.auth.userId`. Reject (403) when a param or body id differs.
  - In the web app, stop sending `userId` in bodies once the API ignores it. That is a follow-up after the API change.
- **Test to add:** API tests: an unauthenticated `GET /users` and `PATCH /users/:id` return 401; an authenticated request with another user's id returns 403.
- **Acceptance:** every non-public route returns 401 without a Clerk session, and no handler trusts a client-supplied user id.

#### FE-003 — Every sidebar upscale fails: a `Ref` is sent as `scale`
- **Sources:** DASH-01 · **Category:** bug
- **Evidence:** `components/Dashboard/Sidebar/UpscaleImageAside.vue:~113` passes `scale` (`ref<number>(2)`) to `generateStore.upscaleImage`, and `stores/generate.ts` does `formData.append('scale', scale)`. FormData sends `"[object Object]"`. The API's `processUpscale` (`apps/api/src/services/generation-service.ts:~425`) computes `Number(scale)`, which is `NaN`, and `validateModelParams` rejects it.
- **Problem:** upscale from the dashboard sidebar always fails.
- **Fix guide:** pass `scale.value`. Type the store parameter as `number`, inside an options object (see FE-029), so a `Ref` becomes a compile error.
- **Test to add:** `UpscaleImageAside.test.ts`: submitting calls `upscaleImage` with `scale: 2` as a number. `generate.test.ts`: FormData `scale` equals `'2'`.
- **Acceptance:** the request body has `scale=2` and the upscale completes.

#### FE-004 — Buy-credits shows "success" when the Razorpay modal merely opens; purchase flow duplicated
- **Sources:** UI-01, UI-19 · **Category:** bug, payments
- **Evidence:**
  - `utils/payment.ts:59-72`: `initiatePayment` resolves right after `rzp.open()` and catches its own errors.
  - `components/Dialogs/BuyMoreCreditsDialog.vue:53-65`: after `await initiatePayment(...)` it sets `successBalance`, then closes via an uncleared `setTimeout(2000)`.
  - `components/Pricing/PricingPacks.vue:39-51`: same call, with no catch and no message.
- **Problem:**
  - The dialog shows a fabricated new balance and closes, even if the user abandons or the payment fails.
  - On the Pricing page, failures just reset the button with no feedback.
  - The two purchase flows are duplicated and share these defects.
- **Fix guide:**
  1. Rewrite `initiatePayment` to return `Promise<PaymentOutcome>`, where `type PaymentOutcome = { status: 'success'; paymentId } | { status: 'failed'; reason; paymentId? } | { status: 'cancelled' }`.
     - Resolve `success` only from the Razorpay `handler`, after `/verify-payment` returns ok.
     - Resolve `failed` from `payment.failed`, an SDK load error, an order-create error or a verify failure.
     - Resolve `cancelled` from `modal.ondismiss`.
     - Never swallow errors: log them with context, then resolve `failed`.
  2. Add a `composables/usePurchaseCredits.ts` composable, used by both `BuyMoreCreditsDialog` and `PricingPacks`. It exposes `isPurchasing`, `purchase(product)`, and the last outcome.
  3. In the dialog, show success only for `success`; show an inline error for `failed`; do nothing for `cancelled`. Clear the close timer in `onScopeDispose`.
- **Test to add:**
  - `usePurchaseCredits.test.ts` covers each outcome.
  - `BuyMoreCreditsDialog.test.ts`: with outcome `failed` or `cancelled`, no success UI and the dialog stays open.
  - `PricingPacks.test.ts`: `failed` renders an error message.
  - Rewrite the existing `utils/payment.test.ts:~173` "swallows SDK load failures", which currently pins the bug.
- **Acceptance:** success UI appears only after a verified payment, failures are visible in both entry points, there is one purchase implementation, and no timers leak.

### 🟠 High

#### FE-005 — Upscale / remove-bg / colorize / revive failures are swallowed (`isEmpty(Error) === true`)
- **Sources:** STATE-01, DASH-02 · **Category:** bug
- **Evidence:** `stores/generate.ts:196,228,258,287`: `if (typeof error.value === 'object' && !isEmpty(error.value))`. vueuse puts an `Error` in `error.value`, and lodash `isEmpty(new Error('x'))` is `true`. `generateImage` (`:161`) uses `if (error.value)` and works.
- **Problem:** on any HTTP or network failure the four transform flows keep `*InProgress` and `isLoading` true, show no error or Retry, and the viewer spinner in `useViewerTransform.startAction` never stops.
- **Fix guide:** extract `handleTransformFailure(feature: FeatureType)` in `stores/generate.ts`. It:
  - resets the persisted in-progress key, using the single key helper from FE-029;
  - resets the feature ref and `isLoading`;
  - calls `closeEventSource(feature)` and `setFeatureError(feature, GENERIC_ERROR)`.
  Change all four conditions to `if (error.value)`, and remove the `isEmpty` import. This also removes the last `lodash-es` use (FE-050).
- **Test to add:** `stores/generate.test.ts`: mock `useFetch` to return `{ error: ref(new Error('Bad Request')) }` for each of the 4 actions; assert `errMsg[feature]` is set and the flags are false.
- **Acceptance:** a failed transform shows an error with Retry, all flags clear, and the viewer spinner stops.

#### FE-006 — Router guard sends signed-in users to `/signin` on hard reload; `redirect` query never used
- **Sources:** STATE-03 · **Category:** bug
- **Evidence:**
  - `router/index.ts:172-185` treats `isSignedIn.value === undefined` as signed out. vue-clerk reports `undefined` until loaded, and the router is installed right after `clerkPlugin` with no `isLoaded` wait.
  - `plugins/index.ts:25` forces `forceRedirectUrl: AFTER_SIGN_IN_URL`.
  - Nothing reads `route.query.redirect`.
- **Problem:** reloading or deep-linking `/profile` or a shared `/explore/:id` while signed in bounces the user to `/signin`, and after sign-in they land on the default page, not the one they requested.
- **Fix guide:**
  - In the guard: `const { isLoaded, isSignedIn } = useUser(); if (!isLoaded.value) await until(isLoaded).toBe(true);`. Redirect only when `isSignedIn.value === false`.
  - Replace the `authRequiredRoutes` list with `meta: { requiresAuth: true }`.
  - `Signin.vue` passes a sanitised `route.query.redirect` to `<SignIn :force-redirect-url>`. A redirect is valid only if it starts with `/` and not `//`; extract that check as `isSafeRedirect(path)` in utils.
- **Test to add:** `router/index.test.ts` covers:
  - `isLoaded` false, then true, while signed in: `/profile` resolves.
  - Signed out: `/signin?redirect=%2Fprofile`.
  - `isSafeRedirect` cases.
- **Acceptance:** a signed-in reload stays on the page, and a signed-out deep link returns the user there after sign-in.

#### FE-007 — "Send to Upscale / Remove BG" always fails: `useRouter()` inside a Pinia action after `await`
- **Sources:** STATE-04 · **Category:** bug
- **Evidence:** `stores/aside.ts:105` calls `const router = useRouter()` and `:123` calls `await router.push(...)`. Callers in `composables/useImageChainActions.ts:188-193,209-214` `await confirmChainAction(...)` first. Outside setup, `inject` returns `undefined`, so `push` throws a TypeError, which is caught at `:128` and makes the action return `false`.
- **Problem:** the user sees "Could not open Upscale" or "Could not open Remove background" from the viewer, the result canvas and history.
- **Fix guide:** remove routing from the store.
  - The store keeps only the blob-to-`File` fetch and staging (`stagePendingFeatureImage(file)`).
  - `useImageChainActions` already has `router` from setup (`:55`). It does `await router.push(createFeatureLocation(feature)); await nextTick(); asideStore.stagePendingFeatureImage(file)`.
- **Test to add:**
  - `useImageChainActions.test.ts`: `router.push` is called with the feature location and the image is staged.
  - `stores/aside.test.ts`: the store no longer imports `vue-router`.
- **Acceptance:** both chain actions navigate and pre-fill the image.

#### FE-008 — Bulk-action busy flags stuck after success
- **Sources:** STATE-05, UI-05 · **Category:** bug
- **Evidence:**
  - `utils/helpers.ts:119-141`: `isBulkFavoriting = true`, reset only on error.
  - `:149-173`: `isBulkDeleting` is reset only when `data.value` is truthy.
  - Consumer: `components/History/History.vue:49,97,106,148,239` sets opacity to 50% and blocks selection while a flag is set.
- **Problem:** after one successful bulk favorite, the whole history grid stays dimmed and no further bulk action is possible until reload.
- **Fix guide:** wrap `bulkFavorite` and `bulkDelete` in `try/finally` that resets their flag. Do this together with FE-015 and FE-016, in the same file.
- **Test to add:** `utils/helpers.test.ts`: both flags are false after success, after an error, and after an empty response body.
- **Acceptance:** the flags reset on every path.

#### FE-009 — Client credit gate ignores daily credits
- **Sources:** DASH-05, UI-07 · **Category:** bug
- **Evidence:**
  - `stores/user.ts:30-34`: `canAffordOutputs` and `hasCredits` use `credits` only.
  - `components/Dashboard/Composer/GenerateCTA.vue:37` gates on them.
  - `composables/useViewerTransform.ts:73`: `if (credits.value < creditCost)`.
  - The server spends daily credits first and checks the sum (`apps/api/src/services/generation-service.ts:137,175`), and `CreditsChip.vue` displays the sum.
- **Problem:** a user with 0 purchased credits but remaining daily credits sees a positive balance yet gets the low-credits dialog.
- **Fix guide:** add `totalCredits = computed(() => credits.value + dailyCredits.value)` in the user store and use it in `canAffordOutputs`, `hasCredits`, `useViewerTransform` and `CreditsChip`. Use `getTransformCreditCost()` instead of the local `TRANSFORM_CREDIT_COST` (FE-047).
- **Test to add:** `stores/user.test.ts`: with `credits 0` and `daily 5`, `canAffordOutputs(1)` is true. `useViewerTransform.test.ts`: `credits 0`, `daily 10` allows a transform.
- **Acceptance:** client affordability matches the server rule everywhere.

#### FE-010 — "Delete account" reports success and navigates home, but nothing is deleted 🧩 API
- **Sources:** UI-10 · **Category:** bug
- **Evidence:**
  - `components/Dialogs/DeleteDialog.vue:25-37`: `const { error, data } = await useFetch('/api/users/${userId}', { method: 'DELETE' })`, then `if (data) {...hide; router.push('/')}`. `data` and `error` are refs, so they are always truthy.
  - The path has a spurious `/api` prefix, so the request 404s. Every other call uses the bare path.
  - `apps/api/src/routes/users.ts:59-63` reads `req.params.userId` on a route declared as `:id`.
- **Problem:** the user believes the account is deleted. The data remains, and a raw `console.error` always fires.
- **Fix guide:**
  - Web: use the path `/users/${id}` and `.json()`. Check `error.value` or `response.value?.ok`. Show an inline error on failure. On success, call `signOut()`, then navigate.
  - API: read `req.params.id` and require it to equal `req.auth.userId` (FE-002). Also delete or anonymise the user's images and payments according to policy ❓.
- **Test to add:** `DeleteDialog.test.ts`: on a failed fetch the dialog stays open, shows an error, and `router.push` is not called; on success `signOut` is called. API test: `DELETE /users/:id` deletes only the caller's account.
- **Acceptance:** the dialog closes only on a real deletion, and failures are visible.

#### FE-011 — Payment failures only log; balance is computed client-side after a 700 ms timer
- **Sources:** STATE-10, UI-02, XC-02 · **Category:** ux-state, payments
- **Evidence:**
  - `utils/payment.ts:67-69`: `payment.failed` only logs.
  - `:72-74`: the catch only logs.
  - `:95-97`: `failureHandler` only logs.
  - `:86-92`: `setTimeout(..., 700)` adds `product.credits` locally.
  - `:121`: the receipt uses `Math.random`.
- **Problem:** an SDK load, order, checkout or verify failure gives no feedback. After success the shown balance is local arithmetic, while the server grants credits through the webhook, so the balance is wrong or reverts if the webhook lags.
- **Fix guide:** this builds on FE-004's `PaymentOutcome`.
  - On success, call `userStore.getUserDetails()` and poll at most N times (named constants `CREDIT_SYNC_ATTEMPTS` and `CREDIT_SYNC_INTERVAL_MS`) until the balance changes.
  - Delete the local `+ amount`.
  - On failure, show a snackbar that includes the Razorpay payment id, for support.
  - The receipt is generated by the server (FE-001), or with `crypto.randomUUID()` in the meantime.
- **Test to add:** `utils/payment.test.ts`: a failed verify triggers the failure outcome and the snackbar text; success calls `getUserDetails` and never adds credits locally.
- **Acceptance:** the displayed credits always come from the server, and every failure path is visible.

#### FE-012 — `apps/web/Dockerfile` cannot build (yarn in a bun workspace)
- **Sources:** XC-05 · **Category:** config
- **Evidence:**
  - `Dockerfile:3-4` does `COPY package.json yarn.lock ./` and `RUN yarn install`. No `yarn.lock` exists (the repo uses root `bun.lock`), and `@visual-ai/shared` is `workspace:*`.
  - `:7` sets `VITE_SKIP_PRERENDER=1`.
  - The nginx config actually copied is `nginx/conf/spa.conf`.
  - Leftover files: `apps/web/.yarnrc.yml` and `apps/web/.cursorrules` (generic boilerplate).
- **Problem:** `docker build` fails at the `COPY` step. Even with that fixed, the workspace dependency cannot resolve from an `apps/web` build context, and the marketing pages would ship without prerendered HTML.
- **Fix guide:** ❓ First confirm whether this Dockerfile is the live deploy path; see `agent_docs/*deploy_modernization*`. If it is:
  - Build from the repo root with `oven/bun` and `bun install --frozen-lockfile`, run the web build with prerender (Playwright Chromium in the build stage), then copy `apps/web/dist` and `nginx/conf/spa.conf`.
  - Extend `.dockerignore` with `coverage`, `.env.local` and `**/node_modules`.
  - Delete `.yarnrc.yml` and `.cursorrules`.
  If it is not the live path, delete the Dockerfile and `docker-compose.yml` instead.
- **Test to add:** n/a. Verify that `docker build -f apps/web/Dockerfile .` succeeds from the root.
- **Acceptance:** the image builds and serves the prerendered landing page, and no yarn artefacts remain.

#### FE-013 — Landing nav links are dead on all 5 feature landing pages
- **Sources:** MKT-01 · **Category:** bug
- **Evidence:** `utils/landing.ts:185-191` defines `NAV_LINKS` as `#tools #showcase #models #pricing #faq`. `pages/FeatureLanding.vue` renders `LandingNav`, but only has a `#faq` section. `LandingNav` uses `@click.prevent` plus `scrollToSection`, which does nothing when the element is missing.
- **Problem:** on `/text-to-image`, `/image-upscaler` and the other feature pages, 4 of the 5 nav links do nothing.
- **Fix guide:** `scrollToSection(hash)`: if `document.querySelector(hash)` exists, scroll to it; otherwise `router.push({ path: '/', hash })`. This relies on FE-037 so the hash scroll works after navigation.
- **Test to add:** `LandingNav.test.ts`: on `/text-to-image`, clicking "Pricing" pushes `{ path: '/', hash: '#pricing' }`; on `/` it scrolls.
- **Acceptance:** every nav link works on every page that renders `LandingNav`.

#### FE-014 — Credit-pack "Save X%" figures are invented, and the featured pack is the wrong one
- **Sources:** MKT-06 · **Category:** bug, trust
- **Evidence:** `utils/constants.ts:256-292` hard-codes 11%, 22% and 31%. The real per-credit prices are 0.825, 0.796, 0.787 and 0.798, so the real savings against the base pack are about 3.5%, 4.6% and 3.3%. `components/Landing/PricingTeaser.vue:25` says "save up to 31%". The 500-credit pack is labelled "Save 31%" and featured, yet it costs **more** per credit than the 380 pack.
- **Problem:** the pricing claims are misleading, which is a consumer-protection risk on a payments page.
- **Fix guide:** add `getPackSavings(product, baseProduct)` and `getBestValuePack(products)` in a pricing util. Derive the badges, the featured pack and the teaser's "up to X%" from them. Delete the hard-coded `savings` fields. ❓ If real savings are too small to advertise, remove the claims entirely.
- **Test to add:** `utils/pricing.test.ts`: savings come from price and credits, and the best-value pack is the one with the lowest per-credit price.
- **Acceptance:** no hard-coded savings remain, and every displayed % matches the computed value.

### 🟡 Medium

#### FE-015 — `deleteImage` keeps only the deleted id in `deletingImageIds` (inverted filter)
- **Sources:** STATE-06, UI-04
- **Evidence:** `utils/helpers.ts:48` `filter((id) => id === data.value.imageId)`; the error branch (`:42`) uses `!==`, and the resets run only when `data.value` is truthy.
- **Problem:** concurrent deletes lose their spinners, the deleted id is never removed, and an empty response body leaves `isDeleting` stuck.
- **Fix guide:** add one `clearDeleting(id)` helper that filters with `!==` against the **requested** id, and call it in `finally`.
- **Test to add:** `helpers.test.ts`: with `['a','b']` in flight, deleting `a` leaves `['b']`, on both success and failure.
- **Acceptance:** only the finished id is removed, and `isDeleting` resets on every path.

#### FE-016 — `bulkDownload` is fire-and-forget
- **Sources:** STATE-11, UI-09
- **Evidence:**
  - `utils/helpers.ts:175-199` uses `images.forEach(async ...)`.
  - `:105` calls `revokeObjectURL` immediately after `a.click()`.
  - `stores/history.ts:10` declares `isBulkDownloading`, which is never set.
  - `getDownloadImageUrl` (`:~303`) can emit a `.undefined` extension.
- **Problem:** the function returns at once, so there is no busy state and errors are unhandled. Browsers block parallel downloads, and revoking immediately can cancel the download in Safari.
- **Fix guide:** run the downloads in a sequential `for…of` with `await`, set and reset `isBulkDownloading` in `try/finally`, defer the revoke with `setTimeout(…, 0)`, and default the extension to the image's `format` or `'png'` (as a named constant).
- **Test to add:** `helpers.test.ts`: the function resolves only after every download, the flag toggles, and no filename contains `undefined`.
- **Acceptance:** the busy flag reflects progress and every file is saved.

#### FE-017 — Bulk delete has no confirmation and no error feedback
- **Sources:** UI-06 (double-fire claim refuted) · **Category:** ux-state
- **Evidence:** `components/History/SelectActionButtons.vue:41-42,157` calls `bulkDelete` directly. `utils/helpers.ts:143-172` only logs errors. Single delete uses `ConfirmDeleteImageDialog`.
- **Problem:** one click permanently deletes all selected images, and a failure is invisible.
- **Fix guide:** generalise `ConfirmDeleteImageDialog` to take a `count`, hoist one instance to `History.vue` (shared with FE-031), confirm before `bulkDelete`, and show a snackbar on failure through `notify()` (FE-051).
- **Test to add:** `SelectActionButtons.test.ts`: `bulkDelete` is not called until the user confirms, and a failure shows an error.
- **Acceptance:** confirmation is required and failures are visible.

#### FE-018 — History "select all in group" pushes duplicates
- **Sources:** UI-08
- **Evidence:** `components/History/History.vue:83-103`: `groupData.forEach(item => selectedImages.value.push(item))`, called whenever a group is not fully selected.
- **Problem:** the selected count is inflated and the bulk request carries duplicate ids.
- **Fix guide:** merge by `_id`, using a `Set` of the selected ids.
- **Test to add:** `History.test.ts`: select one image, then "select all"; the ids are unique and the count is correct.
- **Acceptance:** `selectedImages` never contains duplicates.

#### FE-019 — Dashboard canvas has no error UI for upscale, remove-bg, colorize and revive
- **Sources:** DASH-06 · **Category:** half-baked
- **Evidence:** `components/Dashboard/Canvas/GenerationErrorBanner.vue` is mounted only for `FeatureType.IMAGE` (`Feed/UserGenerationsGrid.vue:143`). The other features' `errMsg` has no consumer in the dashboard canvas.
- **Problem:** even after FE-005, transform errors started from the sidebar are invisible on the dashboard.
- **Fix guide:** render `GenerationErrorBanner` for the active feature: `:feature="activeFeature"`, reading `errMsg[activeFeature]`, with Retry wired to `retryByFeature`.
- **Test to add:** `GenerationErrorBanner.test.ts` / `ResultCanvas.test.ts`: the banner renders for each `FeatureType` that has an error.
- **Acceptance:** errors are visible for all five features.

#### FE-020 — Reference image can be attached but is never sent ❓ Decision
- **Sources:** DASH-11 · **Category:** half-baked
- **Evidence:** `stores/aside.ts` holds `referenceImage` and an unused `imageInputMax`. `components/Dashboard/Composer/ReferenceImageControl.vue` and the `PromptBar` thumbnail let the user attach an image. Neither `GenerateCTA` nor `stores/generate.ts:generateImage` reads it.
- **Problem:** the user attaches a reference and it is silently ignored.
- **Fix guide:** ❓ Either wire it in, sending the image for models whose `MODEL_REGISTRY[...].fields.imageInput` is set and building it in `buildImageBody` (FE-029), or hide the control until the backend supports it.
- **Test to add:** `GenerateCTA.test.ts`: the body includes the image when it is set and the model supports it; otherwise the control is not rendered.
- **Acceptance:** the reference image is either used or not offered.

#### FE-021 — Sidebar `onMounted` overwrites restored composer settings
- **Sources:** DASH-04
- **Evidence:** `components/Dashboard/Sidebar/ImageGenerateAside.vue` `onMounted` resets `aspectRatio`, `imageFormat` and `noOfOutputs`. `composables/useComposerPersistence.ts` restores them earlier, in `Dashboard.vue` setup, and its watcher then persists the defaults.
- **Problem:** persistence is effectively dead. Settings also reset on a breakpoint change or a feature switch, because the aside remounts.
- **Fix guide:** reset a field only when its current value is invalid for the selected model's fields; extract an `isValidForModel(field, value, model)` helper.
- **Test to add:** `ImageGenerateAside.test.ts`: a valid persisted `aspectRatio` survives mount, and an invalid one is reset.
- **Acceptance:** a reload keeps the user's settings.

#### FE-022 — Invalid reference or describe image is silently dropped; type validation is weak
- **Sources:** DASH-10
- **Evidence:** `components/Dashboard/Composer/ReferenceImageControl.vue` does `if (!result.ok) return;`. `composables/useImageDrop.ts` accepts any `image/*`, including svg and heic. The describe input in `ModelPicker/PromptAiMenu.vue` is not validated.
- **Fix guide:** add a single `validateImageFile(file)` util with a jpeg/png/webp allow-list and the max-size constant. Show `result.error` through `notify()`, and reuse the validator in `PromptAiMenu`.
- **Test to add:** `useImageDrop.test.ts`: svg and oversize files are rejected with a message.
- **Acceptance:** every rejected file shows the reason.

#### FE-023 — Explore viewer keyboard and wheel shortcuts fire behind open modals
- **Sources:** UI-14
- **Evidence:** `composables/useExploreViewerNav.ts:34-40` guards only against input and textarea targets. `components/Explore/ImageViewer.vue:60` sets `navEnabled = !isProcessing`.
- **Problem:** with the low-credits or chain-confirm dialog open, pressing `r` remixes, Escape exits the viewer, and the arrow keys change the image behind the dialog.
- **Fix guide:** `navEnabled` also requires that no dialog in `dialogStore` is open. Add an `isAnyDialogOpen` getter, and additionally ignore events whose target is inside `[role="dialog"]`.
- **Test to add:** `useExploreViewerNav.test.ts`: the arrow and `r` keys do nothing while a dialog is open.
- **Acceptance:** no shortcut fires while a modal is open.

#### FE-024 — `app` ↔ `generate` store cycle; SSE handling copy-pasted per feature
- **Sources:** STATE-08 · **Category:** architecture
- **Evidence:**
  - `stores/app.ts:29-40` uses `useGenerateStore()` and `storeToRefs`, and `stores/generate.ts:57` uses `useAppStore()`.
  - `app.ts:59-92` has 5 identical `useEventSource` blocks.
  - `:94-199` has per-feature if-chains.
  - `:115` mutates `userStore.history`.
- **Problem:** the code works only because `main.ts` creates the app store first; creating it in a different order causes a TypeError on the first SSE event. Adding a feature takes about 6 edits. The app store mixes theme, telemetry, toast, SSE and history.
- **Fix guide:**
  - Extract `stores/jobProgress.ts` (or a composable) with an SSE factory per `FeatureType`, a single handler map, and a one-way dependency on the `generate` and `user` stores.
  - Move `sendSignal` to `utils/telemetry.ts`.
  - Add a typed `inProgressKey(feature)` helper (shared with FE-029).
  - Add `parseJobStatus` from FE-046.
- **Test to add:** the existing `app.test.ts` and `generate.test.ts` still pass. Add a test that instantiates `generate` first.
- **Acceptance:** `generate.ts` does not import `app`, and one handler serves all features.

#### FE-025 — `Authorization: Bearer null`, a junk `mode` request header, and a user store that bypasses `useFetch`
- **Sources:** STATE-09
- **Evidence:**
  - `composables/useFetch/index.ts:16-21` builds `Bearer ${token}` with no null check.
  - `mode: 'cors'` sits inside `headers` at `stores/user.ts:83,110`, `stores/generate.ts:143`, `utils/payment.ts:126`, `stores/savedPrompts.ts:59`, six places in `utils/helpers.ts`, and two in `utils/promptAi.ts`.
  - `stores/user.ts:38-48` uses raw `fetch` with its own token logic.
- **Fix guide:**
  - Set the `Authorization` header only when the token is truthy.
  - Delete every `mode: 'cors'` header entry. 🧩 Also remove `"Mode"` from the API's `allowedHeaders`.
  - Port `getUserDetails` to `useFetch`, with a stale-response guard that compares the requested id.
- **Test to add:** `composables/useFetch/index.test.ts`: when `getToken` returns null, no `Authorization` header is sent.
- **Acceptance:** `grep -rn "mode: 'cors'" src` returns 0 results and no request carries `Bearer null`.

#### FE-026 — 28 `vue-tsc` errors in production source
- **Sources:** XC-03 · **Category:** type-safety
- **Evidence:** each entry is `file (line,col)` and the error.
  - `pages/Compare.vue`
    - (20,19) TS2677: bad type predicate.
    - (38,13), (40,20), (63-66): TS18047 `card` is possibly null. This is a possible runtime crash.
  - `components/Dashboard/Feed/UserGenerationsGrid.vue`
    - (34,30), (34,64), (112,19): `Date | undefined` passed to `new Date()`.
    - (220,27): `_id` does not exist on `IImage`.
  - `components/Dashboard/Sidebar/ImageGenerateAside.vue`
    - (26,7): unused `userStore`.
    - (56,36): `string` passed where the format union is expected.
  - `components/Dashboard/Sidebar/UpscaleImageAside.vue` (73,36): the same format-union error.
  - `components/Header/AppHeader.vue` (27,7): unused `dialogStore`.
  - `components/Header/FeatureSelect.vue` (42,63): string index into the icon map.
  - `components/Header/ReferralOffer.vue` (3,1): unused `storeToRefs`.
  - `components/Header/UserMenu.vue`
    - (54,41): `imageUrl` is not on the user type. Check whether the avatar renders.
    - (219,14): the ref callback is not a `VNodeRef`.
    - (234-242): `badge` is not on the item type. This is dead code (FE-055).
  - `components/History/CollectionsStrip.vue` (141,12): `h()` ref callback.
  - `components/History/ImageActionButtons.vue` (217-247): a `Promise<boolean>` handler where `void` is expected.
  - `plugins/index.ts` (22,3): TS2590, union type too complex.
- **Fix guide:** fix each error at its root:
  - Narrow `card` in `Compare.vue`.
  - Add the real fields to the types, or stop reading them.
  - Correct the `IImage` shape (`_id`, optional dates).
  - Narrow the format union.
  - Change the handler types.
  - Delete the unused symbols.
  - Use `keyof typeof` for the icon-map key.
  - Annotate the `plugins/index.ts` expression.
  Do not use `as any` or `@ts-ignore`.
- **Test to add:** `Compare.test.ts`: a missing card renders the fallback.
- **Acceptance:** `bunx vue-tsc --noEmit` reports 0 errors outside `*.test.ts`.

#### FE-027 — Quality gates broken: `vp check` fails, and every script mutates files
- **Sources:** XC-04 · **Category:** config
- **Evidence:** `vp check` aborts while formatting `dist/*.html`. In `apps/web/package.json`, `lint` is `vp lint --fix` and `verify` is `vp lint --fix && vp check --fix`. There is no typecheck script.
- **Fix guide:**
  - Ignore `dist/**` and `coverage/**` in the vite-plus fmt/check config.
  - Add the scripts `"typecheck": "vue-tsc --noEmit"`, `"lint:ci": "vp lint"` and `"check:ci": "vp check"`.
  - Add `vue-tsc` to devDependencies if it is missing.
- **Test to add:** n/a. Verify that `bun run typecheck`, `bun run lint:ci` and `bun run check:ci` run without writing any file (`git status` is unchanged).
- **Acceptance:** all three scripts run with `dist/` present and write nothing.

#### FE-028 — nginx serves no compression, cache headers or security headers
- **Sources:** XC-06 · **Category:** performance, security
- **Evidence:** `apps/web/nginx/conf/spa.conf` contains only `try_files`. `nginx/conf/default.conf:57` sets HSTS only.
- **Fix guide:** in `spa.conf`:
  - `gzip on;` with `gzip_types` for css, js, json, svg and xml.
  - `location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }`
  - `location = /index.html { add_header Cache-Control "no-cache"; }`, plus no-cache for prerendered html.
  - `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
  - A CSP that allows Clerk, Razorpay, Cloudinary, TelemetryDeck and the API origin. Start with `Content-Security-Policy-Report-Only`.
- **Test to add:** n/a. Verify with `curl -I` against the built container.
- **Acceptance:** assets are served immutable and gzipped, HTML is no-cache, and the security headers are present.

#### FE-029 — Transform-job plumbing duplicated across 5 asides, 7 progress-URL builders and divergent storage keys
- **Sources:** XC-11, DASH-09, DASH-03 · **Category:** dry, root cause of bugs
- **Evidence:**
  - The `ImageBody` build is duplicated: `components/Dashboard/Composer/GenerateCTA.vue:54-69` and `composables/useImageChainActions.ts:265-280` are identical apart from the prompt source, and include the magic `outputQuality === 0 ? 70 : 100`.
  - `${VITE_API_BASEPATH}/progress?jobId=` is built 7 times: `useViewerTransform.ts:91`, `useImageChainActions.ts:282`, `RemoveBgAside.vue:55,74`, `UpscaleImageAside.vue:118,137` and `GenerateCTA.vue:72`.
  - The job-id plus `*InProgress` flag plus restore-on-mount logic repeats in `RemoveBgAside.vue:48-60`, `UpscaleImageAside.vue:105-122` and `useViewerTransform.ts:113-130`.
  - The keys have already diverged: `stores/generate.ts:259` resets `removeBgInProgress`, while the aside reads `remove_bgInProgress`. This bug is latent until FE-005 activates that branch.
  - The `*Aside.vue` files duplicate `SEGMENT_BASE`/`segmentClass`, `outputFormatOptions`, `formatGridClass` and `selectedModelFields`, and the mode watcher hard-codes `FLUX_PRO`.
- **Fix guide:**
  - `utils/generationInput.ts`: `buildImageBody({ mode, settings, prompt })` plus the constants `OUTPUT_QUALITY_STANDARD = 70` and `OUTPUT_QUALITY_HIGH = 100`.
  - `utils/api.ts`: `getProgressUrl(jobId)`.
  - `utils/jobKeys.ts`: `inProgressKey(feature: FeatureType)`, the single source for the storage keys.
  - `composables/useTransformAside(feature)`: submit, resume, in-progress and credit gate.
  - A shared `outputFormatOptions` util. Reuse the `primitives/SegmentedControl` (after fixing its keyboard handling, FE-032) instead of the `segmentClass` copies.
  - Take the default model from the registry rather than `FLUX_PRO`.
- **Test to add:** `utils/generationInput.test.ts` (quality is omitted for unsupported models; the 70/100 mapping), `utils/api.test.ts`, `utils/jobKeys.test.ts` (the store and aside keys match).
- **Acceptance:** `grep -rn "progress?jobId" src` returns 1 result, the asides contain no duplicated submit/resume code, and there is one key per feature.

#### FE-030 — Oversized components with mixed responsibilities
- **Sources:** DASH-16, UI-11 · **Category:** maintainability
- **Evidence:**
  - `components/Dashboard/Feed/UserGenerationsGrid.vue` (524 lines) holds the pending row, the progress ring, the tile and a large SCSS block.
  - `components/Dialogs/ImageDialog.vue` (657 lines) duplicates the chain-action menu from `components/History/ImageActionButtons.vue`, and the Cloudinary URL helpers are also in `History.vue:getImageUrl`.
  - `ImageDialog` keeps a local `isFavorite` with two watchers. Its toolbar download handles only index 0 of multi-output images, and `favoriteImage($event, item?._id ?? '')` can send an empty id.
- **Fix guide:**
  - Extract `PendingGenerationTile.vue`, `ProgressRing.vue` and `GenerationTile.vue`.
  - Extract `History/ImageChainMenu.vue`, shared by `ImageDialog` and `ImageActionButtons`.
  - Add a single `utils/cloudinary.ts` (`cloudinaryUrl(id, opts)`, also used by FE-041).
  - Derive the favourite state from the store.
  - Download the currently viewed index.
  - Guard against a missing `item`.
- **Test to add:** the existing specs pass. Add `ImageDialog.test.ts`: download uses the active index, and favourite is not called without an id.
- **Acceptance:** each file is under about 300 lines, with one chain-menu implementation and one Cloudinary helper.

#### FE-031 — Every history tile adds window scroll and resize listeners and its own confirm dialog
- **Sources:** UI-12 · **Category:** performance
- **Evidence:** `components/History/ImageActionButtons.vue:90-91` adds `window.addEventListener('scroll', …, { capture: true })` and a `resize` listener on mount. Each tile also mounts a `ConfirmDeleteImageDialog`. The `imageIndex` prop appears unused.
- **Problem:** with hundreds of tiles, every scroll event runs hundreds of handlers.
- **Fix guide:** attach the listeners only while the menu is open (`useEventListener` inside a `watch(isOpen)`), hoist the confirm dialog to `History.vue` (shared with FE-017), and remove the unused prop.
- **Test to add:** `ImageActionButtons.test.ts`: no window listeners until the menu opens, and they are removed on close.
- **Acceptance:** no listeners exist for closed menus.

#### FE-032 — Dead, unwired and test-only code shipped in `src`
- **Sources:** STATE-13, XC-10, MKT-16, MKT-17, DASH-14, DASH-21 · **Category:** dead-code
- **Evidence:**
  - Never mounted: `components/Dialogs/PricingDialog.vue` (plus `stores/dialog.ts:97-102` `showPricing`/`hidePricing`), `components/Dialogs/ConfirmColorizeDialog.vue`, the empty stub `components/Credits.vue`, and `primitives/Stepper.vue` and `TokenScratch.vue`.
  - `primitives/SegmentedControl.vue` is either kept for FE-029 and has its roving tabindex fixed, or deleted.
  - Test-only: `utils/communityMock.ts` (131 lines, 10 hard-coded Cloudinary URLs) and `composables/useMagnetic.ts`.
  - Unused exports: `getTierCreditLabel` (which is also wrong: it hard-codes premium at 4 credits), `getGenerationCreditBreakdown`, `getLandingStats`, `groupModelsByProvider`, `formatPrice`, `getPublicIds`, `pickRandomPrompt`, `FEATURE_LANDINGS`, `FeatureIconMap`, `SITE_ORIGIN`, `AUTHOR_AVATAR_PALETTE`, `IMAGE_SIZES` (`utils/constants.ts:59`), `HERO_IMAGE`, the types `VideoFeature` and `RazorpaySubscription`, and about 30 unused exported types.
  - `stores/dialog.ts:34` `lowCreditsDialog` duplicates `showLowCreditsDialog`.
  - `stores/user.ts:62-67` writes `localStorage.userDetails`, which nothing reads.
  - `useComposerPersistence.ts:24` exports the test-only `resetComposerPersistenceForTests` from production code.
  - Commented-out code: `utils/constants.ts:36-57`, `types/index.ts:47`, `utils/helpers.ts:307`.
  - About 13 unused icon components (fluxFast, fluxRealism, fluxPro, coin, star, connection, users, and their `*Dark` variants). `IconConnection` and `IconConnectionDark` are byte-identical, and the other Dark variants differ only in hex colour.
  - `Header/FeatureSelect.vue:33-37,129` keeps a dead `iconComponent` alive with `void iconComponent;`, and `features = ref(FEATURES)` is never mutated.
  - Unused `fallback` props in `ModelPicker.vue` and `UpscaleModelPicker.vue`.
  - Unreferenced assets: `src/assets/models/community.png`, and `public/logo.svg` (check the manifest and any external use first).
- **Fix guide:**
  - Delete each item, together with its tests.
  - Make the remaining used icons use `currentColor` (one component instead of a light/dark pair).
  - Reset composer persistence in tests with `localStorage.clear()` plus `vi.resetModules()`.
- **Test to add:** n/a. Verify with `bun run typecheck`, `vp test run`, and a grep for each symbol (0 hits).
- **Acceptance:** no unreferenced modules, exports or assets remain, and there is no commented-out code.

#### FE-033 — Test suite pins a bug, and its mocks have drifted (about 94 type errors in tests)
- **Sources:** XC-15
- **Evidence:**
  - `utils/payment.test.ts:~173` asserts "swallows SDK load failures", which pins FE-004/FE-011.
  - `GenerateCTA.test.ts:82-137` mocks async methods as `() => void`.
  - These tests are weak: `Dashboard/Sidebar/DashboardSidebar.test.ts` (existence checks only), `pages/Frequent.test.ts`, `Signin.test.ts`, `Signup.test.ts`, `AppFooter.test.ts` and `Explore/ViewerStage.test.ts`.
  - The 95 lint errors are all in tests.
- **Fix guide:**
  - Fix the mock signatures, typing them with `vi.mocked` and the real types.
  - Strengthen the weak tests so they assert behaviour, for example which aside renders for each route.
  - Clear the lint errors in tests.
- **Acceptance:** `vue-tsc` and `vp lint` report 0 errors, including tests, and no test asserts a known bug.

#### FE-034 — Prerender overwrites the SPA fallback shell (Likely)
- **Sources:** MKT-02 (severity corrected by the verifier) · **Category:** seo, config
- **Evidence:** `apps/web/scripts/prerender.mjs:112-115` writes the prerendered `/` page to `dist/index.html`, and `nginx/conf/spa.conf` falls back to it for `/create`, `/explore/*` and so on. Those routes therefore first serve the landing HTML, with the landing title, a `/` canonical, inline `opacity:0` from `v-reveal`, and the Lenis classes.
- **Problem:** crawlers see the wrong meta on app routes, and users get a flash of the landing page before the client remounts.
- **Fix guide:** have the prerender script copy the pristine build output to `dist/_shell.html` before overwriting, and set the nginx fallback to `try_files $uri $uri/ /_shell.html`. Strip the `v-reveal` inline styles and Lenis classes from the snapshots. Add `noindex` to `Signin`, `Signup` and `Profile`.
- **Test to add:** a unit test of the prerender helper: the shell file has no prerendered markup.
- **Acceptance:** non-prerendered routes get the neutral shell.

#### FE-035 — No catch-all route (soft 404)
- **Sources:** MKT-03
- **Evidence:** `router/index.ts` has no `/:pathMatch(.*)*` route.
- **Problem:** unknown URLs render a blank app with HTTP 200.
- **Fix guide:** add `pages/NotFound.vue` (links home and to the dashboard) with `usePageSeo({ noindex: true })`, registered as the last route.
- **Test to add:** `router/index.test.ts`: `/nope` resolves to `NotFound`.
- **Acceptance:** unknown paths show the 404 page.

#### FE-036 — A trailing slash blanks the feature landing pages
- **Sources:** MKT-04
- **Evidence:** `utils/featureLandings.ts:212-214` `featureLandingByPath` compares paths strictly.
- **Problem:** `/text-to-image/` renders blank and sets `noindex`.
- **Fix guide:** normalise the trailing slash in the lookup, or add a router `beforeEach` redirect that strips it.
- **Test to add:** `featureLandings.test.ts`: `/text-to-image/` resolves.
- **Acceptance:** both forms render the page.

#### FE-037 — `scrollBehavior` ignores `to.hash`
- **Sources:** MKT-05
- **Evidence:** `router/index.ts:166` always returns `{ top: 0 }`. The links `/pricing#packs` (`Landing/PricingTeaser.vue:30`) and `/pricing#model-costs` (`Landing/CapabilitiesStudioLabs.vue:22`) therefore land at the top.
- **Fix guide:** `if (savedPosition) return savedPosition; if (to.hash) return { el: to.hash, behavior: 'smooth', top: HEADER_OFFSET }; return { top: 0 }`. Check the interaction with Lenis.
- **Test to add:** a `router/index.test.ts` unit test of `scrollBehavior`.
- **Acceptance:** hash links scroll to their section.

#### FE-038 — Credit and pricing copy hard-coded and contradicting the source of truth
- **Sources:** MKT-07, MKT-08, UI-15 · **Category:** dry, trust
- **Evidence:**
  - `components/Pricing/PricingCreditStory.vue:15-16` says "1–8" and "4–8". The real maximum is 5 (`packages/shared/src/models/credits.ts`), and `pricingFAQ.json` says "4–5".
  - `composables/usePricingCatalog.ts:162,167,172` hard-codes blurbs.
  - "50" and "30" are typed about 12 times instead of `SIGNUP_CREDITS` and `DAILY_CREDITS`: `utils/landing.ts:157,162`, `utils/featureLandings.ts:38,50,133`, `PricingTeaser.vue`, `FinalCta.vue:29`, `PricingHero.vue:10`, and others.
  - The pack list in `pricingFAQ.json` duplicates `RAZORPAY_PRODUCTS`.
  - `components/Dialogs/LowCreditsDialog.vue:30,88-89` hard-codes 1 or 2 credits and writes the store ref directly.
- **Fix guide:**
  - Add `getCreditRange(tier?)` derived from `MODEL_REGISTRY`.
  - Interpolate the shared constants into all copy.
  - Build the pack FAQ answer from the catalog.
  - `LowCreditsDialog` takes the required cost as a prop from the caller and closes through a store action.
- **Test to add:** `usePricingCatalog.test.ts`: the ranges equal the registry min and max. `LowCreditsDialog.test.ts`: the text reflects the passed cost.
- **Acceptance:** `grep -rnE "\b(50|30) (free )?credits" src` returns 0 literal hits, and no copy contradicts the registry.

#### FE-039 — Duplicate FAQ entry (also in the JSON-LD)
- **Sources:** MKT-09
- **Evidence:** `utils/constants.ts:21` `GENERAL_FAQS` contains "How do credits work?" twice with different answers, so it renders twice on `/faqs` and in the FAQPage JSON-LD (`pages/Frequent.vue:15`).
- **Fix guide:** merge the two entries into one correct answer.
- **Test to add:** `constants.test.ts`: the FAQ questions are unique.
- **Acceptance:** each question appears once.

#### FE-040 — Legal pages describe subscriptions; the product is credits-only ❓ Decision
- **Sources:** MKT-11
- **Evidence:**
  - `pages/Terms.vue:62-67` and `pages/RefundPolicy.vue:21-31` describe auto-renewing subscriptions.
  - `pages/PrivacyPolicy.vue:14-20` has a commented-out block and a TODO, and a stale "November 13, 2024" date.
  - A `monthly` product is still in `RAZORPAY_PRODUCTS`.
- **Fix guide:** ❓ Get the copy from the owner or legal. Rewrite it for credits-only, remove the TODO and the commented block, move the "last updated" date into a constant, and remove the `monthly` product if it is unused (check the API).
- **Acceptance:** no subscription language remains, and there are no TODOs in legal pages.

#### FE-041 — Images lack dimensions and Cloudinary transforms; Gallery `aspect-ratio` is invalid
- **Sources:** MKT-12 (Likely, static analysis), UI-16 (Confirmed) · **Category:** performance
- **Evidence:**
  - `pages/Gallery.vue:57,89` binds `aspectRatio: "16:9"`, which is invalid CSS, so the browser ignores it. Images load eagerly and there is no `@error` handler.
  - `Landing/ShowcaseGallery.vue:59-65`, `GalleryStrip.vue`, `LandingToolMedia.vue`, `FinalCta.vue` and the LCP image in `LandingHero.vue:87` have no width, height or aspect-ratio.
  - The URLs are raw originals with no `f_auto,q_auto,w_` transforms.
  - `gallery.json` has an `aspectRatio` field that is never used.
- **Fix guide:**
  - Add `toCssAspectRatio('16:9')`, which returns `'16 / 9'`.
  - Add `cloudinaryUrl(id, { width })` (FE-030) with `f_auto,q_auto`, and use `srcset`.
  - Set `loading="lazy"` except on the LCP image, which gets `fetchpriority="high"` and explicit dimensions.
  - Add an `@error` placeholder.
- **Test to add:** `toCssAspectRatio` and `cloudinaryUrl` unit tests, and `Gallery.test.ts` (the style contains `16 / 9`).
- **Acceptance:** every `<img>` has dimensions or an aspect ratio, and the Cloudinary images are transformed.

#### FE-042 — Modals and overlays lack focus trap and restore; `useFocusTrap` has a cleanup bug
- **Sources:** UI-13, DASH-18, MKT-13, STATE-15 (part) · **Category:** a11y
- **Evidence:**
  - `components/AppModal.vue` has no trap and no focus restore, and every instance registers a global Escape handler, so stacked modals close together.
  - `components/Dashboard/MobileSettingsSheet.vue` has no trap, and its slot uses `v-if`, so the aside's state resets on every open.
  - `components/Landing/ShowcaseGallery.vue` sets `aria-modal` on the lightbox but has no focus move, trap or restore, and writes `body.style.overflow` directly.
  - `composables/useFocusTrap.ts:18-23` cleanup removes the listener from the **new** container and never restores focus.
- **Fix guide:**
  - Fix `useFocusTrap`: keep the attached element in a closure, and restore `document.activeElement` on deactivate.
  - Add a `useScrollLock()` with ref-counting.
  - Add a modal stack in `dialogStore`, so only the top modal handles Escape.
  - Apply all of this to `AppModal`, `MobileSettingsSheet` (switching to `v-show`) and the `ShowcaseGallery` lightbox.
- **Test to add:**
  - `useFocusTrap.test.ts`: the old container has no listener after a swap, and focus is restored.
  - `AppModal.test.ts`: Escape closes only the top modal, and focus returns to the trigger.
- **Acceptance:** Tab cycles inside every overlay, and focus returns to the trigger on close.

#### FE-043 — Custom widgets are not keyboard- or ARIA-correct
- **Sources:** DASH-13, DASH-15, MKT-14 · **Category:** a11y
- **Evidence:**
  - `Dashboard/ModelPicker/ModelCompanyGroup.vue` and `ModelCompanySubmenu.vue` open their submenus only on hover, and contain an a11y TODO.
  - The `Feed/UserGenerationsGrid.vue` tile has `role="button"` but contains buttons, and `onTileKeydown` has no target check. `Canvas/CommunityCard.vue:75` has a `@keydown` on an `<article>` that contains the Copy and Remix buttons.
  - `primitives/Tooltip.vue` has no `aria-describedby` and no Escape handling.
  - `primitives/Popover.vue` gives its dialog no accessible name and no `aria-controls`, and restores focus only on Escape.
- **Fix guide:**
  - Model picker: open on click, Enter and ArrowRight, and set `aria-expanded` and `aria-haspopup`.
  - Tiles: use a dedicated "Open" button instead of `role="button"` on the container, or check `event.target === event.currentTarget`.
  - Tooltip and Popover: wire up the ids and ARIA attributes, and restore focus on every close path.
- **Test to add:** keydown opens the submenu; Enter on an inner button does not open the tile; the Tooltip has `aria-describedby`.
- **Acceptance:** the model picker and tiles are fully usable from the keyboard.

#### FE-044 — Marketing stats and badges cannot be verified ❓ Decision
- **Sources:** MKT-10 (Likely)
- **Evidence:** `utils/landing.ts:39-44` claims "500+ creators" and "Thousands of images". `Landing/PricingTeaser.vue:56` shows a "Most popular" badge.
- **Fix guide:** ❓ The owner supplies the real numbers, or the claims are removed. Derive "Most popular" from data, or rename it "Best value" and compute it (FE-014).
- **Acceptance:** every claim is backed by data or removed.

### ⚪ Low

| ID | Title | Sources | Evidence | Fix guide | Test / acceptance |
|---|---|---|---|---|---|
| FE-045 | Per-user state is not scoped and not reset across sessions | STATE-07 (downgraded: `signOut` does a full reload) | `useComposerPersistence` key `visual-ai-composer-state` is not scoped to the user. `getUserDetails` has no stale-response guard. | Scope the key by userId, and clear it on a `user → null` transition in `App.vue`. The guard is in FE-025. | `App.test.ts`: the composer state is cleared when the user becomes null. |
| FE-046 | SSE `JSON.parse` unguarded; `page_view` only fires when the user changes | STATE-12 | `stores/app.ts:222-240`, `:217-220` | Add `parseJobStatus(raw)`, which returns null and logs on bad input. Send `page_view` from `router.afterEach`. | `'not json'` does not throw, and a page view is sent per route. |
| FE-047 | Duplicate constants and enums, plus magic values | STATE-14 | `composables/useViewerTransform.ts:18` duplicates `TRANSFORM_CREDIT_COST` from `utils/generationCredits.ts:10`. `pages/utils/index.ts:3-9` redeclares `FeatureType`, which `Dialogs/ImageDialog.vue:2` imports. `stores/generate.ts:134,151,154` contains the literals `'Flux Lightning'` and `70`. | Import `FeatureType` from `@/types`, use `getTransformCreditCost()`, and add named constants. | Each value has one definition (grep). |
| FE-048 | Composable cleanup leftovers | STATE-15 (rest) | `useExploreViewerNav.ts:98` sets `body.style.overflow = ''` instead of restoring the prior value. `useComposerPersistence.ts:50-52` calls `setItem` with no try/catch inside a watcher. | Use `useScrollLock` (FE-042), and wrap `setItem` with `log.warn`. | `useExploreViewerNav.test.ts`: overflow is restored. A quota error does not throw. |
| FE-049 | Env vars are untyped and `.env.example` is out of sync | XC-07 | `vite-env.d.ts` has no `ImportMetaEnv`. `.env.example` lists 3 unused vars (`VITE_CLERK_SIGN_IN_URL`, `VITE_CLERK_SIGN_UP_URL`, `VITE_RAZORPAY_PLAN_ID`) and is missing `VITE_LOG_LEVEL`. | Add a typed `ImportMetaEnv`, and a `src/config/env.ts` single reader that throws on a missing required var. Sync `.env.example`. | `env.test.ts`: a missing var throws with its name. |
| FE-050 | Unused or misplaced dependencies | XC-09 | Unused: `core-js`, `@vueuse/motion` (registered at `plugins/index.ts:3,32`, never used), `@fortawesome/free-brands-svg-icons`, `vite-plugin-vue-layouts`. `lodash-es` is used only by FE-005. `pinia` and `vue-router` are in devDependencies. `@vitejs/plugin-vue` is ^5 in web and ^6 in root. | Remove them with `bun remove`, move the runtime libraries to dependencies, and align the plugin-vue version. Keep `@clerk/clerk-js` (it is a peer dependency). | Tests and build pass, and the bundle is smaller. |
| FE-051 | Shared UI helpers are bypassed (snackbar, clipboard, dates, logger) | DASH-20, XC-12 | `snackbarText.value = …; snackbar.value = true` is repeated about 12 times (`SavedPromptsPanel.vue` ×5, `PromptAiMenu.vue`, `useShareActions.ts`, `payment.ts`, `CollectionsStrip.vue`, `ReferralCode.vue`, `Contact.vue`). `ReferralCode.vue:16-21` bypasses `copyText` and gives no feedback on failure. Dates are formatted two ways: `en-GB` in `pages/utils/index.ts:36` and the default locale in `ViewerDetails.vue:55`. Raw `console.error` calls: `ReferralDialog.vue:51`, `BuyMoreCreditsDialog.vue:63`, `DeleteDialog.vue:37`. | Add `notify(message, tone?)` to the app store, use `copyText` with feedback in `ReferralCode`, add one `utils/date.ts`, and use `createLogger`. | `grep "snackbar.value = true"` returns only the store. There are no `console.` calls outside `logger.ts`. `ReferralCode.test.ts`: a failed copy shows an error. |
| FE-052 | `any` and `@ts-ignore` in the payment and generate paths | XC-14 | `utils/payment.ts:56,65,67,95,99,107` (with an `@ts-ignore` on `new Razorpay`); `stores/generate.ts:169,206,268`; `stores/app.ts:176`; `utils/helpers.ts:235`; `types/index.ts:119`; `useFetch/index.ts:42` | Add a `types/razorpay.d.ts` (`Window.Razorpay`, `RazorpayPaymentResponse`), and type the payloads from the shared request types. | Zero `any` or `@ts-ignore` in these files. |
| FE-053 | Chunk-reload handler uses `console` and `eslint-disable` (Likely) | XC-16 | `router/index.ts:165,187-198` | Use `createLogger('router')` and an `_to` parameter, and add or verify a once-per-session reload guard (`sessionStorage`). | A chunk error triggers exactly one reload. |
| FE-054 | "Improve prompt" is enabled when the prompt is empty, and the API returns 400 | DASH-12 | `Dashboard/ModelPicker/PromptAiMenu.vue`, `utils/promptAi.ts` | Disable it when `prompt.trim()` is empty. | `PromptAiMenu.test.ts`: the disabled state. |
| FE-055 | CreditsChip and UserMenu accessibility gaps and dead code | DASH-19 | `Header/CreditsChip.vue` has a static `aria-label` that hides the balance, an unlabeled panel and no Escape handling. In `Header/UserMenu.vue` the theme and logout items are missing from `itemRefs`, `item.badge` is dead, and 4 refs are synced by a watcher. | Use a dynamic `aria-label`, register every item, and remove the badge code. | Arrow keys reach Logout. |
| FE-056 | Both referral-offer layouts render at exactly 600px | DASH-22 | `Header/AppHeader.vue` uses `(min-width: 600px)`, while `Header/ReferralOffer.vue` uses `(max-width: 600px)`. | Add one `BREAKPOINT_SM` constant and derive `isMobile = !smAndUp`. | At 600px exactly one layout renders. |
| FE-057 | Favourites empty state shows the wrong copy, and History has no loading state | UI-17 | `History/NoResults.vue`; `History/History.vue:106-110` (a deep watch regroups everything) | Fix the copy, add a loading skeleton, and turn the watcher into a `computed`. | `NoResults.test.ts`: the favourites copy. |
| FE-058 | Examples tabs are not an ARIA tablist, and the 3 panels are copy-pasted | UI-20 | `pages/Examples.vue:116-170`, plus a nested `100vh` scroller | Render one panel with `v-for`, set `role=tabpanel`, `aria-controls` and a roving tabindex with arrow keys, and drop the fixed-height scroller. | ArrowRight moves the selection. |
| FE-059 | ViewerDetails repeats the enhance-button markup 3 times | UI-21 | `Explore/ViewerDetails.vue:163-204` | Use a `const enhanceActions = [...]` array with `v-for`. | The existing testids still pass. |
| FE-060 | Accordion has invalid nesting and its collapsed panels are still tabbable | MKT-15 | `Accordion.vue:55-66` wraps the slot in a `<p>`, and `FAQ.vue` puts a `<div v-html>` inside it. | Use a `<div>` wrapper and set `inert` when collapsed. | Collapsed links cannot be reached with Tab. |
| FE-061 | SEO duplication: two JSON-LD blocks on `/`, an ignored `image`, and route lists kept by hand (Likely) | MKT-18 | `index.html` has a static WebApplication JSON-LD and `Landing.vue` adds another. `composables/usePageSeo.ts:32` hard-codes `twitterImage`. Prerender routes, `sitemap.xml` and the router are 3 separate lists. | Keep one JSON-LD, set `twitterImage = image`, and add a drift test. | A drift test that compares the 3 lists. |
| FE-062 | Contact form hides server errors and overwrites typing | MKT-19 | `pages/Contact.vue:100-122` always shows a generic error, even though `helpers.ts:250-259` throws the server message. Native `required` without `novalidate` suppresses the custom messages. `watch(userDetails)` overwrites what the user has typed. | Show `error.message`, add `novalidate`, and prefill only when the field is empty. | `Contact.test.ts`: a server 400 message is shown. |

---

## 4. Fix order and dependencies

Work in batches, and do not start a batch until the previous batch's gate is green (see the fix prompt). Items that share a file belong in the same work package.

### Batch 0: unblock the gates
- [ ] **FE-027**: typecheck, `lint:ci` and `check:ci` scripts, and `vp check` ignoring `dist/`.
  - Until FE-026 and FE-033 land, the gate is **"no new errors vs the baseline"**: 122 tsc errors and 95 lint errors, all lint errors in tests.

### Batch 1: Critical and money/data correctness
- [ ] **FE-001** 🧩❓ (web and API; needs the owner to confirm the API change)
- [ ] **FE-002** 🧩
- [ ] **FE-003**
- [ ] **FE-004 + FE-011** (one package: both touch `utils/payment.ts`; FE-004 first)
- [ ] **FE-005** (before FE-019, FE-024 and FE-029)
- [ ] **FE-007**
- [ ] **FE-008 + FE-015 + FE-016** (one package: all in `utils/helpers.ts`)
- [ ] **FE-009** (then FE-047's `TRANSFORM_CREDIT_COST` part)
- [ ] **FE-010** 🧩 (after FE-002)

### Batch 2: High and Medium behaviour bugs
- [ ] **FE-006**
- [ ] **FE-012** ❓
- [ ] **FE-013** (needs **FE-037** first or in the same package)
- [ ] **FE-014** (with FE-044 ❓)
- [ ] **FE-017** (after FE-008; shares the hoisted dialog with FE-031)
- [ ] **FE-018**
- [ ] **FE-019** (after FE-005)
- [ ] **FE-020** ❓
- [ ] **FE-021**
- [ ] **FE-022**
- [ ] **FE-023**
- [ ] **FE-026**
- [ ] **FE-028**
- [ ] **FE-034**
- [ ] **FE-035**
- [ ] **FE-036**
- [ ] **FE-039**
- [ ] **FE-040** ❓

### Batch 3: structure and DRY
- [ ] **FE-029** (after FE-003 and FE-005; creates `inProgressKey`, `getProgressUrl` and `buildImageBody`)
- [ ] **FE-024** (after FE-029; uses `inProgressKey`; includes FE-046)
- [ ] **FE-025**
- [ ] **FE-030** (creates `utils/cloudinary.ts` for FE-041)
- [ ] **FE-031**
- [ ] **FE-038**
- [ ] **FE-041** (after FE-030)
- [ ] **FE-042** (includes the `useFocusTrap` fix, then FE-048)
- [ ] **FE-043**
- [ ] **FE-051** (creates `notify()`; earlier packages may use a local call and get migrated here)

### Batch 4: cleanup and polish
- [ ] **FE-032** (last structural step: delete dead code after the refactors)
- [ ] **FE-033** (afterwards the gate becomes **zero** tsc and lint errors)
- [ ] **FE-045**
- [ ] **FE-047**
- [ ] **FE-048**
- [ ] **FE-049**
- [ ] **FE-050** (after FE-005 removes `lodash-es`)
- [ ] **FE-052**
- [ ] **FE-053**
- [ ] **FE-054**
- [ ] **FE-055**
- [ ] **FE-056**
- [ ] **FE-057**
- [ ] **FE-058**
- [ ] **FE-059**
- [ ] **FE-060**
- [ ] **FE-061**
- [ ] **FE-062**

---

## 5. Hot files (likely ownership conflicts)

| File | Items |
|---|---|
| `utils/payment.ts` | FE-001, 004, 011, 052 |
| `utils/helpers.ts` | FE-008, 015, 016, 017, 025, 032 |
| `stores/generate.ts` | FE-003, 005, 024, 025, 029, 047, 052 |
| `stores/app.ts` | FE-024, 046, 051 |
| `stores/user.ts` | FE-009, 025, 032, 045 |
| `stores/aside.ts` | FE-007, 020 |
| `stores/dialog.ts` | FE-023, 032, 042 |
| `router/index.ts` | FE-006, 035, 037, 053 |
| `components/Dashboard/Sidebar/*Aside.vue` | FE-003, 021, 026, 029 |
| `components/Dashboard/Composer/GenerateCTA.vue` | FE-009, 020, 029 |
| `composables/useImageChainActions.ts` | FE-007, 029 |
| `composables/useViewerTransform.ts` | FE-009, 029, 047 |
| `components/History/History.vue`, `ImageActionButtons.vue`, `SelectActionButtons.vue` | FE-017, 018, 026, 030, 031, 057 |
| `components/Dialogs/ImageDialog.vue` | FE-030, 047 |
| `utils/constants.ts` | FE-014, 032, 038, 039 |

---

## 6. Decisions needed before fixing (❓)

| Item | Question |
|---|---|
| FE-001 | The API owner must accept moving the product catalog to `packages/shared` and changing `/order/create` to take `productId`. Is the webhook secret configured in each environment? |
| FE-010 | Should account deletion also delete images and payment history, or anonymise them? |
| FE-012 | Is `apps/web/Dockerfile` the live deploy path? If not, delete it rather than fixing it. |
| FE-014 / FE-044 | With real savings at only about 3–5%, keep a savings badge or drop it? Are the "500+ creators" and "Most popular" claims real? |
| FE-020 | Wire the reference image into generation (which models?) or hide the control? |
| FE-040 | Who supplies the corrected Terms, Refund and Privacy copy? |

---

## 7. Production-readiness checklist (after all fixes)

- [ ] No user can obtain credits without a verified, signed payment (FE-001).
- [ ] Every non-public API route requires Clerk auth and uses `req.auth.userId` (FE-002).
- [ ] All 5 features (generate, upscale, remove-bg, colorize, revive) succeed, and **fail visibly** with Retry (FE-003, 005, 019).
- [ ] Payment success, failure and cancel are each visibly handled, and the balance comes from the server (FE-004, 011).
- [ ] `bun run typecheck`, `bun run lint:ci` and `vp test run` are green with 0 errors (FE-026, 027, 033).
- [ ] The Docker image builds and nginx sends cache, compression and security headers (FE-012, 028).
- [ ] No hard-coded credit or price numbers, and no invented marketing claims (FE-014, 038, 044).
- [ ] Overlays trap and restore focus, and the model picker works from the keyboard (FE-042, 043).

---

## 8. Dropped after verification

| Suspected issue | Why dropped |
|---|---|
| The 2-credit upscale confirm is wrong for premium upscalers | The model is chosen later in the aside, and the cost is re-checked there. |
| `useEventSource` reopens on URL change | It uses `immediate: false`, so there is no watcher. |
| Lenis, GSAP, ScrollTrigger, `vReveal`, `useMagnetic`, `useGlobalShortcuts`, `useImageDrop`, Popover and Tooltip leak listeners | Cleanup is correct in all of them. |
| Model and credit data drift from `packages/shared` | `utils/models.ts` derives from the registry. |
| Credit-cost drift between the CTA and Pricing (XC-13) | Both resolve to `getCreditCost`. |
| `v-html` XSS (FAQ, JSON-LD) | Both render static in-repo data only. |
| Committed secrets | `.env.*` files are untracked, and only publishable keys are used. |
| `PrimitivesPlayground` exposed in production | It is gated by `import.meta.env.DEV`. |
| Contact form not wired | It posts to `/users/contact`. |
| Sitemap and prerender lists drifted | They currently match (FE-061 adds a guard). |
| "Fresh row" marked on error (DASH-07) | The code no longer exists. |
| Dynamic `tw-grid-cols-*` purged (DASH-08) | All three literals exist in source. |
| Community feed blank and pagination missing (DASH-17) | It watches `userId` immediately and prefetches. |
| Bulk actions can be double-fired (UI-06 part) | The selection clears and the bar hides while busy. |
| `PricingPacks` crashes on empty packs | The constant is non-empty. |
| SideBySide ready hang, the chain-confirm promise, ImageDialog Escape gating, AuthShell, ExploreImage, Avatar and share flow | Traced; no defects. |
| Store state leaks across sign-out (STATE-07 core) | `signOut({ redirectUrl })` does a full page load. Only the persisted composer key remains (FE-045). |
| Double credit deduction | The server spends daily credits first, correctly. |
| Download URL revoke race | Browser-dependent; folded into FE-016 as a defensive fix only. |

---

## 9. Revision log

- **Rev 1 (2026-10-01):** initial review. 5 area reviewers, 101 raw findings, de-duplicated to 62. An independent verifier re-traced 20 Critical/High items: 15 confirmed and 5 adjusted, as follows.
  - **UI-18:** scope narrowed to `/users*` plus IDOR.
  - **STATE-07:** downgraded to Low.
  - **DASH-03:** downgraded to latent and merged into FE-029.
  - **UI-06:** the double-fire claim was removed and the finding downgraded to Medium.
  - **MKT-02:** marked Likely and downgraded to Medium.
