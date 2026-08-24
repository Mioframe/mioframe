# Review

Verdict: implementation accepted; no remaining relation-value virtualization blocker.

## Scope reviewed

- `RelationValueField.vue` local scroll root `.relation-value-field__data`.
- `RelationValueFieldData.vue` loading/table composition.
- Explicit relation-root `verticalSurfaceOffset=0` / `horizontalSurfaceOffset=0` contract.
- Owner-local component proof and relevant relation/database E2E reported by the coding agent.

## Resolved — truthful zero-offset invariant

`RelationValueFieldData` now makes loading and table rendering mutually exclusive:

- while `isLoading && !propertiesIdList`, only the existing progress indicator is rendered;
- `DatabaseDataTable` is mounted only in the complementary state via `v-else`.

Therefore, whenever the table exists, it is the first unpadded content of the current local `.relation-value-field__data` root and explicit `0/0` offsets are truthful.

The correction adds no geometry observer, offset state, hard-coded spinner dimension, shared virtualization change, or entity ancestor/sibling discovery.

## Proof

The new owner-local component contract proves spinner/table mutual exclusion and transition to the table once the loading-only state ends. The coding agent also reports relevant relation/database E2E and cumulative `pnpm verify --base origin/develop` green.

Exact-head GitHub CI remains architect-owned final automatic proof.

## Blockers

None.

## Items not required

- top-level Database moving-surface diagnosis;
- Database sticky action/header stacking;
- residual performance/jank investigation.
