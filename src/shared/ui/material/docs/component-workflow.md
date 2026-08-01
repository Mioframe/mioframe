# Material component staged workflow

## Decision

Every official Material family progresses through five isolated reasoning stages followed by one workflow-level verification:

```text
official Material sources
  → DESIGN.md
  → ARCHITECTURE.md
  → implementation + IMPLEMENTATION.md
  → consumer migration + MIGRATION.md
  → independent REVIEW.md
  → final workflow verification
```

The operator invokes `material-component <name>` once. The orchestrator continues through every internally actionable stage until completion or a genuine blocker.

This document is the single complete owner of the Material state machine. Other rules and README files link here and must not reproduce the routing algorithm.

## Execution boundaries

### Orchestrator

The orchestrator is mechanical. It may only:

- resolve the canonical family name;
- read and validate the fixed control fields, revisions, dates, and required headings defined below;
- compare the recorded renderer revision with the lockfile-resolved revision;
- select the exact family and stage named by fixed order or routing fields;
- process the explicit dependency queue written by architecture;
- retain a compact execution ledger and active cross-family route origin;
- launch one fresh isolated worker for one selected stage;
- run the one final read-only verification command;
- pass exact verifier output to a fresh review worker for routing;
- stop at completion or a recorded genuine blocker.

The orchestrator does not determine whether design facts, architecture, code, consumers, tests, dependencies, or findings are semantically correct. It does not infer dependencies or correction targets from prose.

### Stage workers

Design, architecture, implementation, migration, and review each run in a fresh isolated worker context and own their semantic decisions.

Each worker:

- reads its stage skill, applicable `AGENTS.md`, canonical upstream artifacts, and task-relevant workspace files;
- validates the semantic correctness of its inputs and output;
- writes exactly its owned artifact and owned runtime changes;
- records fixed control fields, exact revisions, and required sections;
- returns a compact stage result to the orchestrator.

A later stage does not repair an earlier stage. It records the exact return family and stage, then stops.

The review worker is independent from workers that authored or corrected architecture, implementation, or migration for the reviewed result.

### Runtime independence

Rules define required isolation, not vendor-specific syntax. Use the current runtime’s supported subagent or clean-context mechanism.

If fresh isolation is unavailable, the workflow is blocked. Do not simulate isolation by continuing several reasoning stages in one context.

Workers use readable workspace files and documented project commands only. They must not depend on Git history, diff, index, branch, worktree state, commit identifiers, pull-request metadata, review threads, or external publication checks.

## Fixed field grammar

Control fields use exact standalone values. Explanatory prose must not be appended to an enum, revision, date, queue, or routing line.

Canonical family names are exact path segments under `components/`, for example `button` or `loadingIndicator`.

Every artifact has:

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
```

The value is a UTC ISO 8601 timestamp with milliseconds. The owning worker writes a new value whenever it rewrites or refreshes the artifact. It must not reuse the previous revision after any artifact-content change.

Routing fields obey exactly one of these forms:

```text
Required return family: none
Required return stage: none
```

```text
Required return family: self | <canonical-family>
Required return stage: design | architecture | implementation | migration
```

`self` resolves to the family that owns the artifact. A non-`none` family with stage `none`, or family `none` with a non-`none` stage, is mechanically invalid.

An artifact is mechanically invalid when it is missing a required field or heading, uses an invalid value, violates a field invariant, or records an upstream revision that differs from the current upstream artifact.

No parser framework, hash system, registry, or workflow database is required.

## DESIGN.md contract

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
Status: current | stale | blocked
Source revision: <exact source/cache revision>
Source checked at: YYYY-MM-DD
Refresh check after: YYYY-MM-DD
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none | self
Required return stage: none | design
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

Success gate:

- status `current`;
- valid artifact and source revisions and dates;
- current date is before `Refresh check after`;
- no blockers or return target;
- every required heading exists.

When the current date is on or after `Refresh check after`, run design before using the artifact. Age triggers a source refresh check; it does not itself make the document stale or blocked.

## ARCHITECTURE.md contract

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
Status: ready | stale | blocked
DESIGN.md reference: <path>
DESIGN.md revision: <exact Artifact revision>
Renderer revision: @m3e/web@<lockfile-resolved-version>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Implementation readiness: ready | awaiting-dependencies | blocked
Dependency families: none | <canonical-family>[; <canonical-family>...]
Dependency queue: none | <canonical-family>[; <canonical-family>...]
```

