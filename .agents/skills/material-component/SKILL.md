---
name: material-component
description: 'Use with one Material component name to orchestrate isolated design, architecture, implementation, migration, and independent review stages, then run one final project verification.'
---

# Material component

Accept exactly one operator input: the Material component name.

Do not require an implementation brief, mode, files, dependency list, verification command, or repeated operator invocation.

## Authority

Read applicable `AGENTS.md`, `src/shared/ui/material/docs/component-workflow.md`, `verification`, and the selected stage skill.

`component-workflow.md` is the single complete state-machine contract.

## Goal

The orchestrator exists to help isolated agents implement one correct Mioframe Material family from official Material guidance and repository rules. It must not grow its own workflow database, revision graph, timestamp protocol, hash registry, or semantic review logic.

## Orchestrator boundary

The orchestrator may only:

- resolve the canonical family;
- validate fixed fields, required headings, dates, routes, and terminal-state combinations;
- decide whether DESIGN needs refresh;
- launch fresh isolated stage workers;
- process explicit dependency queues and correction routes;
- maintain an invocation-local dependency path and route stack;
- retain a compact execution ledger;
- run final read-only verification;
- pass exact failed verifier output to a fresh review-routing worker;
- stop on a genuine family blocker, external workspace blocker, or malformed worker result.

It must not evaluate official design, invent architecture, inspect code for semantic drift, discover consumers, infer dependencies, review proof, or classify verifier ownership itself.

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

A handoff contains only the resolved family, selected stage skill, applicable rules, task-relevant workspace files, canonical artifact paths, active dependency path, and exact dependency/route/verifier facts.

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

If architecture emits a dependency queue, process each dependency through its Material pipeline and independent review, then rerun parent architecture fresh.

### IMPLEMENTATION

Run implementation fresh after architecture is ready and dependency queue is empty.

### MIGRATION

Run migration fresh after implementation is complete.

### REVIEW

Run full independent review fresh after migration is complete.

## Result validation

After each worker returns, validate only its owned artifact structure, required headings, routes, and terminal result.

A worker must fix defects owned by its current stage before returning.

Reject:

- `partial`;
- a same-stage self-route;
- route to review;
- successful status with blockers or a route;
- blocked status without an exact blocker;
- malformed required fields/headings/dates.

Do not validate timestamps, hashes, Git identities, or revision chains.

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

## Mechanical algorithm

1. Resolve canonical family.
2. Reuse or refresh DESIGN.
3. Run ARCHITECTURE fresh.
4. Process dependencies and rerun parent ARCHITECTURE as needed.
5. Run IMPLEMENTATION fresh.
6. Run MIGRATION fresh.
7. Run independent REVIEW fresh.
8. Follow exact correction routes until review succeeds or a genuine blocker is reached.
9. Run final verification.
10. On verifier failure, pass exact command/output to a fresh `material-component-review` worker in final-verifier-routing mode.
11. Follow a Material-owned route or stop on an external workspace blocker.

## Final workflow verification

Ordinary Material work uses:

```text
pnpm verify
```

A Material-owned verifier failure routes to the exact family and earliest owning stage; affected stages then run fresh and the same final command is retried.

An external workspace blocker must not rewrite a compliant family review.

## Compact execution ledger

Retain one compact record per worker execution:

```text
family: <canonical-family>
stage: design | architecture | implementation | migration | review
result: complete | blocked | stage-contract-blocked
origin: none | <canonical-family>/<stage>
target: none | <canonical-family>/<stage>
dependency path: none | <family>[ → <family>...]
verification: not-applicable | passed | failed | blocked
```

Do not retain full worker reports or artifact prose.

## Final report

```text
MATERIAL COMPONENT RESULT
Input component:
Resolved official component:
Canonical family:
Execution ledger:
Dependencies processed:
Correction routes:
DESIGN.md status:
ARCHITECTURE.md status:
IMPLEMENTATION.md status:
MIGRATION.md status:
REVIEW.md verdict:
Final workflow verification command:
Final workflow verification result:
Final verifier classification: none | material-owned | external-workspace-blocker
Operator visual status: no-reported-defect | defect-reported | not-applicable
Remaining blocker: none | <exact blocker>
Overall family status: complete | blocked
Next operator action: none | <single required action>
```

## Forbidden

- Requiring one operator command per stage.
- Reusing one worker context for multiple stages.
- Reusing downstream reasoning from an earlier invocation instead of fresh stages.
- Adding artifact timestamps, hashes, counters, or revision graphs as workflow correctness identities.
- Performing stage-owned reasoning or edits in the orchestrator.
- Selecting routes from prose.
- Retrying a genuine blocker without new evidence.
- Depending on Git, PR, commit, branch, or external checks for stage correctness.
- Marking completion before final verification passes.
