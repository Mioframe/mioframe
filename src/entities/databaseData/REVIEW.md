# Review

Verdict: Database ownership correction accepted; merge remains blocked by one feature-owned relation-value surface-offset case plus final CI/operator gates.

## Scope reviewed

- PR #217 complete Database virtualization/native-table integration through code head `5c1feb51102c8923fb23370de099e62e482b65d5`.
- Dynamic surface-offset correction replacing entity-owned ancestor/sibling discovery.
- Shared same-root dynamic `surfaceOffset` capability proof.
- Existing Database virtualization and relation persistence proof reported green locally by the coding agent.

## Resolved — Database dynamic surface ownership

The top-level physical `.database-view` root and preceding composition are owned by `DatabaseViewWidget`. The correction now measures root-to-`DatabaseViewLayout` geometry there and forwards explicit vertical/horizontal offsets through `DatabaseViewLayout` to `DatabaseDataTable`.

`DatabaseDataTable` no longer owns root/table `useElementBounding`, root `MutationObserver`, `onUpdated` geometry refresh, or table-ref ancestor/sibling discovery. It consumes explicit offsets and forwards them to the existing row/property `useVirtualCollection` instances.

This restores the intended boundary: widget owns composition/layout facts; entity owns Database table rendering; shared virtualization forwards geometry; TanStack owns range/measurement/cache/scroll correction.

## Resolved — shared dynamic surfaceOffset capability

The shared browser proof now changes `surfaceOffset` from 240px to 96px on the same mounted root/list and proves deep logical/geometry correctness again. `useVirtualCollection.ts` remains unchanged. No `virtualizer.measure()` or cache-reset protocol is required.

## Blocker — relationValueEdit passes an untruthful fixed zero during loading

Owner: [`src/features/relationValueEdit`](../../features/relationValueEdit/REVIEW.md).

`RelationValueFieldData` passes `verticalSurfaceOffset=0`, but while `isLoading && !propertiesIdList` it renders `MDCircularProgressIndicator` before `DatabaseDataTable` in the same `.relation-value-field__data` scroll root. The table therefore has preceding content and vertical zero is false during that state.

Do not fix this by restoring entity discovery. The narrow feature owner must make its explicit zero invariant truthful, preferably by not mounting the table concurrently with the loading-only progress state unless product behavior requires that composition.

## Preserved contracts

The correction does not change shared virtualization production code, query/storage/value ownership, settled spacer rules, transient cold bootstrap, native table structure, or deferred Chromium heterogeneous-content performance scope.

## Verification required after the feature correction

- focused relation-value / Database virtualization proof;
- persisted relation-filter scenario remains green;
- `pnpm verify --base origin/develop` clean;
- exact-head GitHub CI green;
- operator Database border/corner/sticky reinspection clean.

## Merge condition

Do not merge until the feature-owned zero-offset blocker is fixed, branch verification and exact-head CI are green, operator presentation reinspection is clean, and final resulting-PR review has no blockers.
