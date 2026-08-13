# Material component staged workflow

## Decision

Every official Material family is handled by one operator command:

```text
material-component <name>
```

The command runs five isolated stages and one outer verification:

```text
DESIGN.md
  → ARCHITECTURE.md
  → implementation + IMPLEMENTATION.md
  → migration + MIGRATION.md
  → independent REVIEW.md
  → pnpm verify
```

The goal of the workflow is to help an agent implement a correct Mioframe Material component from official Material guidance and repository rules. Workflow metadata must stay subordinate to that goal.

This document is the single owner of the Material state machine.

## Core simplification

The workflow does not use timestamps, hashes, counters, Git commits, or artifact revision graphs as correctness identities.

`DESIGN.md` may be reused while it is current and its refresh date is not due. Every later reasoning stage is intentionally fresh on every operator invocation:

```text
current DESIGN
  → fresh ARCHITECTURE
  → fresh IMPLEMENTATION pass
  → fresh MIGRATION pass
  → fresh independent REVIEW
  → final verification
```

A fresh implementation or migration pass may conclude that existing code already satisfies the current contract and therefore make no production edit. It must still inspect and verify its owned scope before completing.

This deliberately trades a small amount of repeated agent work for a much simpler and more reliable workflow. Material families are normally migrated once; optimizing repeated invocations is not a current requirement.

Legacy `Artifact revision`, `Design contract revision`, and downstream revision-reference fields may remain in older artifacts. They are ignored by the workflow and must be removed when the owning stage next rewrites that artifact.

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
- run final verification;
- pass exact verifier failure output to a fresh review-routing worker;
- stop on a genuine blocker or malformed worker result.

It does not decide Material design, architecture, implementation, migration semantics, review findings, or verifier ownership.

### Stage workers

Design, architecture, implementation, migration, and review each run in a fresh isolated context and own their semantic decisions.

A worker must resolve every fixable defect owned by its stage before returning. It must not route to its own stage.

A stage returns only:

- successful;
- blocked with an exact route to an earlier stage or another family;
- genuinely blocked with no route.

`partial` is never a valid terminal state. Review must be independent from workers that authored or corrected architecture, implementation, or migration.

Workers do not depend on Git, PR, commit, branch, diff, or external-check state.

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

Architecture always runs fresh after current DESIGN is available.

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

Implementation always runs fresh after ready architecture.

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

## MIGRATION.md

Migration always runs fresh after complete implementation.

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

## REVIEW.md

Review always runs fresh after migration and must be independent.

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

Review reads current DESIGN, ARCHITECTURE, IMPLEMENTATION, MIGRATION, code, consumers, tests, renderer evidence, and current testing policy directly. It does not infer freshness from metadata.

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

Run the requested earlier stage, then run every downstream reasoning stage fresh through review.

Examples:

```text
review → architecture
  => architecture → implementation → migration → review

migration → implementation
  => implementation → migration → review
```

A design correction continues with fresh architecture and all later stages.

### Cross family

Retain invocation-local:

```text
origin: <origin-family>/<origin-stage>
target: <target-family>/<target-stage>
```

Run the target from the requested stage through fresh independent review. Then resume the origin by rerunning the origin stage and every later stage fresh. If the target can affect the origin architecture or dependency closure, restart the origin at architecture.

Nested routes unwind most-recent origin first.

No durable revision graph is needed because the current invocation never reuses downstream reasoning after an upstream correction.

## Mechanical algorithm

1. Resolve canonical family.
2. Validate or refresh DESIGN using the design lifecycle above.
3. Stop if DESIGN is genuinely blocked.
4. Run ARCHITECTURE fresh.
5. Process dependency queue; rerun parent ARCHITECTURE after dependencies.
6. Run IMPLEMENTATION fresh.
7. Run MIGRATION fresh.
8. Run independent REVIEW fresh.
9. Follow any exact correction route using the routing rules above.
10. When review is successful, run final verification.
11. On final-verifier failure, pass exact output to a fresh review-routing worker.
12. Stop only on a genuine family blocker, external workspace blocker, malformed stage result, or successful final verification.

Mechanical validation checks only fields, headings, dates, routes, and terminal-state combinations. It does not validate timestamps or revision identities.

## Final workflow verification

Ordinary Material work uses:

```text
pnpm verify
```

A Material-owned failure is routed to the exact family and earliest owning stage, then affected stages run fresh and the same final command is retried.

An external workspace blocker does not rewrite a compliant family review. Record it in the outer result and roadmap, then stop.

## Visual channel

Operator visual/motion inspection is an external defect-reporting channel. Absence of a report is not a blocker. A concrete defect routes to the owning family and stage.

## Completion

The invocation is complete only when:

- DESIGN is current;
- current-invocation architecture, implementation, migration, and independent review succeed;
- all dependencies processed in the invocation are complete;
- no reported defect remains unresolved;
- final verification passes.

The outer report records the current invocation result. Stage artifacts remain human-readable handoffs, not a workflow database.
