# Review

Verdict: blocked

## Scope reviewed

- `MDTable.vue` current native-table border, radius, sticky-header, and cell-divider styling.
- The Database virtualization consumer, including zero-distance spacer omission and transient bootstrap structure.
- PR #217 operator visual result: the real Database table still has incorrect rounded outer corners after the Database spacer corrections.
- Current shared-UI proof ownership: `src/shared/ui/Table` has no owner-local browser/visual spec; unmigrated shared-UI visual changes remain protected by the verifier's full visual fallback plus product/operator proof.

## Blockers

### B1 — MDTable has multiple competing owners for one outer frame

Owner: `src/shared/ui/Table`

Problem: `MDTable` does not have one coherent outer-border model. The table root first declares `border: var(--md-table-border)` and then disables it with `border: 0`. Side borders are recreated for every `tbody`/`tfoot` row using an absolutely positioned `tr::after`. Bottom radii are then assigned independently to the last section, every row pseudo-element in that last section, the last row, and the first/last cells. Top radii are separately assigned through first-section/first-row selectors. In particular, `tbody:last-child tr::after` matches the pseudo-element of every row in the last section rather than only the final row. The resulting frame is structurally coupled to row/section DOM and does not render the required rounded outline reliably in the real Database consumer.

Evidence:

- [`MDTable.vue`](./MDTable.vue) — root `border` is overwritten by `border: 0`; `tbody, tfoot tr::after` owns per-row side borders; first/last section, row, pseudo-element, and cell selectors all participate in corner rendering.
- [`DatabaseDataTable.vue`](../../../entities/databaseData/DatabaseDataTable.vue) — the consumer does not draw its own outer frame/radii; Database-specific CSS only removes border/padding from virtual spacer cells and owns sticky action behavior.
- [`docs/database-virtualization.md`](../../../../docs/database-virtualization.md) — PR #217 requires normal native-table border/corner presentation and previously allowed a shared `MDTable` change only after a concrete shared defect was established. Operator inspection now establishes that defect.

Basis:

- [`shared-ui-implementation`](../../../../.agents/skills/shared-ui-implementation/SKILL.md) — shared presentation primitives must use explicit native DOM ownership, keep styling tied to the actual hierarchy, preserve consumer blast radius, and prefer the minimum complete implementation without obsolete parallel paths.
- [`AGENTS.md`](../../../../AGENTS.md) — prefer the minimum complete design and remove parallel/replaced logic; shared UI changes require consumer/blast-radius review.

Risk: the visible outer border and corner radii depend on incidental table-section/row structure and virtual spacer placement. This already fails operator acceptance in PR #217, and further virtualization/layout changes can continue to perturb the frame even when Database geometry is correct.

Required final state: `MDTable` must have one simple, native-table-compatible outer-frame model. Remove the row pseudo-element border system and the overlapping radius ownership. The outer outline and corner cells should be derived from normal table/row/cell structure with the fewest selectors necessary. Internal row dividers remain cell-owned. The solution must stay generic and must not encode Database spacer classes or product behavior.

Verification:

- add/preserve the smallest truthful isolated `MDTable` fixture/story needed to inspect ordinary `thead + tbody`, multiple rows, and rounded first/last corners without product bootstrap;
- verifier-managed shared visual fallback must pass for the shared-UI change;
- `tests/e2e/databaseVirtualizationFlows.spec.ts` must remain green so virtualization structure and sticky behavior are preserved;
- operator must recheck the real Database table at logical start/end and horizontal/vertical deep states;
- final `pnpm verify --base origin/develop` must pass before coding handoff.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Reworking Database virtualization geometry, TanStack integration, value rendering, worker/query/storage, or deferred Chromium heterogeneous-content performance.
- Migrating the entire shared-UI visual test architecture solely for `MDTable`; use the currently executable Storybook/verifier ownership model.

## Unresolved questions

- The exact minimal CSS shape must be confirmed in-browser because sticky header/action behavior and native table painting are browser-owned presentation details. Architecture requires one frame owner and no row pseudo-element system; it does not require a specific selector spelling before browser proof.
