---
name: material-component-review
description: 'Use after design, architecture, implementation, and migration artifacts are complete to independently review one Material family, write REVIEW.md, and route findings or final-verifier output without fixing code.'
---

# Material component review

Perform the independent semantic review of one complete Material family and return control to the orchestrator.

This stage owns compliance judgment and exact return-family/stage routing. It does not implement fixes and does not own final workflow verification.

## Modes

### Full independent review

Use after any upstream family artifact changed or when `REVIEW.md` is missing or invalid. Review the complete current family and all migrated consumers, not only the latest patch.

### Final-verifier routing review

Use when the orchestrator provides the exact failed final verification command, visible output, and current parent/dependency family context.

Determine the exact owning family and earliest stage, update fixed review fields, and return. If no family stage can correct a genuine environment/project-command failure, record that blocker with both return fields `none`.

## Input gate

Require mechanically valid and successful:

```text
components/<family>/DESIGN.md
components/<family>/ARCHITECTURE.md
components/<family>/IMPLEMENTATION.md
components/<family>/MIGRATION.md
```

Expected gates:

- design current and not refresh-due;
- architecture ready, current renderer revision, queue `none`, implementation readiness `ready`;
- implementation complete with no deviations;
- migration complete and review readiness `ready`.

If an upstream artifact is invalid, do not reconstruct it. Record the exact earliest return family and stage and block completion.

## Worker boundary

Run in a fresh isolated worker context independent from workers that authored or corrected architecture, implementation, or migration.

Use task-relevant readable workspace files, canonical artifacts, official design evidence, current code/consumers/tests, exact renderer revision, and documented project commands. Do not depend on Git history/log, diff/index/branch/worktree state, commit identifiers, pull-request metadata/review comments, or external publication checks.

## Output

Write exactly:

```text
src/shared/ui/material/components/<family>/REVIEW.md
```

Control fields:

```text
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

Do not append prose to enum or routing values. Use every heading and explicit `none` where applicable.

## Full review order

1. Validate design completeness, required structure, source revision, and refresh lifecycle.
2. Compare architecture with design, scenarios, workspace ownership, simplest viable alternative, exact dependency queue, and renderer revision.
3. Compare implementation with every architecture decision and forbidden approach.
4. Review every current consumer and legacy-removal claim.
5. Inspect API, state precedence, tokens, renderer boundaries, dependencies, accessibility, browser/mobile behavior, errors, motion, and visual presentation.
6. Verify faithful proof ownership, impact metadata, and stage-scoped checks.
7. Check for an actual operator-reported visual/motion defect.
8. Consolidate each underlying problem once and assign its exact owning family and earliest stage.

Automated checks prove only covered contracts. They do not prove architecture or subjective visual/motion quality.

Absence of an operator report is `no-reported-defect`, is not a blocker, and requires no positive acknowledgement.

## Finding ownership

Route:

- missing, due, stale, or incorrect official fact/token/spec → owning family design;
- incorrect demand, API, ownership, dependency queue, renderer revision/strategy, token strategy, proof ownership, or migration plan → owning family architecture;
- component code, token declaration, mapping, export, component test/story/browser/visual proof defect → owning family implementation;
- consumer, product-scenario, legacy-removal, or migration-proof defect → owning family migration.

Use `self` for the reviewed family. Use the exact canonical dependency family when the finding belongs to a dependency. Do not put the family only in prose.

## Verdict semantics

### `compliant`

Use only when all upstream artifacts and mandatory proof are current and complete; no blockers/issues/risks remain; both return fields are `none`; completion is `complete`; final verification readiness is `ready`; and no reported visual defect remains.

### `compliant-with-listed-risks`

Use only when all mandatory work and proof are complete and remaining entries are explicit bounded non-blocking limitations, such as controlled renderer workaround, bounded platform coverage that leaves no required scenario unknown, or upstream uncertainty outside the selected contract.

It must not represent an unrun or failed required check, stale/missing/invalid artifact, unresolved warning/finding, incomplete migration, unknown consumer state, missing proof, deferred required work, or pending final workflow verification.

Blockers, major issues, and minor issues must still be `none`; accepted risks must name the bounded limitation and why it is non-blocking.

### `blocked`

Use for any unresolved required work, proof gap, current warning, semantic finding, invalid upstream artifact, renderer/source revision mismatch, operator-reported defect, or genuine command blocker.

Set the exact target family and earliest stage unless no family stage can correct the blocker.

## Final-verifier routing

Given exact verifier output and family context:

1. identify the failed contract and evidence;
2. identify the exact owning family;
3. map it to the earliest owning stage;
4. set verdict/completion/readiness to blocked;
5. write exact `Required return family` and `Required return stage`;
6. record command and relevant output under routing evidence without Git/PR interpretation;
7. return to the orchestrator.

Example dependency route:

```text
Required return family: loadingIndicator
Required return stage: implementation
```

If the failure is review-artifact formatting or review-owned content, fix only `REVIEW.md`, then restore readiness or keep it blocked with an exact reason.

If no family stage can correct a command-execution blocker, set both return fields to `none` and record the exact blocker.

## Completion

Review is complete only when the artifact contains valid fields/headings and accurately represents the complete current family.

A successful review means the family is ready for outer final workflow verification. It does not claim that command already passed.

## Report

```text
MATERIAL REVIEW RESULT
Input component:
Canonical family:
Review mode: full | final-verifier-routing
REVIEW.md path:
Input artifact statuses:
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
- Reviewing only the latest patch.
- Depending on Git or PR state.
- Encoding the target family only in prose.
- Marking compliant while required work, proof, warnings, or findings remain.
- Using listed risks for incomplete work.
- Blocking only because positive visual acknowledgement is absent.
- Fabricating operator feedback.
- Running or claiming final workflow verification.
