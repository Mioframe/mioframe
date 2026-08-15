# Material component staged workflow

## Decision

Every official Material family is handled by one operator command:

```text
material-component <name>
```

The command runs five isolated stages for the normal first-pass path:

```text
DESIGN.md
  → ARCHITECTURE.md
  → implementation + IMPLEMENTATION.md
  → migration + MIGRATION.md
  → independent REVIEW.md
  → handoff to architect for PR/CI
```

The goal of the workflow is to help an agent implement a correct Mioframe Material component from official Material guidance and repository rules. Workflow metadata and verification orchestration must stay subordinate to that goal.

This document is the single owner of the Material state machine.

## Core simplification

The workflow does not use timestamps, hashes, counters, Git commits, or artifact revision graphs as correctness identities.

`DESIGN.md` may be reused while it is current and its refresh date is not due.

For a normal invocation, later reasoning stages run in fresh isolated workers:

```text
current DESIGN
  → fresh ARCHITECTURE
  → fresh IMPLEMENTATION pass
  → fresh MIGRATION pass
  → fresh independent REVIEW
  → PR/CI handoff
```

Fresh isolation means fresh worker context, not mandatory re-derivation of every already-resolved family fact after a narrow correction. A correction route uses a fresh worker for the target stage, but that worker starts from the current canonical artifacts plus the exact unresolved finding and limits work to the affected contract unless evidence shows wider invalidation.

After every correction, a fresh independent review re-evaluates the complete resulting family and decides whether any preserved downstream artifact became stale. This review is the safety boundary that allows narrow correction stages without weakening final quality.

Existing compliant implementation or migration may require no production edit. Workers inspect and verify only the scope needed to prove their owned contracts.

Legacy `Artifact revision`, `Design contract revision`, and downstream revision-reference fields may remain in older artifacts. They are ignored by the workflow and must be removed when the owning stage next rewrites that artifact.

## Evidence economy

Stage artifacts are contracts and durable evidence indexes, not execution transcripts.

- Read the minimum authoritative Material and exact-version renderer documentation needed for the selected scenario and affected contract; expand only when evidence is ambiguous or reveals broader impact.
- Prefer exact section/path references, compact mapping tables, and observable conclusions over copied source excerpts or narrated searches.
- Do not repeat unchanged renderer token chains, repository searches, arithmetic, or verification prose across ARCHITECTURE, IMPLEMENTATION, MIGRATION, and REVIEW.
- In correction mode, update only affected artifact sections plus any control fields whose meaning changed. Preserve unrelated valid decisions instead of rewriting them as a new narrative.
- A worker may inspect broader context when required for correctness, but its artifact records only conclusions needed by later stages.
- Verification reports list commands/results and unresolved evidence; they do not reproduce test implementation or CI-style logs.

Conciseness must not remove a required decision, mapping, acceptance criterion, proof owner, finding, or correction route.

## Boundaries

### Orchestrator

The orchestrator may only:

- resolve the canonical family;
- inspect fixed stage fields, required headings, dates, routes, and terminal-state combinations;
- decide whether DESIGN must refresh;
- launch fresh isolated stage workers;
- process explicit dependency queues and correction routes;
- maintain an invocation-local dependency path and route stack;
- retain a compact execution ledger;
- retain exact unresolved findings and exact operator observations as an invocation-local correction capsule;
- stop on a genuine blocker or malformed worker result;
- hand a successfully reviewed family back to the architect for PR/CI.

It does not decide Material design, architecture, implementation, migration semantics, review findings, CI ownership, or merge readiness.

It does not run a broad local `pnpm verify` merely to duplicate the exact-head PR CI gate.

### Stage workers

Design, architecture, implementation, migration, and review each run in a fresh isolated context and own their semantic decisions.

A worker must resolve every fixable defect owned by its stage before returning. It must not route to its own stage.

A stage returns only:

- successful;
- blocked with an exact route to an earlier stage or another family;
- genuinely blocked with no route.

`partial` is never a valid terminal state. Review must be independent from workers that authored or corrected architecture, implementation, or migration.

Workers do not depend on Git, PR, commit, branch, diff, or external-check state.

### Correction capsule

When a stage or operator identifies a concrete unresolved defect, the orchestrator retains only the minimum lossless facts needed to route it:

```text
family: <canonical-family>
origin stage: <stage | operator>
target stage: <stage>
finding: <exact observable/contract defect>
affected contract/proof: <concise exact scope>
operator observations: none | <verbatim or lossless factual normalization>
```

Do not retain the previous worker's full report or hidden reasoning. Do not turn an operator observation into a guessed cause or prescribed fix. The target worker owns diagnosis and correction.

## Routing grammar

Successful artifacts use:

```text
Required return family: none
Required return stage: none
```

A correction route uses:

```text
Required return family: self | <canonical-family>
Required return stage: design | architecture | implementation | migration
```

Mixed `none` and non-`none` values are invalid.

Same-family routes must target an earlier stage:

