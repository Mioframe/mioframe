# Checkbox review

Verdict: compliant
Required return family: none
Required return stage: none
Completion status: complete
Operator visual status: no-reported-defect
Blockers: none
Major issues: none
Minor issues: none
Accepted risks: none

## Goal and scenarios reviewed

The complete canonical Checkbox family and all confirmed consumers were reviewed. Ownership remains explicit:

- `MDCheckbox` owns the Material Vue adapter and controlled intent boundary;
- `MDCheckboxField` owns shared field composition and tri-state edit behavior;
- product/entity/widget consumers retain business state and actions;
- decorative consumers use `presentation`;
- m3e remains a private renderer detail.

## Official source compliance

The authoritative Checkbox design evidence comes from the official Material sources represented by the MCP/cache snapshot and normalized in `DESIGN.md`.

The Checkbox accessibility cache contains a keyboard table whose every row refers to Chips: enabled chip or chip group, focused chip, input-chip deletion, and chip arrow navigation. The same table is present in the Chips accessibility source, where those terms and behaviors are coherent and are reinforced by additional Chips-specific guidance.

`DESIGN.md` correctly records this as a source conflict. The `Space or Enter` row is therefore not reliable Checkbox-specific evidence. No inspected official Checkbox source supplies a corrected keyboard table.

Architecture correctly refuses to invent an Enter toggle from that corrupted source. No renderer or deprecated implementation library is used as semantic authority.

## Architecture compliance

Compliant:

- public API is limited to confirmed Mioframe demand;
- controlled state remains one-directional from `checked` / `indeterminate` props;
- current pointer/Space interaction uses the renderer's pre-mutation intent boundary;
- Enter is not promoted to wrapper-owned behavior without trustworthy official evidence;
- no generic adapter or keyboard framework is introduced;
- renderer types/events/state do not leak through the public boundary.

## Implementation compliance

Compliant. `MDCheckbox.vue` already satisfies the corrected architecture; no production correction is required.

The adapter prevents renderer mutation at the cancelable `beforeinput` boundary and emits intended next controlled values. Rejected intent cannot leave renderer state divergent from public props. Presentation and disabled behavior retain their existing ownership.

## Migration and legacy removal

Compliant. All confirmed consumers use canonical `MDCheckbox` directly or through `MDCheckboxField`; the replaced legacy owner and replaced proof remain removed.

`BooleanValueInline` retains the correct effective-value translation:

```ts
checked = effectiveValue === true;
indeterminate = property.indeterminate === true && effectiveValue === undefined;
```

The pre-existing accessible-name gap in `RelationValueFieldData.vue` remains a separate product follow-up and is not a regression introduced by this migration.

## Proof

Existing proof remains correctly partitioned:

- unit/component contract for public controlled semantics;
- real-browser proof for pointer/Space, focus, label, suppression, rejected intent, and owner handoff;
- visual proof for appearance only;
- consumer-owned tests for tri-state/domain translation.

No proof change is required solely because the corrupted official keyboard table was rejected as Checkbox-specific evidence.

## Items not required

- Enter workaround;
- generic keyboard manager or generic m3e adapter framework;
- legacy `error`, `readonly`, tooltip, form-participation, or icon-configuration surface;
- compatibility alias for the removed legacy Checkbox;
- `RelationValueFieldData.vue` accessible-name product decision;
- visual-baseline updates without a visible change.

## Merge handoff

Family review is complete. Exact-head GitHub CI and full resulting-PR review remain the architect-owned merge gate.
