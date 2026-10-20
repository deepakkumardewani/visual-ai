# TASKS: Replace Razorpay with Dodo Payments (test mode)

Source: `SPEC_dodo_payments.md`, `PLAN_dodo_payments.md`. Planning artifact only.

Global rules (every task): never commit yourself; the /build-phases orchestrator commits each verified phase (one commit per phase); never start the dev server (always running); Dodo test mode only; never print or track secrets; never prompt the user (subagents cannot): if a task needs anything outside its Files or beyond its pre-approved scope, take no action on it, log it under DECISIONS and FAIL with the exact unblock step. Every task lists at most 5 files. A task's `Files` are tracked paths only (they go into `task_built --files` and get staged); a `**Manual (untracked, never staged):**` line grants the builder write access to the gitignored files it names, which are never passed to `--files`. Status markers: ☐ todo, flipped to ✅ by the orchestrator after independent verification.

Task kinds: `implementation | unit | e2e | gate | walkthrough | dod`. Each phase that adds behaviour runs in this order: implementation tasks -> `Unit:` tasks (unit-test-engineer, scoped coverage, every file ≥80% required, >95% target) -> `E2E:` tasks (e2e-engineer, one per user flow, `--repeat-each=3`) -> 🔶 checkpoint. Implementation tasks do not create new spec files; they may update existing specs to keep them green. The only exception is the test-first money path (webhook signature, idempotent credit grant): T4.1 (`dodo/eventMapper.test.ts`, `dodo/verify.test.ts`), T4.2 (`applyEvent.test.ts`) and T4.3 (`webhookRouter.test.ts`) create exactly the specs they name. Every other new spec is created by a `Unit:` task (T2.3, T3.6, T3.7, T5.6, T5.7); the `Unit:`/`E2E:` tasks are the independent coverage gate and extend (never duplicate) existing spec files. The T2.0 harness template `_template.spec.ts` is setup, not a feature spec. Where an implementation task's Acceptance needs a spec that a later `Unit:` task creates, it says "proven by T<x>"; the phase verifier checks it after that Unit task has run.

One-time manual PRE-FLIGHT (the user does this BEFORE running `/build-phases` on Phase 0; T0.1/T0.2 only check it and FAIL with these instructions if it is missing):

1. `claude plugins marketplace add dodopayments/dodo-agent-plugin`, then `claude plugins install dodopayments@dodopayments --scope project` (run from the repo root).
2. Restart the Claude Code session so the plugin, its skills and its MCPs load.
3. Authenticate the `dodopayments-api` MCP (OAuth in the browser, test mode); `claude mcp list` must show it connected, along with `dodo-knowledge`.
   3a. Grant the build agent the Dodo MCP tools: subagents only get the tools in their `tools:` line and cannot spawn further subagents, so add the Dodo MCP tool names (as shown by `/mcp` in the restarted session) to `tools:` in `~/.claude/agents/phase-builder.md`.
4. Put the test-mode `DODO_PAYMENTS_API_KEY` in the gitignored `apps/api/.env`.
5. Have a public HTTPS base URL (tunnel or staging) that reaches the running API, and pass it to `/build-phases` for Phase 1 as a note: `webhook-url=https://<host>`.
6. Run permissions: to run Phases 0-1 unattended, the session needs allow rules for `claude plugins list`, `claude mcp list`, the Dodo MCP tools (the same names as step 3a), and writes to the two untracked env files `apps/api/.env` (T1.2 webhook key, T1.3 product ids) and `apps/web/.env.e2e.local` (T1.3); otherwise run those phases in bypass-permissions mode. Without this, subagents stall on permission prompts they cannot answer.
   Note: `.claude/settings.json` is gitignored (`.gitignore:27`), so the plugin enablement written by step 1 is a local-only manual step: there is nothing to commit, and the orchestrator never stages it.

Pre-approved decisions (subagents act on these without asking):

- Create in Dodo TEST mode exactly 4 one-time (non-subscription) INR products: "200 credits" INR 130, "450 credits" INR 290, "960 credits" INR 500, "2000 credits" INR 900 (minor units as Dodo requires). Reuse a product if one with the same name already exists with the same price and type; if a same-name product exists with a different price or type, the task FAILs (no change made). Never delete or overwrite any Dodo resource.
- Create one test-mode webhook endpoint at `<webhook-url>/webhooks/payments`, subscribed to `payment.succeeded` and `payment.failed`. Reuse it if an endpoint with that URL exists; never delete or overwrite.
- Dodo MCP calls are made by phase-builder directly with the Dodo MCP tools (pre-flight step 3a); results are recorded as text evidence the verifier can read without MCP access.

Checkpoint 0/1 notes, gate results and build evidence live in the "Gate results and build evidence" section at the end of `agent_docs/PLAN_dodo_payments.md`, as lines starting with the fixed labels defined there (no secrets, ever). T0.3 also writes the `Answer (T0.3):` lines into SPEC section 13. Every task that writes PLAN or SPEC lists that file in Files so the orchestrator stages it (T0.3 is the only task that stages SPEC). Commit the three planning files yourself before Phase 0: paths already dirty at the orchestrator's snapshot are never staged, so uncommitted planning files would keep the Phase 0 notes out of the phase commit.

Confirmed decisions (not re-opened):

- Legacy monthly product is dropped; only the 4 one-time INR packs (200/450/960/2000 credits at INR 130/290/500/900) are in scope.
- INR gate: if Dodo cannot use INR as a product base currency, T0.4 FAILs (blocked) with the options written out, creates nothing, and the build stops. No automatic fallback.
- The agent creates the 4 test-mode products through the Dodo API MCP, only after the gate passes.
- Plugin installs at project scope.

