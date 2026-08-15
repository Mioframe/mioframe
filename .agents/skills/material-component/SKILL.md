---
name: material-component
description: 'Use with one Material component name to orchestrate isolated design, architecture, implementation, migration, and independent review stages, then hand the completed family to the architect for PR CI.'
---

# Material component

Accept one Material component name. The operator may additionally provide concrete visual, motion, accessibility, interaction, or geometry observations about that component in the current invocation.

Do not require an implementation brief, mode, files, dependency list, verification command, or repeated operator invocation. Treat exact operator observations as external evidence to preserve, not as architecture conclusions to reinterpret.

## Authority

Read applicable `AGENTS.md`, `src/shared/ui/material/docs/component-workflow.md`, `verification`, and the selected stage skill.

`component-workflow.md` is the single complete state-machine contract.

## Goal

The orchestrator exists to help isolated agents implement one correct Mioframe Material family from official Material guidance and repository rules. It must not grow its own workflow database, revision graph, timestamp protocol, hash registry, semantic review logic, or duplicate CI gate.

## Orchestrator boundary

The orchestrator may only:

- resolve the canonical family;
- validate fixed fields, required headings, dates, routes, and terminal-state combinations;
- decide whether DESIGN needs refresh;
- launch fresh isolated stage workers;
- process explicit dependency queues and correction routes;
- maintain an invocation-local dependency path and route stack;
- retain a compact execution ledger;
- retain exact operator observations supplied for the current family until review explicitly resolves or routes them;
- stop on a genuine family blocker or malformed worker result;
- hand a successfully reviewed family back to the architect as ready for PR/CI.

It must not evaluate official design, invent architecture, inspect code for semantic drift, discover consumers, infer dependencies, review proof, classify CI ownership, reinterpret operator observations into technical conclusions, or run a broad local verification merely to duplicate PR CI.

## Fresh-stage model

The workflow does not use artifact revisions as freshness identities.

Reuse `DESIGN.md` only while it is `current`, its refresh date is not due, and no canonical evidence requires refresh.

For every operator invocation after DESIGN is current, always execute fresh:

```text
architecture → implementation → migration → independent review
```

A fresh implementation or migration worker may make no production edit when current code already satisfies the current contract. It must still inspect and verify its owned scope.

Legacy revision/timestamp fields in existing artifacts are ignored and removed by the owning stage when that artifact is next rewritten.

## Worker boundary

Each stage runs in a fresh isolated context.

A handoff contains only the resolved family, selected stage skill, applicable rules, task-relevant workspace files, canonical artifact paths, active dependency path, exact dependency/route facts, and exact operator observations supplied for that family in the current invocation.

Pass operator observations verbatim or as a lossless factual normalization. Do not convert them into suspected causes, fixes, architecture decisions, or hidden reasoning. Architecture and review own their interpretation.

Do not pass hidden reasoning, copied worker reports, Git/PR state, or conversational conclusions.

Review must be independent from workers that authored or corrected architecture, implementation, or migration.

If fresh isolation is unavailable, stop with a genuine blocker.

## Family resolution

Normalize the supplied name against official Material names, existing `MD*` exports, and family paths.

Ask only when readable workspace and official evidence leave multiple materially different official components unresolved.

Canonical family values are exact `components/` path segments.

## Stage execution

Launch only:

- `material-component-design`;
- `material-component-architecture`;
- `material-component-implementation`;
- `material-component-migration`;
- `material-component-review`.

### DESIGN

Run design when DESIGN is missing, refresh date is due, newer official evidence exists, or an exact correction route targets design.

Otherwise reuse current DESIGN.

A genuinely blocked DESIGN stops the invocation.

### ARCHITECTURE

Run architecture fresh on every invocation after DESIGN is current.

Supply any exact operator observations for this family as current scenario/defect evidence. Architecture must account for them in the selected mapping, proof plan, risk, or an exact correction/blocker route; it must not silently omit them.

If architecture emits a dependency queue, process each dependency through its Material pipeline and independent review, then rerun parent architecture fresh.

### IMPLEMENTATION

Run implementation fresh after architecture is ready and dependency queue is empty.

Use focused verifier-managed checks required by the implementation contract. Do not run a broad local final gate solely for completion.

### MIGRATION

Run migration fresh after implementation is complete.

Use focused verifier-managed checks required by migration scope. Do not run a broad local final gate solely for completion.

### REVIEW

Run full independent review fresh after migration is complete.

Supply the same exact operator observations independently of the authored stage artifacts. Review must explicitly inspect each observation against the current implementation and proof; it may report `no-reported-defect` only when no operator defect was supplied or every supplied defect is demonstrably resolved in the current result. An unresolved observation requires the owning correction route or a genuine blocker.

