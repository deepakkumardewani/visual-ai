# Prompt — Implement fixes from the `apps/web` frontend review

> Paste everything below the line into a fresh Claude Code session started at the repo root (main agent: Opus 5.5).

---

You are the **orchestrator** (Opus). Your job is to get every item in `agent_docs/web-frontend-review.md` (FE-001 … FE-062) fixed and independently verified. Use **Sonnet subagents** for all implementation and verification. You plan, dispatch, gate and track; you do not write feature code yourself.

## Source of truth
- **The findings:** `agent_docs/web-frontend-review.md`. Each FE item has Evidence, Problem, Fix guide, Test to add and Acceptance.
  - §4 is the fix order and dependencies. §5 lists the hot files, which drive ownership. §6 lists the items that need a decision (❓). §8 lists issues that were dropped; do **not** "fix" anything listed there.
- **Project rules:**
  - Root and `apps/web/CLAUDE.md`. Bun only, never npm or yarn. Vue 3 `<script setup>` and Pinia setup stores. Tailwind uses the `tw-` prefix. Tests are sibling `*.test.ts` files run by `vp test`.
  - `~/.claude/CLAUDE.md` engineering preferences: DRY, functions under ~30 lines, no magic numbers or strings, never swallow errors, an options object beyond 3 parameters, and pure functions with side effects isolated.
- **Skills:** each implementer loads `vue-best-practices`, `vue-pinia-best-practices`, `code-style` and `typescript-best-practices` before editing.
- **Shared code:** where a fix moves data to `packages/shared` (FE-001), it must remain the single source of truth for both `apps/web` and `apps/api`.

## Hard rules
1. **Never commit.** Never start the dev server; it is already running.
2. **No e2e and no browser testing.** Do not run Playwright, `vp build` (it launches a Chromium prerender), `agent-browser` or chrome-devtools. Verification is unit tests, static gates and code reading.
3. **Line numbers drift.** Every subagent must:
   - re-locate the evidence by symbol or grep before editing;
   - re-confirm that the bug still exists;
   - if the bug no longer reproduces, report `ALREADY-FIXED` with evidence instead of changing code.
