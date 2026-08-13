# Mioframe Material migration roadmap

This file is the only owner of current Material milestone status, family-stage status, technical blockers, latest pilot result, and next operator action. Durable workflow rules live in the other canonical documents.

## Current state

Last updated: 2026-08-12

Current milestone: `M3 — sequential component migration (checkbox correction)`

Status: `complete`

The Checkbox family's `BooleanValueInline.vue` tri-state mapping regression is corrected. The boolean property's `indeterminate` capability flag is no longer passed directly to canonical `MDCheckbox.indeterminate`; `BooleanValueInline.vue` now derives `checked`/`indeterminate` locally from the existing resolved effective value:

```text
checked = effectiveValue === true
indeterminate = property.indeterminate === true && effectiveValue === undefined
```

`true` and `false` render as normal checked/unchecked states even when the property supports indeterminate values, matching legacy observable behavior. Consumer-level proof (`BooleanValueInline.test.ts`) covers `true`, `false`, `undefined` (with and without a resolved default), and both indeterminate-capability states.

All five Checkbox family artifacts (`DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, `REVIEW.md`) were regenerated through their normal owning stages with real current-UTC artifact revisions, resolving the previously-recorded future-timestamp mechanical-invalidity defect. `REVIEW.md` verdict is `compliant-with-listed-risks` (the only accepted risk is the separately-tracked, pre-existing `RelationValueFieldData.vue` accessible-name gap below — unrelated to this correction).

Current family state for merge-readiness purposes:

```text
DESIGN.md          current
ARCHITECTURE.md    ready
IMPLEMENTATION.md  complete
MIGRATION.md       complete
REVIEW.md          compliant-with-listed-risks
```

The ordinary final `pnpm verify` gate passed (11/11 checks, including the targeted mutation audit over `BooleanValueInline.vue`/`SettingsCheckboxListItem.vue`/`SettingsSections.vue`) on the current workspace head. Branch synchronization with `develop` and GitHub merge gates remain external, human/CI-owned steps outside this workflow's scope.

## Calibration result

Switch established the stateful Material adapter invariants now recorded in the canonical rules:

1. a public controlled prop is the sole state source of truth;
2. renderer mutation is prevented at the cancelable pre-mutation intent boundary when such a boundary exists;
3. rejected controlled intent cannot leave renderer state divergent from the public prop;
4. ordinary component-owned browser proof uses owner-local ownership when the current testing migration state supports it;
5. renderer-specific non-browser test shims stay at the narrowest truthful owner;
6. decorative `presentation` composition proves both child suppression and positive input handoff to the real action owner;
7. independent review rechecks current renderer lifecycle, proof ownership, test-environment blast radius, composition ownership, and consumer behavior rather than trusting family prose;
8. repository-root Playwright lanes respect repository ignore policy.

No generic m3e adapter framework, duplicate state manager, compatibility layer, or renderer registry abstraction is justified by the completed pilots.

## Milestones

| ID  | Milestone                           | Status        | Exit gate                                                                       |
| --- | ----------------------------------- | ------------- | ------------------------------------------------------------------------------- |
| M0  | workflow architecture and rules     | `complete`    | coherent staged workflow and corrected calibration invariants                   |
| M1a | Loading Indicator dependency family | `complete`    | current artifacts and compliant review                                          |
| M1  | Button action family                | `complete`    | canonical m3e-backed action component migrated and merged                       |
| M2  | Switch stateful pilot               | `complete`    | family workflow completed without unresolved family findings                    |
| M3  | sequential component migration      | `in-progress` | individual family completion does not complete the sequential migration program |

M3 is an ongoing migration phase. Completing Checkbox will complete the Checkbox family only; M3 continues until the Material migration program is explicitly closed or the remaining legacy families are explicitly classified outside migration scope.

## Known non-blocking follow-up

`RelationValueFieldData.vue` still has the pre-existing accessible-name gap on its standalone relation-selection checkbox. The Checkbox migration must not pretend this was fixed. It is not a blocker for behavior-preserving migration, but it remains an explicit product accessibility follow-up until a correct contextual label is selected and proven.

## Next operator action

1. Synchronize the Checkbox branch with current `develop` (external prerequisite, not performed by this workflow) and confirm the same `pnpm verify` result on the synchronized head.
2. Require ordinary GitHub merge gates before integration into `develop` (not performed by this workflow).
3. Select the next M3 family only after the above two steps are confirmed on the final merge candidate.
