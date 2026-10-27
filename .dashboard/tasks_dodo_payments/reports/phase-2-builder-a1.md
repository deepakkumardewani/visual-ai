# Phase 2 builder report — Test harness and shared catalog

**Tasks:** T2.0, T2.0.1, T2.1, T2.2  
**Result:** PASS (implementation complete; root `bun run test` / `bun run verify` have pre-existing repo failures unrelated to this phase)

## T2.0 — Setup: test harness

**Files created:** `apps/web/e2e/README.md`, `apps/web/e2e/fixtures/README.md`, `apps/web/e2e/fixtures/qa.ts`, `apps/web/e2e/qa/_template.spec.ts`

**Verify:**

```
cd apps/web && bunx playwright test e2e/qa/_template.spec.ts --repeat-each=3
→ 4 passed (1 setup + 3 template repeats)
```

**Note:** `bun run verify` from repo root exits 1 (133 oxlint errors / warnings across existing files, not introduced here). Scoped e2e typecheck: no errors in `qa.ts` after `consoleGuard` fixture typing fix.

## T2.0.1 — Webhook signing helper

**Files:** `apps/web/e2e/support/signWebhook.ts`, updated `qa.ts`, `fixtures/README.md`

**Verify:**

```
cd apps/web && bunx playwright test e2e/qa/_template.spec.ts → 2 passed
cd apps/web && bunx tsc -p e2e/tsconfig.json --noEmit → no qa.ts/signWebhook.ts errors
```

## T2.1 — CREDIT_PACKS

**Files:** `packages/shared/src/models/creditPacks.ts`, `packages/shared/src/models/index.ts`

Four packs: `pack_200|450|960|2000`, minor prices 13000/29000/50000/90000 INR, savings 0/10/20/30.

**Verify:**

```
bunx vitest run packages/shared → 2 files, 26 tests passed
cd packages/shared && bunx tsc --noEmit → exit 0
```

Catalog unit proof deferred to T2.3 (`creditPacks.test.ts`).

## T2.2 — Provider-agnostic payment types

**Files:** `packages/shared/src/types/domain.ts`, `packages/shared/src/types/index.ts`

Added `PaymentProviderName`, `PaymentStatus`, `PaymentRecord` (optional `provider`); kept `RazorpayProduct`.

**Verify:**

```
cd apps/api && bunx vitest run → 50 files, 492 tests passed
cd packages/shared && bunx tsc --noEmit → exit 0
```

## Root verify commands (task-listed)

```
bun run test → exit 1 (320 failed / 1139 passed at root vp test; pre-existing web failures e.g. ResultNextActions.test.ts)
bun run verify → exit 1 (repo-wide oxlint; not caused by Phase 2 files)
```

Scoped green: `packages/shared` vitest, `apps/api` vitest, `apps/web` e2e template, shared + e2e new-file tsc.

## DECISIONS

None.
