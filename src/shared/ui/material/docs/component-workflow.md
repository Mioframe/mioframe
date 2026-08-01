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

The operator invokes `material-component <name>` once. The orchestrator continues until completion or a genuine recorded blocker.

This document is the single complete owner of the state machine.

## Boundaries

### Orchestrator

The orchestrator may only:

- resolve canonical family names;
- validate exact fields, headings, dates, and revisions;
- compare renderer revision with the lockfile;
- compare recorded dependency review revisions with current dependency reviews;
- select exact family/stage targets;
- process an explicit dependency queue;
- maintain an invocation-local active dependency path;
- retain a compact execution ledger and active cross-family route origins;
- launch fresh isolated workers;
- run final verification;
- pass exact verifier output to a fresh review-routing worker.

It does not evaluate design, architecture, code, consumers, proof, dependencies, or verifier meaning.

### Stage workers

Design, architecture, implementation, migration, and review each run in a fresh isolated context and own their semantic decisions.

Each worker writes only its owned artifact and owned runtime changes, records exact control fields and revisions, and returns a compact result.

Review is independent from workers that authored or corrected architecture, implementation, or migration.

If fresh isolation is unavailable, the workflow is blocked. Workers do not depend on Git, PR, commit, branch, diff, or external-check state.

## Common field grammar

Canonical family values are exact path segments under `components/`, such as `button` or `loadingIndicator`.

Every artifact has:

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
```

The owning worker writes a new UTC artifact revision whenever the file is rewritten or refreshed. It must not reuse an artifact revision after content changes.

Routing fields use exactly one valid pair:

```text
Required return family: none
Required return stage: none
```

```text
Required return family: self | <canonical-family>
Required return stage: design | architecture | implementation | migration
```

`self` means the family owning the artifact. Mixed `none`/non-`none` pairs are invalid.

An artifact is mechanically invalid when a required field or heading is missing, a value or date is malformed, a field invariant fails, or an invalidating upstream revision does not match the current upstream artifact.

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
Required return family: none | self
Required return stage: none | design
```

`Artifact revision` tracks any file update.

`Design contract revision` tracks only normalized official Material contract content. It changes when official facts, token tables, states, geometry, behavior, accessibility, or related official contracts change, or when a previously omitted official rule is added. It does not change when only source-check metadata changes.

For a successful first design, both revisions are created. For a blocked design with no complete prior contract, design contract revision may be `none`.

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

Success requires status `current`, a non-`none` design contract revision, valid source dates, current date before `Refresh check after`, no blockers or route, and all headings.

The refresh interval is fixed for all families:

```text
Refresh check after = Source checked at + 30 calendar days
```

A due refresh date runs design.

An immediate refresh before that date occurs only when one of these durable signals exists:

- design status is explicitly `stale`;
- review routes to design because official contract evidence changed or was incomplete;
- roadmap or another canonical workflow artifact records a known newer official source revision.

The orchestrator does not browse sources merely to search for an unrecorded change before the fixed refresh date.

If refresh finds no normalized official contract change:

- write a new artifact revision;
- update source revision and dates as applicable;
- preserve the exact design contract revision;
- do not invalidate downstream artifacts.

If normalized official contract content changes, write a new design contract revision. Architecture then becomes mechanically stale.

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

Dependency names are unique, ordered, exact family names separated by `; `.

`Dependency families` records the complete direct dependency set.

`Dependency queue` records dependencies without successful current independent review.

`Dependency review revisions` records the exact current `REVIEW.md` artifact revision for every dependency not in the queue. Entries use `family=revision` and follow dependency-family order.

Field invariants:

- queue and review-revision families are disjoint;
- their union equals `Dependency families`;
- when dependency families is `none`, both other fields are `none`;
- every recorded review revision equals the current dependency review revision;
- a changed dependency review revision runs parent architecture before any parent route or downstream stage is used;
- self-dependency is forbidden;
- dependencies that already exist in the active dependency path are forbidden.

A non-empty queue requires:

```text
Status: ready
Implementation readiness: awaiting-dependencies
Remaining blockers: none
Required return family: none
Required return stage: none
```

Every queued dependency runs its complete pipeline through current review. Dependency stage gates are unsupported.

After all queued dependencies are current, parent architecture runs again, validates public handoffs, preserves or recomputes dependency families, clears or recomputes the queue, and records exact dependency review revisions.

The orchestrator derives `@m3e/web@<version>` from the root lockfile importer, stripping peer-resolution suffixes. A mismatch runs architecture.

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

Success requires the current design contract revision, current renderer revision, no blockers or route, queue `none`, every dependency review revision current, readiness `ready`, and all headings.

## IMPLEMENTATION.md

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
Status: complete | partial | stale | blocked
ARCHITECTURE.md reference: <path>
ARCHITECTURE.md revision: <exact Artifact revision>
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

Success requires exact current architecture revision, status `complete`, no blockers, route, or deviations, readiness `ready`, and all headings.

## MIGRATION.md

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
Status: complete | partial | stale | blocked
IMPLEMENTATION.md reference: <path>
IMPLEMENTATION.md revision: <exact Artifact revision>
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

Success requires exact current implementation revision, status `complete`, no blockers or route, readiness `ready`, and all headings.

When no consumers or legacy owner exist, record `none` and `not applicable`; do not create a product consumer.

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

Success requires the current design contract revision and exact current architecture, implementation, and migration revisions, compliant verdict, no route or findings, completion `complete`, final-verification readiness `ready`, no unresolved reported defect, and all headings.

