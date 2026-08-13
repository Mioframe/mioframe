# Checkbox review

Verdict: blocked
Required return family: self
Required return stage: implementation
Completion status: blocked
Final workflow verification readiness: blocked
Operator visual status: no-reported-defect
Blockers: Corrected architecture now selects official Material Space/Enter activation, but current `MDCheckbox.vue` and browser proof still implement/assert Enter as a no-op. Implementation and focused proof must be corrected before migration/review can complete.
Major issues: none
Minor issues: none
Accepted risks: none

## Goal and scenarios reviewed

The complete canonical Checkbox family and all confirmed consumers were reviewed. Existing ownership remains sound: `MDCheckbox` is the Material adapter; `MDCheckboxField` retains shared field composition and tri-state edit behavior; product/entity/widget consumers retain business state and actions; decorative consumers use `presentation`.

The remaining finding is limited to the canonical editable Checkbox keyboard contract.

## Official design compliance

`DESIGN.md` records the published Checkbox accessibility keyboard table with `Space` or `Enter` activation. The same table contains copied chip terminology and is correctly recorded as a source-quality conflict, but there is no official correction that removes Enter.

Official Material is the public semantic authority. Current `ARCHITECTURE.md` now correctly selects Enter activation and classifies current m3e behavior as missing renderer coverage rather than public Mioframe semantics.

## Architecture compliance

Current `ARCHITECTURE.md` is now compliant with the selected official contract:

- pointer, Space, and Enter are selected activation paths;
- m3e remains a private renderer;
- Enter is missing renderer coverage in `@m3e/web@2.6.3` and requires the minimum family-local correction;
- public API, controlled state, ownership, tokens, and consumers remain unchanged;
- no generic keyboard/adapter abstraction is justified.

No architecture blocker remains.

## Implementation compliance

Blocked.

Current `MDCheckbox.vue` correctly implements controlled pointer/Space intent through cancelable pre-mutation `beforeinput`, but it has no family-owned Enter correction. Current `MDCheckbox.browser.spec.ts` explicitly asserts that Enter produces no effect.

Implementation must add the minimum Enter path required by current architecture while preserving one source of truth, rejected-intent behavior, disabled/presentation suppression, host boundary, and renderer privacy.

## Migration and legacy removal

No consumer/legacy-removal defect is currently known. All confirmed consumers already use canonical `MDCheckbox` directly or through `MDCheckboxField`; the replaced legacy owner remains removed; `BooleanValueInline` retains the correct capability-flag-to-rendered-state translation.

Migration is marked blocked only because it must execute fresh after implementation changes.

## Proof and stage verification

Required corrected proof:

- pointer activation still produces one controlled intent;
- Space still produces one controlled intent;
- Enter produces one controlled intent and accepted state round-trips;
- rejected Enter intent leaves rendered state unchanged;
- disabled/presentation suppress independent Enter activation.

Existing accessibility, label, tab-order, presentation handoff, target-area, host-boundary, and visual proof should remain unless actual behavior changes.

Previous exact-head CI predates the corrected target state. A new exact-head CI run is required after code/proof correction.

## Blockers

1. Implement the architecture-selected Enter activation correction.
2. Replace obsolete Enter-no-op proof with faithful real-browser accepted/rejected/suppressed Enter proof.
3. Run fresh migration and independent review, then exact-head GitHub CI.

## Major issues

none

## Minor issues

none

## Accepted risks

none

## Items not required

- Do not restore legacy `error`, `readonly`, tooltip, form-participation, or icon-configuration surface.
- Do not add a generic keyboard manager or generic m3e adapter framework.
- Do not create a new `M3E-*` record for merely missing Enter capability; current registry policy keeps missing capability in family architecture.
- Do not change `RelationValueFieldData.vue` accessible naming in this correction.
- Do not update visual baselines without an actual inspected appearance change.

## Routing evidence

```text
official Material contract: Space or Enter
corrected architecture: pointer + Space + Enter
current implementation: pointer + Space; Enter no-op
```

The earliest unresolved owner is now `self/implementation`. After implementation correction, migration and independent review must execute fresh.
