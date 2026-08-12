# Mioframe Material migration roadmap

This file is the only owner of current Material milestone status, family-stage status, technical blockers, latest pilot result, and next operator action. Durable workflow rules live in the other canonical documents.

## Current state

Last updated: 2026-08-12

Current milestone: `M3 — sequential component migration (checkbox correction)`

Status: `blocked`

The Checkbox family has a complete initial implementation and consumer migration, but it is **not currently complete or merge-ready**. Independent architecture review after the first family workflow found a product-behavior regression in `BooleanValueInline.vue`: the boolean property's `indeterminate` capability flag is passed directly to canonical `MDCheckbox.indeterminate`, which represents the current rendered mixed state. Legacy behavior rendered mixed only when the effective boolean value was actually `undefined` and indeterminate values were enabled.

The required mapping is:

```text
checked = effectiveValue === true
indeterminate = property.indeterminate === true && effectiveValue === undefined
```

where `effectiveValue` is the existing resolved value after the property's default fallback. `true` and `false` must therefore remain normal checked/unchecked states even when the property supports indeterminate values.

The same review also found that several Checkbox family artifact revisions were recorded as future UTC timestamps relative to the actual execution time. Those revisions cannot be treated as factual durable workflow identities. `docs/component-workflow.md` now requires artifact/contract revisions to use the runtime UTC clock at the actual write and makes future factual execution/source-check timestamps mechanically invalid. The Checkbox family artifact chain must therefore be regenerated through the normal owning stages; stage-owned artifacts must not be manually patched around the workflow.

Previous focused checks and the previous outer `pnpm verify` run passed for the then-current workspace, but they no longer prove family completion because the behavior regression and invalid workflow metadata were discovered afterward.

Current family state for merge-readiness purposes:

```text
DESIGN.md          requires workflow timestamp revalidation
ARCHITECTURE.md    correction required for BooleanValueInline mapping
IMPLEMENTATION.md  invalidated by architecture correction
MIGRATION.md       invalidated by architecture/implementation correction
REVIEW.md          must run fresh after corrected upstream artifacts
```

Branch synchronization with the latest `develop` is an external workspace prerequisite and must be rechecked before final verification. Do not claim synchronization, current release metadata, or current testing-migration ownership until that check has actually completed on the final branch head.

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

1. Synchronize the Checkbox branch with current `develop` and preserve the current testing-migration ownership state and release metadata.
2. Route Checkbox back through architecture for the `BooleanValueInline` tri-state mapping correction; the workflow must also regenerate any mechanically invalid future-timestamp artifacts using real current UTC revisions.
3. Execute the invalidated implementation, migration, and independent review stages normally.
4. Add consumer-level proof covering `true`, `false`, `undefined`, and default-fallback behavior when indeterminate values are enabled or disabled.
5. Run the ordinary final `pnpm verify` gate on the final synchronized head, then require ordinary GitHub merge gates before integration into `develop`.

Do not select the next M3 family until the Checkbox family is current, independently reviewed, and verified on the final merge candidate.
