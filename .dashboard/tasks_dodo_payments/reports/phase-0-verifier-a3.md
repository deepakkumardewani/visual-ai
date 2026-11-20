# Phase 0 verifier a3: PASS

- T0.1: plugins list shows dodopayments@dodopayments v0.6.5 Scope project enabled; .claude/settings.json line 4 true; ~/.claude/settings.json only has marketplace source (extraKnownMarketplaces), no enabledPlugins entry; T0.1-plugin line L311.
- T0.2: claude mcp list both Dodo MCPs Connected; all five T0.2-_ labels present; skills line has dodopayments:_; docs-query has URLs; products 0 (mode assumed test, noted).
- T0.3: 6 T0.3-item lines, each with URL; 11 indented Answer (T0.3) lines, one under each Q1-11; Q12-14 untouched; UPI/window.DodoPayments seam addressed.
- T0.4: T0.4-gate: PASS with citation; no create calls.
- Checkpoint: git status shows only untracked docs, no repo source touched.
  Note: literal grep of ~/.claude/settings.json for dodopayments matches the marketplace entry, but AC (enabledPlugins) is met.
