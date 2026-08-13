# Mioframe Material migration roadmap

This file is the only owner of current Material milestone status, family-stage status, technical blockers, latest pilot result, and next operator action. Durable workflow rules live in the other canonical documents.

## Current state

Last updated: 2026-08-13

Current milestone: `M3 — sequential component migration (checkbox correction)`

Status: `blocked`

The Checkbox family's `BooleanValueInline.vue` tri-state mapping regression is corrected. The boolean property's `indeterminate` capability flag is no longer passed directly to canonical `MDCheckbox.indeterminate`; `BooleanValueInline.vue` now derives `checked`/`indeterminate` locally from the existing resolved effective value:

```text
checked = effectiveValue === true
indeterminate = property.indeterminate === true && effectiveValue === undefined
```

Consumer-level proof (`BooleanValueInline.test.ts`) covers `true`, `false`, unresolved `undefined`, `true`/`false` property-default fallback, indeterminate capability enabled/disabled, and `presentation` forwarding.

The previously-invalid future execution timestamps were regenerated through the owning Checkbox stages using factual UTC revisions.

However, the family is not currently complete. After synchronization, current `develop` includes the Material Storybook ownership contract from PR #193: once owner-local visual discovery is executable, a canonical Material migration must finish surviving family-owned browser/visual proof at the canonical owner in the same family workflow rather than leaving it in a central path for a later S4 cleanup.

The current Checkbox architecture, implementation, migration, and review still describe and accept `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts` as the final visual owner. That is stale relative to the current `docs/testing/migration-plan.md` and current Material architecture/migration skills. The family must return to architecture, classify the legacy visual proof disposition under the current policy, and move surviving Checkbox visual proof and baselines to the canonical `src/shared/ui/material/components/checkbox/` owner if the current executable lane supports that convention. Downstream implementation/migration/review artifacts are invalidated by that architecture correction.

Current family state for merge-readiness purposes:

```text
DESIGN.md          current
ARCHITECTURE.md    correction required for current visual ownership policy
IMPLEMENTATION.md  invalidated by architecture correction
MIGRATION.md       invalidated by architecture/implementation correction
REVIEW.md          must run fresh after corrected upstream artifacts
```

Branch synchronization is complete against current `develop` (`behind_by: 0`). The branch still requires a PR-level `package.json` version bump strictly above current `develop` before a PR into `develop` can pass the repository `release-version` gate.

The earlier local `pnpm verify` result remains useful implementation evidence but is not merge approval after this newly identified architecture/proof-ownership defect and the required final-owner relocation.

## Calibration result

Switch established the stateful Material adapter invariants now recorded in the canonical rules:

1. a public controlled prop is the sole state source of truth;
2. renderer mutation is prevented at the cancelable pre-mutation intent boundary when such a boundary exists;
3. rejected controlled intent cannot leave renderer state divergent from the public prop;
4. component-owned browser/visual proof ends at the canonical executable owner selected by the current testing architecture;
5. renderer-specific non-browser test shims stay at the narrowest truthful owner;
6. decorative `presentation` composition proves both child suppression and positive input handoff to the real action owner;
7. independent review rechecks current renderer lifecycle, proof ownership, test-environment blast radius, composition ownership, consumer behavior, and legacy-to-canonical semantic translations rather than trusting family prose;
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

1. Route Checkbox back through architecture using the current `docs/testing/migration-plan.md` and Material skills. Correct the stale central visual-proof decision and explicitly classify legacy/canonical visual proof ownership.
2. Apply the resulting implementation/migration changes, including final owner-local visual proof/baselines when selected by the current architecture, then run a fresh independent review.
3. Run the ordinary final `pnpm verify` on the corrected current head.
4. Bump `package.json` to a version strictly above current `develop` before opening/refreshing the PR into `develop`.
5. Require ordinary GitHub merge gates before integration.

Do not select the next M3 family until the Checkbox family is current, independently reviewed, and verified on the final merge candidate.
