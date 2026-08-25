# Review

Verdict: blocked

## Scope reviewed

- PR #217 application-E2E impact ownership for Database virtualization, inline relation editing, and the historical relation-view product scenario.
- Current `scripts/lib/e2eRisk.ts` focused-plan behavior and the existing relation-view E2E proof.

## Blockers

### B1 — Focused E2E mapping can omit inline relation-view behavior

Owner: `scripts/lib/e2eRisk.ts`

Problem: the current focused mapping selects `databaseItemFlows.spec.ts` and `databaseVirtualizationFlows.spec.ts` for the relation-value editor sources touched by PR #217, but it does not select `databaseViewsAndQueryFlows.spec.ts`. The omitted historical scenario is the only current product proof that changes a relation from the default view to a differently sorted explicit view and verifies that the rendered relation rows actually change order. A source change can therefore remain in focused mode while skipping the product contract that distinguishes selected relation-view data from unchanged default-view data.

Evidence:

- [`lib/e2eRisk.ts`](lib/e2eRisk.ts) — `database item flows` maps `src/features/relationValueEdit/` to `databaseItemFlows.spec.ts`; `database virtualized table product behavior` adds the same relation editor path plus `DatabasePropertyValueField.vue` and maps them to `databaseItemFlows.spec.ts` + `databaseVirtualizationFlows.spec.ts`, with no relation to `databaseViewsAndQueryFlows.spec.ts`.
- [`../src/features/relationValueEdit/RelationValueField.vue`](../src/features/relationValueEdit/RelationValueField.vue) — `effectiveViewId` is selected here and emitted through the `data` slot as `viewId`.
- [`../src/features/relationValueEdit/RelationValueFieldData.vue`](../src/features/relationValueEdit/RelationValueFieldData.vue) — the supplied `viewId` is forwarded to `DatabaseDataTable` and therefore owns application of the selected relation view to rendered data.
- [`../src/widgets/DocumentView/Database/DatabasePropertyValueField.vue`](../src/widgets/DocumentView/Database/DatabasePropertyValueField.vue) — composes the inline relation field and forwards its selected `viewId` into `RelationValueFieldData`.
- [`../tests/e2e/databaseViewsAndQueryFlows.spec.ts`](../tests/e2e/databaseViewsAndQueryFlows.spec.ts) — `uses default relation view inline and switches to a selected relation view` creates two target rows, a descending view, proves the default order, then selects the descending view and proves the changed rendered order.

Basis:

- [`../docs/testing/architecture.md`](../docs/testing/architecture.md) — application E2E remains centralized and stable source-to-product-scenario impact must be explicit; automatic selection must use the smallest reliable set that completely protects changed observable contracts and unknown relevant impact must fail closed rather than silently omit proof.
- [`../.agents/skills/verification/SKILL.md`](../.agents/skills/verification/SKILL.md) — application E2E impact uses explicit source-to-product-scenario ownership and retry/flaky results do not substitute for the owning proof.

Risk: a future focused change to the inline relation-view composition can break propagation/application of the selected relation `viewId` while `verify` still reports a focused green E2E lane because the only product scenario that distinguishes default-view data from selected-view data was not selected.

Required final state: add one narrow explicit source-to-product-scenario relation for `RelationValueField.vue`, `RelationValueFieldData.vue`, and `DatabasePropertyValueField.vue` to `tests/e2e/databaseViewsAndQueryFlows.spec.ts`. Preserve the existing item-flow and virtualization mappings; do not add `databaseViewsAndQueryFlows.spec.ts` to the whole virtualization scope or broaden unrelated Database sources.

Verification: extend `scripts/lib/e2eRisk.test.ts` so each of the three source owners resolves a focused plan containing `databaseItemFlows.spec.ts`, `databaseViewsAndQueryFlows.spec.ts`, and `databaseVirtualizationFlows.spec.ts`; run the focused verifier-managed unit/static checks for the resolver change and the normal branch gate before handoff. Exact-head GitHub CI remains the merge gate.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- The pre-existing `RelationValueFieldData.onSelect` callback prop is outside PR #217 correction scope by the accepted virtualization quality-correction contract.
- Residual heterogeneous Chromium Database jank remains deferred to `docs/database-chrome-jank-follow-up.md` and is not a PR #217 merge criterion.

## Unresolved questions

None.
