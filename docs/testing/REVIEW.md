# Review

Verdict: blocked

## Scope reviewed

- Complete verifier-modernization finish implementation on `refactor/verify-modernization-finish` after synchronization with current `develop`.
- Passes A-F and the final Pass C correction were re-reviewed against the current implementation, current tests, `docs/testing/verify-target-architecture.md`, and `docs/testing/verify-unit-impact-correction.md`.
- The final Pass G benchmark was re-reviewed against the corrected post-sync planner behavior and the recorded real focused resolver probes.

## Blockers

None.

## Major issues

### M1 — durable verifier artifacts still depend on temporary review history and one Pass G statement is stale

Owner: verifier modernization documentation/integration (`docs/testing` with affected verifier comments/tests).

Problem: the implementation/proof behavior is now correct, but several durable branch artifacts still describe resolved correction history as if temporary `REVIEW.md` files were authoritative, and the final benchmark contains one statement that contradicts the corrected Playwright inventory predicate.

Evidence:

- [`verify-modernization.md`](./verify-modernization.md), `Accepted false positives / conservative over-selection` — says a colocated Playwright spec **or any** `tests/e2e/**/*.spec.ts` path selects `playwright.lanes.test.ts`. The final M1 correction immediately above proves the opposite for an arbitrary nested `tests/e2e/other/example.spec.ts`: it must not select `playwright.lanes.test.ts` because that path is outside the lane test's real scan population.
- [`../../scripts/lib/unitRisk.ts`](../../scripts/lib/unitRisk.ts), comments around `isPlaywrightLaneInventoryScanPath` / `checkExactMapping` — still cite `scripts/lib/REVIEW.md B1/M1`, even though the owner review is resolved and has been removed.
- [`../../scripts/lib/unitRisk.test.ts`](../../scripts/lib/unitRisk.test.ts), test-author audit commentary — still contains resolved-round wording such as references to `scripts/lib/REVIEW.md` and statements that the current production module is "unfixed" / expected red, although the final branch implementation is now green.
- [`../../scripts/verify.ts`](../../scripts/verify.ts), `getFailureReason` commentary — still cites the resolved temporary `scripts/REVIEW.md B1` instead of the canonical failure-detail contract.
- [`../../.github/workflows/verify.yml`](../../.github/workflows/verify.yml), `verification-release` timeout commentary — still cites the resolved temporary `.github/workflows/REVIEW.md B1` instead of the canonical testing/timeout evidence.

Basis:

- [`../../.agents/skills/project-review/SKILL.md`](../../.agents/skills/project-review/SKILL.md), `Review artifact ownership` — `REVIEW.md` is temporary working state; when a review closes, durable decisions must live in canonical documentation and the review artifact is deleted.
- [`../../AGENTS.md`](../../AGENTS.md), `Implementation quality` — obsolete comments and replaced logic/documentation should be removed rather than retained after their replacement is established.
- [`verify-unit-impact-correction.md`](./verify-unit-impact-correction.md), bounded Playwright inventory decision — `playwright.lanes.test.ts` owns only root app specs, explicit Storybook/visual/release subtrees, and colocated browser/visual specs; an arbitrary nested other subtree is outside that scan.

Risk: the final implementation is correct, but the durable source of truth becomes internally contradictory and depends on review artifacts that are intentionally non-permanent. Future verifier maintenance could reintroduce the broad Playwright predicate or misread historical RED-state commentary as current contract.

Required final state:

- durable verifier implementation/test/workflow comments cite canonical testing documents, not resolved owner `REVIEW.md` files;
- remove or rewrite historical "current unfixed" / expected-RED commentary that is no longer true in the final branch while preserving useful oracle/mechanism explanations;
- correct the Pass G accepted-over-selection statement so it names only the real Playwright inventory populations and explicitly does not claim arbitrary nested `tests/e2e/<other-subtree>/**/*.spec.ts` ownership by `playwright.lanes.test.ts`;
- do not change production planner behavior, test expectations, lane ownership, CI topology, or benchmark measurements while doing this cleanup;
- after the cleanup is re-reviewed, delete this `docs/testing/REVIEW.md` as the last temporary review artifact.

Verification:

- inspect the touched verifier comments/docs against `verify-target-architecture.md` and `verify-unit-impact-correction.md`;
- confirm no durable verifier implementation/test/workflow comment relies on the resolved owner `REVIEW.md` artifacts;
- confirm the Pass G Playwright wording agrees with the existing positive `appSmoke.spec.ts` row and negative `tests/e2e/other/example.spec.ts` row;
- formatting/document checks only as needed; no behavioral verifier rerun is required because this finding must not change executable behavior.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Do not reopen Pass A-F architecture, Pass C ownership mechanisms, mutation/release mappings, CI topology, or planner performance work.
- Do not rerun browser/release/mutation proof for this documentation/comment-only cleanup.

## Unresolved questions

None.