QA harness note: the repo has NO seeded QA harness yet (`apps/web/e2e/fixtures/` holds only `generation.ts`; there is no `e2e/qa/`). T2.0/T2.0.1 create it. The e2e root is `apps/web` (not the repo root): README at `apps/web/e2e/README.md`, template at `apps/web/e2e/qa/_template.spec.ts`, specs at `apps/web/e2e/qa/<area>.spec.ts`, scenario files at `apps/web/e2e/scenarios/<area>.feature.md`. When running `/build-phases` on Phase 5, pass the note `e2e-root=apps/web; spec dir apps/web/e2e/qa/` (the orchestrator's harness check is repo-root relative). Billing specs: `e2e/qa/billing-purchase.spec.ts` (T5.8) and `e2e/qa/billing-history.spec.ts` (T5.9). `agent-browser` is never used as evidence.

Commands used in Verify (run from repo root unless noted): `bun run test`, `bun run verify` (`vp lint` + `vp check`), `cd apps/api && bunx vitest run`, `cd apps/web && bunx playwright test e2e/qa/billing-purchase.spec.ts e2e/qa/billing-history.spec.ts`. Coverage note: `apps/api/vitest.config.ts` and `apps/web/vite.config.mts` enforce 90% global thresholds, so API and web files in `Unit:` tasks effectively need ≥90%; the root config (used for `packages/shared`) has none.

---

## Phase 0: Tooling and INR gate

**Adds:** No product change. Checks the Dodo tooling is set up (plugin, MCPs, skills), researches the open payment questions, and decides whether Dodo supports INR as a base currency. If it does not, the build stops here.

**Try in UI:** No UI in this phase. Run claude plugins list and claude mcp list and see both Dodo MCPs connected ; Open agent_docs/PLAN_dodo_payments.md and find the T0.1-plugin, T0.2-\* and T0.4-gate lines (PASS or FAIL) ; Open SPEC section 13 and read the Answer (T0.3) lines

### ✅ T0.1 PRE-FLIGHT: Dodo plugin installed at project scope

- **Kind:** implementation
- **Files:** `agent_docs/PLAN_dodo_payments.md`
- **Do:** Read-only check (kind implementation so the builder runs it before T0.3). Write only the `T0.1-plugin:` line of the PLAN evidence section. The plugin itself was installed in the pre-flight. Check, do not install. Run `claude plugins list` and read `.claude/settings.json`. If `dodopayments@dodopayments` is missing, user-scoped, or not enabled, FAIL with the unblock text: "Run pre-flight steps 1-2 at the top of TASKS_dodo_payments.md (`claude plugins marketplace add dodopayments/dodo-agent-plugin`; `claude plugins install dodopayments@dodopayments --scope project`; restart the session), then re-run /build-phases."
- **Acceptance:**
  - [ ] `.claude/settings.json` in this repo lists `dodopayments@dodopayments` under `enabledPlugins`.
  - [ ] `~/.claude/settings.json` does not list it.
  - [ ] Check result recorded as a `T0.1-plugin:` line (the `claude plugins list` line for the plugin, verbatim, plus the scope flag used in the pre-flight) in the PLAN evidence section.
- **Verify:** `claude plugins list`; `grep dodopayments .claude/settings.json`; `grep dodopayments ~/.claude/settings.json` returns nothing; `grep -n '^T0.1-plugin:' agent_docs/PLAN_dodo_payments.md` prints one line.

### ✅ T0.2 PRE-FLIGHT: MCPs authenticated and skills loaded

- **Kind:** implementation
- **Files:** `agent_docs/PLAN_dodo_payments.md`
- **Depends on:** T0.1
- **Do:** Write only the `T0.2-*` lines of the PLAN evidence section. Run `claude mcp list`. Using the Dodo MCP tools directly, query `dodo-knowledge` once and list products with `dodopayments-api` in test mode. If the Dodo MCP tools are not available to this agent at all, FAIL with: "Add the Dodo MCP tool names to `tools:` in `~/.claude/agents/phase-builder.md` (pre-flight step 3a), then re-run /build-phases." If an MCP is listed but missing, unauthenticated, or not loaded in this session, FAIL with the unblock text: "Restart the Claude Code session, authenticate `dodopayments-api` (OAuth, test mode) per pre-flight step 3, confirm `claude mcp list` shows both Dodo MCPs connected, then re-run /build-phases." Never attempt OAuth or a restart yourself. The verifier has no MCP or skill access, so record the evidence as text in the PLAN evidence section, one labelled line each: `T0.2-mcp-list:` (the two Dodo lines of `claude mcp list`, verbatim), `T0.2-mcp-tools:` (the Dodo MCP tool names available to you, verbatim), `T0.2-skills:` (the Dodo skill names exactly as they appear in your available-skills listing, e.g. `dodopayments:<name>`; if none appear, FAIL with the pre-flight step 2 restart instruction), `T0.2-docs-query:` (the question and a one-line answer with its source URL), `T0.2-products:` (test-mode product count and names, no prices needed).
- **Acceptance:**
  - [ ] `dodo-knowledge` answers a docs query (`T0.2-docs-query:` recorded with a source URL).
  - [ ] `dodopayments-api` is authenticated and lists products in test mode (`T0.2-products:` recorded).
  - [ ] Dodo skills are loaded (`T0.2-skills:` lists at least one `dodopayments:` skill).
- **Verify:** `claude mcp list` shows both Dodo MCPs connected; `grep -nE '^T0\.2-(mcp-list|mcp-tools|skills|docs-query|products):' agent_docs/PLAN_dodo_payments.md` prints all five labels; `grep -n '^T0.2-skills:.*dodopayments' agent_docs/PLAN_dodo_payments.md` matches.

### ✅ T0.3 Research open questions (cited)

- **Kind:** implementation
- **Files:** `agent_docs/PLAN_dodo_payments.md`, `agent_docs/SPEC_dodo_payments.md`
- **Depends on:** T0.2
- **Do:** In PLAN write only the "Gate results" part of the evidence section; in SPEC write only the section 13 `Answer (T0.3):` lines. Use the `dodo-knowledge` MCP tools directly. Record each item in PLAN as a `T0.3-item<N>:` line (N = 1-6) with a cited doc snippet and source URL, then copy the answers into SPEC section 13: exactly ONE indented `Answer (T0.3):` line under each of Q1-11 (11 lines in total); when a question draws on two sources, merge them into that single line. Mapping: Q1 <- item 1; Q2 <- item 1; Q3 <- items 2 and 3 (one merged line); Q4 <- item 2; Q5 <- item 6; Q6 <- item 4; Q7 <- item 5; Q8 <- item 3; Q9 <- item 6; Q10 <- item 6; Q11 <- the `T0.1-plugin:` evidence. Do not edit SPEC outside section 13. Resolve each item with a cited doc snippet: (1) INR as product base currency, and Adaptive Currency vs Localized Pricing semantics; (2) checkout-session `metadata`: is it a supported `checkoutSessions.create` param, the create response field names (`checkout_url`/`session_id`), and is it echoed on `payment.succeeded` (exact path); (3) payload field names for payment id, amount, currency, status, session id, payment method, plus the payment-method values Dodo reports and whether UPI is available for INR in test mode; (4) verification path, `client.webhooks.unwrap` vs `standardwebhooks`, pick ONE, plus timestamp tolerance and Express lowercase headers; (5) checkout SDK package name (`dodopayments-checkout` vs `@dodopayments/checkout`), `onEvent` names, whether a success event exists, `return_url` behavior in an SPA, and whether the SDK is reachable as a `window.DodoPayments` global (the e2e stub in SPEC section 7 relies on it; if module-only, `dodoOverlay.ts` must expose a test seam on `window`); (6) test cards, live environment string, webhook retry behavior, and the Get Checkout Session SDK method name and response fields (`payment_id`, `payment_status`).
- **Acceptance:**
  - [ ] All six items answered with a source, or listed "unverifiable" with a proposed handling.
  - [ ] Item 1 states explicitly: INR supported as base currency, yes or no.
  - [ ] SPEC section 13 Q1-11 each carry exactly one `Answer (T0.3):` line (source URL or "unverifiable" plus handling); Q12-14 unchanged; no other SPEC section touched.
- **Verify:** `grep -cE '^T0\.3-item[1-6]:' agent_docs/PLAN_dodo_payments.md` prints 6, each with a source URL or "unverifiable"; `grep -cE '^[[:space:]]+Answer \(T0\.3\):' agent_docs/SPEC_dodo_payments.md` prints 11 (one per Q1-11; indented answer lines only, the section 13 preamble is not counted), and each of Q1-11 is followed by exactly one such line; `git diff agent_docs/SPEC_dodo_payments.md` touches only section 13.

### ✅ T0.4 INR base currency decision (blocks the build on NO)

- **Kind:** implementation
- **Files:** `agent_docs/PLAN_dodo_payments.md`
- **Depends on:** T0.3
- **Do:** Write only the `T0.4-gate:` outcome line(s) in PLAN. Kind implementation (like T0.1/T0.2) because it writes PLAN before it can FAIL. Read T0.3 item 1. If INR is supported as a product base currency, record `T0.4-gate: PASS` with the citation and continue. If NOT, first record `T0.4-gate: FAIL` with the options below in PLAN, then this task FAILs (blocked) and the build stops: write into PLAN and the failure output the options and their consequences, (a) keep INR via Adaptive Currency (price drift; `applyEvent` must cross-check against the catalog), (b) change the catalog currency (prices in `CREDIT_PACKS` and copy change), (c) Localized Pricing (per-currency prices to maintain), with the unblock text "Choose an option, record it in SPEC section 2 and the Pre-approved decisions block, then re-run /build-phases." Create no products. No automatic fallback, no prompt.
- **Acceptance:**
  - [ ] Either PASS recorded with the doc citation, or FAIL returned with the three options and consequences written out.
  - [ ] No product created before this task passes.
- **Verify:** `grep -nE '^T0\.4-gate: (PASS|FAIL)' agent_docs/PLAN_dodo_payments.md` prints one line with a citation; `T0.2-products:` shows the pre-gate product count and no Phase 0 line records a create call. Evidence is the cited docs, not a browser check.

### 🔶 Checkpoint 0

- [ ] Plugin is project scoped; MCPs reachable; skills loaded; gate outcome recorded (`T0.1-plugin:`, `T0.2-*`, `T0.4-gate:` lines present).
- [ ] SPEC section 13 has 14 questions: Q1-11 each carry an `Answer (T0.3):` line with a source or "unverifiable" handling; Q12-14 keep their recorded defaults. No repo source files touched.

---

## Phase 1: Products and env (only after gate PASS)

**Adds:** No product change. Creates the four test-mode credit packs (200/450/960/2000 credits at INR 130/290/500/900) and a webhook endpoint in Dodo, and records their ids in the env files.

**Try in UI:** No UI in this phase. Open the Dodo dashboard in test mode and see the four products and the webhook endpoint ; Check the env example files for the recorded product ids and webhook placeholder

### ✅ T1.1 Create four test-mode products via Dodo API MCP

- **Kind:** implementation
- **Files:** `agent_docs/PLAN_dodo_payments.md`
- **Depends on:** T0.4
- **Do:** Pre-approved (see top of file), no confirmation needed. Write only the `T1.1-product:` lines of the PLAN evidence section. The products themselves live in the external Dodo account. Using the Dodo API MCP tools directly, list existing test-mode products, then create the 4 one-time products: 200/450/960/2000 credits at INR 130/290/500/900 (minor units as Dodo requires). Reuse a same-name product only if its price and type match; if a same-name product differs in price or type, FAIL with its id and the mismatch (no change made). Never delete or overwrite.
- **Acceptance:**
  - [ ] 4 product IDs returned and recorded in the PLAN evidence section as one line per product, copied from the MCP listing after creation: `T1.1-product: <packId> | <name> | <dodo product id> | <price minor> <currency> | <type> | test_mode | created|reused`. Product ids are not secrets.
  - [ ] Each product is one-time (not subscription) and in test mode, with the correct INR price.
- **Verify:** `grep -c '^T1.1-product:' agent_docs/PLAN_dodo_payments.md` prints 4; `grep '^T1.1-product:' agent_docs/PLAN_dodo_payments.md` shows `pack_200|450|960|2000`, INR 130/290/500/900 in minor units, a one-time type and `test_mode` on each line.

### ✅ T1.2 Create webhook endpoint in Dodo test mode

- **Kind:** implementation
- **Files:** `agent_docs/PLAN_dodo_payments.md`
- **Manual (untracked, never staged):** `apps/api/.env`. This task is pre-approved to write only the `DODO_PAYMENTS_WEBHOOK_KEY` line of this gitignored file; never pass it to `task_built --files` and never print its value.
- **Depends on:** T0.4
- **Do:** Pre-approved (see top of file). Write only the `T1.2-endpoint:` line of the PLAN evidence section. The endpoint itself lives in the external Dodo account. Read the public base URL from the `webhook-url=` note passed to /build-phases; if absent, FAIL with the unblock text: "Provide a public HTTPS URL reaching the running API (pre-flight step 5) and re-run /build-phases with the note `webhook-url=https://<host>`." Never create a tunnel. Using the Dodo API MCP tools directly, create (or reuse by URL) the endpoint `<webhook-url>/webhooks/payments` subscribed to `payment.succeeded` and `payment.failed`. Fetch its signing secret (also when the endpoint is reused) and write it, without printing it, ONLY into the gitignored `apps/api/.env` as the `DODO_PAYMENTS_WEBHOOK_KEY=` line (replace that line if present, add it otherwise; leave every other line untouched). Never put the secret in PLAN, SPEC, any tracked file, the task result or the evidence. This file is the hand-off: T1.3 reads the key from it, so a retry of T1.3 needs no agent context. If the MCP cannot return the secret, FAIL with "copy the endpoint secret from the Dodo test dashboard into `DODO_PAYMENTS_WEBHOOK_KEY` in `apps/api/.env`, then re-run".
- **Acceptance:**
  - [ ] Endpoint exists, subscribed to both events, test mode; recorded in the PLAN evidence section as `T1.2-endpoint: <endpoint id> | <url> | payment.succeeded, payment.failed | test_mode | created|reused` (no secret).
  - [ ] The secret is in the gitignored `apps/api/.env` only; never printed to output, evidence or a tracked file.
- **Verify:** `grep -n '^T1.2-endpoint:' agent_docs/PLAN_dodo_payments.md` prints one line ending in `/webhooks/payments` for the URL field and listing both events; `git check-ignore apps/api/.env` succeeds; `grep -c '^DODO_PAYMENTS_WEBHOOK_KEY=.' apps/api/.env` prints 1 (count only, never the value); `grep -c whsec_ agent_docs/PLAN_dodo_payments.md` prints 0; `git grep -n whsec_ -- ':!agent_docs/*dodo_payments.md' ':!apps/api/src/webhook/index.test.ts' ':!infra/.env.example'` returns nothing (the excluded files hold only prose or the pre-existing Clerk placeholders `whsec_test_secret` / `whsec_your-webhook-secret`).

### ✅ T1.3 Record IDs and placeholders in env files

- **Kind:** implementation
- **Files:** `apps/api/.env.example`, `apps/web/.env.example`, `apps/web/.env.e2e.example`
- **Manual (untracked, never staged):** `apps/api/.env`, `apps/web/.env.e2e.local`. This task is pre-approved to write these two gitignored files; never pass them to `task_built --files` (the orchestrator `git add`s that list and would fail on ignored paths) and never print their values.
- **Depends on:** T1.1, T1.2
- **Do:** Real values only in the gitignored (Manual line above) `apps/api/.env` (add the product ids; the API key is already there from pre-flight step 4 and the webhook key from T1.2; if either is missing, FAIL with pre-flight step 4 or "re-run T1.2" respectively) and `apps/web/.env.e2e.local` (`DODO_PAYMENTS_WEBHOOK_KEY`, copied from the `apps/api/.env` line written by T1.2, for the e2e signer). Product ids come from the `T1.1-product:` PLAN lines and the key from `apps/api/.env`, so a retry re-reads both from disk and needs no agent context. Write secrets without echoing them. `.env.example` gets placeholders: `PAYMENT_PROVIDER=dodo`, `DODO_PAYMENTS_API_KEY=`, `DODO_PAYMENTS_ENVIRONMENT=test_mode`, `DODO_PAYMENTS_WEBHOOK_KEY=`, `DODO_PRODUCT_ID_PACK_200/_450/_960/_2000=`, `PAYMENT_RETURN_URL=`; web: `VITE_DODO_CHECKOUT_MODE=test`; `apps/web/.env.e2e.example`: `DODO_PAYMENTS_WEBHOOK_KEY=` placeholder. Leave Razorpay vars (removed in T6.4).
- **Acceptance:**
  - [ ] `.env.example` files contain placeholders only.
  - [ ] `apps/api/.env` has the 4 product IDs and the webhook key; `apps/web/.env.e2e.local` has the webhook key.
  - [ ] `git check-ignore apps/api/.env apps/web/.env.e2e.local` succeeds for both.
- **Verify:** `git diff -- apps/api/.env.example apps/web/.env.example apps/web/.env.e2e.example`; `git check-ignore apps/api/.env apps/web/.env.e2e.local`; `grep -c '^DODO_PRODUCT_ID_PACK_' apps/api/.env` prints 4 (count only, no values); `grep -c '^DODO_PAYMENTS_WEBHOOK_KEY=.' apps/api/.env apps/web/.env.e2e.local` prints 1 for each; each product id in the `T1.1-product:` lines appears in `apps/api/.env` (`grep -c '<id>' apps/api/.env` per id, ids are not secrets); `git grep -nE "(sk_|whsec_)" -- apps/api/.env.example apps/web/.env.example apps/web/.env.e2e.example` returns nothing (`infra/.env.example` has a pre-existing Clerk placeholder and is not touched here).

### 🔶 Checkpoint 1

- [ ] 4 IDs in `apps/api/.env`; placeholders only in tracked files; webhook endpoint exists (T1.1-T1.3 ✅).

---

## Phase 2: Test harness and shared catalog

**Adds:** No product change. Builds the e2e test harness and the shared credit-pack catalog (CREDIT_PACKS) with provider-agnostic payment types that the API and web will both use.

**Try in UI:** No UI in this phase. Run bun run test and see the shared catalog tests pass ; Open packages/shared and read CREDIT_PACKS (4 packs) ; Check apps/web/e2e/README.md and apps/web/e2e/qa/\_template.spec.ts exist

### ✅ T2.0 Setup: test harness

- **Kind:** implementation
- **Files:** `apps/web/e2e/README.md`, `apps/web/e2e/fixtures/README.md`, `apps/web/e2e/qa/_template.spec.ts`, `apps/web/e2e/fixtures/qa.ts`
- **Do:** Follow `~/.claude/commands/e2e.md` `setup`, skipping what exists (Playwright and `apps/web/playwright.config.ts` already exist; do not change the config). The e2e root is `apps/web`, not the repo root. `e2e/README.md` documents: run command (`cd apps/web && bunx playwright test <spec>`), base URL from `e2e/support/env.ts`; auth via the existing `auth.setup.ts` storage state (`AUTH_STATE_PATH`) and the seeded e2e Clerk user; no `webServer` (web and API are always running locally, never started by tests); env file `.env.e2e.local` (template `.env.e2e.example`); mocking with `page.route` (block third-party network) and `page.addInitScript` (stub browser SDKs); data is created through the real API, not a seed init script, and each test creates its own state; selector policy (`getByRole`/`getByLabel`/`getByTestId`, no CSS/nth-child, no `waitForTimeout`). `fixtures/README.md` documents the QA fixtures. `fixtures/qa.ts` extends the base test with the authenticated page, a console-error guard, and a `snap` screenshot helper. `_template.spec.ts` is a runnable smoke (authenticated home loads, console guard on) that new `e2e/qa/*.spec.ts` files copy.
- **Acceptance:**
  - [ ] The four files exist; README covers auth storage state, no webServer, env file, `page.route`/`addInitScript` mocking, and selector policy, and states the e2e root is `apps/web`.
  - [ ] Template passes against the running app.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/_template.spec.ts --repeat-each=3`; `bun run verify`.

### ✅ T2.0.1 Setup: webhook signing helper

- **Kind:** implementation
- **Files:** `apps/web/e2e/support/signWebhook.ts`, `apps/web/e2e/fixtures/qa.ts`, `apps/web/e2e/fixtures/README.md`
- **Depends on:** T2.0
- **Do:** `signWebhook({ body, secret, id?, timestamp? })` returns Standard Webhooks headers (`webhook-id`, `webhook-timestamp`, `webhook-signature` = `v1,` + base64 HMAC-SHA256 of `{id}.{timestamp}.{body}` with the base64 key after the `whsec_` prefix; algorithm per T0.3 item 4). Expose a `postSignedWebhook(request, payload)` fixture in `qa.ts` that reads `DODO_PAYMENTS_WEBHOOK_KEY` from the e2e env, fails fast with a clear message if it is unset, and POSTs to the API `/webhooks/payments` via Playwright `request`. Document it in `fixtures/README.md`. Never log the key or the signature.
- **Acceptance:**
  - [ ] The algorithm cites its T0.3 source in a comment; end-to-end proof (valid signature accepted, tampered rejected) comes from T5.8.
  - [ ] Missing key yields a clear error, never an unsigned request.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/_template.spec.ts`; `cd apps/web && bunx tsc -p e2e/tsconfig.json --noEmit`.

### ✅ T2.1 `CREDIT_PACKS` in `packages/shared`

- **Kind:** implementation
- **Files:** `packages/shared/src/models/creditPacks.ts`, `packages/shared/src/models/index.ts`
- **Do:** Export `CreditPack`, `CREDIT_PACK_CURRENCY`, `CREDIT_PACKS` (ids `pack_200|450|960|2000`, `priceMinor` 13000/29000/50000/90000, savings 0/10/20/30), `getCreditPack(id)`. Currency per gate result. No spec file here (not money path); `creditPacks.test.ts` is created by T2.3.
- **Acceptance:**
  - [ ] Exactly 4 packs with unique ids; credits and prices match the legacy singles (proven by T2.3).
  - [ ] `getCreditPack('nope')` returns undefined; no monthly entry (proven by T2.3).
  - [ ] Exported from `models/index.ts` and reachable via the package root.
- **Verify:** `bun run test`; `bun run verify`.

### ✅ T2.2 Provider-agnostic payment types

- **Kind:** implementation
- **Files:** `packages/shared/src/types/domain.ts`, `packages/shared/src/types/index.ts`
- **Do:** Add `PaymentProviderName`, `PaymentStatus`, `PaymentRecord` (`provider` optional for legacy rows). Do not delete Razorpay types yet.
- **Acceptance:**
  - [ ] Types exported; API and web still type-check unchanged.
- **Verify:** `bun run verify`; `bun run test`.

### ✅ T2.3 Unit: shared catalog

- **Kind:** unit
- **Files:** `packages/shared/src/models/creditPacks.ts`
- **Depends on:** T2.1
- **Do:** Create `packages/shared/src/models/creditPacks.test.ts` (pattern: `registry.test.ts`): every pack, `getCreditPack` hit/miss, uniqueness, currency constant, no monthly entry. `packages/shared` has no test script, so run vitest from the repo root (root `vite.config.ts`).
- **Acceptance:**
  - [ ] (from T2.1) Tests prove exactly 4 packs with unique ids, credits/prices matching the legacy singles, `getCreditPack('nope')` undefined, no monthly entry.
  - [ ] `creditPacks.ts` ≥80% lines/branches/functions/statements (required), >95% target; no `it.fails` unless the source has a real bug.
- **Verify:** `bunx vitest run packages/shared/src/models/creditPacks.test.ts --coverage --coverage.include=packages/shared/src/models/creditPacks.ts --coverage.reporter=text` (from repo root).

### 🔶 Checkpoint 2

- [ ] `bun run test` and `bun run verify` green; web/API behavior unchanged.
- [ ] QA harness template green (T2.0, T2.0.1); T2.3 coverage gate met.

---

## Phase 3: Provider port, Dodo adapter, checkout endpoints, auth fix

**Adds:** Backend only: the API can start a Dodo checkout for a credit pack and report its status, with the Clerk auth mount-order bug on payment routes fixed. The price and credits always come from the catalog, never from the client.

**Try in UI:** No UI in this phase. Run cd apps/api && bunx vitest run to see the payments router and adapter tests pass ; Read apps/api/src/payments/router.ts for POST /payments/checkout, GET /payments and the status endpoint ; Check an unauthenticated call returns 401 in the router tests

### ☐ T3.1 Fix Clerk auth mount order on payments routes (test first)

- **Kind:** implementation
- **Files:** `apps/api/src/routes/index.ts`, `apps/api/src/routes/payments.test.ts`
- **Do:** Write failing supertest first: unauthenticated request to each existing payments route returns 401. Then register `ClerkExpressRequireAuth({})` before `paymentsRoute`. Do NOT change lines for users/explore/credits/image/collections (see Open questions).
- **Acceptance:**
  - [ ] Unauthenticated calls to every payments route return 401.
  - [ ] Existing authenticated payments tests still pass.
  - [ ] Other routers' mounting is unchanged (diff shows only the payments line).
- **Verify:** `cd apps/api && bunx vitest run routes/payments.test.ts`; `git diff apps/api/src/routes/index.ts`.

### ☐ T3.2 Payment port, constants, errors, service skeleton

- **Kind:** implementation
- **Files:** `apps/api/src/payments/types.ts`, `apps/api/src/payments/constants.ts`, `apps/api/src/payments/errors.ts`, `apps/api/src/payments/service.ts`
- **Do:** Define `PaymentProvider` port and `NormalizedPaymentEvent` per spec 5.2; typed errors (`InvalidSignatureError`, `UnknownPackError`, `ProviderApiError`); named constants for provider names, statuses, event types, header names. `createCheckout(userId, packId)` resolves the pack from the shared catalog and passes only catalog values to the provider; its signature takes no price or credits. (`providerFactory.ts` is added in T3.3.) Checkout side, not money path: no spec file here; `service.test.ts` is created by T3.6.
- **Acceptance:**
  - [ ] Unknown pack throws `UnknownPackError` (proven by T3.6).
  - [ ] Client-supplied price or credits cannot reach the provider (proven by T3.6 with a provider mock).
- **Verify:** `bun run verify`.

### ☐ T3.3 Dodo adapter: checkout creation and session status

- **Kind:** implementation
- **Files:** `apps/api/src/payments/dodo/client.ts`, `apps/api/src/payments/dodo/adapter.ts`, `apps/api/src/payments/dodo/productMap.ts`, `apps/api/src/payments/providerFactory.ts`, `apps/api/package.json`
- **Do:** Add dependency `dodopayments` (plus `standardwebhooks` only if T0.3 chose it; list new deps in the report). `createCheckout` passes `product_cart` from env map, `metadata {userId, packId}`, `return_url`, email when available; fresh session per call. Provider errors map to `ProviderApiError` without secrets. Keep the SDK behind `client.ts` so tests can mock that boundary only. `config/env.ts` is changed in T3.4. Checkout side, not money path: no spec file here; `dodo/adapter.test.ts` (with the architecture guard) is created by T3.6.
- **Acceptance:**
  - [ ] The SDK call receives product id from env, metadata, and return URL (proven by T3.6).
  - [ ] Provider failure yields `ProviderApiError` with no key material in the message (proven by T3.6).
  - [ ] No `dodopayments` import outside `payments/dodo/` (git grep below; T3.6 adds the guard test).
- **Verify:** `bun run verify`; `git grep -n "from 'dodopayments'" apps/api/src` lists only `payments/dodo/` files.

### ☐ T3.4 Env validation and payment model changes

- **Kind:** implementation
- **Files:** `apps/api/src/config/env.ts`, `apps/api/src/config/env.test.ts`, `apps/api/src/models/payment.ts`, `apps/api/src/models/payment.test.ts`
- **Do:** Env: add Dodo vars, fail fast at boot when `PAYMENT_PROVIDER=dodo` and any is missing; make Razorpay vars optional for now. Model: add `provider` (razorpay|dodo, default razorpay), `providerPaymentId`, `providerSessionId`, `packId`, `credits`, `currency` (default INR); extend `paymentMethod` with `card|upi|other` keeping legacy values; new rows also set `transactionId` to the provider payment id so legacy readers work. Document that embedded arrays cannot carry a cross-document unique index, so atomicity relies on the conditional update. Stay within spec 5.4; if a schema change beyond it is needed, make no change and FAIL with the needed change under DECISIONS.
- **Acceptance:**
  - [ ] Missing any Dodo var with `PAYMENT_PROVIDER=dodo` fails env validation.
  - [ ] A legacy-shaped payment (no `provider`) reads as `provider: 'razorpay'`.
  - [ ] A new Dodo-shaped record validates.
- **Verify:** `cd apps/api && bunx vitest run config/env.test.ts models/payment.test.ts`; `bun run verify`.

### ☐ T3.5 Authenticated payments router

- **Kind:** implementation
- **Files:** `apps/api/src/payments/router.ts`, `apps/api/src/routes/index.ts`, `apps/api/src/payments/service.ts`
- **Do:** `POST /payments/checkout` (`{packId}` only), `GET /payments` (caller's rows, newest first), `GET /payments/checkout/:sessionId/status`. `userId` only from `req.auth.userId`. On checkout, write a pending record `{providerSessionId, userId, packId}` for ownership checks; status endpoint returns 403/404 for another user's session. Status is read from the caller's DB record for that session first (terminal `completed`/`failed` written by the webhook wins); provider `getSessionStatus` is only a fallback while the record is pending (see Open question 3). Mount behind the auth middleware from T3.1. Old Razorpay routes stay until Phase 6. No rate limiter (out of scope, Open question 2). Checkout side, not money path: no spec file here; `payments/router.test.ts` is created by T3.7. Keep the existing `routes/payments.test.ts` (T3.1) green.
- **Acceptance (all proven by T3.7's `payments/router.test.ts`):**
  - [ ] 201 `{checkoutUrl, sessionId}`; 400 unknown pack; 401 unauthenticated; 502 generic body on provider failure.
  - [ ] Extra body fields (`amount`, `credits`, `userId`) are ignored; provider called with catalog values.
  - [ ] `GET /payments` returns only the caller's rows, newest first.
  - [ ] Another user's `sessionId` returns 403/404.
  - [ ] Status returns `succeeded` with `credits` when the DB record for the session is `completed`, without calling the provider.
- **Verify:** `cd apps/api && bunx vitest run routes/payments.test.ts`; `bun run test`; `bun run verify`.

### ☐ T3.6 Unit: payments core

- **Kind:** unit
- **Files:** `apps/api/src/payments/service.ts`, `apps/api/src/payments/dodo/adapter.ts`, `apps/api/src/payments/dodo/productMap.ts`, `apps/api/src/payments/providerFactory.ts`, `apps/api/src/payments/errors.ts`
- **Depends on:** T3.2, T3.3, T3.5
- **Do:** Independent coverage gate for the checkout side. Create `payments/service.test.ts`, `payments/dodo/adapter.test.ts`, `payments/dodo/productMap.test.ts`, `payments/providerFactory.test.ts`, `payments/errors.test.ts` (none exist yet). SDK mocked at `dodo/client.ts` only. `adapter.test.ts` includes the architecture guard test (no `dodopayments` import outside `payments/dodo/`).
- **Acceptance:**
  - [ ] (from T3.2) Unknown pack throws `UnknownPackError`; a test proves client-supplied price or credits cannot reach the provider mock.
  - [ ] (from T3.3) A test asserts the SDK call receives product id from env, metadata, and return URL; provider failure yields `ProviderApiError` with no key material in the message; the architecture guard test passes.
  - [ ] Every file ≥80% lines/branches/functions/statements (required), >95% target. `apps/api/vitest.config.ts` enforces 90% global thresholds, so the scoped run effectively needs ≥90%.
  - [ ] No `it.fails` unless the source has a real bug (reported as a source bug).
- **Verify:** `cd apps/api && bunx vitest run payments/service.test.ts payments/dodo/ payments/providerFactory.test.ts payments/errors.test.ts --coverage --coverage.include=src/payments/service.ts --coverage.include=src/payments/dodo/adapter.ts --coverage.include=src/payments/dodo/productMap.ts --coverage.include=src/payments/providerFactory.ts --coverage.include=src/payments/errors.ts --coverage.reporter=text`.

### ☐ T3.7 Unit: payments API surface

- **Kind:** unit
- **Files:** `apps/api/src/payments/router.ts`, `apps/api/src/config/env.ts`, `apps/api/src/models/payment.ts`
- **Depends on:** T3.4, T3.5
- **Do:** Create `payments/router.test.ts` (supertest); extend the existing `config/env.test.ts` and `models/payment.test.ts` (no duplicate spec files). Cover 201/400/401/403/404/502 branches, ignored extra body fields, caller-only newest-first `GET /payments`, pending-vs-terminal status reads, env fail-fast per missing var, legacy default `provider`.
- **Acceptance:**
  - [ ] (from T3.5) Tests prove every T3.5 acceptance item: 201 `{checkoutUrl, sessionId}`, 400 unknown pack, 401 unauthenticated, 502 generic body; extra body fields ignored and provider called with catalog values; `GET /payments` caller-only, newest first; another user's `sessionId` 403/404; `completed` DB record returns `succeeded` with `credits` without calling the provider.
  - [ ] Every file ≥80% lines/branches/functions/statements (required), >95% target; the API's 90% global thresholds apply to the scoped run.
  - [ ] No `it.fails` unless the source has a real bug.
- **Verify:** `cd apps/api && bunx vitest run payments/router.test.ts config/env.test.ts models/payment.test.ts --coverage --coverage.include=src/payments/router.ts --coverage.include=src/config/env.ts --coverage.include=src/models/payment.ts --coverage.reporter=text`.

### 🔶 Checkpoint 3 (money path review)

- [ ] `cd apps/api && bunx vitest run` and `bun run test` green; 401 test covers every payments route.
- [ ] T3.6 and T3.7 coverage gates met.
- [ ] Optional: with a Clerk token against the already running API, a real Dodo test session URL is returned (sandboxed HTTP tool; do not start the server).
- [ ] Advisor reviews the diff before Phase 4.

---

## Phase 4: Webhook and idempotent grant

**Adds:** Backend only: a signed Dodo webhook now grants the purchased credits exactly once, even if the same event is delivered twice. Bad signatures are rejected.

**Try in UI:** No UI in this phase. Run cd apps/api && bunx vitest run on the webhook tests: a duplicate delivery adds no credits and an invalid signature gets 401 ; Read apps/api/src/payments webhook router mounted at POST /webhooks/payments

### ☐ T4.1 Event mapper and signature verification

- **Kind:** implementation
- **Files:** `apps/api/src/payments/dodo/eventMapper.ts`, `apps/api/src/payments/dodo/constants.ts`, `apps/api/src/payments/dodo/adapter.ts`, `apps/api/src/payments/dodo/eventMapper.test.ts`, `apps/api/src/payments/dodo/verify.test.ts`
- **Do:** Test-first money-path task (webhook signature): it is allowed to create the two specs in its Files. Test first, signing payloads for real (`{id}.{timestamp}.{body}` HMAC or the library). Implement `verifyAndParseWebhook` with the single path chosen in T0.3. Cases: valid; tampered body; wrong secret; missing headers; stale timestamp; unknown event type (returns null); metadata and amount extracted.
- **Acceptance:**
  - [ ] Invalid, missing, or stale signature throws `InvalidSignatureError`.
  - [ ] Valid `payment.succeeded` and `payment.failed` map to `NormalizedPaymentEvent`; unknown type maps to null.
- **Verify:** `cd apps/api && bunx vitest run payments/dodo/`; `bun run verify`.

### ☐ T4.2 `applyEvent` with atomic idempotent grant

- **Kind:** implementation
- **Files:** `apps/api/src/payments/service.ts`, `apps/api/src/payments/applyEvent.test.ts`, `apps/api/src/models/user.ts`
- **Do:** Test-first money-path task (idempotent credit grant): it is allowed to create `applyEvent.test.ts`. Test first. Resolve `userId` from signed metadata; pack from catalog; cross-check amount and currency (mismatch: record failed with reason, no credits, error log). Grant via one conditional `User.updateOne({clerkId, 'payments.providerPaymentId': {$ne}}, {$push, $inc})`. `payment.failed` records a failed row; a later success for the same payment id must still grant (guard blocks only an existing `completed`). Missing user or metadata: log with context, return 200. Transient DB error: throw so the router returns 500. `models/user.ts` only if the payments subdocument typing requires it.
- **Acceptance:**
  - [ ] Each pack grants exactly its credits.
  - [ ] Same payment id twice grants once; 10 concurrent deliveries (`Promise.all`) grant once; a new webhook-id with the same payment id grants once.
  - [ ] Wrong amount, currency, or pack grants nothing and logs at error level.
  - [ ] Failed-then-succeeded grants; succeeded-then-failed does not revoke.
  - [ ] When the event carries the session id, the pending checkout record becomes the completed/failed row (no duplicate row in `payments`), per Open question 3.
  - [ ] Logs contain `webhookId`, `paymentId`, `userId`; no signature header or secrets.
- **Verify:** `cd apps/api && bunx vitest run payments/applyEvent.test.ts`; `bun run test`.

### ☐ T4.3 Webhook router and mount

- **Kind:** implementation
- **Files:** `apps/api/src/payments/webhookRouter.ts`, `apps/api/src/payments/webhookRouter.test.ts`, `apps/api/src/app.ts`
- **Do:** Test-first money-path task (webhook signature and duplicate delivery): it is allowed to create `webhookRouter.test.ts`; write the failing supertest first. `POST /webhooks/payments` with `express.raw({type:'application/json', limit})`, mounted beside the Clerk `webhookRouter`, before `express.json`. Invalid signature: 401 with no DB access. Unknown event: 200. Duplicate: 200 no-op. Transient DB error: 500. Do not remove `/webhooks/razorpay` yet.
- **Acceptance:**
  - [ ] Supertest with a real signed body returns 200 and grants once; second identical post returns 200 and changes nothing.
  - [ ] Bad signature returns 401 and no DB call is made.
  - [ ] Body over the `express.raw` limit returns 413 with no DB call.
  - [ ] Transient DB error returns 500.
  - [ ] `/webhooks/clerk` still works (existing test passes).
- **Verify:** `cd apps/api && bunx vitest run payments/webhookRouter.test.ts webhook/`; `bun run test`; `bun run verify`.

### ☐ T4.4 Unit: webhook

- **Kind:** unit
- **Files:** `apps/api/src/payments/dodo/eventMapper.ts`, `apps/api/src/payments/dodo/adapter.ts`, `apps/api/src/payments/webhookRouter.ts`, `apps/api/src/payments/service.ts`
- **Depends on:** T4.1, T4.2, T4.3
- **Do:** Independent coverage gate for the webhook half of the money path. Extend the test-first specs from T4.1-T4.3 (`dodo/eventMapper.test.ts`, `dodo/verify.test.ts`, `applyEvent.test.ts`, `webhookRouter.test.ts`) and `dodo/adapter.test.ts` from T3.6; include `service.test.ts` in the run so `createCheckout` lines in `service.ts` stay covered. Real HMAC signing, no mocked verification.
- **Acceptance:**
  - [ ] 100% branch coverage for `webhookRouter.ts` and for `applyEvent` in `service.ts` (SPEC section 7).
  - [ ] Every file ≥80% lines/branches/functions/statements (required), >95% target; the API's 90% global thresholds apply to the scoped run.
  - [ ] No `it.fails` unless the source has a real bug.
- **Verify:** `cd apps/api && bunx vitest run payments/dodo/ payments/applyEvent.test.ts payments/webhookRouter.test.ts payments/service.test.ts --coverage --coverage.include=src/payments/dodo/eventMapper.ts --coverage.include=src/payments/dodo/adapter.ts --coverage.include=src/payments/webhookRouter.ts --coverage.include=src/payments/service.ts --coverage.reporter=text`.

### 🔶 Checkpoint 4 (money path audit)

- [ ] API suite green including concurrent duplicate and real-signature tests; T4.4 coverage gate met.
- [ ] Advisor audits the Phase 3-4 diff against Spec section 6; findings resolved or reported.
- [ ] Real Dodo webhook delivery through a tunnel is deferred to T7.3; signed-webhook e2e is T5.8.

---

## Phase 5: Web checkout client and UI

**Adds:** The Buy credits dialog now lists the four packs and opens the Dodo checkout overlay. After payment the credits appear and the purchase shows in Profile > Payments (old Razorpay rows still render). The trust line names Dodo Payments.

**Try in UI:** Open the Buy more credits dialog and check the four packs and the Dodo trust line ; Pick a pack, complete a test payment in the overlay, and watch credits increase once ; Open Profile > Payments and see the new row (and an empty state if you have none) ; Close the overlay early: a processing message shows after the poll times out

### ☐ T5.1 Overlay wrapper and checkout client

- **Kind:** implementation
- **Files:** `apps/web/src/payments/dodoOverlay.ts`, `apps/web/src/payments/checkoutClient.ts`, `apps/web/package.json`, `apps/web/src/main.ts`
- **Do:** Add the checkout SDK (package name per T0.3; verify on the registry before install). `Initialize` once at app load with mode from `VITE_DODO_CHECKOUT_MODE`. `dodoOverlay.ts` is the only file importing the SDK. `checkoutClient` calls `POST /payments/checkout` and `GET .../status`. Locate the correct init location in `main.ts` (or app setup) during build. Not money path: no spec file here; `checkoutClient.test.ts` and `dodoOverlay.test.ts` are created by T5.6.
- **Acceptance:**
  - [ ] SDK initialized exactly once; not per checkout (proven by T5.6).
  - [ ] `git grep` shows the SDK imported only in `dodoOverlay.ts`.
  - [ ] Open-with-URL and API-error behaviour (proven by T5.6).
- **Verify:** `bun run verify`; `git grep -nE "dodopayments-checkout|@dodopayments/checkout" apps/web/src` lists only `src/payments/dodoOverlay.ts`.

### ☐ T5.2 `usePurchase` composable with status polling

- **Kind:** implementation
- **Files:** `apps/web/src/payments/usePurchase.ts`, `apps/web/src/payments/constants.ts`
- **Do:** `start(packId)`: checkout, open overlay, on close or success event poll status every `PAYMENT_POLL_INTERVAL_MS` (2000) until `PAYMENT_POLL_TIMEOUT_MS` (60000), on `succeeded` refetch the user via the existing store fetch (this also refreshes payments), then toast. Never call `setCredits` with a computed value. Not money path (the client never grants credits): no spec file here; `usePurchase.test.ts` is created by T5.6.
- **Acceptance:**
  - [ ] Succeeded: user refetched, success toast, no local credit increment (proven by T5.6).
  - [ ] Failed: error toast. Timeout: "processing, credits will appear shortly" message; state is recoverable (proven by T5.6).
  - [ ] Poll constants are named, not inline numbers.
- **Verify:** `bun run verify`; `git grep -n setCredits apps/web/src/payments` returns nothing.

### ☐ T5.3 Pricing catalog and Pricing page use shared `CREDIT_PACKS`

- **Kind:** implementation
- **Files:** `apps/web/src/composables/usePricingCatalog.ts`, `apps/web/src/composables/usePricingCatalog.test.ts`, `apps/web/src/components/Pricing/PricingPacks.vue`, `apps/web/src/components/Pricing/PricingPacks.test.ts`
- **Do:** Replace `RAZORPAY_PRODUCTS` usage (`usePricingCatalog.ts`) with `CREDIT_PACKS`; keep savings labels 10/20/30%. A pack click in `PricingPacks.vue` calls `usePurchase.start(pack.id)`; its `RazorpayProduct` prop type becomes `CreditPack`. Do not create new component files (they would fall outside Files, and T5.7 is already at 5 files and could not cover them); if the template grows past ~20 lines, note the extraction under DECISIONS as a follow-up.
- **Acceptance:**
  - [ ] Pricing page lists exactly the 4 packs from the shared catalog (no monthly).
  - [ ] Pack click invokes `start` with the pack id only.
  - [ ] No Razorpay reference left in these 4 files.
- **Verify:** `cd apps/web && bunx vitest run src/composables/usePricingCatalog.test.ts src/components/Pricing/`; `bun run verify`.

### ☐ T5.4 Buy dialog and Profile payments

- **Kind:** implementation
- **Files:** `apps/web/src/components/Dialogs/BuyMoreCreditsDialog.vue`, `apps/web/src/components/Dialogs/BuyMoreCreditsDialog.test.ts`, `apps/web/src/components/Profile/Payments.vue`, `apps/web/src/components/Profile/Payments.test.ts`
- **Do:** Dialog lists `CREDIT_PACKS` and calls `usePurchase.start(pack.id)`; no `setCredits` with a computed value. Replace the dialog trust line (`BuyMoreCreditsDialog.vue` `<p class="trust-line">Secure payment via Razorpay. Credits apply instantly.</p>`, around line 143) with `Secure payment via Dodo Payments. Credits apply after payment confirmation.` (credits are granted by the webhook, not instantly), and rewrite the matching test in `BuyMoreCreditsDialog.test.ts` (the `displays trust line about Razorpay` case, around lines 151-166) to assert the new Dodo text (title and assertion must not name the old provider, so the Verify grep stays clean). `Payments.vue` keys rows by `providerPaymentId ?? transactionId` and uses provider-neutral labels; no endpoint change (it reads the Pinia store).
- **Acceptance:**
  - [ ] Dialog lists the 4 packs; click invokes `start` with the pack id only.
  - [ ] A legacy Razorpay-shaped row (no `provider`) and a Dodo row both render in Payments.
  - [ ] No Razorpay import, type or constant left in these 4 files (`git grep -nE "RAZORPAY_PRODUCTS|Razorpay(Product|Subscription|Order)|utils/payment" -- <the 4 files>` returns nothing); legacy-row fixtures and test titles in `Payments.test.ts` may still say "razorpay".
  - [ ] The dialog trust line names Dodo Payments, and its test asserts the new text; neither dialog file mentions Razorpay in any form.
- **Verify:** `cd apps/web && bunx vitest run src/components/Dialogs/BuyMoreCreditsDialog.test.ts src/components/Profile/Payments.test.ts`; `git grep -ni razorpay -- apps/web/src/components/Dialogs/BuyMoreCreditsDialog.vue apps/web/src/components/Dialogs/BuyMoreCreditsDialog.test.ts` returns nothing; `bun run test`; `bun run verify`.

### ☐ T5.5 Return-URL handler (conditional)

- **Kind:** implementation
- **Files:** `apps/web/src/router/index.ts`, `apps/web/src/pages/PaymentReturn.vue`
- **Do:** Only if T0.3 shows the overlay completes via `return_url` rather than an `onEvent` success. Route triggers the same polling and redirects to Profile -> Payments. If not needed, mark "N/A per gate" with the citation and skip. Not money path: no spec file here; `PaymentReturn.test.ts` is created by T5.7 when this task is implemented.
- **Acceptance:**
  - [ ] Either N/A with citation, or the route polls status and refetches the user (proven by T5.7).
- **Verify:** the N/A citation in the task result, or `bun run verify` and `test -f apps/web/src/pages/PaymentReturn.vue`.

### ☐ T5.6 Unit: web purchase

- **Kind:** unit
- **Files:** `apps/web/src/payments/checkoutClient.ts`, `apps/web/src/payments/usePurchase.ts`, `apps/web/src/payments/dodoOverlay.ts`
- **Depends on:** T5.1, T5.2
- **Do:** Create `src/payments/checkoutClient.test.ts`, `src/payments/usePurchase.test.ts` and `src/payments/dodoOverlay.test.ts` (none exist yet; SDK mocked at the module boundary). Fake timers for polling; cover success, failed, timeout, API error, overlay close, single `Initialize`.
- **Acceptance:**
  - [ ] (from T5.1) Tests prove a single `Initialize` (not per checkout), open-with-URL, and the API-error path.
  - [ ] (from T5.2) Tests prove succeeded -> user refetched, success toast, no local credit increment; failed -> error toast; timeout -> "processing, credits will appear shortly" with recoverable state.
  - [ ] Every file ≥80% lines/branches/functions/statements (required), >95% target. `apps/web/vite.config.mts` enforces 90% global thresholds, so the scoped run effectively needs ≥90%.
  - [ ] No `it.fails` unless the source has a real bug.
- **Verify:** `cd apps/web && bunx vitest run src/payments/ --coverage --coverage.include=src/payments/checkoutClient.ts --coverage.include=src/payments/usePurchase.ts --coverage.include=src/payments/dodoOverlay.ts --coverage.reporter=text`.

### ☐ T5.7 Unit: pricing UI

- **Kind:** unit
- **Files:** `apps/web/src/composables/usePricingCatalog.ts`, `apps/web/src/components/Pricing/PricingPacks.vue`, `apps/web/src/components/Dialogs/BuyMoreCreditsDialog.vue`, `apps/web/src/components/Profile/Payments.vue`, `apps/web/src/pages/PaymentReturn.vue`
- **Depends on:** T5.3, T5.4, T5.5
- **Do:** `PaymentReturn.vue` is in scope only if T5.5 was implemented (not N/A); otherwise leave it out of the run and of `task_built --files`. Extend the existing specs updated in T5.3/T5.4 (no duplicates). If T5.5 was implemented (not N/A), create `src/pages/PaymentReturn.test.ts`. Test environment is happy-dom (the web vitest config), not jsdom. Cover the 4-pack render, click -> `start(pack.id)`, legacy and Dodo rows, empty payments list, and (if T5.5 implemented) return-route polling and user refetch.
- **Acceptance:**
  - [ ] Every file ≥80% lines/branches/functions/statements (required), >95% target; the web's 90% global thresholds apply to the scoped run.
  - [ ] (from T5.5, only if implemented) A test proves the return route polls status and refetches the user.
  - [ ] No `it.fails` unless the source has a real bug.
- **Verify:** If T5.5 is N/A: `cd apps/web && bunx vitest run src/composables/usePricingCatalog.test.ts src/components/Pricing/PricingPacks.test.ts src/components/Dialogs/BuyMoreCreditsDialog.test.ts src/components/Profile/Payments.test.ts --coverage --coverage.include=src/composables/usePricingCatalog.ts --coverage.include=src/components/Pricing/PricingPacks.vue --coverage.include=src/components/Dialogs/BuyMoreCreditsDialog.vue --coverage.include=src/components/Profile/Payments.vue --coverage.reporter=text`. If T5.5 was implemented: the same command with `src/pages/PaymentReturn.test.ts` added to the spec list and `--coverage.include=src/pages/PaymentReturn.vue` added to the includes.

### ☐ T5.8 E2E: purchase credits

- **Kind:** e2e
- **Spec:** `apps/web/e2e/qa/billing-purchase.spec.ts` (scenario file `apps/web/e2e/scenarios/billing-purchase.feature.md`)
- **Files:** none
- **Depends on:** T2.0.1, T5.6, T5.7
- **Scenarios:**
  - @critical Buy dialog lists the 4 credit packs
  - @critical Checkout request sends the pack id only
  - @critical Signed payment success grants exactly the pack's credits and shows the row in Profile -> Payments
  - @critical Duplicate webhook delivery is a no-op
  - @high Invalid signature gets 401 and credits are unchanged
  - @high Failed payment shows an error and credits are unchanged
  - @medium Overlay closed then poll timeout shows the processing message
- **Do:** e2e-engineer, started from `apps/web/e2e/qa/_template.spec.ts` per `apps/web/e2e/README.md`; write the scenario file first. Mocking per SPEC section 7: stub the checkout SDK with `page.addInitScript` (recorder replacing `window.DodoPayments.Checkout.open`, or the seam from T0.3 item 5), block real Dodo network with `page.route('**/checkouts/**')`, create the checkout through the real API, sign webhooks with the `postSignedWebhook` fixture (T2.0.1) using the returned session id and `metadata {userId, packId}` with catalog-matching amount and currency. Assert credit deltas through the API/UI, never client state. Use `page.clock` to fast-forward the 60s poll timeout. The browser and the test process never contact Dodo. Report any `data-testid` added to app source in the task result.
- **Acceptance:**
  - [ ] One `test()` per scenario, titled and tagged as above, real `expect`s; green 3 times in a row.
  - [ ] No `test.fail()`, `.skip` or `.fixme`.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/billing-purchase.spec.ts --repeat-each=3`.

### ☐ T5.9 E2E: payment history

- **Kind:** e2e
- **Spec:** `apps/web/e2e/qa/billing-history.spec.ts` (scenario file `apps/web/e2e/scenarios/billing-history.feature.md`)
- **Files:** none
- **Depends on:** T2.0.1, T5.7
- **Scenarios:**
  - @high Dodo and legacy Razorpay-shaped rows both render in Profile -> Payments
  - @medium Empty state when the user has no payments
  - @medium Payment rows persist after reload
  - @medium Deep link opens Profile -> Payments directly
- **Do:** e2e-engineer, same harness and mocking rules as T5.8. Create the Dodo row through the real API (checkout + signed webhook). Inject the legacy Razorpay-shaped row (no `provider`) with `page.route` on the user fetch (`route.fetch()` then append the row), so no test writes legacy data to the DB. Empty state uses the same interception with an empty `payments` array. Report any `data-testid` added to app source in the task result.
- **Acceptance:**
  - [ ] One `test()` per scenario, titled and tagged as above, real `expect`s; green 3 times in a row.
  - [ ] No `test.fail()`, `.skip` or `.fixme`.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/billing-history.spec.ts --repeat-each=3`.

### 🔶 Checkpoint 5

- [ ] `bun run test` and `bun run verify` green; Razorpay path still present (removed next phase).
- [ ] T5.6/T5.7 coverage gates met; browser evidence is T5.8 and T5.9 green with `--repeat-each=3`.

---

## Phase 6: Razorpay removal, env cleanup, docs

**Adds:** Removes Razorpay everywhere (API routes, web code, shared types, env files) and updates user-facing copy and docs to name Dodo as the merchant of record. UPI claims are removed unless Dodo supports it.

**Try in UI:** Open the Pricing page and FAQ: no Razorpay wording remains ; Open the Buy dialog: still works with Dodo ; Run git grep -il razorpay and see only legacy-labelled mentions ; Check docs/API_REFERENCE.md lists the new payment endpoints

### ☐ T6.1 Remove Razorpay routes and webhook from API

- **Kind:** implementation
- **Files:** `apps/api/src/routes/payments.ts`, `apps/api/src/routes/payments.test.ts`, `apps/api/src/webhook/index.ts`, `apps/api/src/webhook/index.test.ts`, `apps/api/src/routes/index.ts`
- **Do:** Delete the Razorpay endpoints (`POST /payments`, `/order/create`, `/verify-payment`, `GET /payments/:id`), `new Razorpay`, and `/webhooks/razorpay` plus their tests. Delete `routes/payments.ts` and its test if empty and unmount it in `routes/index.ts`; the new `payments/router.ts` (T3.5) remains the only payments router and keeps the 401 coverage. Keep `PaymentModel` and `PaymentSchema` in `models/payment.ts` untouched (outside Files): the legacy "Payment" collection still holds historical Razorpay payments and `models/payment.test.ts` imports it. Removing or migrating it is out of scope.
- **Acceptance:**
  - [ ] The four old endpoints and `/webhooks/razorpay` no longer exist; `/webhooks/clerk` test still passes.
  - [ ] Unauthenticated calls to every remaining payments route still return 401.
  - [ ] `PaymentModel` is still exported from `models/payment.ts` (legacy records) and `models/payment.test.ts` passes.
- **Verify:** `git grep -il razorpay -- apps/api/src/routes apps/api/src/webhook` returns nothing; `git grep -c "export const PaymentModel" -- apps/api/src/models/payment.ts` prints 1; `cd apps/api && bunx vitest run`; `bun run verify`.

### ☐ T6.2 Remove Razorpay constants, types and dependency from API

- **Kind:** implementation
- **Files:** `apps/api/src/utils/constants.ts`, `apps/api/src/utils/constants.test.ts`, `apps/api/src/types/index.ts`, `apps/api/package.json`, `bun.lock`
- **Do:** Delete `RAZORPAY_PRODUCTS` and the related test cases, and remove the `RazorpayProduct` re-export line from `apps/api/src/types/index.ts` (plus `RazorpaySubscription`/`RazorpayOrder` if present there); remove the `razorpay` dependency and refresh `bun.lock` with bun. The `RazorpayProduct` definition in `packages/shared` is removed later by T6.3.1, once the web re-export is gone (T6.3). Keep the legacy `'razorpay'` provider literal wherever it legitimately lives (`models/payment.ts` and its test, `payments/constants.ts`, shared `PaymentProviderName`). `config/env.ts`/`env.test.ts` still hold the optional `RAZORPAY_*` env vars until T6.4.
- **Acceptance:**
  - [ ] No `razorpay` import, `new Razorpay`, `RAZORPAY_PRODUCTS` or Razorpay type in `apps/api/src`, and no `razorpay` dependency in `apps/api/package.json`; legacy provider literal retained.
  - [ ] `bun.lock` has no `razorpay` entry.
- **Verify:** `git grep -nE "RAZORPAY_PRODUCTS|Razorpay(Product|Subscription|Order)|new Razorpay|from ['\"]razorpay['\"]|require\(['\"]razorpay['\"]\)" -- apps/api/src` returns nothing; `git grep -ni razorpay -- apps/api/src apps/api/package.json ':!apps/api/src/config' ':!apps/api/src/models/payment.ts' ':!apps/api/src/models/payment.test.ts' ':!apps/api/src/payments' | grep -vi legacy | grep -vE "[\"']razorpay[\"']"` returns nothing (same filters as T6.6; the excluded paths hold the env vars removed in T6.4 and the legacy provider literal; the quoted-literal filter would hide a `"razorpay":` dependency line, so the next check covers it); `grep -ci razorpay apps/api/package.json` prints 0; `grep -c razorpay bun.lock` prints 0; `cd apps/api && bunx vitest run`; `bun run verify`.

### ☐ T6.3 Remove Razorpay from web

- **Kind:** implementation
- **Files:** `apps/web/src/utils/payment.ts`, `apps/web/src/utils/payment.test.ts`, `apps/web/src/utils/constants.ts`, `apps/web/src/types/index.ts`
- **Do:** Delete the Razorpay loader/`successHandler` and test, the duplicate `RAZORPAY_PRODUCTS` (around line 256), the web `RazorpaySubscription`/`RazorpayOrder` types, and the `RazorpayProduct` re-export line in `apps/web/src/types/index.ts` (the shared definition goes in T6.3.1). Confirm no remaining importer first.
- **Acceptance:**
  - [ ] No web source imports or defines a Razorpay symbol; the only remaining mentions are legacy-row fixtures/titles in `Payments.test.ts` (T5.4/T5.7) and the copy file `pricingFAQ.json` (handled in T6.5).
  - [ ] Web build and tests pass.
- **Verify:** `git grep -nE "RAZORPAY_PRODUCTS|Razorpay(Product|Subscription|Order)|utils/payment|checkout\.razorpay\.com|new Razorpay|from ['\"]razorpay['\"]" -- apps/web/src` returns nothing; `git grep -ni razorpay -- apps/web/src ':!apps/web/src/utils/pricingFAQ.json' ':!apps/web/src/components/Profile/Payments.test.ts' | grep -vi legacy | grep -vE "[\"']razorpay[\"']"` returns nothing (a quoted provider literal or a legacy-labelled comment is allowed, the same filters as T6.6); `bun run test`; `bun run verify`.

### ☐ T6.3.1 Remove `RazorpayProduct` from packages/shared

- **Kind:** implementation
- **Files:** `packages/shared/src/types/domain.ts`, `packages/shared/src/types/index.ts`
- **Depends on:** T6.2, T6.3
- **Do:** Delete the `RazorpayProduct` interface from `types/domain.ts` and its re-export from `types/index.ts`. Its dependents (the API and web `types/index.ts` re-exports, API/web `RAZORPAY_PRODUCTS`, `PricingPacks.vue` prop type) are already gone via T6.2, T6.3 and T5.3; if `git grep -n RazorpayProduct -- apps packages` still shows an importer outside these two files, make no change and FAIL naming it. Keep the `'razorpay'` member of `PaymentProviderName` (T2.2, legacy rows). No spec file here (type-only change).
- **Acceptance:**
  - [ ] `RazorpayProduct` no longer exists anywhere in `apps/` or `packages/`.
  - [ ] `packages/shared/src` mentions razorpay only as the legacy `'razorpay'` provider literal.
  - [ ] API and web still type-check; tests green.
- **Verify:** `git grep -n RazorpayProduct -- apps packages` returns nothing; `git grep -ni razorpay -- packages/shared/src | grep -vi legacy | grep -vE "[\"']razorpay[\"']"` returns nothing (same filters as T6.6); `bun run test`; `bun run verify`.

### ☐ T6.4 Env cleanup: config and compose

- **Kind:** implementation
- **Files:** `apps/api/src/config/env.ts`, `apps/api/src/config/env.test.ts`, `apps/api/docker-compose.yml`
- **Do:** Remove `RAZORPAY_*` from env validation and compose (and the `// Razorpay` comment), drop them from the `env.test.ts` base fixture, and assert their absence in `env.test.ts`. The removed names appear in `env.test.ts` only through one short marker constant in the API style (double quotes, no semicolon), `const LEGACY_RAZORPAY_ENV_PREFIX = "RAZORPAY_"`, and the absence test asserts that no key of the parsed env starts with it (e.g. `expect(Object.keys(parsed).filter((key) => key.startsWith(LEGACY_RAZORPAY_ENV_PREFIX))).toEqual([])`). The test title and every other line avoid naming Razorpay, so each remaining mention contains the identifier. Never write real secrets.
- **Acceptance:**
  - [ ] No Razorpay env var or comment in `env.ts` or `docker-compose.yml`; `env.test.ts` asserts the absence via `LEGACY_RAZORPAY_ENV_PREFIX`.
- **Verify:** `cd apps/api && bunx vitest run config/env.test.ts`; `git grep -ni razorpay -- apps/api/src/config/env.ts apps/api/docker-compose.yml` returns nothing; `git grep -ni razorpay -- apps/api/src/config/env.test.ts | grep -v LEGACY_RAZORPAY_ENV_PREFIX` returns nothing (only the marker constant and its uses mention the removed names).

### ☐ T6.4.1 Env cleanup: tracked example files

- **Kind:** implementation
- **Files:** `apps/api/.env.example`, `apps/web/.env.example`, `infra/.env.example`
- **Depends on:** T6.4
- **Do:** Only TRACKED env files are edited (`git ls-files 'apps/*/.env*' 'infra/.env*'` lists them). Remove `RAZORPAY_*` / `VITE_RAZORPAY_*`, keeping the Dodo placeholders from T1.3. Do NOT open or edit untracked env files (`apps/api/.env*`, `apps/web/.env.local|.staging|.production`, `infra/.env.prod|.staging`); instead list under DECISIONS in the task result, and in `agent_docs/CHECKLIST_manual_steps.md` via T6.6, the exact manual edit per file: delete each `RAZORPAY_*` / `VITE_RAZORPAY_*` line and add the Dodo variable names from SPEC 5.7 with the user's own values. Never write real secrets.
- **Acceptance:**
  - [ ] No Razorpay env var in any tracked env/compose file.
  - [ ] Untracked env files unchanged; the manual edit list is in the task result under DECISIONS.
- **Verify:** `git grep -inE "razorpay" -- '*.env*' '*.yml' ':!apps/web/coverage'` returns nothing tracked; `git status --short -- 'apps/*/.env*' 'infra/.env*'` shows only the three tracked example files.

### ☐ T6.5 User-facing copy and product docs

- **Kind:** implementation
- **Files:** `apps/web/src/utils/pricingFAQ.json`, `apps/web/public/pricing.md`, `apps/web/public/llms.txt`, `README.md`, `docs/PRD.md`
- **Do:** Replace Razorpay wording; mention Dodo as merchant of record accurately; remove UPI claims unless T0.3 confirmed support.
- **Acceptance:**
  - [ ] No Razorpay mention in these files; payment method claims match T0.3.
- **Verify:** `git grep -il razorpay -- apps/web/src/utils/pricingFAQ.json apps/web/public README.md docs/PRD.md` returns nothing; `bun run verify`.

### ☐ T6.6 Technical docs, checklist, and scenarios

- **Kind:** implementation
- **Files:** `docs/ARCHITECTURE.md`, `docs/API_REFERENCE.md`, `agent_docs/CHECKLIST_manual_steps.md`, `agent_docs/e2e-scenarios/profile-billing.feature.md`
- **Depends on:** T6.1, T6.3.1, T6.4.1, T6.5
- **Do:** Document the new endpoints and webhook, add Dodo dashboard/webhook/live-mode cutover steps and the T6.4.1 manual untracked-env edits to the checklist, update the billing scenario to the Dodo flow. Any line that still has to name Razorpay (the checklist's manual "delete `RAZORPAY_*` / `VITE_RAZORPAY_*`" edits, a legacy-row note or scenario) must contain the word "legacy" (e.g. "Remove the legacy `RAZORPAY_KEY_ID` line from `apps/api/.env.production`") so the Verify filter can tell it from a leftover Razorpay step.
- **Acceptance:**
  - [ ] API reference lists `POST /payments/checkout`, `GET /payments`, status endpoint, `POST /webhooks/payments`.
  - [ ] Checklist and scenario contain no Razorpay payment steps; remaining mentions are legacy-labelled (manual env removals, legacy rows).
- **Verify:** `git grep -ni razorpay -- docs agent_docs/CHECKLIST_manual_steps.md agent_docs/e2e-scenarios | grep -vi legacy` returns nothing; final repo check `git grep -ni razorpay -- . ':!apps/web/coverage' ':!**/dist/**' ':!agent_docs/done' ':!agent_docs/*deploy_modernization*' ':!agent_docs/REVIEW_*' ':!agent_docs/web-frontend-review.md' ':!agent_docs/*dodo*' ':!apps/api/src/models/payment.ts' ':!apps/api/src/models/payment.test.ts' ':!apps/api/src/payments' ':!apps/web/src/components/Profile/Payments.test.ts' ':!apps/web/e2e/qa/billing-history.spec.ts' ':!apps/web/e2e/scenarios/billing-history.feature.md' | grep -vi legacy | grep -vE "[\"']razorpay[\"']"` returns nothing. Allowlist rationale: historical `agent_docs/` plans and reviews are records, not edited; the model, `payments/` and shared `PaymentProviderName` hold the legacy `'razorpay'` provider literal; the `LEGACY_RAZORPAY_ENV_PREFIX` absence marker in `env.test.ts` (T6.4) passes the `legacy` filter; because the quoted-literal filter would also hide an import or a dependency line, `git grep -nE "from ['\"]razorpay['\"]|\"razorpay\":" -- apps packages` must also return nothing; `Payments.test.ts` and the T5.9 spec/scenario carry the "legacy Razorpay-shaped row" fixtures and titles. `grep razorpay bun.lock` returns nothing.

### 🔶 Checkpoint 6

- [ ] No Razorpay import, type, constant, route, env var or dependency left in `apps/` or `packages/` (`RazorpayProduct` gone from `packages/shared` via T6.3.1); the T6.6 repo-wide grep is clean apart from its allowlist (legacy `'razorpay'` provider literal, `LEGACY_RAZORPAY_ENV_PREFIX` marker, legacy-row test fixtures/titles, legacy-labelled manual steps); `bun.lock` clean; `bun run test` and `bun run verify` green.

---

## Phase 7: E2E gate, manual run, definition of done

**Adds:** No new feature. Runs the full automated suites, then a real test-mode purchase with a Dodo test card, and finally audits everything against the spec's definition of done.

**Try in UI:** Follow agent_docs/CHECKLIST_manual_steps.md: buy a pack with the Dodo test card and see credits +N once ; Open Profile > Payments and see one row for it ; Replay the webhook from the Dodo dashboard and see no extra credits ; Run bun run test and bun run verify

Numbering starts at T7.2: there is no T7.1 (the PLAN's e2e spec task became the Phase 5 `E2E:` tasks T5.8/T5.9; ids were kept stable rather than renumbered).

### ☐ T7.2 GATE: automated suites green

- **Kind:** gate
- **Files:** none
- **Depends on:** T5.8, T5.9, T6.6
- **Do:** Run the whole evidence set; fix or report failures, no retries without a new hypothesis (two identical failures: consult the advisor).
- **Acceptance:**
  - [ ] Spec section 12 criteria 4, 6, 7 and the automated part of 5 satisfied by the outputs below (the manual run in 5 is T7.3).
- **Verify:** `bun run test`; `bun run verify`; `cd apps/api && bunx vitest run`; `cd apps/web && bunx playwright test e2e/qa/billing-purchase.spec.ts e2e/qa/billing-history.spec.ts --repeat-each=3`; `cd apps/web && bun run test:e2e` (full e2e suite). Evidence is command output only; `agent-browser` is not evidence.

### ☐ T7.3 WALKTHROUGH: real test-mode run

- **Kind:** walkthrough
- **Files:** `agent_docs/CHECKLIST_manual_steps.md`
- **Depends on:** T7.2
- **Do:** The real card payment is a human step done before running Phase 7, using the checklist steps from T6.6: real overlay, Dodo test card from T0.3 results, webhook delivered through the `webhook-url` from pre-flight step 5 (never create a tunnel), delivery observed and replayed from the Dodo dashboard, results and date recorded in the checklist. This task never prompts: if the checklist has no dated result for the run, FAIL with the unblock text "Perform the real test-mode purchase per `agent_docs/CHECKLIST_manual_steps.md`, record the result and date there, then re-run /build-phases for Phase 7." If it is recorded, confirm the API data matches (credits +N once, one row for the payment id) and re-run the automated evidence.
- **Acceptance:**
  - [ ] Real purchase credits +N exactly once; Profile -> Payments shows the record; dashboard replay adds no credit.
  - [ ] Results and date recorded in the checklist.
- **Verify:** `cd apps/web && bunx playwright test e2e/qa/billing-purchase.spec.ts e2e/qa/billing-history.spec.ts --repeat-each=3` still green after the run, plus `cd apps/api && bunx vitest run`; the manual observations are recorded in the checklist. Browser tooling is not used as evidence.

### ☐ T7.4 DEFINITION OF DONE: audit and summary

- **Kind:** dod
- **Files:** none
- **Depends on:** T7.2, T7.3
- **Do:** Advisor audits the full diff against Spec section 12 criteria 1-7 (make work durable first); resolve or report every finding; never commit yourself (the /build-phases orchestrator commits each verified phase, one commit per phase); produce the Implementation Summary in the required format with Verification Steps for browser testing.
- **Acceptance:**
  - [ ] Criteria 1-7 each mapped to evidence (e2e criteria to the T5.8/T5.9 scenario tags per SPEC section 7).
  - [ ] Advisor findings resolved or reported; exactly one orchestrator commit per completed phase; no commits by build agents.
  - [ ] New dependencies listed in the report (`dodopayments`, checkout SDK, optional `standardwebhooks`; removed `razorpay`).
- **Verify:** `git log --oneline master..feature/payments` shows one commit per completed phase (0-6), each matching a `commit` event in `.dashboard/tasks_dodo_payments/events.jsonl`, and no commit made by a build agent (user-made commits such as the planning files are allowed); `bun run test`; `bun run verify`; `cd apps/web && bunx playwright test e2e/qa/billing-purchase.spec.ts e2e/qa/billing-history.spec.ts --repeat-each=3`; `cd apps/web && bun run test:e2e`.

### 🔶 Checkpoint 7 (done)

- [ ] All tasks ✅; implementation summary delivered; committed per phase by the orchestrator (one commit per phase).

---

## Open questions

Each has a default the build follows unless the user says otherwise.

1. Clerk auth mount-order bug on the users, explore, credits, image, and collections routers (`routes/index.ts` lines 19-23). Default: out of scope; log as follow-up. No task changes them (T3.1 fixes only payments). Alternative: a separate follow-up task.
2. Rate limiter for `POST /payments/checkout` (none exists in the repo). Default: out of scope; log as follow-up. No task asks about it or adds one. Alternatives: hand-rolled per-user limiter, or `express-rate-limit` (new dependency).
3. Linking webhook to checkout session. Default: the checkout writes a pending embedded record keyed by `providerSessionId`; `applyEvent` turns that record into `completed`/`failed` (setting `providerPaymentId`) in the same guarded atomic update when the payload carries the session id, otherwise pushes a new record; the status endpoint reads that DB record first. Alternative: status polls Dodo only (the stubbed e2e could then never reach `succeeded`).
4. Webhook path. Default `/webhooks/payments`; alternative `/webhooks/dodo`.
