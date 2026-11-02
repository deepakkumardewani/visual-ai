---
description: Turn the Cloudflare maintenance redirect rule on, off, or show its status
argument-hint: on | off | status
---

Toggle the Cloudflare Redirect Rule named `maintenance` on the `visual-ai.app` zone. Requested action: `$ARGUMENTS` (default `status`).

Use the `cloudflare-api` MCP server (its search + execute tools). If its tools are not loaded, call its `authenticate` tool and ask me to open the URL; on the consent screen I must grant Zone → Rulesets/Dynamic Redirect edit permission.

Steps:

1. Find the zone id for `visual-ai.app`.
2. Get the zone's `http_request_dynamic_redirect` phase ruleset and locate the rule whose description/name is `maintenance`. If it does not exist, stop and say so (see `agent_docs/CHECKLIST_manual_steps.md` C6).
3. `status`: report whether it is enabled. Do nothing else.
4. `on` / `off`: PATCH only that rule's `enabled` to `true` / `false`. Do not touch any other rule, and do not change the rule's expression or target.
5. Re-read the rule and confirm the new state. Report it in one line, plus a reminder that my home IP bypass is separate (WAF skip rule).

For `on`, state that the site will show the maintenance page to everyone except bypassed IPs. Never create or delete rules from this command.
