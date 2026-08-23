# Database virtualization performance diagnostic preflight

Status: **superseded; do not execute**.

This preflight belonged to the now-superseded current-head Short view -> Full view diagnostic.

Manual Chrome testing exposed additional in-scope product regressions:

- remaining freeze on Short -> Full;
- perceptible freezes/jank during table scrolling;
- broken table border/corner-radius appearance.

The previous preflight covered only S0/G1 switch timing and prohibited production correction, so it is no longer a complete implementation contract.

Do not create `tests/e2e/diagnostics/databaseVirtualizationPerformance.spec.ts` from this document and do not run the old switch-only pass as the next PR step.

The replacement architecture/correction preflight must cover, together:

1. root-to-surface geometry refresh ownership and avoidance of virtual-range-update hot-path layout reads;
2. Short -> Full responsiveness;
3. representative steady-state vertical and horizontal scrolling responsiveness;
4. preservation of pre-virtualization table borders and corner radii despite spacer DOM;
5. bounded mounted rows/properties/cells and existing correctness/accessibility behavior.

Browser proof must use repository verifier commands. Coding agents must not use historical checkout/worktree/bisect orchestration or direct Playwright/Vite/browser commands.