| Emitting stage | Allowed same-family targets                     |
| -------------- | ----------------------------------------------- |
| design         | none                                            |
| architecture   | design                                          |
| implementation | design; architecture                            |
| migration      | design; architecture; implementation            |
| review         | design; architecture; implementation; migration |

Routes to review and same-stage self-routes are invalid.

A blocked result with route `none/none` is a genuine terminal blocker.

## DESIGN.md

Control fields:

```text
Status: current | blocked
Source revision: <exact source/cache revision>
Source checked at: YYYY-MM-DD
Refresh check after: YYYY-MM-DD
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none
Required return stage: none
```

Required headings:

```text
## Source ledger
## Identity and purpose
## Anatomy and content
## Variants and configurations
## Geometry and layout
## States and behavior
## Usage guidance
## Accessibility
## Complete official token catalogue
## Source conflicts and unknowns
## Related official contracts
```

The refresh interval is fixed:

```text
Refresh check after = Source checked at + 30 calendar days
```

Run design when:

- DESIGN is missing;
- status is `blocked` and a source condition has materially changed;
- refresh date is due;
- canonical evidence records newer official Material content;
- an exact correction route targets design.

Otherwise reuse current DESIGN for the invocation.

A blocked design has an exact blocker and route `none/none`.

## ARCHITECTURE.md

Architecture runs in a fresh worker after current DESIGN is available. On the normal path it resolves the complete family architecture. On a correction route it corrects the exact affected decision and checks adjacent decisions only far enough to prove the artifact remains complete and internally consistent.

Control fields:

```text
Status: ready | blocked
DESIGN.md reference: <path>
Renderer revision: @m3e/web@<lockfile-resolved-version>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Implementation readiness: ready | awaiting-dependencies | blocked
Dependency families: none | <canonical-family>[; <canonical-family>...]
Dependency queue: none | <canonical-family>[; <canonical-family>...]
```

Required headings:

```text
## Goal
## Non-goals
## Current scenarios
## Selected and deferred Material surface
## Dependency closure
## Ownership
## Public Vue API
## Public token contract
## Renderer mapping and gaps
## State precedence and restoration
## Implementation passes
## TEST IMPACT
## Migration plan
## Acceptance criteria
## Risks
## Forbidden
## Implementation readiness
```

Architecture resolves every coding decision. A non-empty dependency queue uses `Status: ready` with `Implementation readiness: awaiting-dependencies` and no correction route.

After queued dependencies complete through independent review, parent architecture runs fresh again. It does not persist dependency review revision identities.

## IMPLEMENTATION.md

Implementation runs in a fresh worker after ready architecture. On a correction path, implementation consumes the exact correction capsule and corrected architecture, edits only affected component/proof files unless the correction changes a wider contract, and runs the smallest faithful verifier-managed checks for the affected proof.

Control fields:

```text
Status: complete | blocked
ARCHITECTURE.md reference: <path>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Architecture deviations: none | <exact deviations>
Migration readiness: ready | blocked
```

Required headings:

```text
## Implemented passes
## Public API implemented
## Tokens and renderer mappings
## Dependencies
## Component-owned proof
## Stage verification
## Architecture deviations
## Remaining blockers
## Migration readiness
```

The worker compares current code and proof directly with current ARCHITECTURE. Existing compliant code may require no production edit. Any current-stage defect must be fixed before success.

Use focused verifier-managed local checks needed for implementation feedback and contract proof. A broad local repository gate is not required merely for stage completion.

## MIGRATION.md

Migration runs in a fresh worker on the normal path after complete implementation, and whenever a correction route explicitly targets migration.

It is not automatically rerun after every same-family architecture or implementation correction. The existing MIGRATION.md remains evidence to be checked by the next independent review. If the corrected result changes consumer-facing semantics, migration inventory, legacy disposition, or migration proof, review must route to migration before the family can complete.

Control fields:

```text
Status: complete | blocked
IMPLEMENTATION.md reference: <path>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Review readiness: ready | blocked
```

Required headings:

```text
## Consumer inventory
## Migrated consumers
## Preserved scenarios and failure paths
## Legacy ownership removed
## Consumer and blast-radius proof
## Stage verification
## Remaining blockers
## Review readiness
```

When no consumer or legacy owner exists, record `none` / `not applicable`; do not invent a product consumer.

The worker compares current consumers directly with current architecture and implementation. Existing compliant migration may require no production edit.

Use focused verifier-managed local checks needed for migration feedback and preserved-scenario proof. A broad local repository gate is not required merely for stage completion.

For an already-proven no-consumer case in a correction route, do not rerun migration merely to repeat the same repository search. Independent review verifies that the preserved MIGRATION.md still matches the corrected family.

## REVIEW.md

Review always runs fresh after the normal migration path and after every correction path, and must be independent.

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

`Final workflow verification readiness` means the family is ready for exact-head PR CI. It does not require the review worker or orchestrator to execute that CI gate locally.

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

