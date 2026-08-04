# Material component staged workflow

## Decision

Every official Material family progresses through five isolated stages and one outer verification:

```text
DESIGN.md
  → ARCHITECTURE.md
  → implementation + IMPLEMENTATION.md
  → migration + MIGRATION.md
  → independent REVIEW.md
  → final workflow verification
```

The operator invokes `material-component <name>` once. The orchestrator continues until completion or one genuine recorded blocker.

This document is the single complete owner of the Material state machine.

## Boundaries

### Orchestrator

The orchestrator may only:

- resolve canonical family names;
- validate exact fields, headings, dates, revisions, route invariants, and terminal-state invariants;
- compare renderer and dependency-review revisions with current workspace facts;
- process explicit dependency queues and correction routes;
- maintain an invocation-local active dependency path and route stack;
- retain a compact execution ledger;
- launch fresh isolated workers;
- run final verification;
- pass exact verifier output to a fresh review-routing worker;
- stop on a genuine blocker or malformed worker result.

It does not evaluate design, architecture, code, consumers, proof, dependencies, or verifier meaning.

### Stage workers

Design, architecture, implementation, migration, and review each run in a fresh isolated context and own their semantic decisions.

A worker must resolve every defect owned by its current stage with the available stage mechanisms before returning. It must not route back to the same family and same stage.

A worker returns one terminal stage result:

- successful;
- blocked with an exact correction route to an earlier stage or another family;
- genuinely blocked with no route.

A worker must not finish with `stale`, `partial`, or another temporary state.

Review is independent from workers that authored or corrected architecture, implementation, or migration.

If fresh isolation is unavailable, the workflow is genuinely blocked. Workers do not depend on Git, PR, commit, branch, diff, or external-check state.

## Common field grammar

Canonical family values are exact path segments under `components/`, such as `button` or `loadingIndicator`.

Every artifact has:

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
```

The owning worker writes a new UTC artifact revision whenever the file is rewritten or refreshed. It must not reuse a revision after content changes.

Routing fields use exactly one pair:

```text
Required return family: none
Required return stage: none
```

or:

```text
Required return family: self | <canonical-family>
Required return stage: design | architecture | implementation | migration
```

Mixed `none` and non-`none` values are invalid.

### Route restrictions

A same-family route must target a strictly earlier stage than the artifact that emits it:

| Emitting stage | Allowed same-family targets                     |
| -------------- | ----------------------------------------------- |
| design         | none                                            |
| architecture   | design                                          |
| implementation | design; architecture                            |
| migration      | design; architecture; implementation            |
| review         | design; architecture; implementation; migration |

A route to another family may target design, architecture, implementation, or migration.

Same-stage self-routes and routes to review are invalid. Review-owned output defects must be corrected in the current review worker.

### Blocked-state semantics

A valid blocked artifact has exactly one meaning:

```text
blocked + route non-none
  → correction is possible in an earlier stage or another family

blocked + route none/none
  → genuine terminal blocker; stop the workflow
```

A successful artifact has route `none/none` and no blockers.

A worker that cannot complete its own stage after exhausting the available mechanisms records `blocked`, an exact blocker, and route `none/none`. It does not ask the orchestrator to rerun the same stage.

### Mechanical invalidity

An artifact is mechanically invalid when:

- a required field or heading is missing;
- a value or date is malformed;
- revision or dependency invariants fail;
- route fields are inconsistent;
- a same-family route does not target a strictly earlier stage;
- a successful state contains blockers or a route;
- a blocked state contains neither an exact blocker nor a valid correction route;
- an old terminal artifact contains `partial`;
- an invalidating upstream revision differs from the current upstream artifact.

Before a stage runs, an externally recorded `stale` state is a retry marker and causes the owning stage to run. After a worker runs, `stale` is not an allowed terminal result.

No hash system, registry, parser framework, or workflow database is required.

## DESIGN.md

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
Design contract revision: none | YYYY-MM-DDTHH:mm:ss.sssZ
Status: current | stale | blocked
Source revision: <exact source/cache revision>
Source checked at: YYYY-MM-DD
Refresh check after: YYYY-MM-DD
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none
Required return stage: none
```

The design worker may finish only with `current` or `blocked`.

- `current` requires a non-`none` contract revision, valid dates, all headings, no blockers, and route `none/none`.
- `blocked` means the official contract cannot be completed with the available sources and fallbacks; it has an exact blocker and route `none/none`.
- `stale` is only an external pre-run marker.

`Artifact revision` tracks every file update. `Design contract revision` changes only when normalized official Material content changes.

The refresh interval is fixed:

