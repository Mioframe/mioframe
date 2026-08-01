---
name: material-component-review
description: 'Use after design, architecture, implementation, and migration artifacts are complete to independently review one Material family, write REVIEW.md, and route findings or final-verifier output without fixing code.'
---

# Material component review

Perform the independent semantic review of one complete Material family and return control to the orchestrator.

This stage owns compliance judgment and exact family/stage routing. It does not implement fixes or own final workflow verification.

## Modes

### Full independent review

Use after an invalidating upstream revision changed, when review is missing or invalid, or when review is the origin stage that must be executed fresh after a cross-family correction.

A metadata-only design refresh with unchanged design contract revision does not require a new review.

Review the complete current family and all migrated consumers, not only the latest change.

### Final-verifier routing review

Use when the orchestrator provides the exact failed final command and visible output.

Determine the exact owning family and earliest stage, update review control fields, and return. If no family stage can correct a genuine command-execution blocker, record it with both return fields `none`.

## Input gate

Require successful current design, architecture, implementation, and migration artifacts.

Architecture must reference the exact current design contract revision and dependency review revisions. Implementation and migration must reference exact current upstream artifact revisions.

If an upstream artifact is invalid, do not reconstruct it. Record the exact earliest return family and stage and block completion.

## Worker boundary

Run in a fresh isolated context independent from workers that authored or corrected architecture, implementation, or migration.

Use task-relevant readable workspace files, canonical artifacts, official design evidence, current code, consumers, tests, and documented project commands. Do not depend on Git, PR, commit, or external-check state.

Do not write branch, commit, or PR facts into review.

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

Use a new artifact revision whenever review content or routing changes. Record the exact design contract revision and exact three downstream artifact revisions reviewed.

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
2. Compare architecture with design contract, scenarios, ownership, dependencies, renderer revision, and simplest viable alternative.
3. Compare implementation with every architecture decision and forbidden approach.
4. Review consumers, explicit no-consumer case, and legacy-removal claims.
5. Inspect public API, state precedence, tokens, renderer boundaries, accessibility, browser/mobile behavior, errors, motion, and visual presentation.
6. Verify proof ownership, impact metadata, and stage-scoped checks.
7. Check for an actual operator-reported visual/motion defect.
8. Consolidate each underlying problem once and assign the exact owning family and earliest stage.

Automated checks prove only covered contracts. They do not prove architecture or subjective visual/motion quality.

Absence of an operator report is `no-reported-defect`, is not a blocker, and requires no positive acknowledgement.

## Finding ownership

Route:

- missing or incorrect official fact → owning family/design;
- incorrect demand, API, ownership, dependency, renderer/token strategy, proof ownership, or migration plan → owning family/architecture;
- component code, token, mapping, export, or component-owned proof defect → owning family/implementation;
- consumer, product-scenario, legacy-removal, or migration-proof defect → owning family/migration.

A dependency defect routes to the dependency family, not automatically to the reviewed parent.

Do not fix findings during review.

## Cross-family origin execution

When review is the stored origin stage after another family was corrected, the orchestrator first resumes this family through normal durable validation from design forward.

Therefore review may receive newly rewritten architecture, implementation, or migration artifacts before it runs.

In the fresh origin review:

- inspect the corrected target’s current artifacts and proof;
- inspect every current origin-family artifact after durable resume;
- re-evaluate the original finding from current evidence;
- clear return fields when resolved;
- otherwise replace them with the exact remaining target;
- never preserve an old route merely because it existed before correction.

This fresh review execution is required before the orchestrator continues.

## Verdict semantics

### `compliant`

Use only when all invalidating upstream revisions match, mandatory work and proof are complete, no findings or accepted risks remain, return target is `none`, completion is `complete`, final-verification readiness is `ready`, and no operator-reported defect remains unresolved.

### `compliant-with-listed-risks`

Use only when every mandatory requirement is complete and remaining entries are explicit bounded non-blocking limitations, such as controlled renderer workarounds or bounded platform coverage that leaves no required scenario unknown.

It must not represent an unrun or failed required check, revision mismatch, stale artifact, warning, unresolved finding, incomplete migration, unknown consumer state, missing proof, deferred required work, or pending final verification.

Blockers, major issues, and minor issues must still be `none`.

### `blocked`

Use for any unresolved required work, proof gap, warning caused by current work, semantic finding, invalid upstream revision, operator-reported defect, or genuine command blocker.

Set the exact return family and earliest stage unless no family stage can correct the blocker.

## Final-verifier routing

Given exact final verifier output:

1. identify the failed contract and evidence;
2. map it to the exact owning family and earliest stage;
3. record current invalidating upstream revisions;
4. write verdict and completion as blocked;
5. set exact return family and stage;
6. record the command and relevant output in routing evidence without Git/PR interpretation;
7. return to the orchestrator.

If the failure is review formatting or review-owned content, fix only review and restore or retain its verdict from current evidence.

## Completion

Review succeeds only when:

- recorded design contract revision equals the current design contract revision;
- architecture, implementation, and migration revisions equal current artifacts;
- all required headings exist;
- the verdict accurately represents the complete current family;
- no unresolved route or finding remains.

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

- Fixing production code or rewriting earlier artifacts.
- Reviewing only the latest change.
- Depending on Git or PR state.
- Marking compliant with invalidating revision mismatches or unresolved work.
- Treating metadata-only design refresh as review invalidation.
- Using listed risks for incomplete work.
- Preserving a stale cross-family route after target correction and durable origin resume.
- Blocking only because positive visual acknowledgement is absent.
- Fabricating operator feedback.
- Reusing an artifact revision after content changed.
- Running or claiming final workflow verification.