4. **No half-baked work.** An item is done only when all of these hold:
   - the fix guide is fully implemented;
   - the "Test to add" exists as a sibling `*.test.ts` and passes;
   - the Acceptance criteria are demonstrably met;
   - nothing new was introduced from this list: `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `any`, `as any`, `TODO`, `FIXME`, `console.*` outside `utils/logger.ts`, or a hard-coded credit or price number that duplicates a shared constant.
5. **No two concurrently running subagents may edit the same file.** Before each wave, build a file-ownership map from each item's Evidence and Fix guide plus §5 of the report. Items that share a file go to the same subagent or into sequential waves.
6. **Shared working tree, so no destructive git.**
   - Subagents must NEVER run `git stash`, `git checkout -- …`, `git restore`, `git reset` or `git clean`.
   - Subagents must not run a repo-wide fixer such as `vp lint --fix`, `vp check --fix`, `bun run lint` (which is `--fix`) or `bun run verify`.
   - To format, run `bunx vp fmt <owned files only>` (or the equivalent per-file formatter).
   - Generated `src/auto-imports.d.ts` and `src/components.d.ts` may change only when the owning package adds or removes a component or auto-import. Otherwise revert by hand-editing, not with git.
7. **Document ownership.** Only the orchestrator edits `agent_docs/web-frontend-review.md`. Subagents treat it as read-only.
8. **Respect the §4 dependencies:**
   - FE-027 first.
   - FE-004 before FE-011.
   - FE-005 before FE-019, FE-029 and FE-050.
   - FE-003 before FE-029, and FE-029 before FE-024.
   - FE-002 before FE-010.
   - FE-037 with or before FE-013.
   - FE-008 before FE-017; FE-017 and FE-031 share the hoisted dialog.
   - FE-030 before FE-041.
   - FE-042 before FE-048.
   - FE-051 creates `notify()`. Earlier packages call the existing snackbar refs, and FE-051 migrates them.
   - FE-032 and FE-033 come last.
9. **Cross-boundary and decision items.**
   - 🧩 items (FE-001, FE-002, FE-010, and the `Mode` header part of FE-025) touch `apps/api`. Before dispatching them, confirm via `AskUserQuestion` that API changes are in scope.
   - ❓ items (FE-001, FE-010, FE-012, FE-014, FE-020, FE-040, FE-044) need the §6 decision first. Ask at the start of the batch that contains them, using `AskUserQuestion` with concrete options and a recommended option first. Never invent legal or marketing copy or business numbers.
10. **Don't run the full typecheck mid-way.** Subagents run only the test files they touched: `cd apps/web && bunx vp test run <paths>`, plus `apps/api` test paths for 🧩 items. The full gates run at each batch gate (step C).
11. **Don't stall.** Never pause mid-batch to wait for the user. If a package is blocked, mark it `BLOCKED`, keep going with everything else, and raise all blocked items together at the batch gate.

## Step 0 — baseline (once, before Batch 0)
Have one Sonnet `general-purpose` subagent run these in `apps/web` and record the counts:
- `bunx vue-tsc --noEmit`: expect 122 errors, 28 of them in non-test files.
- `bunx vp lint` (no `--fix`): expect 95 errors and 9 warnings.
- `bunx vp test run`: expect 1,003 passing.
- `git status --short`.

Until FE-026 and FE-033 land, the gate rule is **no new errors compared with the baseline** and **no decrease in passing tests**. After Batch 4 the rule is **zero errors**.

## Workflow — repeat for Batch 0 → 1 → 2 → 3 → 4 (from §4)

### A. Plan the wave (you)
- List the batch's FE items and read only their sections of the report.
- Raise the ❓ and 🧩 questions for this batch (Hard rule 9).
- Build the file-ownership map.
- Group the items into **work packages**: 1–4 related FE items per package that share files or a root cause. Mandatory groupings:
  - FE-004 + FE-011 (`utils/payment.ts`)
  - FE-008 + FE-015 + FE-016 (`utils/helpers.ts`)
  - FE-013 + FE-037
- Split the packages into parallel **waves** with disjoint file sets.
- Print the wave plan (package → FE IDs → files) before dispatching.

### B. Implement → verify loop (per package, Sonnet subagents)
1. **Implementer** (`Agent`, `subagent_type: "general-purpose"`, `model: "sonnet"`). Do not use `phase-builder`; it expects a TASKS.md phase. Give the implementer:
   - the FE IDs, with the instruction to read those sections of `agent_docs/web-frontend-review.md`;
   - the list of files it owns, and the instruction not to touch any other file (if it must, it stops and reports back);
   - all of the Hard rules above, and the skills to load;
   - the workflow: write the failing `*.test.ts` first (TDD), implement the fix, run the touched test files, then self-review against the Acceptance criteria;
   - the return format, in ≤200 words: `PASS|FAIL|ALREADY-FIXED`, the files changed, the tests added (with names), and each Acceptance criterion with its evidence (`file:line` or test name).
2. **Verifier** (`Agent`, `subagent_type: "phase-verifier"`, `model: "sonnet"`, read-only). Start it with a fresh context after the implementer returns.
   - Give it the FE IDs, the report path and the implementer's owned-file list, but **not** the implementer's summary.
   - Tell it explicitly that the acceptance criteria come from the FE items in the review report, not from a TASKS.md phase.
   - It must:
     - re-read each item's Problem and Acceptance, and inspect `git diff -- <files>`;
     - confirm the original failure scenario is gone by reading the code path end to end, not just the test;
     - confirm, by reasoning from the diff, that the new tests would fail without the fix (no stash, checkout or restore; see Hard rule 6);
     - check callers for regressions, and check the Hard rule 4 violations;
     - run the touched and related test files;
     - return `VERIFIED` or `REJECTED` with a precise defect list.
3. **If REJECTED**, re-dispatch the implementer with the verifier's defect list. Allow at most 2 retries. If it still fails, mark the package `BLOCKED` (Hard rule 11) and continue.
4. Run the independent packages of a wave in parallel. Wait for the whole wave to be VERIFIED or BLOCKED before starting the next wave.

### C. Batch gate (one Sonnet `general-purpose` subagent)
Run in `apps/web`, in this order:
1. `bun run typecheck`. This script is added by FE-027; until then, use `bunx vue-tsc --noEmit`.
2. `bun run lint:ci`. Until FE-027 lands, use `bunx vp lint`. **Never use `--fix`.**
3. `bun run check:ci` (after FE-027).
4. `bunx vp test run --coverage`.
5. For 🧩 batches, also run `cd apps/api && bunx vp test run`, or that package's test script.
6. `git diff --stat`.

Then check:
- Grep the changed files for `eslint-disable|@ts-ignore|@ts-expect-error|: any\b|as any|TODO|FIXME|console\.` (excluding `utils/logger.ts`).
- Grep for newly hard-coded credit or price literals, such as `\b(50|30) (free )?credits`, `Save \d+%` and `\? 70 : 100`.
- `git status --short` shows no unexpected files and no generated `dist/`.

Compare the results with the baseline (Step 0). On any regression, dispatch a fix package through step B, then re-run the gate. A batch is done only when the gate is green. Then raise any `BLOCKED` packages with `AskUserQuestion`, giving concrete options, before starting the next batch.

### D. Track progress (you, after each verified package)
In `agent_docs/web-frontend-review.md`:
- tick the §4 checkbox;
- under each fixed FE heading (or in the Low table row), add `- **Status:** ✅ Fixed & verified (Batch N) — tests: <names>`;
- for `ALREADY-FIXED`, a decision-driven deviation or a `BLOCKED` item, add `- **Status:** ⚠️ <reason>`;
- tick the §7 production-readiness checklist lines once their items are verified;
- append a §9 revision-log entry per batch.

## After Batch 4 — final gate
1. **Full gate:** run step C again. Now **zero** `vue-tsc` and `vp lint` errors are required, including in tests (FE-026 and FE-033).
2. **Static re-checks from the Acceptance criteria.** Each must return the count shown:
   - `grep -rn "progress?jobId" apps/web/src`: 1 hit.
   - `grep -rn "mode: 'cors'" apps/web/src`: 0.
   - `grep -rn "snackbar.value = true" apps/web/src`: only the store.
   - `grep -rn "isEmpty(" apps/web/src/stores`: 0.
   - `grep -rn "Save [0-9]\+%" apps/web/src`: 0 literal values.
3. **Completeness audit.** Spawn one final Sonnet `phase-verifier` and give it only the report. It must:
   - confirm that every FE-001 … FE-062 item has a Status line;
   - confirm that every 🔴 and 🟠 item, plus a random sample of 10 others, actually holds in the code;
   - confirm that §7 is fully ticked or each unticked line has an explicit reason.
   Anything it flags goes back through step B.
4. **No browser verification.** Write the manual steps for the user to run themselves instead.

## Final output to the user
- A table: FE ID | Status | Tests added.
- Gate results: `vue-tsc` and `vp lint` error counts against the baseline, and `vp test` pass counts for web and api.
- Any item that is not fully fixed, with the reason and the open decision.
- Then the mandatory summary block:

```
Frontend Review Fixes Implementation Summary

### Verification Steps
- <manual browser steps for the user, one per 🔴/🟠 item plus key 🟡 items, derived from each FE item's Acceptance — e.g. "Dashboard → Upscale sidebar → upload image → Upscale ×2: request body shows scale=2 and the result appears">
```