`compliant-with-listed-risks` is only for complete work with bounded non-blocking limitations. It cannot represent missing checks, stale artifacts, warnings, unresolved findings, unknown consumers, missing proof, or deferred required work.

## No-consumer scenario

When no current consumer exists, the explicit invocation establishes one approved library scenario:

- implement the unambiguous official standalone default;
- expose only the API required to render and accessibly operate that default;
- expose only mandatory official controllable state belonging to the selected default;
- do not add `v-model`, selection, toggle, value, or open-state contracts unless that state is part of the selected official default;
- include disabled behavior only when official Material supports it for that default;
- include mandatory semantics, accessibility, states, and proof;
- defer optional variants, sizes, shapes, configurations, and state models;
- do not expose m3e capability merely because it exists;
- do not invent product demand or consumers.

Ask the operator only when official sources define no standalone default or multiple materially different public models.

## Mechanical algorithm

For each family, process artifacts in stage order.

1. Validate syntax, required headings, dates, renderer revision, invalidating upstream revisions, dependency review revisions, and dependency invariants.
2. If invalid, run the owning stage before reading or following any existing route from that artifact.
3. If valid and its return target is non-`none`, process that route.
4. If valid but its success gate is not met, run its owning stage.
5. A parent architecture with a valid pending dependency queue pauses the parent before implementation.
6. Process every queued dependency left to right through successful current review.
7. Rerun parent architecture after dependencies are current.
8. Continue parent and every listed dependency through current review.
9. Run one final workflow verification.
10. Complete only when it passes on the unchanged workspace.

A design artifact revision change with an unchanged design contract revision does not invalidate architecture or later stages.

After an invalidating revision changes, downstream revision mismatch drives the next required stage. The same algorithm works after an interrupted session or new invocation.

## Dependency cycle handling

Maintain an invocation-local active dependency path beginning with the requested parent family.

Before entering a queued dependency:

```text
dependency == current family
or
dependency already exists in active dependency path
```

means a dependency cycle.

On detection:

1. stop descending into that dependency;
2. construct the exact path, for example `button → loadingIndicator → button`;
3. launch the architecture worker for the family that emitted the cyclic dependency;
4. pass the exact detected path;
5. require architecture to correct ownership/dependency closure or record a genuine blocker;
6. resume through the normal durable state machine.

The orchestrator detects repeated family names only. It does not decide how ownership must change.

## Cross-family correction

For a valid cross-family route, record:

```text
origin: <origin-family>/<origin-stage>
target: <target-family>/<target-stage>
```

Then:

1. run the target family from the requested stage through successful current review;
2. resume the origin family through its normal durable state machine from design forward;
3. run any earlier mechanically invalid stage and its downstream stages;
4. always finish by executing the origin stage in a fresh worker, even when no earlier stage was invalid;
5. require the fresh origin result to clear or replace its route;
6. continue from that result.

Do not execute the old target again before a fresh origin-stage result exists.

A self-route runs the requested stage and downstream stages normally. Nested cross-family routes apply the same rule recursively and unwind the most recent origin first.

## Durable continuation

Invalidating revision links are:

```text
DESIGN contract revision → ARCHITECTURE
Dependency REVIEW revisions → parent ARCHITECTURE
ARCHITECTURE artifact revision → IMPLEMENTATION
IMPLEMENTATION artifact revision → MIGRATION
DESIGN contract + ARCHITECTURE + IMPLEMENTATION + MIGRATION revisions → REVIEW
```

Design artifact revision alone is not an invalidator.

Source refresh dates and renderer revision comparison are additional triggers. Invocation-local changed-stage memory is not required for correctness.

## Preflight and stage verification

Implementation and migration run `implementation-preflight` before owned edits and run only verifier-managed focused proof.

Review evaluates stage evidence. The pending outer command is not a stage blocker or risk.

## Compact execution ledger

Retain one record per worker execution:

```text
family: <canonical-family>
stage: design | architecture | implementation | migration | review
result: complete | blocked
artifact: <path>
artifact revision: <exact Artifact revision>
origin: none | <canonical-family>/<stage>
target: none | <canonical-family>/<stage>
dependency path: none | <family>[ → <family>...]
verification: not-applicable | passed | failed | blocked
```

Do not copy worker reports or artifact prose into orchestrator context.

## Final workflow verification

After current reviews, run one read-only command selected by root policy and `verification`.

Ordinary component work uses:

```text
pnpm verify
```

Use `pnpm verify:release` only for actual release-sensitive infrastructure changes.

On failure, pass the exact command and output to a fresh review-routing worker. Follow its exact route through the self-route or cross-family rules, then rerun the same command after all affected reviews are current.

## Visual channel

Operator visual/motion inspection is an external defect-reporting channel. Absence of a report is not a blocker and requires no positive acknowledgement. A concrete defect routes to its exact owning family and stage.

## Stop conditions

Stop only for a recorded unavailable required source/tool, unavailable fresh isolation, unresolved architecture decision, project command that cannot execute after applicable mechanisms, unresolved reported defect, or safety-required operator input.

A metadata-only design refresh, renderer change, dependency review change, pending dependency, dependency cycle that can be routed to architecture, stale downstream revision, ordinary finding, routable correction, or missing repeated command is not itself a blocker.

## Completion

The invocation is complete only when parent and dependency artifacts satisfy all success gates, invalidating revision links and dependency review revisions match, every dependency family has current review, no reported defect remains unresolved, and final verification passes.

The final report owns the compact ledger and final command result. Stage artifacts remain the durable source of truth.
