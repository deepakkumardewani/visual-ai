# HANDOFF — landing-v3-polish: implement agent_docs/landing-v3-polish/PLAN.md

Saved: 2026-11-16T17:27:24Z · Repo: /Users/deepakdewani1/Documents/Programs/vue/text-to-image/visual-ai · Model: claude-fable-5-2 · Effort: unknown
Mode: freeform (orchestrated per PLAN.md section 4)

## Context discipline (mandatory for the resuming session)

Main session orchestrates only. Delegate exploration, implementation, review and
verification to subagents, one task per subagent. Keep raw output out of main context.

## Where we are

Plan has 8 phases on `/v3` (shared `apps/web/src/components/LandingV2/*`). Owner decisions: drop the model name on showcase tiles; keep "No card needed"; pricing shows Free + Pro + Credit packs.
Built, reviewed, fixes applied: phases 1, 4, 6, 8. Built, NOT reviewed: 2 (hero), 7 (showcase).
Phase 3 (tools) builder was killed mid-verification: code is edited and 53 shots exist, but there is no report; reduced-motion and v1-page checks were not done. Phase 5 (rotating hero prompt) not started.
Rules: Opus for phases 2/3/5/7 and UI/UX review, Sonnet for the rest; no new or changed tests; no commits; dev app already runs on http://localhost:4300; agent-browser with a repo-unique session.

## Done this session

- Phases 1, 2, 4, 6, 7, 8 built; reviews in agent_docs/landing-v3-polish/reviews/ (ui/ux for p1-p6 and p4-p8), shots in agent_docs/landing-v3-polish/shots/
- 6 approved Replicate calls made (3 Flux 1.1 Pro, 3 background removals); assets in apps/web/public/landing/remove-bg-\*.webp. No further paid calls are approved.
- Phase 7 file list: see git status (safeRedirect.ts, useStudioPromptPrefill.ts, ShowcaseDialog.vue, showcaseScrub.ts, useShowcaseLightbox.ts, useTryPromptLink.ts, Signin.vue, Dashboard.vue, router/index.ts, useLenis.ts, useFocusTrap.ts, AppModal.vue)
- Usage guard fixed in ~/dotfiles/claude/.claude/hooks/usage-guard.sh (skips subagents, hard stop at 98%)

## Next step (exact)

1. Opus subagent: finish phase 3 verification (PLAN.md phase 3; `vp check`, `vp lint`, shots at 1440x900, 1920x1080, 390, WebGL off, reduced motion, `/v2` and v1 pages) and report what the killed agent changed (ToolsScene.vue, toolsTimeline.ts, ToolStage.vue, ToolChapterCopy.vue, ToolCluster.vue).
2. reviewer-ui + reviewer-ux (Opus) on phases 2+3 together and on phase 7; reviewer-security on phase 7 (sign-in `redirect` param now read app-wide, `?prompt=` prefill). Apply must-fixes with fix subagents.
3. Phase 5 (Opus), then its review.
4. Final "Landing v3 polish Implementation Summary" with task list and Verification Steps.

## In flight when stopped

Phase 3 builder (killed, see above). agent-browser session `visual-ai-p3` may still be open; close that session only.

## Uncommitted changes

69 paths, all uncommitted, mixed with unrelated edits (Header, .dashboard). Never commit; leave others' files alone.

## Open questions for the user

None blocking. To flag in the final summary: utils/landing.test.ts fails (4 tests, 2 TS2339) because of the new `cutout` media kind; local API CORS rejects localhost:4300 so `/payments/prices` fails there; v1 teaser says "From ₹99" but the cheapest pack is ₹130; mobile hero "Start free" clipped ~13px at 390x844; `/signup` drops the redirect; `marketing.spec.ts` looks for the missing `.tile__btn`.