Dependency grammar and lifecycle:

- names are exact canonical family path segments;
- multiple names are separated by semicolon plus one space: `; `;
- names are unique and ordered;
- `Dependency families` records the complete direct family dependency set;
- `Dependency queue` records only dependencies that do not yet have a successful current independent review;
- a non-empty queue uses `Status: ready`, no blockers or return target, and `Implementation readiness: awaiting-dependencies`;
- every queued dependency runs its complete workflow through successful current `REVIEW.md`;
- no dependency gate variants exist;
- after all queued dependencies reach current review, rerun parent architecture;
- the rerun validates public handoffs, preserves or recomputes `Dependency families`, clears satisfied queue entries, and sets readiness to `ready` only when the queue is `none`.

The orchestrator derives the installed renderer revision from the root `pnpm-lock.yaml` importer entry, strips peer-resolution suffixes, and compares the exact result with `Renderer revision`. A mismatch routes the family to architecture.

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

Success gate:

- status `ready`;
- `DESIGN.md revision` equals the current successful design revision;
- renderer revision equals the lockfile-resolved revision;
- no blockers or return target;
- dependency queue `none`;
- every dependency family has a successful current review;
- implementation readiness `ready`;
- every required heading exists.

A valid architecture with readiness `awaiting-dependencies` is not rerun immediately. Dependency processing has priority.

## IMPLEMENTATION.md contract

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

Success gate: status `complete`, architecture revision equals the current successful architecture revision, no blockers or return target, no architecture deviations, migration readiness `ready`, and every required heading exists.

## MIGRATION.md contract

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

Success gate: status `complete`, implementation revision equals the current successful implementation revision, no blockers or return target, review readiness `ready`, and every required heading exists.

When no current consumers or legacy owner exist, record `none` and `not applicable` explicitly. Do not create a product consumer merely to satisfy migration.

## REVIEW.md contract

