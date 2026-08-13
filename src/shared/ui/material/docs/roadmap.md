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

However, the family is not currently complete: `REVIEW.md` has not yet run fresh against the corrected artifacts below.

The Checkbox visual-ownership gap identified after synchronizing with `develop`'s PR #193 Storybook ownership contract is now corrected. A fresh architecture-stage worker (`ARCHITECTURE.md`, `Artifact revision: 2026-08-13T06:41:40.600Z`, `Status: ready`) selected owner-local visual-proof ownership for the canonical Checkbox family, mirroring the Stage S4-D (MDSwitch) precedent. A fresh implementation-stage worker (`IMPLEMENTATION.md`, `Artifact revision: 2026-08-13T06:47:59.000Z`, `Status: complete`, `Migration readiness: ready`) relocated the visual spec and its four baselines to the owner-local `src/shared/ui/material/components/checkbox/MDCheckbox.visual.spec.ts` (colocated `MDCheckbox.visual.spec.ts-snapshots/`) and deleted the legacy central `tests/e2e/visual/shared-ui/md-checkbox-family.spec.ts` and its snapshot directory. A fresh migration-stage worker (`MIGRATION.md`, `Artifact revision: 2026-08-13T06:51:14.000Z`) independently re-confirmed all six consumers unchanged and correct, and corrected `docs/testing/migration-plan.md`'s stale Stage S4-B trailing sentence and "Still transitional" visual-pilot list to record this owner-local ownership. Only a fresh independent review of these corrected artifacts remains.

Current family state for merge-readiness purposes:

```text
DESIGN.md          current
ARCHITECTURE.md    current (owner-local visual ownership correction applied)
IMPLEMENTATION.md  current (visual proof relocated to owner-local location)
MIGRATION.md       current (confirms consumers unchanged; migration-plan.md corrected)
REVIEW.md          must run fresh after corrected upstream artifacts
```

Branch synchronization is complete against current `develop` (`behind_by: 0`). The branch still requires a PR-level `package.json` version bump strictly above current `develop` before a PR into `develop` can pass the repository `release-version` gate.

The earlier local `pnpm verify` result remains useful implementation evidence but is not merge approval: the architecture/proof-ownership correction and the final-owner visual-proof relocation are now complete, but a fresh independent review and a fresh `pnpm verify` on the corrected head are still required before merge.

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

1. Run a fresh independent review of the corrected Checkbox architecture, implementation, and migration artifacts (owner-local visual-proof relocation is complete; `docs/testing/migration-plan.md` is corrected).
2. Run the ordinary final `pnpm verify` on the corrected current head.
3. Bump `package.json` to a version strictly above current `develop` before opening/refreshing the PR into `develop`.
4. Require ordinary GitHub merge gates before integration.

Do not select the next M3 family until the Checkbox family is current, independently reviewed, and verified on the final merge candidate.
