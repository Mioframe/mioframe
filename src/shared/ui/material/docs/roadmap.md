# Mioframe Material migration roadmap

This file owns current Material milestone status, family-stage status, technical blockers, and next operator action. Durable workflow rules live in the canonical Material docs and skills.

## Current state

Last updated: 2026-08-13

Current milestone: `M3 — sequential component migration (Checkbox)`

Status: `in-progress`

Checkbox is complete at the coding-agent workflow boundary under the simplified Material process:

- current `DESIGN.md` reused;
- fresh `ARCHITECTURE.md`: `Status: ready`;
- fresh `IMPLEMENTATION.md`: `Status: complete`;
- fresh `MIGRATION.md`: `Status: complete`;
- fresh independent `REVIEW.md`: `Verdict: compliant`;
- no review blockers, major issues, minor issues, or accepted risks;
- focused implementation/migration/review verification passed;
- obsolete Material timestamp/revision guard removed;
- Material workflow no longer uses timestamp/revision graphs;
- coding agents use focused local verification for development feedback;
- GitHub CI owns authoritative verification on the exact PR head.

Checkbox does not require another broad local `pnpm verify` before PR creation.

## Calibration result

Switch and Checkbox established these durable invariants:

1. public controlled props remain the source of truth;
2. renderer mutation is prevented at the faithful pre-mutation intent boundary when available;
3. rejected intent cannot leave renderer state divergent from public props;
4. browser/visual proof ends at the canonical owner;
5. presentation composition proves child suppression and positive handoff to the actual action owner;
6. independent review checks the complete current family and consumer semantics;
7. workflow metadata stays subordinate to component correctness;
8. coding agents run focused local checks; exact-head PR CI is the merge verification gate.

No generic m3e adapter framework, workflow database, timestamp validator, artifact revision graph, or duplicate local CI gate is justified.

## Milestones

| ID  | Milestone                           | Status        |
| --- | ----------------------------------- | ------------- |
| M0  | workflow architecture and rules     | `complete`    |
| M1a | Loading Indicator dependency family | `complete`    |
| M1  | Button action family                | `complete`    |
| M2  | Switch stateful pilot               | `complete`    |
| M3  | sequential component migration      | `in-progress` |

## Known non-blocking follow-up

`RelationValueFieldData.vue` still has the pre-existing accessible-name gap on its standalone relation-selection checkbox. Checkbox migration does not claim to fix it.

## Next operator action

1. Recheck branch synchronization and package version against current `develop`.
2. Open the Checkbox PR into `develop`.
3. Use GitHub CI on the exact PR head as the authoritative verification gate.
4. Perform full PR review and issue the merge recommendation.

Do not select the next M3 family until Checkbox completes PR CI and merge review.
