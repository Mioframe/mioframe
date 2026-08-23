# Database virtualization performance diagnostic preflight

Status: **ready**.

Authoring source: `docs/database-virtualization-performance-attribution-handoff.md`, `src/entities/databaseData/REVIEW.md`, `docs/database-virtualization-profiling.md`, and `docs/database-virtualization-production-results.md`.

## Goal

Collect canonical current-head S0/G1 performance evidence through the existing verifier-managed E2E lane, without historical Git orchestration or production changes.

## Expected tracked changes

None at handoff.

A temporary nested diagnostic spec may exist during measurement and must be deleted before completion.

## Pass order

### Pass 1 — prepare one temporary nested spec

Use:

`tests/e2e/diagnostics/databaseVirtualizationPerformance.spec.ts`

Do not add a root `tests/e2e/*.spec.ts` entry and do not edit `scripts/lib/e2eProjectApplicability.ts` or `scripts/lib/e2eRisk.ts` for this temporary proof.

Reuse existing E2E helpers where practical. Keep the temporary test self-contained enough that deleting it removes the entire diagnostic surface.

Required cases:

- S0: 100 rows × 8 properties, 3 samples;
- G1: 30,000 rows × 300 properties, 3 samples.

For every sample:

- fresh browser context/test isolation;
- 640×480 viewport;
- real JSON import and real Short view -> Full view user action;
- deterministic sparse data equivalent to seed `pr-217-production-v1`;
- MessageChannel yield;
- first `requestAnimationFrame`;
- switch-to-usable;
- Long Task count/max/total;
- mounted rows / property headers / expensive cells;
- full logical metadata correctness;
- deep final row/property/value sentinel correctness.

The diagnostic must exclude setup/import/build time from `switchToUsable`.

If the verifier also collects Mobile Chrome for an unregistered nested spec, the temporary spec may explicitly skip its performance cases for non-`chromium` projects. Do not change durable applicability metadata for this diagnostic.

### Pass 2 — run only through verify

Required command:

```bash
pnpm verify --only e2e --files tests/e2e/diagnostics/databaseVirtualizationPerformance.spec.ts
```

Do not substitute:

- `pnpm exec playwright`;
- direct Playwright CLI;
- direct Vite build/preview;
- manual Chromium launch;
- shell environment overrides selecting different verifier behavior.

The verifier owns the production build/preview, browser execution, sandbox/container policy, and command lifecycle.

### Pass 3 — classify current-head evidence

Classify:

- `slowdown reproduced` when the verifier-managed current-head samples again show material usable delay and repeated >100 ms switch-associated Long Tasks;
- `slowdown not reproduced` when the verifier-managed samples remain near the retained fast envelope and do not show repeated >100 ms Long Tasks;
- `ambiguous` when sample variance prevents a reliable conclusion.

Do not compare by running historical refs. Historical data is context only.

Do not identify or fix a production root cause in this pass.

### Pass 4 — cleanup

Delete the temporary diagnostic spec.

Confirm:

- no temporary diagnostic files remain tracked or untracked in the task scope;
- no production/test metadata was changed;
- no Git worktree or alternate checkout was created;
- active branch/ref was never moved.

## TEST IMPACT

- Contract/scenario: Database Short view -> Full view responsiveness on the current production implementation.
  - Primary proof owner: temporary verifier-managed application-E2E diagnostic.
  - Existing evidence: retained historical S0/G1 measurements and the later non-verifier slow current-geometry measurement.
  - New proof: current-head S0×3 + G1×3 through `pnpm verify --only e2e`.
  - Persistent proof changes: none.
  - Durable ownership updates: architect-owned after evaluating the report.

## Stop conditions

Stop without production edits when:

- the focused verifier command cannot execute the temporary nested spec;
- the diagnostic cannot use the real product switch faithfully;
- the six samples cannot be collected without changing verifier or durable E2E ownership;
- results are ambiguous;
- a production fix appears obvious but has not been separately architected.

Do not work around a verifier limitation with manual Git/Playwright/Vite orchestration. Report the limitation instead.

## Required report

Report:

- exact current head;
- exact verifier command;
- S0×3 raw samples;
- G1×3 raw samples;
- classification;
- mounted/correctness result per sample;
- whether the temporary spec was removed;
- whether tracked diagnostic files remain.

Final exact-head GitHub CI remains architect-owned and is outside this diagnostic pass.
