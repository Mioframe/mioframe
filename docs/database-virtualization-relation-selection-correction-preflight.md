# Database virtualization relation-selection correction preflight

Status: **ready**.

Authoring source: `docs/database-virtualization-relation-selection-correction-handoff.md` plus the active `src/features/relationValueEdit/REVIEW.md` finding.

## Goal and non-goals

Implement only the relation-selection component-boundary correction. Do not work on the separate inline-edit eviction or lockfile findings in this pass.

## Confirmed current implementation

- `RelationValueFieldData.vue` receives `onSelect` as a prop and invokes it from `onUpdateSelectedValue()`.
- `DatabasePropertyValueField.vue` receives `onSelect` from `RelationValueField`'s `data` scoped slot and passes it down as `:on-select`.
- `RelationValueFieldData.test.ts` covers loading/table mounting but does not prove the selection interaction contract.
- Existing E2E impact mapping already maps `RelationValueFieldData.vue` and `DatabasePropertyValueField.vue` to the required Database product specs; no mapping change is needed for this correction.

## Owners and entry points

- mutation owner: `src/features/relationValueEdit/RelationValueField.vue` existing relation update path;
- child interaction API: `src/features/relationValueEdit/RelationValueFieldData.vue`;
- composition seam: `src/widgets/DocumentView/Database/DatabasePropertyValueField.vue`.

No state or persistence owner changes.

## Minimum implementation

Expected production changes:

1. `src/features/relationValueEdit/RelationValueFieldData.vue`
   - remove the `onSelect` prop;
   - add typed `select: [itemId: DatabaseItemId]` emit;
   - make the existing checkbox handler emit that event.
2. `src/widgets/DocumentView/Database/DatabasePropertyValueField.vue`
   - replace the `:on-select="onSelect"` component prop with `@select="onSelect"`.
3. `src/features/relationValueEdit/RelationValueFieldData.test.ts`
   - stop supplying the removed prop;
   - make the checkbox stub capable of emitting `update:checked` through an observable user interaction;
   - assert one interaction produces exactly one `select` event with the expected item id.

Do not change `RelationValueField.vue` unless required solely for a mechanical compile/type adjustment. The simplest viable implementation is the three-file change above.

## Removed logic

The function-valued `onSelect` prop and `props.onSelect(...)` invocation must be completely removed from `RelationValueFieldData`.

## TEST IMPACT

- Contract/scenario: relation-row selection crosses the child component boundary as a typed upward event while preserving the existing feature-owned mutation.
  - Primary proof owner: `src/features/relationValueEdit/RelationValueFieldData.test.ts` component contract.
  - Additional proof: existing application E2E selected by source-impact mapping for `RelationValueFieldData.vue` and `DatabasePropertyValueField.vue`.
  - Existing proof: current relation/Database application scenarios and existing E2E mapping in `scripts/lib/e2eRisk.ts`.
  - New/updated proof: add a focused emitted-payload assertion to `RelationValueFieldData.test.ts`; do not add a duplicate product scenario.
  - Risk/platform matrix: non-browser component wiring plus existing desktop Database/relation application coverage; no new geometry/mobile/visual contract.
  - Durable ownership/impact updates: none expected; existing mappings already cover the changed production sources.

## Pass order

1. implement the child emit and composition wiring;
2. update the focused component contract test;
3. run focused unit verification;
4. run focused E2E verification for the changed production sources and inspect the resolved plan/results;
5. run `pnpm verify --base origin/develop` and require a clean pass with no flaky/retry classification.

## Verification commands

Use verifier-managed commands directly:

```bash
pnpm verify --only unit-tests --files src/features/relationValueEdit/RelationValueFieldData.vue src/features/relationValueEdit/RelationValueFieldData.test.ts src/widgets/DocumentView/Database/DatabasePropertyValueField.vue
pnpm verify --only e2e --files src/features/relationValueEdit/RelationValueFieldData.vue src/widgets/DocumentView/Database/DatabasePropertyValueField.vue
pnpm verify --base origin/develop
```

If focused verification exposes a failure outside this resolved correction contract, stop and report the exact evidence instead of expanding ownership.

## Forbidden

- editing `REVIEW.md`, this preflight, the handoff, canonical virtualization docs, or PR metadata;
- touching `EditableInlineValue`, `databaseInlineValueEdit`, `pnpm-lock.yaml`, shared virtualization, `DatabaseDataTable`, relation query/persistence/view behavior, or E2E mappings without new contradictory repository evidence;
- callback-prop compatibility shims;
- new abstraction/state;
- weakening assertions, changing expected relation values/order, sleeps, retries, timeout inflation, or `force`.

Verdict: **ready**.
