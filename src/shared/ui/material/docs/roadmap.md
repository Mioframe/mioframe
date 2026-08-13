# Mioframe Material migration roadmap

This file owns current Material milestone status, family-stage status, technical blockers, latest calibration result, and next operator action. Durable workflow rules live in the canonical Material docs and skills.

## Current state

Last updated: 2026-08-13

Current milestone: `M3 — sequential component migration (Checkbox)`

Status: `in-progress`

The Checkbox family workflow is complete under the simplified Material process. Current `DESIGN.md` was reused, fresh architecture/implementation/migration/review stages completed, the independent review verdict is `compliant`, and the workflow's final `pnpm verify` passed before this status-only roadmap update.

The repeated invalid review timestamp exposed architectural drift in the Material agent workflow. The correction is now implemented:

- keep the five isolated stages;
- reuse current DESIGN until its normal source refresh is due;
- run ARCHITECTURE, IMPLEMENTATION, MIGRATION, and independent REVIEW fresh on every `material-component <name>` invocation;
- after any correction, rerun affected downstream reasoning fresh;
- do not use timestamps, hashes, counters, Git identities, or persistent artifact revision graphs for workflow freshness;
- treat legacy revision fields in existing artifacts as ignored metadata and remove them when each owning stage next rewrites its artifact;
- keep `scripts/agentEnvironment.mjs` limited to agent-environment compatibility checks rather than Material workflow artifact validation.

The obsolete Material timestamp validator and its tests have been removed. Focused unit and `agent-environment` verification passed after that deletion.

This deliberately accepts some repeated agent work on a repeated family invocation. Material family migration is normally a one-time operation, so simpler orchestration is preferred over persistent invalidation infrastructure.

## Checkbox state

Completed behavior and proof:

- canonical m3e-backed `MDCheckbox` ownership under `src/shared/ui/material/components/checkbox`;
- controlled checked/indeterminate behavior and presentation composition;
- explicit `BooleanValueInline` translation from effective value to rendered checked/indeterminate state;
- consumer-level proof for true/false/unresolved/default/capability combinations;
- owner-local canonical Checkbox browser/visual proof and removal of replaced legacy proof;
- all six current direct/fixture consumers migrated to the canonical Material API;
- fresh `ARCHITECTURE.md`: `Status: ready`;
- fresh `IMPLEMENTATION.md`: `Status: complete`, no production edit required;
- fresh `MIGRATION.md`: `Status: complete`, no consumer edit required;
- fresh independent `REVIEW.md`: `Verdict: compliant`, no blockers/major/minor issues/accepted risks;
- workflow final `pnpm verify`: passed before this roadmap status update;
- branch synchronization check: `behind 0` against `develop`;
- package version `0.3.12` over current `develop` `0.3.11`.

Because this roadmap edit happened after the successful workflow final gate, one exact-head `pnpm verify` rerun is still required before opening the PR.

## Calibration result

Switch and Checkbox established the durable Material implementation invariants:

1. a controlled public prop is the sole public state source of truth;
2. renderer mutation is prevented at a faithful pre-mutation intent boundary when available;
3. rejected intent cannot leave renderer state divergent from the public prop;
4. component-owned browser/visual proof ends at the canonical executable owner;
5. renderer-specific test shims stay at the narrowest truthful owner;
6. presentation composition proves both child suppression and positive input handoff to the real action owner;
7. independent review rechecks renderer lifecycle, proof ownership, test-environment blast radius, composition ownership, consumer behavior, and semantic translations;
8. workflow metadata remains subordinate to component correctness and must not become a second product.

No generic m3e adapter framework, duplicate state manager, compatibility layer, renderer registry, workflow database, timestamp validator, or artifact revision graph is justified.

## Milestones

| ID  | Milestone                           | Status        | Exit gate                                                                       |
| --- | ----------------------------------- | ------------- | ------------------------------------------------------------------------------- |
| M0  | workflow architecture and rules     | `complete`    | simplified staged workflow is internally consistent and obsolete guard removed |
| M1a | Loading Indicator dependency family | `complete`    | family implemented and reviewed                                                 |
| M1  | Button action family                | `complete`    | canonical m3e-backed action family migrated                                     |
| M2  | Switch stateful pilot               | `complete`    | controlled-state calibration complete                                           |
| M3  | sequential component migration      | `in-progress` | individual family completion does not complete the migration program            |

## Known non-blocking follow-up

`RelationValueFieldData.vue` still has the pre-existing accessible-name gap on its standalone relation-selection checkbox. Checkbox migration does not claim to fix it. It remains a separate product accessibility follow-up until the correct contextual label is selected and proven.

## Next operator action

1. Rerun ordinary exact-head `pnpm verify` after this roadmap-only status update.
2. Open the Checkbox PR into `develop`.
3. Run GitHub gates and perform full PR review on the exact PR head.
4. Merge only after the PR review and required checks are complete.

Do not select the next M3 family until the Checkbox PR is merged.
