# Responsiveness audit: UI Polish, Model Picker and Header

Evidence names refer to `agent_docs/qa/ui-polish-picker-header/baseline/<route>-<width>-<theme>-<plan>.png`.
Status is exactly one of `open`, `fixed`, `no issue`, `wontfix`.

| width    | element                   | symptom                                                                                                                | fix                                                  | status |
| -------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------ |
| 360-768  | Feature dropdown (header) | Vanishes at mobile and tablet widths. Evidence: `create-390-light-free.png`, `create-768-light-free.png`               | Phase 4: FeatureSelect in the header at every width  | open   |
| 700-1440 | Header tabs               | Tabs are left-shifted instead of centred. Evidence: `create-1024-light-free.png`                                       | Phase 4: tabs moved into the header, centred in free space        | open   |
| 360-390  | Feature name              | Truncated to "AI I..." in the header. Evidence: `create-360-light-free.png`                                            | Phase 4: FeatureSelect sizing and truncation rules   | open   |
| 360-1440 | Model picker row          | Title and description text fuse together. Evidence: `picker-390-light-free.png`                                        | Phase 6 (T6.3): row layout fix                       | open   |
| 640-767  | Header tabs               | No tabs between 640 and 767. Evidence: `create-700-light-free.png`                                                     | Phase 4: tabs shown from the header breakpoint       | open   |
| all      | DashboardShell height     | Shell uses 60px while the header is 64px. Evidence: `create-1024-light-free.png`                                       | Phase 5: single header height variable and dvh shell | open   |
| 700      | 640 split band            | Check the 700px band for the unchanged 640 split. Evidence: `create-700-light-free.png`                                | Phase 1: shared breakpoint constants; verify at 700  | open   |
| 360-390  | Keyboard open             | Check the composer stays on screen with the on-screen keyboard open. Evidence: `create-360-light-free.png`             | Phase 5: dvh shell; verify in P5 E2E                 | open   |
| 600      | `Header/Logo.vue`         | Still switches size at 600px, outside the 768/1024 consolidation; decide in P11. Evidence: `create-700-light-free.png` | Decide in P11                                        | open   |
