# Prompt: Implement fixes from the API production-readiness review

> Paste everything below the line into a fresh Claude Code session (main agent: Opus 5.5).

---

You are the **orchestrator** (Opus). Your job is to get every item in `agent_docs/REVIEW_api_production_readiness.md` (BE-001 … BE-060) fixed and **independently verified**. Use **Sonnet subagents** for all implementation and verification. Keep your own context clean: you plan, dispatch, gate and track. You do not write feature code yourself.

## Source of truth
- **The findings:** `agent_docs/REVIEW_api_production_readiness.md`.
  - Each BE item has Evidence, Problem, Fix guide, Test to add and Acceptance.
  - §1 lists the **product decisions D1–D5** and the orchestrator's corrections to reviewer claims. Follow the corrected version.
  - §4 is the fix order, the dependencies and the file-ownership notes.
  - §5 lists what is already fine. Do not "fix" it.
- **Project rules:** `CLAUDE.md` and `~/.claude/CLAUDE.md`. Key ones:
  - bun only;
  - DRY;
  - functions under about 30 lines;
  - an options object beyond 3 parameters;
  - no magic numbers or strings;
  - never swallow errors;
  - log with context through the pino logger, never `console.*`.
- **Skills:** `code-style` and `typescript-best-practices`.
- **Shared contracts:** zod schemas, request/response types and constants live in `packages/shared`. API changes that alter a request contract must update the matching `apps/web` caller in the **same** package (see the cross-app note in §4).

## Step 0: decisions first (you, before any dispatch)
Use `AskUserQuestion` once to settle **D1–D5** from §1 of the report, with concrete options and the recommended option first:
- **D1:** explore visibility, opt-in vs public-by-default;
- **D2:** credit cost per output vs cap at 1;
- **D3:** moderation fail-closed vs fail-open flag;
- **D4:** referral policy, one per account plus the bonus amount;
- **D5:** standalone `Payment` collection vs embedded.

Record each answer in the report under §1, as `**Decision:** …`. Items that depend on an unanswered decision are `BLOCKED`, not guessed.

## Hard rules
1. **Never commit.** Never start the API or web server; they are already running.
2. **No e2e and no browser testing.** Do not run Playwright, `agent-browser`, or chrome-devtools. Verification is unit and integration tests, plus reading the code.
3. **Line numbers drift.** Every subagent must re-locate the evidence by symbol/grep before editing and re-confirm that the bug still exists. If it no longer reproduces, report `ALREADY-FIXED` with evidence instead of changing code.
4. **No half-baked work.** An item is done only when all of these hold:
   - the Fix guide is implemented in full;
   - the "Test to add" exists and passes;
   - the Acceptance criteria are demonstrably met;
   - no new `any`, `as any`, `@ts-ignore`, `// TODO`, `console.*`, or empty `catch` was introduced;
   - no route reports success for a write that did nothing.
5. **Security fixes need negative tests.** Every auth/IDOR/payment fix needs:
   - a test proving that the *attack* fails (401/403/400, and no DB or Cloudinary side effect);
   - that test must **fail on the pre-fix code**.

   Route tests must go through real HTTP dispatch (the BE-046 harness: `supertest` against the real `router`), not `router.stack` poking.
6. **Fix tests that lock in bugs; don't preserve them.** Examples are `routes/index.test.ts` mount order, the `users.test.ts` `params.userId` test, `multer.test.ts` body.userId, and the `collections.test.ts` body userId. Rewrite them to assert the correct behaviour. Never weaken an assertion just to go green.
7. **No two concurrently running subagents may edit the same file.** Before each wave, build a file-ownership map from each item's Evidence and Fix guide. Items that share a file go into the same package or into sequential waves. Hotspots are `routes/index.ts`, `app.ts`, `index.ts`, `services/generation-service.ts`, `webhook/index.ts`, `routes/users.ts`, `packages/shared/src/**`, and `apps/api/package.json`.
8. **Shared working tree, so no destructive git.** Subagents must NEVER run any of these, because they would wipe or rewrite other agents' in-progress work:
   - `git stash`, `git checkout -- …`, `git restore`, `git reset`, `git clean`;
   - repo-wide formatters.
9. Only the orchestrator edits `agent_docs/REVIEW_api_production_readiness.md`. Subagents treat it as read-only.
10. **Respect §4 dependencies:**
    - BE-001 comes before BE-002/006/008/011.
    - BE-002 (`lib/auth.ts` `requireUserId`) comes before every route-level fix.
    - BE-014 comes before BE-016.
    - BE-007 comes before BE-018, which comes before BE-051.
    - BE-008 comes before BE-031.
    - BE-040 comes before BE-049/050.
    - The BE-046 harness is **started in Batch 1**, because Batch 1 tests depend on it.
11. **New dependencies** (`supertest`, `helmet`, `express-rate-limit` with a Redis store) are added only by the package that owns `apps/api/package.json` in that wave, via `bun add`. No other package edits `package.json`.
12. **Typecheck and tests.** Do not run the full typecheck mid-wave. Subagents run only the vitest files they touched (`cd apps/api && bunx vitest run <paths>`). The full typecheck and tests run in the batch gate (step C).
13. **Don't stall.** Never pause mid-batch to wait for the user. If a package is blocked, mark it `BLOCKED`, carry on with everything else, and raise all blocked items together at the batch gate.

## Workflow: repeat for Batch 1 → 5 (from §4)

