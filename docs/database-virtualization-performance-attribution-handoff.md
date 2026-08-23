# Database virtualization performance diagnostic handoff

Status: **superseded — completed; do not execute again**.

This record describes the completed sparse all-string current-head diagnostic for PR #217.

## Result

The verifier-managed diagnostic on production-equivalent head `1c1a3789ef66cc950eba543566502aec8567f3ec` did **not** reproduce a general slowdown.

Command used:

```bash
pnpm verify --only e2e --files tests/e2e/diagnostics/databaseVirtualizationPerformance.spec.ts
```

S0 100 × 8:

- usable 269.8 / 281.1 / 283.8 ms;
- median 281.1 ms;
- zero Long Tasks;
- mounted 12 rows / 8 headers / 96 expensive cells;
- deep correctness passed.

G1 30,000 × 300:

- usable 323.5 / 321.5 / 305.9 ms;
- median 321.5 ms;
- zero Long Tasks;
- mounted 12 / 8 / 96;
- deep correctness passed.

The temporary diagnostic spec was removed and no tracked diagnostic files remain.

## Interpretation

This result is accepted as the fast control for the deterministic sparse all-string fixture. The earlier non-verifier 1.6–2.5 s measurement is retained only as environment/protocol warning evidence, not as proof of a general current-runtime regression.

Subsequent operator testing exposed a different failing class: a real Database with heterogeneous property types still janks in Chrome during Short -> Full and scrolling, while Firefox on the same laptop does not show the same problem.

Therefore this completed diagnostic must not be rerun or expanded as the next coding task. The active requirement is the heterogeneous Chrome/Firefox attribution described in `docs/database-virtualization.md` and `src/entities/databaseData/REVIEW.md`.

## Historical workflow restriction

Do not use coding-agent historical checkout, worktree, bisect, reset, rebase, or direct Playwright/Vite/browser orchestration. Required diagnostics use repository verifier surfaces.
