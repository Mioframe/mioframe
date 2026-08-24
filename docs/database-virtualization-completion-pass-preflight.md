# Database virtualization completion pass preflight

Authoring source: `docs/database-virtualization-completion-pass-handoff.md`.

## Goal / non-goals

Close the two implementation-ready virtualization blockers and collect the required top-level numeric diagnosis. Do not investigate residual non-virtualization jank or change shared virtualization/MDTable architecture.

## Owners / entry points

- Pass A diagnosis: `src/widgets/DocumentView/Database/DatabaseViewWidget.vue` + `tests/e2e/databaseVirtualizationFlows.spec.ts`.
- Pass B relation loading: `src/features/relationValueEdit/RelationValueFieldData.vue`.
- Pass C stacking: `src/entities/databaseData/DatabaseDataTable.vue` + existing virtualization E2E.

## Pass order

### A. Moving-surface diagnosis

1. Follow `docs/database-virtualization-widget-surface-offset-diagnosis-preflight.md`.
2. Add only temporary instrumentation needed to compare supplied vs current physical offsets at all five checkpoints.
3. Run focused moving-surface E2E normally; if it does not reproduce, run that focused verifier check with `--profile github-actions`.
4. Obtain at most one coherent failing trace. A retry-pass is not success evidence.
5. Remove all temporary instrumentation.
6. Record one result: `widget-offset-mismatch`, `offsets-truthful-product-still-fails`, or `not-reproduced` with the complete observed trace.
7. Do not implement a moving-surface production correction in this pass.

Passes B/C are independent and may continue after A.

### B. Relation local-root invariant

1. Change `RelationValueFieldData` so `isLoading && !propertiesIdList` renders only the progress indicator.
2. Mount `DatabaseDataTable` only in the complementary state; retain explicit `0/0` offsets.
3. Add/extend the lowest faithful component proof. If no owner-local contract test exists, add `RelationValueFieldData.test.ts` with the Database table stubbed and `useDatabaseProperties` controlled to prove loading-only vs table-mounted states. Do not test geometry in happy-dom.
4. Rerun the existing relation/database product lane relevant to nested relation virtualization/persistence.

### C. Sticky action/header stacking

1. Keep `position: sticky; right: 0` on action cells.
2. Put body action cells below shared `thead` (`z-index: 1`) while retaining their overlay over ordinary body cells. Prefer the minimum local z-index change; no new stacking abstraction.
3. Keep the header action cell above sibling header cells within the header stacking context.
4. Extend the existing `retains dynamic row sizing, sticky native-table surfaces, and measured property width` product E2E (or the nearest existing sticky owner) to scroll both axes and prove real hit-testing/stacking:
   - at a body/right-edge point, the sticky action cell is the top body surface;
   - at a header/right-edge overlap point, the topmost hit belongs to `thead`, specifically the action header intersection where applicable;
   - ordinary header cells remain above body action cells across the sticky header band.
5. Do not assert only computed z-index values; the contract is actual browser stacking.

## TEST IMPACT

- Scenario: top-level moving surface
  - Primary proof: `tests/e2e/databaseVirtualizationFlows.spec.ts`.
  - Change: temporary diagnosis only; final stable test remains product-observable.
  - Risk: desktop Chromium / CI profile.

- Scenario: relation loading offset invariant
  - Primary proof: feature component contract (`RelationValueFieldData.test.ts` if missing).
  - Additional proof: existing relation/database E2E.
  - Change: spinner/table mutual exclusion.

- Scenario: sticky action/header stacking
  - Primary proof: application E2E using real browser hit-testing under combined scroll.
  - Existing owner: sticky native-table virtualization scenario in `tests/e2e/databaseVirtualizationFlows.spec.ts`.
  - Risk: desktop + Mobile Chrome selected by verifier.

## Expected production files

- `src/features/relationValueEdit/RelationValueFieldData.vue`
- `src/entities/databaseData/DatabaseDataTable.vue`

Diagnostic temporary edit only:

- `src/widgets/DocumentView/Database/DatabaseViewWidget.vue`

Expected proof files:

- `tests/e2e/databaseVirtualizationFlows.spec.ts`
- `src/features/relationValueEdit/RelationValueFieldData.test.ts` only if required by missing owner-local proof.

## Required removal

- all Pass A temporary diagnostic instrumentation before handoff;
- no old/fallback geometry mechanism may be introduced;
- no obsolete body-action z-index rule that still places body cells above the header plane.

## Focused verification

Use verifier-managed commands only. Suitable focused runs include:

- `pnpm verify --only e2e --files tests/e2e/databaseVirtualizationFlows.spec.ts`
- same focused E2E with `--profile github-actions` only for Pass A diagnosis when needed;
- `pnpm verify --only unit-tests --files src/features/relationValueEdit/RelationValueFieldData.vue src/features/relationValueEdit/RelationValueFieldData.test.ts`
- `pnpm verify --only e2e --files tests/e2e/databaseViewsAndQueryFlows.spec.ts`
- applicable format/eslint/oxlint/type-check via verifier.

## Final gate

After temporary diagnosis code is removed and B/C are complete:

`pnpm verify --base origin/develop`

If a PR-caused in-contract failure is found and remains within Pass B/C accepted ownership, fix narrowly, focused-verify, then rerun the complete branch gate. If the failure requires the unresolved moving-surface architecture, report it instead of inventing a fix.

## Forbidden

Production moving-surface correction in this pass; shared virtualization/TanStack edits; `virtualizer.measure()`; MDTable change unless local stacking is browser-proven impossible; permanent diagnostics; relation geometry observer; residual performance work; sleeps/timeouts/retry-as-success; raw Playwright/Vite/browser commands; mutating Git workflow; `--profile github-actions` on final branch gate; `pnpm verify --full`.
