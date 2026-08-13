# Mioframe Material migration roadmap

This file owns current Material milestone status, family-stage status, technical blockers, latest calibration result, and next operator action. Durable workflow rules live in the canonical Material docs and skills.

## Current state

Last updated: 2026-08-13

Current milestone: `M3 — sequential component migration (Checkbox)`

Status: `blocked`

Checkbox runtime, consumer migration, and proof are materially complete. The remaining work is workflow simplification and fresh final review after that simplification.

The repeated invalid review timestamp exposed architectural drift in the Material agent workflow. The problem was not Checkbox runtime behavior; the workflow had made timestamp/revision metadata a correctness mechanism and then needed extra validator infrastructure to defend that mechanism.

The selected correction is simpler:

- keep the five isolated stages;
- reuse current DESIGN until its normal source refresh is due;
- run ARCHITECTURE, IMPLEMENTATION, MIGRATION, and independent REVIEW fresh on every `material-component <name>` invocation;
- after any correction, rerun affected downstream reasoning fresh;
- do not use timestamps, hashes, counters, Git identities, or persistent artifact revision graphs for workflow freshness;
- treat legacy revision fields in existing artifacts as ignored metadata and remove them when each owning stage next rewrites its artifact;
- remove the Material timestamp validation code added to `scripts/agentEnvironment.mjs` and its tests because it no longer protects a required repository invariant.

This deliberately accepts some repeated agent work on a repeated family invocation. Material family migration is normally a one-time operation, so simpler orchestration is preferred over persistent invalidation infrastructure.

## Checkbox state

Confirmed completed behavior/proof includes:

- canonical m3e-backed `MDCheckbox` ownership under `src/shared/ui/material/components/checkbox`;
- controlled checked/indeterminate behavior and presentation composition;
- explicit BooleanValueInline semantic translation from effective value;
- consumer-level proof for true/false/unresolved/default/capability combinations;
- owner-local canonical Checkbox visual proof and removal of replaced central canonical proof;
- current testing migration documentation aligned with owner-local proof;
- package version `0.3.12` over current `develop` `0.3.11` at the last synchronization check.

The previous `REVIEW.md` is not accepted as final review evidence because it was produced under the superseded timestamp/revision workflow and was already known to contain invalid execution-time metadata when written.

After the workflow simplification lands, Checkbox must pass one fresh current-invocation architecture → implementation → migration → independent review sequence. Those stages may be no-op with respect to production code when current implementation remains compliant.

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
| M0  | workflow architecture and rules     | `in-progress` | simplified staged workflow is internally consistent and executable              |
| M1a | Loading Indicator dependency family | `complete`    | family implemented and reviewed                                                  |
| M1  | Button action family                | `complete`    | canonical m3e-backed action family migrated                                      |
| M2  | Switch stateful pilot               | `complete`    | controlled-state calibration complete                                            |
| M3  | sequential component migration      | `in-progress` | individual family completion does not complete the migration program             |

## Known non-blocking follow-up

`RelationValueFieldData.vue` still has the pre-existing accessible-name gap on its standalone relation-selection checkbox. Checkbox migration must not pretend this is fixed. It remains a separate product accessibility follow-up until the correct contextual label is selected and proven.

## Next operator action

1. Complete documentation/skill simplification so all active Material workflow instructions use the fresh-stage model and no correctness-critical revision graph remains.
2. Remove the now-obsolete Material artifact timestamp validator from `scripts/agentEnvironment.mjs` and its tests without changing unrelated agent-environment checks.
3. Run `material-component Checkbox` through fresh architecture, implementation, migration, and independent review under the simplified workflow.
4. Run ordinary final `pnpm verify` on the resulting exact head.
5. Open the PR into `develop`, run GitHub gates, and perform full PR review.

Do not select the next M3 family until Checkbox and the simplified workflow complete these gates.
