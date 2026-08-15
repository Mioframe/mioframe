---
name: material-component
description: 'Use with one Material component name to orchestrate isolated design, architecture, implementation, migration, and independent review stages, then hand the completed family to the architect for PR CI.'
---

# Material component

Accept one Material component name. The operator may additionally provide concrete visual, motion, accessibility, interaction, or geometry observations about that component in the current invocation.

Do not require an implementation brief, mode, files, dependency list, verification command, or repeated operator invocation. Treat exact operator observations as external evidence to preserve, not as architecture conclusions to reinterpret.

## Authority

Read applicable `AGENTS.md`, `src/shared/ui/material/docs/component-workflow.md`, `verification`, and the selected stage skill.

`component-workflow.md` is the single complete state-machine contract. This skill implements that state machine mechanically and must not duplicate stage semantics.

## Goal

Help isolated agents implement one correct Mioframe Material family from official Material guidance and repository rules while keeping repeated correction work proportional to the defect being fixed.

Correctness comes from authoritative artifacts, focused owned proof, preserved operator evidence, and a fresh independent review after every normal or correction path — not from repeatedly re-deriving already-valid decisions.

## Orchestrator boundary

The orchestrator may only:

- resolve the canonical family;
- validate fixed fields, required headings, dates, routes, and terminal-state combinations;
- decide whether DESIGN needs refresh;
- launch fresh isolated stage workers;
- process explicit dependency queues and correction routes;
- maintain an invocation-local dependency path and route stack;
- retain a compact execution ledger;
- retain a minimal correction capsule containing exact unresolved findings and exact operator observations;
- stop on a genuine family blocker or malformed worker result;
- hand a successfully reviewed family back to the architect as ready for PR/CI.

It must not evaluate official design, invent architecture, inspect code for semantic drift, discover consumers, infer dependencies, review proof, classify CI ownership, reinterpret operator observations into technical conclusions, or run a broad local verification merely to duplicate PR CI.

## Fresh-stage model

Fresh means a fresh isolated worker context.

Normal path after current DESIGN:

```text
architecture → implementation → migration → independent review
```

Correction path is intentionally narrower. A fresh correction worker receives the current canonical artifacts plus the exact correction capsule, corrects the affected contract, and expands only when its own evidence shows wider invalidation.

Every correction path still ends in a fresh independent review of the complete resulting selected family contract. That review is the guard against incorrectly preserving stale downstream work.

Do not re-run migration automatically after a family-local architecture or implementation correction. Preserve current MIGRATION.md and let the independent review route to migration only if the corrected result invalidates consumer semantics, legacy disposition, or migration proof.

## Worker boundary

Each stage runs in a fresh isolated context.

A normal-path handoff contains only the resolved family, selected stage skill, applicable rules, task-relevant workspace files, canonical artifact paths, active dependency path, exact dependency facts, and exact operator observations supplied for that family.

A correction-path handoff additionally contains the minimal correction capsule:

```text
family: <canonical-family>
origin stage: <stage | operator>
target stage: <stage>
finding: <exact observable/contract defect>
affected contract/proof: <concise exact scope>
operator observations: none | <verbatim or lossless factual normalization>
```

Pass observations verbatim or as a lossless factual normalization. Do not convert them into suspected causes, fixes, architecture decisions, or hidden reasoning.

Do not pass previous worker reports, hidden reasoning, Git/PR state, or external-check state.

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

Run design when DESIGN is missing, refresh date is due, newer canonical evidence exists, or an exact correction route targets design. Otherwise reuse current DESIGN.

A genuine blocked DESIGN stops the invocation.

### ARCHITECTURE

Normal path: run architecture fresh after DESIGN is current.

Correction path: run architecture fresh with the correction capsule and require it to correct the affected decision while preserving unrelated valid decisions unless evidence shows broader invalidation.

If architecture emits a dependency queue, process dependencies through their Material pipeline and independent review, then rerun parent architecture fresh.

### IMPLEMENTATION

Run implementation fresh after ready architecture when the normal path or correction routing requires it.

Use focused verifier-managed checks required by the implementation contract. In correction mode, the checks and file inspection should stay scoped to the corrected contract unless evidence requires expansion.

Do not run a broad local final gate solely for completion.

### MIGRATION

Normal path: run migration fresh after implementation.

Correction path: run migration only when the correction route explicitly targets migration or a subsequent independent review determines that preserved MIGRATION.md is stale.

