# Database virtualization performance diagnostic preflight

Status: **superseded — completed; do not execute again**.

The sparse all-string current-head diagnostic owned by this preflight completed successfully through the verifier and did not reproduce the reported general slowdown.

Accepted result:

- S0 median usable 281.1 ms;
- G1 median usable 321.5 ms;
- zero Long Tasks in all six samples;
- mounted 12 rows / 8 headers / 96 expensive cells;
- deep correctness passed;
- temporary diagnostic spec removed.

This completed pass is now only the fast all-string control.

Manual testing subsequently established a different failing class: a real Database with heterogeneous property types janks in Chrome during Short -> Full and scrolling, while Firefox on the same laptop does not show the same issue. The old all-string pass must not be repeated as the next task.

The active next architecture requirement is type-sensitive browser attribution using one deterministic heterogeneous fixture in Chrome and Firefox, with the all-string case retained as control. Attribution must cover both view switching and sustained vertical/horizontal scrolling and must narrow the failing property/render path before any production correction owner is selected.

Required browser diagnostics continue to run through repository `pnpm verify` surfaces. Coding-agent historical checkout/worktree/bisect and direct Playwright/Vite/browser orchestration remain forbidden.
