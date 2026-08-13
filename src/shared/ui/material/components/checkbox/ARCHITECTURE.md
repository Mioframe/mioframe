# Checkbox architecture

Status: ready
DESIGN.md reference: `src/shared/ui/material/components/checkbox/DESIGN.md`
Renderer revision: @m3e/web@2.6.3
Revision summary: Official Material is the public semantic authority. Checkbox guidance publishes Space or Enter activation. Current m3e handles Space but not Enter, so Enter is a renderer gap to adapt rather than a public behavior to remove.
Remaining blockers: none
Required return family: none
Required return stage: none
Implementation readiness: ready
Dependency families: none
Dependency queue: none

## Goal

Keep one canonical `MDCheckbox` under `@shared/ui/material`, backed privately by `m3e-checkbox`, and satisfy the selected official Material Checkbox contract for current Mioframe scenarios.

## Non-goals

No generic adapter/keyboard framework, new public variants, form API, tooltip API, component-token surface, or consumer ownership changes are required.

## Current scenarios

- editable labeled field through `MDCheckboxField`;
- standalone relation selection in `RelationValueFieldData`;
- decorative selection indicators in settings/database-view rows;
- decorative read-only boolean display in `BooleanValueInline`;
- Storybook consumer fixture.

Legacy Checkbox ownership is already removed.

## Selected and deferred Material surface

Selected: checked, indeterminate, disabled, pointer activation, Space activation, Enter activation, accessible naming through supported host ARIA attributes, renderer-owned Material appearance, and Mioframe `presentation` composition.

Deferred: error/invalid API, native form participation, component-specific public tokens, and parent/child group orchestration.

`DESIGN.md` records a source-quality defect in the published keyboard table because other cells use chip terminology. The same official table still publishes `Space or Enter` for activation and no official correction removes Enter. Under project policy, official Material semantics take precedence over renderer quirks and legacy implementation.

## Dependency closure

Dependency families: none.

## Ownership

Checkbox family owns public Vue semantics, controlled intent, host boundary, presentation behavior, renderer-gap corrections, exports, and family proof. Consumers retain business/domain state and actions. m3e remains a private renderer.

## Public Vue API

Props: `checked`, `indeterminate`, `disabled`, `presentation` (all boolean, default false).

Emits: `update:checked(value: boolean)` and `update:indeterminate(value: boolean)`.

One accepted activation produces one next-value intent pair: checked toggles and indeterminate becomes false. The controlling consumer remains authoritative; rejected intent leaves rendered state unchanged.

Host forwarding remains limited to merged class/style plus `id`, `title`, `data-*`, `aria-label`, and `aria-labelledby`.

## Public token contract

No Checkbox-specific public component token is selected.

## Renderer mapping and gaps

Current m3e directly covers renderer properties, pointer activation, Space activation, role, geometry, and Material visual states.

`M3E-005` remains the adjacent-label accessible-name gap; explicit ARIA naming is the current backstop.

Enter is a second renderer gap for the selected contract: installed `@m3e/web@2.6.3` does not activate Checkbox on Enter. Mioframe must add the minimum family-local correction so Enter produces the same controlled public intent as other activation paths. Revalidate and remove that correction if a future renderer version implements Enter natively.

## State precedence and restoration

`presentation` suppresses independent interaction; `disabled` suppresses selection intent; `checked` and `indeterminate` remain the only rendered-state sources of truth. Pointer, Space, and Enter must all preserve the same accepted/rejected controlled-state contract and one action must never emit duplicate intent.

## Implementation passes

1. Preserve the existing one-host adapter, host allow-list, presentation behavior, and controlled pointer/Space path.
2. Add only the family-local Enter correction required by official Material, with disabled/presentation suppression and no second state owner.
3. Replace the real-browser Enter-no-op proof with exactly-once Enter activation proof and rejected-intent coverage.
4. Keep existing proof unchanged where behavior is unaffected.
5. Record the version-scoped renderer gap and run focused verification.

## TEST IMPACT

`MDCheckbox.test.ts` owns non-browser controlled adapter contracts. `MDCheckbox.browser.spec.ts` owns real pointer/Space/Enter behavior and must prove accepted/rejected Enter intent plus suppression. Visual proof should not change unless appearance changes.

## Migration plan

No consumer edit is expected solely from Enter support. After implementation, rerun migration fresh to confirm current canonical consumers, legacy removal, `MDCheckboxField` ownership, and `BooleanValueInline` effective-value translation remain correct.

## Acceptance criteria

- Official Material defines public Checkbox keyboard behavior.
- Pointer, Space, and Enter each activate exactly once.
- Rejected intent remains controlled by unchanged props.
- Disabled/presentation suppress Enter appropriately.
- No new abstraction or public surface is added.
- Focused proof and corrected exact-head PR CI pass.

## Risks

A future renderer may add native Enter handling, requiring removal of the workaround to avoid duplicate intent. A later official correction to the source-quality-affected keyboard table requires a DESIGN refresh first.

## Forbidden

Do not treat renderer behavior as public authority when it conflicts with selected official Material; do not add duplicate state, generic keyboard infrastructure, unrelated API, consumer changes, or visual-baseline updates without an actual visible change.

## Implementation readiness

`ready`. The required correction is limited to family-local Enter activation and its focused proof/documented renderer gap.
