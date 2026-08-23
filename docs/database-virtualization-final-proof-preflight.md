# Database virtualization final proof correction preflight

Status: **ready**.

Authoring source: `docs/database-virtualization-final-proof-handoff.md` plus the four active owner-local `REVIEW.md` files.

## Scope

Expected tracked code/test changes only:

- `src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.test.ts`;
- `src/widgets/DocumentView/Database/EditableInlineValue.test.ts`;
- `tests/e2e/databaseVirtualizationFlows.spec.ts`.

No production source change is expected.

## Pass order

1. Fix the two feature-test findings: exact raw-cause identity and awaited/asserted `commit()` results.
2. Fix boolean dependency-wiring proof in `EditableInlineValue.test.ts`.
3. Remove the unused E2E destructuring only.
4. Run focused verifier-managed static/unit/mutation/E2E checks.
5. With the tracked runtime/test correction stable, run final task-specific S0/G1 production measurement using temporary measurement tooling, then remove that tooling.
6. Confirm the final working tree contains no measurement harness/artifacts intended for commit.

## TEST IMPACT

- Inline-edit error/lifecycle proof
  - Primary owner: `useDatabaseInlineEditSession.test.ts`.
  - Prove raw rejected object identity and meaningful `commit()` results.
  - Mutation target remains `useDatabaseInlineEditSession.ts`.

- Boolean activation wiring
  - Primary owner: `EditableInlineValue.test.ts`.
  - Prove persistence receives the exact mocked `toggleBoolean` return value, distinguishable from direct inversion.
  - No browser/product duplication.

- Virtualization E2E
  - Primary owner remains `databaseVirtualizationFlows.spec.ts` with current `both` applicability.
  - No scenario redesign; remove only the unused binding.

- Performance
  - Task-specific measurement, not a permanent test owner.
  - S0 and G1 only, three samples each, using the protocol in `docs/database-virtualization-profiling.md` and baseline shape in `docs/database-virtualization-production-results.md`.

## Required verifier commands

Run these through `pnpm verify`; do not substitute direct tool commands:

```bash
pnpm verify --only oxlint --files src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.test.ts src/widgets/DocumentView/Database/EditableInlineValue.test.ts tests/e2e/databaseVirtualizationFlows.spec.ts
pnpm verify --only eslint --files src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.test.ts src/widgets/DocumentView/Database/EditableInlineValue.test.ts tests/e2e/databaseVirtualizationFlows.spec.ts
pnpm verify --only unit-tests --files src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.test.ts src/widgets/DocumentView/Database/EditableInlineValue.test.ts
pnpm verify --only type-check
pnpm verify --only mutation --files src/features/databaseInlineValueEdit/useDatabaseInlineEditSession.ts src/widgets/DocumentView/Database/EditableInlineValue.vue
pnpm verify --only e2e --files tests/e2e/databaseVirtualizationFlows.spec.ts tests/e2e/databasePropertyFlows.spec.ts
```

The E2E command must complete without relying on retry-pass/flaky classification. Do not run broad `pnpm verify`, `--full`, or `verify:release` solely for handoff; final repository-wide execution remains exact-head CI owned by the architect.

## Performance execution

A permanent benchmark command is intentionally absent. Create a temporary untracked Playwright measurement spec/runner using existing fixture/import helpers and the established in-page timing protocol. It may live temporarily under the repository so local imports work, but it must be deleted before handoff and must not alter durable E2E ownership metadata.

Use production Vite build/preview, fresh Chromium contexts, one worker, retries off, 640×480 viewport, and collect six samples total: S0×3 and G1×3. Report raw values, mounted counts, correctness, browser/platform, and exact repository head measured.

Stop and report a blocker if the temporary measurement cannot faithfully reproduce the documented protocol or if S0/G1 reveals a material regression.

Final CI gate: architect-owned exact-head GitHub CI.
