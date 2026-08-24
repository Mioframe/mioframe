# Review

Verdict: blocked

## Scope reviewed

- PR #217 current Database virtualization/native-table integration.
- Accepted bounded-DOM/deep-correctness evidence.
- Completed heterogeneous Chromium attribution.
- Current spacer DOM against shared `MDTable` structural styling.

## Blockers

### B1 — Zero-distance virtual spacers break the Database table's logical visual boundary

Owner: `src/entities/databaseData`

Problem: `DatabaseDataTable` always renders leading/trailing row and column spacer elements, including when their virtual size is `0`. `MDTable` derives outer corners and bottom-edge behavior from physical first/last table structure, so zero-size presentation spacers become the structural boundary instead of the real logical row/cell. Operator testing confirms broken borders and corner radii.

Evidence:

- [`DatabaseDataTable.vue`](./DatabaseDataTable.vue) — leading/trailing `<col>`, `<th>`, `<td>`, and row-spacer `<tr>` elements are rendered unconditionally from virtual sizes.
- [`../../shared/ui/Table/MDTable.vue`](../../shared/ui/Table/MDTable.vue) — outer corner/bottom styling uses physical `first-child` / `last-child` structure.
- [`../../../docs/database-virtualization-integration-correction-handoff.md`](../../../docs/database-virtualization-integration-correction-handoff.md) — ready minimum correction contract.
- Operator manual testing reports visibly broken table border/radius appearance.

Basis:

- [`../../../AGENTS.md`](../../../AGENTS.md) — preserve existing visible behavior, prefer the minimum complete local solution, and control shared-UI blast radius.
- [`../../../docs/database-virtualization.md`](../../../docs/database-virtualization.md) — spacer DOM belongs to `databaseData`; shared `MDTable` remains generic.

Risk: merging #217 leaves an ordinary Database table visibly regressed and makes presentation-only spacer DOM part of the visible boundary contract.

Required final state: render each leading/trailing spacer only when its corresponding virtual distance is greater than zero. Real logical rows/cells regain the physical table boundary at logical start/end. Keep non-zero spacer geometry, bounded virtualization, sticky/action/no-action paths, ARIA semantics, dynamic sizing, relations, and editing unchanged. Do not change shared `MDTable`.

Verification: update `tests/e2e/databaseVirtualizationFlows.spec.ts` to prove zero-distance spacers are absent at logical boundaries and non-zero spacers remain in interior virtual ranges for representative top-level and relation/no-action paths. Operator verifies the real application's border/radius appearance before merge.

## Known follow-up risk — not required for PR #217

Residual heterogeneous-content Chromium jank remains real but is intentionally deferred to a separate PR.

Evidence retained in [`../../../docs/database-chrome-jank-follow-up.md`](../../../docs/database-chrome-jank-follow-up.md):

- all-string verifier control is fast and bounded;
- Number isolation reproduces ~631–636 ms switches with repeated 241–244 ms Long Tasks;
- vertical scrolling has intermittent >100 ms Long Tasks;
- horizontal scrolling was clean in the diagnostic;
- Firefox was better in operator testing;
- production root-cause owner remains unresolved.

Do not continue String-vs-Number attribution or add speculative performance changes in #217.

## Major issues

None.

## Minor issues

None.

## Accepted risks

- Residual Chromium heterogeneous-table jank is accepted only as a tracked follow-up risk for #217, not as resolved behavior. It must remain documented for the next performance PR.

## Items not required

- Equal-density String-vs-Number attribution in #217.
- Number-specific UI optimization.
- Geometry ownership changes.
- Replacing TanStack or rewriting `useVirtualCollection`.
- Worker/query/storage redesign, paging, indexes, or caches.
- Shared `MDTable` changes.
- New Storybook/product bootstrap solely for visual screenshots.
- Historical checkout/worktree/bisect orchestration.

## Merge condition

After B1 is resolved, the real table appearance is operator-accepted, existing structural/product proof remains intact, and exact-head GitHub CI is green, this review has no remaining semantic blocker for PR #217. Residual Chrome jank proceeds separately.