```text
Refresh check after = Source checked at + 30 calendar days
```

A metadata-only refresh writes a new artifact revision and dates while preserving the exact design contract revision. It does not invalidate downstream stages.

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

## ARCHITECTURE.md

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
Status: ready | stale | blocked
DESIGN.md reference: <path>
DESIGN.md contract revision: <exact Design contract revision>
Renderer revision: @m3e/web@<lockfile-resolved-version>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Implementation readiness: ready | awaiting-dependencies | blocked
Dependency families: none | <canonical-family>[; <canonical-family>...]
Dependency queue: none | <canonical-family>[; <canonical-family>...]
Dependency review revisions: none | <canonical-family>=<REVIEW Artifact revision>[; <canonical-family>=<REVIEW Artifact revision>...]
```

The architecture worker may finish only with `ready` or `blocked`.

- `ready` may use readiness `ready` or `awaiting-dependencies` and has no blockers or route.
- `blocked` may route to `self/design` or another family/stage when an upstream correction is required.
- An unresolved architecture decision owned by the current architecture worker is terminal `blocked` with route `none/none`.
- `stale` is only an external pre-run marker.

Dependency invariants:

- queue and review-revision families are disjoint;
- their union equals `Dependency families`;
- every recorded review revision is current;
- self-dependency and active-path ancestor dependency are forbidden;
- a non-empty queue requires readiness `awaiting-dependencies` and route `none/none`.

Every queued dependency runs its full pipeline through current independent review. Afterward parent architecture runs again and records current dependency review revisions.

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

## IMPLEMENTATION.md

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
Status: complete | stale | blocked
ARCHITECTURE.md reference: <path>
ARCHITECTURE.md revision: <exact Artifact revision>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Architecture deviations: none | <exact deviations>
Migration readiness: ready | blocked
```

The implementation worker may finish only with `complete` or `blocked`.

- `complete` requires the current architecture revision, completed proof, no deviations, no blockers, route `none/none`, and migration readiness `ready`.
- `blocked` may route to `self/design`, `self/architecture`, or another family/stage when upstream correction is required.
- A component-owned implementation or proof defect must be fixed in the current worker. If it remains impossible after available mechanisms are exhausted, return terminal `blocked` with route `none/none`.
- `stale` is only an external pre-run marker.

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