Do not rerun an already-proven no-consumer migration merely because a family-local story, proof, renderer mapping, or implementation detail was corrected.

### REVIEW

Run full independent review fresh after the normal migration path and after every correction path.

Review receives the unresolved correction capsule/operator observations and must explicitly resolve them or return an exact route. It also checks whether any preserved downstream artifact, including MIGRATION.md, became stale.

A successful review means the family is ready to hand to the architect for PR creation and exact-head CI. It does not mean CI has already run.

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

Build one minimal correction capsule from the exact finding. Do not retain the full emitting worker report.

### Same family

Use these paths:

```text
design correction
  → design → architecture → implementation → migration → review

architecture correction
  → architecture → implementation → review

implementation correction
  → implementation → review

migration correction
  → migration → review
```

A review after architecture/implementation correction validates the preserved MIGRATION.md. If it is stale, it routes once to migration, then migration → review.

If two correction rounds for the same underlying defect still reveal ownership drift, missing scenarios, mixed responsibilities, or workaround growth, stop narrow correction and restart with full architecture using the unresolved finding and operator evidence explicitly.

### Cross family

Retain invocation-local:

```text
origin: <origin-family>/<stage>
target: <target-family>/<stage>
```

Run the target from its requested stage through independent review. Then resume the origin at the earliest stage actually invalidated by the dependency correction; when in doubt about architecture/dependency closure, restart origin architecture. Always finish with a fresh independent origin review.

Nested routes unwind most-recent origin first.

## Evidence and token economy

Do not ask workers to reproduce broad prior reasoning merely to prove freshness.

- Use the current canonical artifacts as indexes to the exact relevant Material sections, renderer docs, files, and proof.
- Correction workers receive the exact unresolved contract and inspect adjacent scope only as needed.
- Do not pass copied source excerpts or previous narrative reports between workers.
- Do not require migration/repository-wide consumer searches again when current migration already proves a no-consumer case and the correction cannot itself establish a consumer; independent review checks staleness.
- Do not require repeated broad verifier runs; use the smallest faithful verifier-managed scope and exact-head CI later.
- Keep worker reports compact: decisions, changed files/contracts, proof, route, blocker. Detailed durable facts belong in the owning artifact only when later stages need them.

Efficiency never permits skipping the fresh independent review, required browser/visual proof, exact renderer-documentation checks for affected mappings, or unresolved operator observations.

## Mechanical algorithm

Normal path:

1. Resolve canonical family.
2. Reuse or refresh DESIGN.
3. Run ARCHITECTURE fresh.
4. Process dependencies and rerun parent ARCHITECTURE as needed.
5. Run IMPLEMENTATION fresh with focused local proof.
6. Run MIGRATION fresh with focused local proof.
7. Run independent REVIEW fresh.
8. Hand off only when review succeeds and no operator observation remains unresolved.

Correction path:

1. Build the correction capsule.
2. Run the target stage fresh, scoped to that exact defect.
3. Run only the downstream stage(s) listed in `Correction routing`.
4. Run a fresh independent REVIEW.
5. Follow any exact route. After two unsuccessful narrow rounds for the same underlying defect, restart at full architecture.
6. Hand off only when review succeeds and no operator observation remains unresolved.

GitHub CI is outside this coding-agent orchestration. If exact-head PR CI later fails, the architect owns the failure evidence and routes a correction back to the appropriate Material stage.

## Compact execution ledger

Retain one compact record per worker execution:

```text
family: <canonical-family>
stage: design | architecture | implementation | migration | review
mode: normal | correction
result: complete | blocked | stage-contract-blocked
origin: none | <canonical-family>/<stage | operator>
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
- Re-running every downstream stage automatically after a narrow correction.
- Re-deriving unrelated valid family decisions merely to demonstrate freshness.
- Adding artifact timestamps, hashes, counters, or revision graphs as workflow correctness identities.
- Performing stage-owned reasoning or edits in the orchestrator.
- Selecting routes from prose instead of fixed route fields/correction evidence.
- Retrying a genuine blocker without new evidence.
- Dropping or reinterpreting a concrete operator observation before independent review resolves it.
- Depending on Git, PR, commit, branch, or external checks for stage correctness.
- Running broad local `pnpm verify` or `pnpm verify:release` solely to duplicate the PR CI gate.
- Claiming merge readiness; merge readiness belongs to the architect after exact-head CI and full PR review.
