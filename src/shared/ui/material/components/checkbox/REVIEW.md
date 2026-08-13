# Checkbox review

Verdict: blocked
Required return family: self
Required return stage: architecture
Completion status: blocked
Final workflow verification readiness: blocked
Operator visual status: no-reported-defect
Blockers: The current architecture/implementation intentionally make Enter a no-op because installed m3e does not activate Checkbox on Enter, but official Material Checkbox accessibility guidance publishes Space or Enter activation. Official Material is the public semantic authority, so the family must correct architecture first and then implement/prove Enter activation.
Major issues: none
Minor issues: none
Accepted risks: none

## Goal and scenarios reviewed

The complete canonical Checkbox family and all confirmed consumers were reviewed. Existing ownership remains sound: `MDCheckbox` is the Material adapter; `MDCheckboxField` retains shared field composition and tri-state edit behavior; product/entity/widget consumers retain business state and actions; decorative consumers use `presentation`.

The finding is limited to the canonical editable Checkbox keyboard contract.

## Official design compliance

`DESIGN.md` records the published Checkbox accessibility keyboard table with `Space` or `Enter` activation. The same table contains obvious chip terminology and is correctly recorded as a source-quality conflict, but there is no official correction that removes Enter from the published Checkbox activation contract.

Project policy is to follow official Material semantics when legacy or renderer behavior differs. Therefore the public Checkbox contract must include Enter unless DESIGN is refreshed from newer official evidence that changes that rule.

## Architecture compliance

Blocked.

Current `ARCHITECTURE.md` explicitly selects renderer behavior where `KeyboardClick(..., false)` means Enter does nothing and then treats that renderer behavior as the desired public contract. That reverses the project authority boundary: m3e is private implementation detail and cannot narrow official Material behavior merely because it omits a capability.

The correction belongs to architecture because the selected public keyboard behavior and renderer-gap ownership are wrong. Architecture must select Enter activation and define the minimum family-local renderer-gap correction, with no generic adapter/keyboard abstraction.

## Implementation compliance

Blocked by architecture.

Current `MDCheckbox.vue` correctly implements controlled pointer/Space intent through cancelable pre-mutation `beforeinput`, and the one-source-of-truth/rejected-intent model remains valid. The implementation defect is that no family-owned Enter correction exists for the renderer gap.

After architecture is corrected, implementation must add only the minimum Enter activation path while preserving controlled state, disabled/presentation suppression, renderer privacy, and the existing host-attribute boundary.

## Migration and legacy removal

No migration/ownership defect found.

All confirmed consumers already use canonical `MDCheckbox` directly or through `MDCheckboxField`; the replaced legacy Checkbox owner remains removed. `BooleanValueInline` correctly distinguishes the domain indeterminate capability flag from current rendered mixed state.

A fresh migration pass is still required after implementation correction to confirm no consumer behavior regressed, but no consumer edit is currently expected solely from adding official Enter activation.

## Proof and stage verification

Existing focused proof is otherwise strong, but one browser assertion is now evidence of the defect: `MDCheckbox.browser.spec.ts` explicitly asserts that Enter produces no effect.

Required correction proof must establish in a real browser that:

- pointer activation still produces one controlled intent;
- Space still produces one controlled intent;
- Enter produces one controlled intent and accepted state round-trips correctly;
- rejected Enter intent leaves rendered state unchanged;
- disabled/presentation do not expose independent Enter activation.

Existing visual baselines do not need changes unless actual appearance changes.

The previous exact-head CI result predates this review finding and is no longer merge evidence for the corrected target state. CI must rerun after correction.

## Blockers

1. Correct Checkbox architecture so official Material Space/Enter activation is authoritative and current m3e Enter behavior is treated as a renderer gap.
2. Implement and prove the resulting Enter correction.
3. Rerun migration and independent review fresh, then require exact-head GitHub CI on the corrected head.

## Major issues

none

## Minor issues

none

## Accepted risks

none

## Items not required

- Do not restore unrelated legacy Checkbox API such as `error`, `readonly`, tooltip, form participation, or icon configuration.
- Do not add a generic keyboard manager or generic m3e adapter framework.
- Do not change `RelationValueFieldData.vue` accessible naming in this correction; it remains a separate pre-existing follow-up.
- Do not update visual baselines without an actual inspected appearance change.

## Routing evidence

Official source authority resolves the ownership unambiguously:

```text
published Material Checkbox activation: Space or Enter
current architecture: Space only / Enter no-op
current m3e 2.6.3 renderer: Space only
```

Because architecture incorrectly promoted renderer behavior into the public semantic contract, the earliest owning correction stage is `self/architecture`. After architecture correction, normal fresh downstream execution is required: implementation → migration → independent review.