## MIGRATION.md

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
Status: complete | stale | blocked
IMPLEMENTATION.md reference: <path>
IMPLEMENTATION.md revision: <exact Artifact revision>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Review readiness: ready | blocked
```

The migration worker may finish only with `complete` or `blocked`.

- `complete` requires the current implementation revision, completed consumer/no-consumer proof, no blockers, route `none/none`, and review readiness `ready`.
- `blocked` may route to `self/design`, `self/architecture`, `self/implementation`, or another family/stage when upstream correction is required.
- A migration-owned consumer, legacy-removal, product-scenario, impact-metadata, or proof defect must be fixed in the current worker. If it remains impossible after available mechanisms are exhausted, return terminal `blocked` with route `none/none`.
- `stale` is only an external pre-run marker.

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

When no consumer or legacy owner exists, record `none` and `not applicable`; do not create a product consumer.

## REVIEW.md

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

- A compliant verdict requires current revisions, no findings, route `none/none`, completion `complete`, and final-verification readiness `ready`.
- `blocked` with a route assigns an exact earlier-stage or other-family correction.
- A genuine unresolvable family-review blocker uses route `none/none`.
- Review-owned formatting or routing-output defects are fixed in the current review worker; review cannot route to review.
- `Final workflow verification readiness` describes whether the family is ready for the outer command. It does not store the result of that command.
- A final-verifier failure outside every Material family must not change any family `REVIEW.md` verdict, completion status, readiness, or artifact revision.

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

`compliant-with-listed-risks` is only for complete work with bounded non-blocking limitations. It cannot represent missing checks, stale artifacts, warnings, unresolved findings, unknown consumers, missing proof, or deferred required work.

## No-consumer scenario

When no current consumer exists, the invocation establishes one approved library scenario:

- implement the unambiguous official standalone default;
- expose only the API required to render and accessibly operate that default;
- expose only mandatory controllable state belonging to that selected default;
- do not add `v-model`, selection, toggle, value, or open-state contracts unless required by the selected official default;
- defer optional variants, sizes, shapes, configurations, and state models;
- do not invent product demand or copy renderer capability.

## Mechanical algorithm

For each artifact in stage order:

1. **Validate mechanical structure.** If invalid or externally `stale`, run the owning stage once.
2. **Validate the returned worker result.** If it is malformed, `stale`, `partial`, or routes to the same family and same stage, stop with a stage-contract blocker. Do not rerun that worker automatically.
3. **Handle correction route.** If status/verdict is blocked and route is non-`none`, execute the exact route.
4. **Handle terminal blocker.** If status/verdict is blocked and route is `none/none`, stop and report the exact genuine blocker.
5. **Handle successful state.** If the success gate passes, continue.
6. **Reject ambiguous state.** Any other validly parsed combination is a stage-contract blocker; do not infer a retry.

After architecture produces a non-empty dependency queue, process each dependency through current review, then rerun parent architecture.

After an invalidating revision changes, downstream revision mismatch selects the next stage. A design artifact revision change alone does not invalidate downstream work when design contract revision is unchanged.

## Dependency cycle handling

Maintain an active dependency path beginning with the requested family.

Before entering a queued dependency, detect whether it equals the current family or already exists in the active path.

On a cycle:

1. stop descending;
2. construct the exact path;
3. run architecture once for the family that emitted the cyclic dependency;
4. require architecture to remove the cycle or return terminal `blocked` with route `none/none`;
5. validate the returned architecture result under the normal worker-result rules.

Architecture must not return `self/architecture` for an unresolved cycle.

## Cross-family correction

For a valid cross-family route retain:

```text
origin: <origin-family>/<origin-stage>
target: <target-family>/<target-stage>
```

Run the target from the requested stage through current review. Then resume the origin family through normal durable validation from design forward, execute any earlier invalid stages, and always execute the stored origin stage fresh.

The fresh origin result must clear the route, replace it with a different valid route, or return a genuine blocker. The old route cannot execute again before this fresh origin result exists.

A valid same-family route always targets an earlier stage. Run that earlier stage and normal downstream stages, which naturally re-executes the emitting stage.

Nested cross-family routes unwind the most recent origin first.

## Durable continuation

Invalidating links are:

```text
DESIGN contract revision → ARCHITECTURE
Dependency REVIEW revisions → parent ARCHITECTURE
ARCHITECTURE artifact revision → IMPLEMENTATION
IMPLEMENTATION artifact revision → MIGRATION
DESIGN contract + ARCHITECTURE + IMPLEMENTATION + MIGRATION revisions → REVIEW
```

Invocation-local changed-stage memory is not required for correctness.

## Compact execution ledger

Retain one record per worker execution:

```text
family: <canonical-family>
stage: design | architecture | implementation | migration | review
result: complete | blocked | stage-contract-blocked
artifact: <path>
artifact revision: <exact Artifact revision>
origin: none | <canonical-family>/<stage>
target: none | <canonical-family>/<stage>
dependency path: none | <family>[ → <family>...]
verification: not-applicable | passed | failed | blocked
```

Do not copy worker reports or artifact prose into orchestrator context.

## Final workflow verification

After current successful reviews, run one read-only command selected by root policy and `verification`.

Ordinary Material work uses:

```text
pnpm verify
```

On failure, pass the exact command and visible output to a fresh review-routing worker.

The routing worker returns one of two outcomes:

### Material-owned failure

When the failed contract belongs to an exact Material family and stage:

1. update that owning family `REVIEW.md` to `blocked` with the exact correction route;
2. leave unrelated family reviews unchanged;
3. follow the route through normal durable validation;
4. rerun affected reviews;
5. rerun the original final command.

### External workspace blocker

When no Material family stage owns the failure:

1. do not edit any family `REVIEW.md`;
2. preserve all compliant family review revisions and dependency gates;
3. return an external-workspace blocker with exact command and evidence;
4. stop the invocation with overall status `blocked`;
5. record the blocker in the outer final report and mutable roadmap/status owner;
6. after the external owner corrects it, rerun the verifier-prescribed focused command and then the original final command without rebuilding current family artifacts.

A non-failing warning outside Material is recorded in the outer result but does not change a family review. Whether it blocks completion follows the root verification contract.

The family `REVIEW.md` remains the durable source of truth for family compliance. The outer final report and roadmap own final-command state and external blockers.

## Visual channel

Operator visual/motion inspection is an external defect-reporting channel. Absence of a report is not a blocker. A concrete defect routes to its exact owning family and earlier stage.

## Completion

The invocation is complete only when parent and dependency artifacts satisfy all success gates, all invalidating revisions match, every dependency has current independent review, no reported defect remains unresolved, and final verification passes.

The invocation may be externally blocked while every family remains compliant and ready. In that case family review revisions stay current and only the outer result is blocked.

The final report owns the compact ledger, final command result, and external blocker. Stage artifacts remain the durable source of truth for their own contracts.