Review reads enough current DESIGN, ARCHITECTURE, IMPLEMENTATION, MIGRATION, code, consumers, tests, renderer evidence, and testing policy to independently evaluate the complete selected family contract. It prioritizes the correction capsule and operator observations, then verifies the rest of the selected contract and migration consistency. Complete review coverage does not require narrating or re-deriving unrelated deferred surfaces.

`compliant-with-listed-risks` is only for complete work with bounded non-blocking limitations. Missing proof, unresolved findings, unknown consumers, or deferred required work are not accepted risks.

## Dependency handling

Architecture records only the direct dependency families and the dependencies that still require processing in the current invocation.

For each queued dependency:

1. append it to the invocation-local active dependency path;
2. run its normal Material pipeline through fresh independent review;
3. remove it from the path when returning;
4. rerun parent architecture fresh.

A dependency with an already-complete canonical implementation and successful review may still be revalidated by its own invocation. No persistent dependency revision graph is required.

Before entering a dependency, detect self-dependency or an ancestor already in the active path. Return the exact cycle to the architecture worker that emitted it. Architecture must correct ownership or return a genuine blocker.

## Correction routing

### Same family

Use the exact correction capsule and fresh isolated workers, but do not automatically repeat unaffected downstream stages.

- `review → design`: design → architecture → implementation → migration → review. Design changes may invalidate the whole family, so the full downstream path is required.
- `review/migration/implementation → architecture`: architecture → implementation → review. Preserve the current MIGRATION.md; review routes to migration only if the corrected contract makes it stale.
- `review/migration → implementation`: implementation → review. Preserve the current MIGRATION.md; review routes to migration only if implementation changes invalidate it.
- `review → migration`: migration → review.

The same principle applies when an earlier stage emits the route: execute the target and only the stages listed above, then independent review.

If review routes to migration because a preserved MIGRATION.md is stale, run migration once and review again.

If two correction rounds for the same underlying defect still reveal ownership drift, missing scenarios, mixed responsibilities, or workaround growth, stop narrow correction and restart at full architecture with the unresolved defect and operator evidence explicit.

### Cross family

Retain invocation-local:

```text
origin: <origin-family>/<origin-stage>
target: <target-family>/<target-stage>
```

Run the target from the requested stage through fresh independent review. Then resume the origin. If the target can affect the origin architecture or dependency closure, restart the origin at architecture; otherwise resume at the earliest actually invalidated origin stage. Always finish with a fresh independent origin review.

Nested routes unwind most-recent origin first.

No durable revision graph is needed because correction scope and unresolved evidence remain invocation-local.

## Mechanical algorithm

Normal path:

1. Resolve canonical family.
2. Validate or refresh DESIGN using the design lifecycle above.
3. Stop if DESIGN is genuinely blocked.
4. Run ARCHITECTURE fresh.
5. Process dependency queue; rerun parent ARCHITECTURE after dependencies.
6. Run IMPLEMENTATION fresh with focused local proof.
7. Run MIGRATION fresh with focused local proof.
8. Run independent REVIEW fresh.
9. When review is successful, stop agent orchestration and hand the family to the architect for PR creation and exact-head CI.

Correction path:

1. Build the minimal correction capsule from the exact finding/operator observation.
2. Run the target stage in a fresh worker scoped to that defect.
3. Run only the required downstream stage(s) from `Correction routing`.
4. Run a fresh independent REVIEW of the complete resulting family.
5. Follow any new exact route; after two unsuccessful narrow rounds for the same underlying defect, restart at full architecture.
6. Hand off only when no operator observation or review finding remains unresolved.

Mechanical validation checks only fields, headings, dates, routes, and terminal-state combinations. It does not validate timestamps or revision identities.

## CI failure routing

GitHub CI is outside the coding-agent Material invocation and is owned by the architect/PR workflow.

If exact-head PR CI later fails:

1. the architect captures the exact failed check/output;
2. classify whether an exact Material family/stage owns the failure;
3. route a correction to that stage when Material-owned;
4. run focused local proof for the correction;
5. push the correction and let CI rerun the authoritative exact-head gate.

A fresh `material-component-review` worker may classify supplied CI output in its routing mode. An external workspace failure must not rewrite a compliant family `REVIEW.md`.

## Visual channel

Operator visual/motion inspection is an external defect-reporting channel. Absence of a report is not a blocker. A concrete defect is preserved in the invocation-local correction capsule and remains unresolved until a fresh independent review explicitly verifies the corrected observable behavior or routes it again.

## Completion

The coding-agent invocation is complete when:

- DESIGN is current;
- the current normal path or correction path has reached a successful independent review;
- all dependencies processed in the invocation are complete;
- no reported defect remains unresolved;
- review declares `Final workflow verification readiness: ready`.

The resulting family is then ready for architect-owned PR creation and exact-head GitHub CI. Merge readiness is decided only after CI and full PR review.

Stage artifacts remain human-readable handoffs, not a workflow database.
