# Review

Verdict: blocked by an invalid fixed surface-offset assumption in `RelationValueFieldData`; correction is deferred until the active top-level surface discriminator resolves ownership.

## Scope reviewed

- PR #217 dynamic surface-offset correction at code head `5c1feb51102c8923fb23370de099e62e482b65d5`.
- `RelationValueField.vue` local scroll root `.relation-value-field__data`.
- `RelationValueFieldData.vue` loading/progress and `DatabaseDataTable` composition.

## Blocker — fixed zero offset is not always truthful

`RelationValueFieldData` passes `verticalSurfaceOffset=0` and `horizontalSurfaceOffset=0` to `DatabaseDataTable`.

Horizontal zero is consistent with the current unpadded local root. Vertical zero is not unconditional: while `isLoading && !propertiesIdList`, `RelationValueFieldData` renders `MDCircularProgressIndicator` before `DatabaseDataTable` in the same `.relation-value-field__data` scroll root. The table therefore has real preceding content and its root-to-table vertical surface offset is non-zero during that state.

This violates the accepted ownership contract: a caller may pass zero only when its DOM topology proves the collection surface is the first unpadded content of that root.

## Required final state

Use the minimum feature-local correction that makes the zero-offset invariant true. Prefer mutually exclusive loading/table rendering if existing product behavior does not require an empty virtualized table to remain mounted while relation properties are unavailable.

Do not add another bounding observer or geometry state to this feature merely to preserve simultaneous spinner+empty-table rendering unless a confirmed product requirement requires that composition.

## Pass ordering

This is a separate confirmed blocker, but do **not** combine its production correction with the active shared deep-state discriminator. First resolve the discriminator in:

- `docs/database-virtualization-deep-state-surface-offset-discriminator-handoff.md`
- `docs/database-virtualization-deep-state-surface-offset-discriminator-preflight.md`

After the top-level surface owner is resolved, correct this feature invariant in a narrow follow-up pass.

## Verification after its correction

- focused relation-value / Database virtualization product proof through the verifier;
- persisted relation-filter scenario remains green;
- final `pnpm verify --base origin/develop` passes cleanly;
- exact-head CI remains required.

## Forbidden

- restoring entity-owned ancestor/sibling observation;
- feature-local MutationObserver/rAF/per-scroll geometry tracking;
- hard-coded non-zero spinner height as `surfaceOffset`;
- shared virtualization changes;
- weakening virtualization/relation E2E assertions.
