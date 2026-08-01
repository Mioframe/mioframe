---
name: material-component-review
description: 'Use after design, architecture, implementation, and migration artifacts are complete to independently review one Material family, write REVIEW.md, and route findings or final-verifier output without fixing production code.'
---

# Material component review

Perform the independent semantic review of one complete Material family and return control to the orchestrator.

This stage owns compliance judgment and exact correction routing. It does not implement production fixes or own final workflow verification.

## Modes

### Full independent review

Use after an invalidating upstream revision changed, when review is missing or invalid, or when review is the stored origin stage after cross-family correction.

A metadata-only design refresh with unchanged design contract revision does not require review.

Review the complete current family and all consumers, not only the latest change.

### Final-verifier routing review

Use when the orchestrator provides the exact failed final command and visible output.

Determine the exact owning family and earliest correction stage. If no family stage can correct a genuine command-execution blocker, return terminal blocked with route `none/none`.

## Input gate

Require successful current design, architecture, implementation, and migration artifacts.

Architecture must reference current design contract and dependency review revisions. Implementation and migration must reference current upstream artifact revisions.

If an upstream artifact is invalid, do not reconstruct it. Record the exact earlier-stage or other-family route and block completion.

## Worker boundary

Run in a fresh isolated context independent from workers that authored or corrected architecture, implementation, or migration.

Use task-relevant workspace files, canonical artifacts, official design evidence, code, consumers, tests, and documented commands. Do not depend on Git, PR, commit, or external-check state.

## Output

Write exactly:

```text
src/shared/ui/material/components/<family>/REVIEW.md
```

Control fields:

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
DESIGN.md contract revision: <exact Design contract revision>
ARCHITECTURE.md revision: <exact Artifact revision>
IMPLEMENTATION.md revision: <exact Artifact revision>
MIGRATION.md revision: <exact Artifact revision>
Verdict: compliant | compliant-with-listed-risks | blocked
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Completion status: complete | blocked
Final workflow verification readiness: ready | blocked
Operator visual status: no-reported-defect | defect-reported | not-applicable
Blockers: none | <exact blockers>
Major issues: none | <exact issues>
Minor issues: none | <exact issues>
Accepted risks: none | <exact accepted risks>
```

Use a new artifact revision whenever review content or routing changes. Record exact invalidating upstream revisions.

Required headings:

```text
## Goal and scenarios reviewed
## Official design compliance
## Architecture compliance
## Implementation compliance
## Migration and legacy removal
## Proof and stage verification
## Blockers
## Major issues
## Minor issues
## Accepted risks
## Items not required
## Routing evidence
```

## Full review order

1. Validate complete official design contract and source lifecycle.
2. Compare architecture with design, scenarios, ownership, dependencies, renderer revision, and simplest viable alternative.
3. Compare implementation with every architecture decision and forbidden approach.
4. Review consumers, no-consumer case, and legacy-removal claims.
5. Inspect public API, state precedence, tokens, renderer boundaries, accessibility, browser/mobile behavior, errors, motion, and visual presentation.
6. Verify proof ownership, impact metadata, and stage-scoped checks.
7. Check for an actual operator-reported visual/motion defect.
8. Consolidate each underlying problem once and assign exact ownership.

Automated checks prove only covered contracts. Absence of an operator visual report is not a blocker and requires no positive acknowledgement.

## Finding ownership

Route:

- missing or incorrect official fact → owning family/design;
- incorrect demand, API, ownership, dependency, renderer/token strategy, proof ownership, or migration plan → owning family/architecture;
- component code, token, mapping, export, or component-owned proof defect → owning family/implementation;
- consumer, scenario, legacy-removal, or migration-proof defect → owning family/migration.

A dependency defect routes to the dependency family, not automatically to the parent.

Do not fix production findings during review.

## Origin execution

When review is the stored origin stage after another family was corrected, the orchestrator first resumes the origin through durable validation from design forward.

Review then executes fresh against all current artifacts, re-evaluates the original finding, and clears or replaces its route. Never preserve a route merely because it existed before correction.

## Verdict semantics

### `compliant`

Use only when all revisions match, mandatory work and proof are complete, no findings or accepted risks remain, route is `none/none`, completion is `complete`, final-verification readiness is `ready`, and no reported defect remains unresolved.

### `compliant-with-listed-risks`

Use only for complete work with explicit bounded non-blocking limitations. It must not represent an unrun or failed check, revision mismatch, stale artifact, warning, unresolved finding, incomplete migration, unknown consumer state, missing proof, deferred required work, or pending final verification.

Blockers, major issues, and minor issues must be `none`.

### `blocked` with correction route

Use when a finding belongs to an earlier stage of the same family or to another family.

Same-family review routes may target design, architecture, implementation, or migration. Review cannot route to review.

### Genuine blocker

When required evidence, safety input, or command execution cannot be resolved by any family stage, use:

```text
Verdict: blocked
Required return family: none
Required return stage: none
Completion status: blocked
Final workflow verification readiness: blocked
Blockers: <exact blocker>
```

This is terminal for the invocation.

A review-owned formatting, synthesis, classification, or routing-output defect must be fixed in this worker. Do not return a route to review.

## Final-verifier routing

Given exact final verifier output:

1. identify the failed contract and evidence;
2. map it to the exact owning family and earliest correction stage;
3. record current revisions;
4. write blocked verdict and route, or terminal blocker `none/none`;
5. record the command and relevant output without Git/PR interpretation;
6. return.

If the failure is review-owned output, correct review in this worker instead of routing to review.

## Completion

Review succeeds only when recorded revisions equal current artifacts, all headings exist, the verdict represents the complete family, and no unresolved route or finding remains.

A design artifact revision mismatch alone is irrelevant when design contract revision is unchanged.

A successful review means ready for outer final verification. It does not claim that command passed.

## Report

```text
MATERIAL REVIEW RESULT
Input component:
Canonical family:
Review mode: full | final-verifier-routing
REVIEW.md path:
Artifact revision:
DESIGN.md contract revision:
ARCHITECTURE.md revision:
IMPLEMENTATION.md revision:
MIGRATION.md revision:
Operator visual status:
Blockers:
Major issues:
Minor issues:
Accepted risks:
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Review verdict: compliant | compliant-with-listed-risks | blocked
Final workflow verification readiness: ready | blocked
Completion status: complete | blocked
Status: complete | blocked
```

## Forbidden

- Routing to review or leaving a review-owned defect unresolved.
- Fixing production code or rewriting earlier artifacts.
- Reviewing only the latest change.
- Depending on Git or PR state.
- Marking compliant with invalidating revision mismatches or unresolved work.
- Treating metadata-only design refresh as invalidation.
- Using listed risks for incomplete work.
- Preserving a stale cross-family route after durable origin resume.
- Blocking only because positive visual acknowledgement is absent.
- Fabricating operator feedback.
- Running or claiming final workflow verification.
