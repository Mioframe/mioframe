# Mioframe Material migration roadmap

This file is the only owner of current Material milestone status, family-stage status, technical blockers, latest pilot result, and next operator action. Durable workflow rules live in the other canonical documents.

## Current state

Last updated: 2026-08-13

Current milestone: `M3 — sequential component migration (checkbox correction)`

Status: `blocked`

The Checkbox runtime and migration corrections are complete:

- `BooleanValueInline.vue` translates the boolean property's indeterminate capability into canonical rendered state explicitly:

  ```text
  checked = effectiveValue === true
  indeterminate = property.indeterminate === true && effectiveValue === undefined
  ```

- consumer-level proof covers `true`, `false`, unresolved `undefined`, `true`/`false` property-default fallback, capability enabled/disabled, and `presentation` forwarding;
- canonical Checkbox visual proof is owner-local at `src/shared/ui/material/components/checkbox/MDCheckbox.visual.spec.ts` with colocated snapshots;
- the former central `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts` ownership is removed;
- `docs/testing/migration-plan.md` records the canonical Checkbox family's owner-local visual ownership;
- the branch is synchronized with current `develop` (`behind_by: 0`);
- `package.json` is `0.3.12`, strictly above current `develop` `0.3.11`.

The family is still blocked by workflow metadata integrity. The latest independent `REVIEW.md` records:

```text
Artifact revision: 2026-08-13T11:00:00.000Z
```

but the branch head containing that review was created at approximately `2026-08-13T07:55Z`. The review revision therefore claims a completed action in the future and is mechanically invalid under `docs/component-workflow.md`'s factual-UTC timestamp contract. A passing `pnpm verify` does not override an invalid family artifact.

This timestamp failure repeated after a prose-only future-time rule already existed, so the workflow is being hardened at two levels before Checkbox completion is accepted:

1. `material-component-review` now requires a newly-written review revision to come directly from runtime `new Date().toISOString()` output, with no local-time conversion or manual `Z` suffixing;
2. `material-component` now requires an executed post-write timestamp validation against a fresh runtime clock before any stage artifact can be accepted.

Because an LLM instruction can still be skipped, this repeated failure also requires a repository-level fail-closed validation guard in the existing unconditional `agent-environment` verification path. The guard must validate canonical Material stage artifact timestamps and must be reusable by the Material orchestrator for single-artifact post-write validation. This is workflow-integrity hardening, not a Checkbox runtime redesign.

Current family state for merge-readiness purposes:

```text
DESIGN.md          current
ARCHITECTURE.md    ready
IMPLEMENTATION.md  complete
MIGRATION.md       complete
REVIEW.md          mechanically invalid; fresh independent review required after timestamp guard hardening
```

The reported final `pnpm verify` pass is useful verification evidence for the current code and proof relocation, but family completion requires the workflow guard and a mechanically valid current review first. After that review is regenerated, the final `pnpm verify` must be run again on the exact resulting head because both verifier code and the review artifact change the merge candidate.

## Calibration result

Switch and Checkbox established the durable stateful Material adapter invariants now recorded in the canonical rules:

1. a public controlled prop is the sole state source of truth;
2. renderer mutation is prevented at the cancelable pre-mutation intent boundary when such a boundary exists;
3. rejected controlled intent cannot leave renderer state divergent from the public prop;
4. component-owned browser/visual proof ends at the canonical executable owner selected by the current testing architecture;
5. renderer-specific non-browser test shims stay at the narrowest truthful owner;
6. decorative `presentation` composition proves both child suppression and positive input handoff to the real action owner;
7. independent review rechecks renderer lifecycle, proof ownership, test-environment blast radius, composition ownership, consumer behavior, and legacy-to-canonical semantic translations rather than trusting family prose;
8. repository-root Playwright lanes respect repository ignore policy;
9. Material workflow artifact timestamps are executable contracts, not trusted worker prose.

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

1. Add the repository-level fail-closed Material artifact timestamp validation to the existing unconditional `agent-environment` verification path, with focused deterministic tests and a single-artifact mode reusable by the Material orchestrator. Do not create a new verify lane or registry.
2. Update the orchestrator command to use that repository-owned validator as the single executable timestamp-validation implementation.
3. Run the Checkbox independent review fresh; the review worker must obtain its revision from the runtime UTC command and the orchestrator must validate the stored artifact immediately after the write.
4. Run the ordinary final `pnpm verify` on that exact resulting head.
5. Open the PR into `develop` and require the ordinary GitHub merge gates on the same head.

Do not select the next M3 family until Checkbox has the repository timestamp guard, a mechanically valid current independent review, and final verification on the merge candidate.