A successful review means the family is ready to hand to the architect for PR creation and exact-head CI. It does not mean CI has already run.

## Result validation

After each worker returns, validate only its owned artifact structure, required headings, routes, terminal result, and preservation of supplied operator-observation status.

A worker must fix defects owned by its current stage before returning.

Reject:

- `partial`;
- a same-stage self-route;
- route to review;
- successful status with blockers or a route;
- blocked status without an exact blocker;
- malformed required fields/headings/dates;
- a successful review that reports `Operator visual status: no-reported-defect` while an operator-supplied defect remains unaddressed in the review artifact.

Do not validate timestamps, hashes, Git identities, revision chains, or the semantic correctness of a worker's claimed defect resolution; that remains review-owned.

## Dependency lifecycle

Start an invocation-local active dependency path with the requested family.

Before entering a queued dependency, detect self-dependency or a family already present in the active path.

On a cycle:

1. stop descending;
2. give the exact cycle path to the architecture worker that emitted it;
3. require architecture to remove the cycle or return a genuine blocker.

For a valid dependency:

1. append it to the active path;
2. process it through current independent review;
3. remove it when returning;
4. rerun parent architecture fresh.

Do not persist dependency review revision identities.

## Correction routing

A same-family route must target an earlier stage.

Run the target, then every downstream reasoning stage fresh through review.

For a cross-family route retain invocation-local:

```text
origin: <origin-family>/<origin-stage>
target: <target-family>/<target-stage>
```

Run the target from its requested stage through review. Then resume the origin with fresh downstream reasoning. If the correction can affect origin architecture or dependency closure, restart origin at architecture.

Nested cross-family routes unwind most-recent origin first.

Exact operator observations remain attached to their owning family across correction routes until a successful independent review explicitly resolves them.

## Mechanical algorithm

1. Resolve canonical family and retain exact operator observations for it.
2. Reuse or refresh DESIGN.
3. Run ARCHITECTURE fresh with the current operator observations.
4. Process dependencies and rerun parent ARCHITECTURE as needed.
5. Run IMPLEMENTATION fresh with focused local proof.
6. Run MIGRATION fresh with focused local proof.
7. Run independent REVIEW fresh with the same operator observations.
8. Follow exact correction routes until review succeeds or a genuine blocker is reached.
9. When review succeeds with every supplied observation addressed, return the family to the architect as ready for PR/CI.

GitHub CI is outside this coding-agent orchestration. If exact-head PR CI later fails, the architect owns the failure evidence and routes a correction back to the appropriate Material stage. A fresh `material-component-review` worker may classify supplied CI output in its routing mode; the coding agent itself does not fetch or own GitHub checks.

## Compact execution ledger

Retain one compact record per worker execution:

```text
family: <canonical-family>
stage: design | architecture | implementation | migration | review
result: complete | blocked | stage-contract-blocked
origin: none | <canonical-family>/<stage>
target: none | <canonical-family>/<stage>
dependency path: none | <family>[ → <family>...]
```

Do not retain full worker reports or artifact prose.

## Final report

```text
MATERIAL COMPONENT RESULT
Input component:
Resolved official component:
Canonical family:
Operator observations: none | <exact observations and disposition>
Execution ledger:
Dependencies processed:
Correction routes:
DESIGN.md status:
ARCHITECTURE.md status:
IMPLEMENTATION.md status:
MIGRATION.md status:
REVIEW.md verdict:
Local focused verification:
Operator visual status: no-reported-defect | defect-reported | not-applicable
Remaining blocker: none | <exact blocker>
Overall family status: complete | blocked
PR/CI readiness: ready | blocked
Next operator action: hand to architect for PR/CI | <single required action>
```

## Forbidden

- Requiring one operator command per stage.
- Reusing one worker context for multiple stages.
- Reusing downstream reasoning from an earlier invocation instead of fresh stages.
- Dropping, weakening, or silently rephrasing a concrete operator observation before architecture and independent review have addressed it.
- Converting an operator observation into a guessed technical cause or prescribed implementation in the orchestrator.
- Adding artifact timestamps, hashes, counters, or revision graphs as workflow correctness identities.
- Performing stage-owned reasoning or edits in the orchestrator.
- Selecting routes from prose.
- Retrying a genuine blocker without new evidence.
- Depending on Git, PR, commit, branch, or external checks for stage correctness.
- Running broad local `pnpm verify` or `pnpm verify:release` solely to duplicate the PR CI gate.
- Claiming merge readiness; merge readiness belongs to the architect after exact-head CI and full PR review.
