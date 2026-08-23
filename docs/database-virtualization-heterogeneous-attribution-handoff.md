# Database virtualization heterogeneous attribution handoff

Status: **ready**.

## Goal

Identify the smallest heterogeneous Database render path that reproduces the current Chrome switch/scroll jank before any production correction.

## Confirmed evidence

- Sparse all-string current-head control is fast in verifier-managed Chromium: S0 median 281.1 ms, G1 median 321.5 ms, zero Long Tasks, bounded 12 / 8 / 96 mounted work, deep correctness pass.
- Operator testing on the same laptop reports perceptible Short -> Full delay and scrolling jank for a real heterogeneous Database in Chrome; Firefox does not show the same issue.
- Current application E2E verifier has `chromium` and `Mobile Chrome` projects only. Firefox is therefore operator evidence for this pass, not an automated project to add opportunistically.

## Scope

Attribution only. No production changes.

Use one temporary nested application-E2E diagnostic:

`tests/e2e/diagnostics/databaseVirtualizationHeterogeneousPerformance.spec.ts`

Run it only through:

```bash
pnpm verify --only e2e --files tests/e2e/diagnostics/databaseVirtualizationHeterogeneousPerformance.spec.ts
```

Skip non-desktop project execution inside the temporary diagnostic.

## Attribution order

1. Build a deterministic sparse **scalar-mixed** fixture using valid current-schema String, Number, Date, and Boolean properties while preserving the established Short -> Full flow and large logical shape.
2. Measure Short -> Full plus bounded real vertical and horizontal wheel scrolling in desktop Chromium.
3. If scalar-mixed reproduces repeated material main-thread blocking, narrow by replacing the mixed non-control properties with one scalar type at a time until the first reproducing render path is identified.
4. If scalar-mixed does not reproduce, test a separate **relation** fixture with one representative non-empty relation property and bounded nested content. Do not repeat relation properties across hundreds of columns.
5. Stop when either a smallest reproducing render path is established or the verifier fixture still cannot reproduce the operator-observed Chrome defect.

The accepted all-string result is the control; do not rerun the complete historical matrix.

## Measurements

For each measured variant record:

- fixture property mix and logical shape;
- Short -> Full event-loop yield, first rAF, switch-to-usable, Long Task count/max/total;
- a fixed vertical wheel sequence: Long Task count/max/total plus mounted-work result;
- a fixed horizontal wheel sequence: Long Task count/max/total plus mounted-work result;
- mounted outer rows / property headers / expensive cells;
- deep row/property/value correctness.

Use the existing 100 ms Long Task research target. Do not invent a new wall-clock acceptance threshold for scrolling.

## Decision

Return one result:

- `scalar path identified` + the smallest reproducing scalar type;
- `relation path identified`;
- `heterogeneous mix reproduced but not isolated`;
- `not reproduced in verifier`;
- `ambiguous`.

Do not select or implement a production fix in this pass.

## Constraints

- no Git checkout/worktree/bisect/reset/rebase/cherry-pick;
- no direct Playwright/Vite/browser commands;
- no verifier/config/project changes to add Firefox;
- no production instrumentation or test-only production seams;
- no geometry/TanStack/worker/query/storage/Material changes;
- no retries, sleeps, timeout inflation, force, or repeat-until-pass;
- remove the temporary diagnostic before handoff.

The separate border/corner-radius blocker is outside this attribution pass.
