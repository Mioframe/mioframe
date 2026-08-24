# Review

Verdict: blocked by an invalid fixed surface-offset assumption in `RelationValueFieldData`; correction is now implementation-ready in the PR #217 virtualization completion pass.

Active completion contract:

- `docs/database-virtualization-completion-pass-handoff.md`
- `docs/database-virtualization-completion-pass-preflight.md`

## Scope reviewed

- `RelationValueField.vue` local scroll root `.relation-value-field__data`.
- `RelationValueFieldData.vue` loading/progress and `DatabaseDataTable` composition.
- Accepted shared deep-state surface-offset capability and current explicit-root ownership direction.

## Blocker — fixed zero offset is not always truthful

`RelationValueFieldData` passes `verticalSurfaceOffset=0` and `horizontalSurfaceOffset=0` to `DatabaseDataTable`.

Horizontal zero is consistent with the current unpadded local root. Vertical zero is not unconditional: while `isLoading && !propertiesIdList`, `RelationValueFieldData` renders `MDCircularProgressIndicator` before `DatabaseDataTable` in the same `.relation-value-field__data` scroll root. The table therefore has real preceding content and its root-to-table vertical surface offset is non-zero during that state.

## Required final state

Use the minimum feature-local correction:

- when `isLoading && !propertiesIdList`, render only the existing progress indicator;
- mount `DatabaseDataTable` only in the complementary state;
- retain explicit `verticalSurfaceOffset=0` and `horizontalSurfaceOffset=0` because, whenever the table then exists, it is the first unpadded content of the local root.

Do not add bounding observation, geometry state, or a hard-coded spinner offset.

## Required proof

Use the lowest faithful feature/component contract to prove loading/table mutual exclusion; add an owner-local test only if no existing proof owns that contract. Keep relevant nested relation/database E2E green.

## Merge condition

This blocker is resolved only when the invariant is truthful in production, focused proof is green, cumulative branch verification passes, and exact-head CI remains green.

## Forbidden

- restoring entity-owned ancestor/sibling observation;
- feature-local MutationObserver/rAF/per-scroll geometry tracking;
- hard-coded non-zero spinner height as `surfaceOffset`;
- shared virtualization changes;
- weakening virtualization/relation E2E assertions.
