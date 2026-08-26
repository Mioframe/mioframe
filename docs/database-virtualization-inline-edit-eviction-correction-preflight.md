# Database virtualization inline-edit eviction correction preflight

Status: **ready**.

Authoring source: `docs/database-virtualization-inline-edit-eviction-correction-handoff.md` plus active `src/widgets/DocumentView/Database/REVIEW.md`.

## Goal and non-goals

Implement only the inline-edit virtual-eviction lifecycle correction. The Google Drive type lockfile update is operator-approved and is not a finding. Do not perform dependency cleanup in this pass.

## Confirmed implementation

- `EditableInlineValue.vue` imports `onBeforeUnmount`, tracks `isCancellationRequested`, and commits an open editor during component teardown.
- `isCancellationRequested` is used only to suppress that teardown commit after explicit cancellation.
- Explicit commit paths already exist through Enter and `MDOverlayTooltip` `interaction-outside`.
- Explicit cancel paths already exist through Escape and `update:show=false`.
- `databaseInlineValueEdit` already owns the lifted draft/session across virtual remounts; no feature API change is needed.
- Existing `tests/e2e/databaseVirtualizationFlows.spec.ts` owns the vertical/horizontal eviction product scenario and is already mapped from `EditableInlineValue.vue`.

## Owners and entry points

- mounted interaction surface: `src/widgets/DocumentView/Database/EditableInlineValue.vue`;
- deterministic component contract: `src/widgets/DocumentView/Database/EditableInlineValue.test.ts`;
- product proof: `tests/e2e/databaseVirtualizationFlows.spec.ts`;
- lifted session/persistence owner: `src/features/databaseInlineValueEdit/` unchanged.

## Minimum implementation

Expected production change:

`src/widgets/DocumentView/Database/EditableInlineValue.vue`

- remove `onBeforeUnmount` import and hook;
- remove `isCancellationRequested` local ref;
- remove assignments to that flag from request/cancel handlers;
- leave explicit `commitEditor` and `cancelEditor` routes otherwise unchanged.

Expected proof changes:

`src/widgets/DocumentView/Database/EditableInlineValue.test.ts`

- replace the current `commits an active editor on unmount unless cancellation was requested` contract;
- prove an active editor can unmount without emitting either `commitEdit` or `cancelEdit`;
- keep existing explicit Enter/Escape/outside/close wiring proof intact.

`tests/e2e/databaseVirtualizationFlows.spec.ts`

Strengthen only the existing virtual-eviction scenario:

- after vertical eviction and return, assert the editor field is visible and has the exact vertical draft;
- press Escape;
- assert the editor closes and the original persisted first-label value is visible;
- open again with a distinct horizontal draft;
- after horizontal eviction and return, assert the editor field is visible and has the exact horizontal draft;
- press Escape;
- assert the editor closes and the same original persisted value is visible.

This distinguishes true lifted-session survival from eviction-triggered persistence. Do not add a duplicate scenario or reload-based persistence protocol unless the existing flow proves insufficient.

## Removed logic

Completely remove the generic-unmount commit hook and the now-unneeded cancellation bookkeeping. Do not replace either with another teardown discriminator.

## TEST IMPACT

- Contract/scenario: mounted virtual cell teardown does not resolve the feature-owned edit session.
  - Primary proof owner: `EditableInlineValue.test.ts` component contract for no teardown event.
  - Additional proof: existing `databaseVirtualizationFlows.spec.ts` product scenario for real vertical/horizontal eviction/remount and explicit cancel.
  - Existing proof: explicit commit/cancel wiring tests plus existing view/configuration resolution product scenarios.
  - New/updated proof: update one unit contract and strengthen the existing eviction scenario only.
  - Risk/platform matrix: real application scrolling/virtual remount on the existing `both` virtualization spec; no new visual/accessibility/geometry contract.
  - Durable ownership/impact updates: none; existing E2E mapping already selects the virtualization spec from `EditableInlineValue.vue`.

## Pass order

1. remove unmount-resolution behavior and obsolete local state;
2. update component contract;
3. strengthen existing product eviction proof;
4. run focused unit verification;
5. run focused E2E through the changed production source and inspect the resolved spec/project plan;
6. run cumulative `pnpm verify --base origin/develop`; retry/flaky is failure.

## Verification commands

Use verifier-managed commands directly:

```bash
pnpm verify --only unit-tests --files src/widgets/DocumentView/Database/EditableInlineValue.vue src/widgets/DocumentView/Database/EditableInlineValue.test.ts
pnpm verify --only e2e --files src/widgets/DocumentView/Database/EditableInlineValue.vue
pnpm verify --base origin/develop
```

The focused E2E source mapping may select the existing Database item + virtualization specs. Do not narrow the verifier to bypass its durable mapping.

If implementation reveals that generic unmount must persist for a confirmed user scenario, or requires feature/session API changes, stop and report the exact repository evidence instead of inventing a teardown protocol.

## Forbidden

- editing any `REVIEW.md`, this preflight/handoff, canonical architecture/results docs, or PR metadata;
- touching `pnpm-lock.yaml` or dependency versions;
- changing feature/session/entity writer APIs;
- changing virtualization geometry/range/Table/Relation code;
- adding teardown flags/discriminators/managers/hooks;
- changing explicit commit/cancel semantics;
- new E2E scenario when the existing one can own the proof;
- assertion weakening, timeout inflation, sleeps, force, retries-as-success;
- unrelated cleanup.

Verdict: **ready**.
