# Database virtualization relation bootstrap correction handoff

## Goal

Restore cold rendering of saved relation-filter values after the zero-distance spacer correction without regressing Database table borders/radii or reopening shared virtualization architecture.

## Confirmed current behavior and evidence

- Exact-head GitHub E2E at `63a984a85c8f3a4c3b75eea9be122ea64691c963` fails `tests/e2e/databaseViewsAndQueryFlows.spec.ts` → `applies string, boolean, and relation filters and persists them after reload` on the initial attempt and both retries.
- After reload filtering behavior remains correct; only the persisted related value text is missing from the Filters Sheet.
- The same scenario passed on PR head `1c1a3789ef66cc950eba543566502aec8567f3ec`, before `d3c81c27805316a8ebd46e53c96137520e6d14a4` made zero-distance spacer DOM conditional.
- `DatabaseDataTable` currently treats spacer presence as only `leadingSize/trailingSize > 0`.
- `useVirtualCollection` also yields zero leading/trailing sizes when `items` is empty, so an unresolved non-empty collection and a resolved logical boundary currently collapse to the same observable spacer state.

## Non-goals

- Do not change filter persistence/query semantics, relation data, worker/service/storage, or inline-edit behavior.
- Do not reopen the deferred heterogeneous-content Chrome jank follow-up.
- Do not redesign `useVirtualCollection`, TanStack ownership, surface-offset geometry, or shared `MDTable`.

## Affected user scenarios

- Reload a Database with persisted string, boolean, and relation filters; the relation filter's selected related value is rendered in the Filters Sheet.
- Initial/top-left and logical-end Database table boundaries retain the corrected border/radius behavior with no settled zero-distance spacer DOM.
- Existing nested relation roots continue to mount bounded row/property ranges and scroll independently.

## Boundaries

- Primary correction owner: `src/entities/databaseData/DatabaseDataTable.vue`.
- Product regression proof: `tests/e2e/databaseViewsAndQueryFlows.spec.ts`.
- Existing structural protection: `tests/e2e/databaseVirtualizationFlows.spec.ts`.
- If focused reproduction shows the cause is outside Database table bootstrap and requires a widget/shared/public-contract change, stop and return to architecture.

## Ownership matrix

- feature: unchanged.
- entity: `databaseData` owns native-table virtual rendering and bootstrap behavior.
- widget: unchanged unless evidence disproves entity ownership; do not patch around the defect here.
- page/pane: unchanged.
- shared: unchanged.
- service/worker: unchanged.

## Source of truth

- Logical rows/properties remain the existing Database entity inputs.
- TanStack through `useVirtualCollection` remains the sole range, measurement, size-cache, and scroll-correction engine.
- Bootstrap lifecycle must be derived from existing source length and current virtual items; do not create an independent persisted range fact.

## State shape

No new persistent state. It is acceptable to derive an ephemeral `non-empty source + no mounted virtual items yet` bootstrap condition independently for rows and columns if focused reproduction confirms this cause.

## Public API / entry points

No public API change.

## Minimum sufficient design

- Distinguish unresolved non-empty virtual collections from settled logical boundaries.
- Provide only the minimum presentation-only native-table bootstrap structure needed for a non-empty unresolved collection to obtain its first TanStack range.
- Once virtual items exist, steady-state spacer DOM is controlled only by actual positive leading/trailing virtual distance, preserving the zero-distance spacer correction.
- Any bootstrap-only structure must be `aria-hidden`, must not become a second geometry/range owner, and must disappear when the real range is available.

Behavior intentionally deferred: heterogeneous-content Chromium jank remains separate.

## Rejected approaches

- Restore unconditional zero-distance spacers permanently: regresses native-table structural borders/radii.
- Add sleeps, retries, delayed remounts, force updates, or timeout-based recovery.
- Add an independent range/measurement/bootstrap manager or stored lifecycle flag.
- Change shared `MDTable` for this Database-only regression.
- Expand `useVirtualCollection` or TanStack configuration without evidence that the entity-local minimum solution is insufficient.
- Patch only `DatabaseRelationValueInline` with arbitrary fixed/minimum dimensions unless focused evidence proves root sizing is the actual owner; stop for architecture first in that case.

## Shared UI blast radius

None. Shared UI must remain unchanged.

## Acceptance matrix

- Cold persisted relation-filter render: selected related value text appears after reload.
- Filter semantics: expected row remains visible; string/boolean/relation mismatches remain filtered out.
- Bootstrap: non-empty nested table obtains non-zero mounted row/property work without retry recovery.
- Settled logical start/end: zero-distance spacer DOM is absent.
- Interior/deep range: non-zero spacers remain correct and bounded work remains intact.

## Risk matrix

- Native-table structural CSS regression: protect settled start/end spacer absence.
- Nested auto-sized scroll-root bootstrap: prove with the existing failing product E2E.
- Virtualization ownership drift: no second range/measurement state.
- Shared blast radius: none allowed.

## Required test proof

- Primary product proof: existing `tests/e2e/databaseViewsAndQueryFlows.spec.ts` relation-filter persistence scenario.
- Additional structural proof: existing `tests/e2e/databaseVirtualizationFlows.spec.ts` start/interior/end spacer-boundary and nested-root scenarios; update only if the bootstrap contract otherwise lacks durable direct coverage.
- Type-check for touched Vue/TS contracts.
- No new visual baseline is required for this narrow correction; operator visual acceptance of the existing Database surface remains a separate merge gate.

## Required verification

Use verifier-managed focused checks only. Exact-head GitHub CI remains architect-owned.

## Forbidden

- Shared `MDTable` changes.
- `useVirtualCollection`/TanStack API redesign or second virtualization state engine.
- Widget/page/service/worker/storage/query changes without stopping for architecture.
- Sleeps, retries, timeout inflation, force-remount/recovery loops, weakened assertions, flaky acceptance.
- Direct Playwright/Vite/browser commands or historical Git/worktree orchestration.
- Repository-wide final verification as a coding-agent handoff requirement.

## Implementation readiness

- Product and architecture decisions resolved: yes.
- Dependencies/inputs/worker boundaries explicit: yes.
- Unresolved blockers: exact root cause must be confirmed by the existing focused failing scenario before production edits; if it disproves the entity-local bootstrap hypothesis, implementation must stop rather than broaden scope.
- Verdict: ready for focused diagnosis and entity-local correction only.
