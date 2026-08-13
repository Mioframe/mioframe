# Mioframe Material migration roadmap

This file owns current Material milestone status, family-stage status, technical blockers, and next operator action. Durable workflow rules live in the canonical Material docs and skills.

## Current state

Last updated: 2026-08-13

Current milestone: `M3 — sequential component migration (Checkbox)`

Status: `in-progress`

PR #194 is open. The canonical Checkbox migration is structurally complete, but final merge review found one Material-contract correction still required before the family can be considered complete:

- official Checkbox accessibility guidance publishes `Space` **or** `Enter` activation;
- the installed private renderer `@m3e/web@2.6.3` activates Checkbox with Space but not Enter;
- Mioframe follows official Material as the public semantic authority, so the canonical adapter must compensate for the renderer gap rather than adopting renderer behavior as public behavior;
- the existing `Enter → no-op` browser proof and matching architecture/review claims are therefore obsolete and must be corrected;
- exact-head GitHub CI was green before this correction, but a new exact-head CI run is required after the code/proof correction.

The general workflow simplification remains valid:

- Material workflow uses no timestamp/revision graph;
- architecture, implementation, migration, and independent review run fresh per invocation;
- coding agents use focused local verification for implementation feedback;
- GitHub CI owns authoritative repository verification on the exact PR head;
- merge readiness belongs to the architect after current CI and full PR review.

## Calibration result

Switch and Checkbox establish these durable invariants:

1. official Material semantics define the public component contract; m3e is a private renderer and divergences are adapted or recorded, not promoted to Mioframe API semantics;
2. public controlled props remain the source of truth;
3. renderer mutation is prevented at the faithful pre-mutation intent boundary when available;
4. rejected intent cannot leave renderer state divergent from public props;
5. browser/visual proof ends at the canonical owner;
6. presentation composition proves child suppression and positive handoff to the actual action owner;
7. independent review checks the complete current family and consumer semantics;
8. workflow metadata stays subordinate to component correctness;
9. coding agents run focused local checks; exact-head PR CI is the merge verification gate.

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

1. Correct canonical Checkbox Enter activation and its focused unit/browser proof without adding a generic keyboard abstraction.
2. Re-run fresh Checkbox architecture → implementation → migration → independent review so stage artifacts describe the corrected official contract and current repository state.
3. Update PR #194 description if the final contract changes materially.
4. Require all exact-head GitHub CI checks to pass on the corrected PR head.
5. Perform one final full PR review and issue the merge recommendation.

Do not select the next M3 family until Checkbox completes this correction, exact-head CI, and merge review.
