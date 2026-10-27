Phase 0 builder report

- T0.1/T0.2: sanity-checked; T0.1-plugin and T0.2-\* lines present in PLAN (lines 311-317).
- T0.3: grep -cE '^T0\.3-item[1-6]:' PLAN = 6; grep -cE '^[[:space:]]+Answer \(T0\.3\):' SPEC = 11; each of Q1-11 followed by exactly one indented Answer line; Q12-14 have none. No formatting fixes needed.
- T0.4: added `T0.4-gate: PASS` under "### Gate results" in PLAN (line 327) citing T0.3-item1 / adaptive-currency doc. No products created, no API calls.
- Dashboard: T0.3, T0.4 task_started/task_built logged (note: T0.3 started was logged after T0.4 started due to a shell quoting slip; T0.3 first log attempts errored harmlessly).