```text
Artifact revision: YYYY-MM-DDTHH:mm:ss.sssZ
DESIGN.md revision: <exact Artifact revision>
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

Success gate:

- all four upstream revisions equal the current artifacts;
- verdict `compliant` or `compliant-with-listed-risks`;
- no return target;
- completion status `complete`;
- final workflow verification readiness `ready`;
- no blockers, major issues, or minor issues;
- no unresolved operator-reported defect;
- every required heading exists.

`compliant-with-listed-risks` is allowed only when all mandatory work, proof, and stage verification are complete and the listed items are bounded non-blocking limitations. It must not represent an unrun required check, stale artifact, warning, unresolved finding, unknown consumer state, missing proof, or deferred required work.

## Scenario selection without existing consumers

When no current consumer exists, the explicit `material-component <name>` invocation establishes one approved library scenario:

- provide the official standalone default configuration when official documentation defines one unambiguously;
- expose the minimum coherent public API required to render and accessibly name that default and to control its required state;
- include disabled behavior only when the official component supports disabled state;
- include mandatory default states, semantics, accessibility, and faithful proof;
- defer optional variants, sizes, shapes, and configurations not required by that default;
- do not expose capabilities only because m3e supports them;
- do not invent product scenarios or product consumers.

Architecture asks the operator only when official sources do not define one standalone default or define multiple materially different public models that cannot be resolved mechanically.

## Mechanical state machine

The orchestrator performs these steps without semantic interpretation:

1. Resolve the requested parent family.
2. Validate parent design, including revision, headings, and refresh date. Run design when invalid or due.
3. Validate parent architecture, including design revision and renderer revision. Run architecture when invalid.
4. If parent architecture has a valid non-empty dependency queue, pause the parent and process each dependency left to right through successful current independent review.
5. After all queued dependencies reach current review, rerun parent architecture to clear or recompute the queue.
6. For each artifact in stage order:
   - follow an exact non-`none` return target;
   - otherwise run the owning stage when fields, headings, or upstream revisions are invalid;
   - otherwise run the owning stage when its success gate is not met.
7. After a stage writes a new artifact revision, continue to the next stage; downstream revision mismatch provides the durable invalidation signal.
8. Continue until the parent and every family listed in parent `Dependency families` have successful current reviews.
9. Run the one final workflow verification.
10. Complete only when it passes on the unchanged workspace.

The same rules work after orchestration restarts. Invocation-local memory is not required to detect stale downstream artifacts.

## Cross-family correction routing

When an artifact routes to another family:

1. record an active route frame in the compact ledger:

   ```text
   origin: <origin-family>/<origin-stage>
   target: <target-family>/<target-stage>
   ```

2. run the target family from the requested stage through successful current independent review;
3. rerun the exact origin stage in a fresh worker;
4. require the origin stage to clear or replace its routing fields from current evidence;
5. continue from the new origin-stage result.

Do not reread the old route and launch the target again before rerunning the origin stage.

A self-route follows normal stage order: run the requested stage and all downstream stages, which naturally reruns the artifact that emitted the route.

If a target correction emits another cross-family route, apply the same rule recursively and unwind the most recent route first.

## Durable invalidation

Revision linkage, source refresh dates, and renderer revision comparisons are the durable continuation mechanism.

- design rewrite changes `Artifact revision`, invalidating architecture;
- architecture rewrite changes `Artifact revision`, invalidating implementation;
- implementation rewrite changes `Artifact revision`, invalidating migration;
- migration rewrite changes `Artifact revision`, invalidating review;
- review records all four exact upstream revisions;
- renderer revision mismatch routes to architecture;
- due source refresh routes to design.

When a durable rule change invalidates existing artifacts, update `roadmap.md` with the earliest affected stage and, when practical, mark that artifact stale. Artifacts from an older schema are mechanically invalid because required fields or headings are absent.

## Implementation preflight

Before production edits, implementation runs `implementation-preflight` using current design and ready architecture.

Before consumer edits, migration runs `implementation-preflight` using the accepted migration plan and current implementation.

Preflight resolves exact files, pass order, `TEST IMPACT`, and focused verifier scopes. It does not reopen architecture decisions.

## Compact execution ledger

After each worker returns, retain only:

```text
family: <canonical-family>
stage: design | architecture | implementation | migration | review
result: complete | blocked
artifact: <path>
artifact revision: <exact Artifact revision>
origin: none | <canonical-family>/<stage>
target: none | <canonical-family>/<stage>
verification: not-applicable | passed | failed | blocked
```

Do not copy full worker reports or artifact prose into orchestrator context. Correction cycles append another compact record.

## Final workflow verification

After current successful reviews, the orchestrator runs exactly one read-only final command selected by root policy and the `verification` skill.

Ordinary Material component work uses:

```text
pnpm verify
```

Use `pnpm verify:release` only when the task itself changes release-sensitive infrastructure and verification classifies it accordingly.

### Failure routing

The orchestrator does not classify verifier output.

When final verification fails:

1. preserve the exact command and visible output;
2. launch a fresh independent review-routing worker with the parent and dependency family context;
3. let review record the exact return family and stage, or a genuine command blocker with both return fields `none`;
4. process a correction through the cross-family or self-route rules above;
5. rerun the same final command after all affected reviews are current.

A routable verification failure is correction work, not a listed risk and not a reason to request another operator invocation.

## Operator visual/motion channel

Operator visual/motion inspection is an external defect-reporting channel.

- Absence of a reported defect is `no-reported-defect` and is not a blocker.
- No positive acceptance record is required.
- A concrete reported defect is `defect-reported`, blocks completion, and routes to its exact owning family and stage.
- Automated checks must not claim subjective visual or motion correctness.

## Stop conditions

The invocation stops only for a blocker explicitly recorded by fixed fields:

- required official content remains unavailable after source fallbacks;
- required source or project tools are unavailable;
- fresh-worker isolation cannot be created;
- architecture records an unresolved decision;
- a required stage or final project command cannot execute after applicable mechanisms are exhausted;
- a concrete operator-reported defect remains unresolved;
- safety requires operator input.

A due source refresh, renderer revision change, pending dependency, ordinary finding, routable correction, stale downstream revision, or missing repeated operator command is not itself a stop condition.

## Completion

The operator invocation is complete only when:

- parent and dependency artifacts satisfy all fixed success gates;
- every dependency family has successful current review;
- all durable revision links match;
- no operator-reported defect remains unresolved;
- one final workflow verification passes on the unchanged workspace.

The final report owns the compact ledger and final command result. Family artifacts remain the durable source of stage facts.