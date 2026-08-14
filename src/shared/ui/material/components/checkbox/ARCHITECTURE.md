# Checkbox architecture

Artifact revision: 2026-08-14T11:46:35.000Z
Status: ready
DESIGN.md reference: `src/shared/ui/material/components/checkbox/DESIGN.md`
Renderer: `@m3e/web@2.7.4`
Revision summary: Revalidated the installed 2.7.4 Checkbox renderer boundary. M3E-005 remains an explicit native-label accessible-name divergence; no public API or renderer mapping changed.
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

`checked` and `indeterminate` remain the only state sources of truth; rejected intent must not mutate renderer state.

The current official Material Checkbox snapshot does not provide a reliable Checkbox-specific key mapping. Its only keyboard table is explicitly recorded in `DESIGN.md` as a source conflict because every row uses Chips terminology, including chip groups, input-chip deletion, and chip navigation. No corrected Checkbox keyboard table is published in the inspected official sources.

Therefore Enter is not selected as a required public Checkbox behavior. The adapter must not invent an Enter workaround from the corrupted table. Existing keyboard operability through the renderer's Space path remains supported and proved, but architecture does not claim that the corrupted table establishes a broader Space-or-Enter contract.

## Ownership

The Material family owns the Vue adapter, controlled intent, host boundary, presentation behavior, exports, and family proof. Consumers retain business/domain state and actions. `MDCheckboxField` remains a separate shared-field composition owner. m3e remains private.

## Renderer mapping

Current m3e covers the selected public state surface and current pointer/Space interaction. No Enter correction is required from current official-source evidence.

`M3E-005` remains the adjacent-label accessible-name divergence in installed `2.7.4`; fresh real-browser external-label proof confirms an empty accessible name, so explicit ARIA naming remains the current backstop.

## Host boundary

Forward only merged class/style plus `id`, `title`, `data-*`, `aria-label`, and `aria-labelledby`. Do not expose renderer-specific state, attributes, events, or types.

## TEST IMPACT

- `MDCheckbox.test.ts`: controlled adapter contract.
- `MDCheckbox.browser.spec.ts`: real pointer/Space interaction, rejected intent, disabled/presentation behavior, focus/label behavior including M3E-005, and absence of an invented Enter toggle.
- visual spec: appearance only.
- consumer tests: consumer-owned state translation and composition.

## Acceptance criteria

- current pointer/Space interaction remains exactly-once and controlled;
- Enter is not promoted to a custom toggle without corrected official Checkbox evidence;
- rejected intent leaves rendered state controlled by props;
- disabled/presentation suppress independent interaction;
- no new abstraction or public API is introduced;
- current consumer semantics remain preserved;
- exact-head PR CI passes before merge.

## Forbidden

Do not derive public Material semantics from renderer behavior, deprecated implementation libraries, or unrelated accessibility patterns. Do not add an Enter workaround from the corrupted Chips table. Do not add duplicate state, generic keyboard infrastructure, unrelated public API, consumer ownership changes, or visual-baseline changes without a visible change.
