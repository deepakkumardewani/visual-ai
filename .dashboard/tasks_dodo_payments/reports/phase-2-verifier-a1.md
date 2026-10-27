# Phase 2 verifier report — Test harness and shared catalog

**Phase:** Phase 2  
**Tasks:** T2.0, T2.0.1, T2.1, T2.2, T2.3, Checkpoint 2  
**Result:** FAIL  
**Date:** 2026-10-20

## T2.0 — Setup: test harness

### Acceptance

- Four files exist (`e2e/README.md`, `fixtures/README.md`, `fixtures/qa.ts`, `qa/_template.spec.ts`): **PASS** (present on disk).
- README covers e2e root `apps/web`, auth storage state, no webServer, env file, `page.route`/`addInitScript`, selector policy: **PASS** (read `apps/web/e2e/README.md`).
- Template passes against running app: **PASS** (Playwright below).

### Verify (ran independently)

```bash
cd apps/web && bunx playwright test e2e/qa/_template.spec.ts --repeat-each=3 --reporter=line
# 4 passed (1 setup + 3 repeats), 14.1s
```

```bash
cd /Users/deepakdewani1/Documents/Programs/vue/text-to-image/visual-ai && bun run verify
# exit 1 — oxlint: "Found 87 warnings and 130 errors" on 570 files
```

**Task verdict:** FAIL — Verify requires `bun run verify` green.

---

## T2.0.1 — Webhook signing helper

### Acceptance

- Algorithm cites T0.3 in comment: **PASS** (`signWebhook.ts` lines 9–14 reference SPEC Q6 / PLAN T0.3-item4).
- E2E signature proof deferred to T5.8: **PASS** (documented in fixtures README).
- Missing key → clear error, never unsigned POST: **PASS** (`requireEnv` throws; manual check with unset `DODO_PAYMENTS_WEBHOOK_KEY` → `[e2e] Missing DODO_PAYMENTS_WEBHOOK_KEY...`).

### Verify

```bash
cd apps/web && bunx playwright test e2e/qa/_template.spec.ts --reporter=line
# 2 passed (11.2s)
```

```bash
cd apps/web && bunx tsc -p e2e/tsconfig.json --noEmit
# exit 2 — errors in pre-existing specs (not qa.ts/signWebhook.ts):
# e2e/assets.spec.ts(264,64), (266,11), (267,20), (325,20)
# e2e/explore.spec.ts(240,14)
# e2e/fixtures/generation.ts(29,5)
```

**Task verdict:** FAIL — Verify requires full e2e `tsc --noEmit` with exit 0.

---

## T2.1 — CREDIT_PACKS

### Acceptance

- Four packs, unique ids, legacy credits/prices: **PASS** (T2.3 tests + `creditPacks.ts` content).
- `getCreditPack('nope')` undefined, no monthly: **PASS** (T2.3).
- Exported via `models/index.ts` and package root `src/index.ts`: **PASS**.

### Verify

```bash
bun run test
# exit 1 — Test Files 49 failed | 192 passed; Tests 320 failed | 1146 passed
```

```bash
bun run verify
# exit 1 — 130 errors, 87 warnings (repo-wide oxlint)
```

**Task verdict:** FAIL — both listed Verify commands exit non-zero.

---

## T2.2 — Provider-agnostic payment types

### Acceptance

- Types in `domain.ts`, exported: **PASS** (`PaymentProviderName`, `PaymentStatus`, `PaymentRecord`; Razorpay types retained).
- API/web type-check unchanged: **PASS** for scoped `cd packages/shared && bunx tsc --noEmit` (exit 0). Full repo verify/test still fail (below).

### Verify

```bash
bun run verify  # exit 1 (same oxlint summary)
bun run test    # exit 1 (same vitest summary)
```

**Task verdict:** FAIL — Verify steps require green root `verify` and `test`.

---

## T2.3 — Unit: shared catalog

### Verify

```bash
bunx vitest run packages/shared/src/models/creditPacks.test.ts \
  --coverage --coverage.include=packages/shared/src/models/creditPacks.ts --coverage.reporter=text
# Test Files 1 passed; Tests 7 passed
# Statements 100% (4/4), Branches 100%, Functions 100% (2/2), Lines 100% (3/3)
```

```bash
grep -rnE "test\.fail|it\.fails|\.skip|\.only|\.fixme" packages/shared/src/models/creditPacks.test.ts
# no matches
```

**Task verdict:** PASS — unit lowest 100% lines; 7/7 clean; no weakened tests.

---

## Checkpoint 2

| Criterion                                | Result                                     |
| ---------------------------------------- | ------------------------------------------ |
| `bun run test` green                     | **FAIL** (exit 1, 320 failed tests)        |
| `bun run verify` green                   | **FAIL** (exit 1, 130 oxlint errors)       |
| QA harness template green (T2.0, T2.0.1) | **PASS** (Playwright template 4/4 and 2/2) |
| T2.3 coverage gate                       | **PASS** (100% all metrics)                |

**Checkpoint verdict:** FAIL — root test/verify not green.

---

## Code quality (phase files only)

Reviewed: `qa.ts`, `signWebhook.ts`, `_template.spec.ts`, READMEs, `creditPacks.ts`, `creditPacks.test.ts`, `domain.ts` exports.

No concrete violations (dead code, swallowed errors, scope creep, or duplicated signing logic).

---

## Engineer reports cross-check

- `phase-2-builder-a1.md` correctly notes root `bun run test` / `bun run verify` fail; implementation scoped checks green. **Independent re-run confirms root commands still fail** — tasks listing those Verify lines cannot pass until repo-wide issues are fixed or Verify scope is clarified.
- `T2.3-unit-a1.md` claims 7/7 and 100% coverage — **confirmed**.

---

## Fix guidance for builder retry

1. Either fix repo-wide `bun run test` / `bun run verify` failures, **or** orchestrator must narrow task Verify lines if pre-existing failures are out of scope (verifier must follow TASKS as written — currently FAIL).
2. For T2.0.1: fix e2e tsconfig type errors in `assets.spec.ts`, `explore.spec.ts`, `fixtures/generation.ts`, or exclude legacy specs from `e2e/tsconfig.json` if intentional — Verify demands exit 0 on full project typecheck.