### A. Plan the wave (you)
- List the batch's BE items and read only their sections of the report. Build the file-ownership map.
- Group the items into **work packages**: 1–4 related items per package that share files or a root cause. The report already suggests groupings:
  - BE-003+004+021+022+024+025 (payments);
  - BE-012+013+023 (users);
  - BE-002+006.
- Split the packages into parallel **waves** with disjoint file sets.
- Print the wave plan (package → BE IDs → files) before dispatching.

### B. Implement → verify loop (per package, Sonnet subagents)
1. **Implementer:** `Agent` with `subagent_type: "general-purpose"`, `model: "sonnet"`. Do not use `phase-builder`; there is no TASKS.md. Give it:
   - the BE IDs, with an instruction to read exactly those sections of the report plus any decisions recorded in §1;
   - the file list it owns, with an instruction not to touch other files (if it must, it stops and reports back);
   - the Hard rules above.

   Workflow:
   - write the failing test first (TDD), including the negative/attack test for security items;
   - implement the fix;
   - update the matching `apps/web` caller if the request contract changed;
   - run the touched vitest files;
   - self-review against Acceptance.

   Return format, ≤200 words:
   - `PASS|FAIL|ALREADY-FIXED`;
   - files changed;
   - tests added (names);
   - each Acceptance criterion with evidence (`file:line` or test name).
2. **Verifier:** `Agent` with `subagent_type: "phase-verifier"`, `model: "sonnet"` (read-only tools). Launch it with fresh context after the implementer returns. Give it the BE IDs, the report path and the implementer's owned-file list, but **not** the implementer's summary. Tell it explicitly that the acceptance criteria come from the BE items in the report, not from a TASKS.md phase. It must:
   - re-read each item's Problem and Acceptance, then inspect the diff (`git diff -- <files>`);
   - confirm the original bug is gone by reading the code path end to end (route → service → model), not just the test;
   - for security items, actively try the attack from the Problem section on paper. Examples: body `userId` of another user, a forged webhook, a replayed webhook, a client `amount`, a foreign `publicIds`.
   - confirm the new tests would fail without the fix, by reasoning from the diff (no git stash/checkout; Hard rule 8);
   - check `apps/web` callers for contract breaks, check for regressions, and check Hard-rule-4 violations;
   - run the touched and related vitest files;
   - return `VERIFIED` or `REJECTED` with a precise defect list.
3. **If REJECTED:** re-dispatch the implementer with the verifier's defect list, at most 2 retries. If it still fails, mark the package `BLOCKED` (Hard rule 13) and continue.
4. Run the independent packages of a wave in parallel. Wait for the whole wave to be VERIFIED or BLOCKED before starting the next wave.

### C. Batch gate (one Sonnet subagent, `general-purpose`)
Run in order, from the repo root:
1. `cd apps/api && bunx tsc --noEmit --composite false -p tsconfig.json`
2. `cd apps/api && bunx vitest run --coverage`. All tests must pass and the 90% thresholds must hold.
3. If any `apps/web` file changed: `cd apps/web && bun run check`, then `bun run test`.
4. If `packages/shared` changed: typecheck both apps.
5. `git diff --stat`.

Then:
- Grep the changed files for `: any|as any|@ts-ignore|TODO|FIXME|console\.|catch \([^)]*\) \{\s*\}`.
- Grep `apps/api/src` (excluding tests) for `req\.(body|query|params)[^;]*userId` and `req\.body\.id`. After Batch 1 this must return nothing.

On any failure, dispatch a fix package through step B and re-run the gate. The batch is done only when the gate is fully green. Then use `AskUserQuestion` to raise any `BLOCKED` packages, with concrete options, before starting the next batch.

### D. Track progress (you, after each verified package)
In `agent_docs/REVIEW_api_production_readiness.md`:
- tick the §4 checkbox;
- under each fixed BE heading (or in the table row for Medium/Low items), add `**Status:** ✅ Fixed & verified (Batch N): tests: <names>`;
- for `ALREADY-FIXED`, decision-driven or deliberate deviations, add `**Status:** ⚠️ <reason>`;
- append a line to §6 Revision log per batch.

## After Batch 5: final gate
1. **Full gate:** run step C once more, including the `apps/web` checks.
2. **Ops sanity (no server start):** `docker compose -f infra/docker-compose.yml config` must succeed. The Dockerfile `HEALTHCHECK` must target `/health` on `APP_PORT` (read it; don't build the image unless the user asks).
3. **Completeness audit:** spawn one last Sonnet `phase-verifier` and give it only the report. It must:
   - confirm that every BE-001 … BE-060 item has a Status line;
   - re-verify **all 6 Critical items** in code;
   - re-verify a random sample of 10 other fixed items.

   Anything it flags goes back through step B.

## Final output to the user
- A table: BE ID | Severity | Status | Tests added.
- Gate results: tsc, vitest counts with coverage %, and web check/test results.
- Every item that is not fully fixed, with the reason, plus any new env vars the user must set. Known ones are `RAZORPAY_WEBHOOK_SECRET`, `ALERT_EMAIL` and the rate-limit settings. Also remind the user to configure the Razorpay dashboard webhook secret.
- Then the mandatory summary block:

```
API Production-Readiness Fixes Implementation Summary

### Verification Steps
- <manual API/browser steps per Critical and High item, derived from each BE item's Acceptance. Examples: "Sign out → GET /users returns 401", "POST a webhook without a signature → 400, balance unchanged", "Buy the smallest pack → credits match the pack and the purchase shows in Profile → Payments">
```
