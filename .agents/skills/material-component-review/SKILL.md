---
name: material-component-review
description: 'Use after design, architecture, implementation, and migration artifacts are complete to independently review one Material family, write REVIEW.md, and route findings or final-verifier output without fixing code.'
---

# Material component review

Perform the independent semantic review of one complete Material family and return control to the orchestrator.

This stage owns compliance judgment and explicit return-stage routing. It does not implement fixes and does not own final workflow verification.

## Modes

### Full independent review

Use after design, architecture, implementation, or migration changed, or when `REVIEW.md` is missing or invalid.

Review the complete current family and all migrated consumers, not only the latest patch.

### Final-verifier routing review

Use when the orchestrator provides the exact failed final verification command and visible output.

Do not let the orchestrator classify that output. Determine the earliest owning stage, update the fixed `REVIEW.md` fields, and return. If the command cannot execute for a genuine environment/project-command reason unrelated to a correctable family stage, record that exact blocker with `Required return stage: none`.

## Input gate

Require successful control fields in:

```text
components/<family>/DESIGN.md
components/<family>/ARCHITECTURE.md
components/<family>/IMPLEMENTATION.md
components/<family>/MIGRATION.md
```

Expected gates:

- design `current`;
- architecture `ready`;
- implementation `complete` with no deviations;
- migration `complete` and review readiness `ready`.

If an upstream artifact is invalid, review does not reconstruct it. Record the earliest `Required return stage` and block completion.

## Worker boundary

Run in a fresh isolated worker context independent from workers that authored or corrected architecture, implementation, or migration.

Use task-relevant readable workspace files, canonical artifacts, official design evidence, current code/consumers/tests, and documented project commands. Do not depend on:

- Git history or log;
- diff, index, branch, or worktree state;
- commit identifiers;
- pull-request metadata or review comments;
- GitHub checks or another external publication system.

Do not write branch, commit, committed/uncommitted, or PR facts into `REVIEW.md`.

## Output

Write exactly:

```text
src/shared/ui/material/components/<family>/REVIEW.md
```

The artifact begins with exact control fields:

```text
Verdict: compliant | compliant-with-listed-risks | blocked
Required return stage: none | design | architecture | implementation | migration
Completion status: complete | blocked
Final workflow verification readiness: ready | blocked
Operator visual status: no-reported-defect | defect-reported | not-applicable
Blockers: none | <exact blockers>
Major issues: none | <exact issues>
Minor issues: none | <exact issues>
Accepted risks: none | <exact accepted risks>
```

Do not append prose to enum values. Put evidence and explanations in sections below the control fields.

## Full review order

1. Validate that `DESIGN.md` represents the complete official contract and source lifecycle correctly.
2. Compare architecture with official design, confirmed scenarios, workspace ownership, and the simplest viable alternative.
3. Compare the complete implementation with every architecture decision and forbidden approach.
4. Review every current consumer and legacy-removal claim from migration.
5. Inspect public API, state precedence, tokens, renderer boundaries, dependencies, accessibility, browser/mobile behavior, errors, motion, and visual presentation.
6. Verify faithful proof ownership, impact metadata, and required stage-scoped checks.
7. Check for an actual operator-reported visual/motion defect.
8. Consolidate each underlying problem once and assign the earliest owning stage.

Automated checks prove only their covered contracts. They do not prove architecture or subjective visual/motion quality.

Absence of an operator report is `no-reported-defect`, is not a blocker, and requires no positive acknowledgement.

## Finding ownership

Route:

- missing, stale, or incorrect official fact/token/spec → design;
- incorrect demand, API, ownership, dependency, renderer/token strategy, proof ownership, or migration plan → architecture;
- component code, token declaration, mapping, export, component test/story/browser/visual proof defect → implementation;
- consumer, product-scenario, legacy-removal, or migration-proof defect → migration.

A reported visual/motion defect routes through the same ownership rules.

Do not fix findings during review.

## Verdict semantics

### `compliant`

Use only when:

- all upstream artifacts and mandatory proof are current and complete;
- there are no blockers, major issues, minor issues, or accepted risks;
- required return stage is `none`;
- completion status is `complete`;
- final workflow verification readiness is `ready`;
- no operator-reported defect remains unresolved.

### `compliant-with-listed-risks`

Use only when every mandatory requirement above is complete and the remaining entries are explicit accepted non-blocking limitations, for example:

- bounded platform coverage that does not leave a required scenario unknown;
- a controlled documented renderer workaround with current proof;
- upstream uncertainty that does not affect the selected current contract.

It must not be used for:

- an unrun or failed required check;
- stale, missing, or invalid artifact;
- unresolved warning or finding;
- incomplete migration or unknown consumer state;
- missing proof;
- deferred required work;
- pending final workflow verification.

For this verdict, blockers, major issues, and minor issues must still be `none`, and accepted risks must name the exact bounded limitation and why it is non-blocking.

### `blocked`

Use for any unresolved required work, proof gap, warning caused by current work, semantic finding, invalid upstream artifact, operator-reported defect, or genuine project-command blocker.

Set the earliest return stage unless the blocker has no correctable family owner.

## Final-verifier routing

Given exact final verifier output:

1. identify the failed contract and evidence;
2. map it to the earliest owning stage using the ownership table;
3. update `REVIEW.md` to `Verdict: blocked`, `Completion status: blocked`, and `Final workflow verification readiness: blocked`;
4. set the exact `Required return stage`;
5. record the command and relevant output in the proof section without Git/PR interpretation;
6. return to the orchestrator.

If the failure is in `REVIEW.md` formatting or review-owned content, fix only `REVIEW.md`, then either restore a compliant verdict/readiness or keep it blocked with an exact reason. Review owns its own artifact.

If no family stage can correct a command-execution blocker, set return stage `none` and record the exact blocker.

## Required sections

After the control fields include:

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

Use `none` explicitly where applicable.

Do not list the expected pending final workflow command as a blocker, issue, risk, or item not required. Review records readiness; the orchestrator runs the command afterward.

## Completion

Review is complete only when the artifact contains valid fixed fields and accurately represents the complete current family.

A successful review means the family is ready for the orchestrator’s final workflow verification. It does not claim that command already passed.

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
- Marking compliant while required work, proof, warnings, or findings remain.
- Using `compliant-with-listed-risks` for incomplete work.
- Blocking only because positive visual acknowledgement is absent.
- Fabricating operator feedback.
- Running or claiming ownership of final workflow verification.
