# Phase 0 builder (this attempt)

T0.1: PASS (sanity). claude plugins list shows project scope enabled; PLAN T0.1-plugin line present (line 311).
T0.2: FAIL. `claude mcp list`: both Dodo MCPs now Connected (auth fixed). But the phase-builder toolset (`tools: Read, Edit, Write, Bash, Glob, Grep, Agent, Skill` in ~/.claude/agents/phase-builder.md) has no Dodo MCP tools, so docs-query and products cannot be run. Updated T0.2-mcp-list to Connected; docs-query/products remain NOT RUN.
Unblock: pre-flight 3a - add the Dodo MCP tool names (see /mcp) to tools: in ~/.claude/agents/phase-builder.md (agent definitions load at session start, so restart the session), re-run /build-phases.
T0.3, T0.4 not started (depend on T0.2).
