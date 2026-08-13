# Checkbox architecture

Status: ready
DESIGN.md reference: `src/shared/ui/material/components/checkbox/DESIGN.md`
Renderer: `@m3e/web@2.6.3`
Remaining blockers: none
Required return family: none
Required return stage: none
Implementation readiness: ready
Dependency families: none

## Goal

Keep one canonical controlled `MDCheckbox` under `@shared/ui/material`, backed privately by `m3e-checkbox`, for the confirmed Mioframe Checkbox scenarios.

## Selected contract

Public props: `checked`, `indeterminate`, `disabled`, `presentation`.

Public emits: `update:checked(value: boolean)` and `update:indeterminate(value: boolean)`.

Selected interaction: pointer and Space activation. `checked` and `indeterminate` remain the only state sources of truth; rejected intent must not mutate renderer state.

Enter is intentionally not selected. The `DESIGN.md` source table that says `Space or Enter` is internally corrupted: the same table describes chips, chip groups, input-chip deletion, and chip navigation. It is not reliable Checkbox-specific keyboard evidence. Checkbox semantics use Space activation, consistent with the standard Checkbox interaction model and Google's Material Web Checkbox using a native checkbox input without a custom Enter toggle.

## Ownership

The Material family owns the Vue adapter, controlled intent, host boundary, presentation behavior, exports, and family proof. Consumers retain business/domain state and actions. `MDCheckboxField` remains a separate shared-field composition owner. m3e remains private.

## Renderer mapping

Current m3e covers the selected pointer/Space interaction and renderer state. No Enter workaround is required.

`M3E-005` remains the adjacent-label accessible-name divergence; explicit ARIA naming is the current backstop.

## Host boundary

Forward only merged class/style plus `id`, `title`, `data-*`, `aria-label`, and `aria-labelledby`. Do not expose renderer-specific state, attributes, events, or types.

## TEST IMPACT

- `MDCheckbox.test.ts`: controlled adapter contract.
- `MDCheckbox.browser.spec.ts`: real pointer/Space interaction, rejected intent, disabled/presentation behavior, focus/label behavior, and no custom Enter toggle.
- visual spec: appearance only.
- consumer tests: consumer-owned state translation and composition.

## Acceptance criteria

- pointer and Space activate exactly once;
- Enter does not add a non-native Checkbox toggle;
- rejected intent leaves rendered state controlled by props;
- disabled/presentation suppress independent interaction;
- no new abstraction or public API is introduced;
- current consumer semantics remain preserved;
- exact-head PR CI passes before merge.

## Forbidden

Do not add an Enter workaround without corrected Checkbox-specific Material evidence. Do not add duplicate state, generic keyboard infrastructure, unrelated public API, consumer ownership changes, or visual-baseline changes without a visible change.
