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

This document is the single complete owner of the Material state machine. Other rules and README files link here and must not reproduce the full routing algorithm.

## Execution boundaries

### Orchestrator

The orchestrator is mechanical. It may only:

- resolve the canonical family name;
- read and validate the fixed control fields and required headings defined below;
- compare design refresh dates with the current date;
- compare the recorded renderer revision with the lockfile-resolved revision;
- select the exact family and stage named by routing fields and fixed stage order;
- process an explicit dependency queue written by architecture;
- launch a fresh isolated worker for one selected stage;
- retain a compact invocation-local execution ledger and which stages changed;
- run the one final read-only verification command;
- pass exact verifier output to a fresh review worker for routing when the command fails;
- stop at completion or a recorded genuine blocker.

The orchestrator does not determine whether design facts, architecture, code, consumers, tests, or findings are semantically correct. It does not inspect implementation drift, rediscover consumers, conduct migration audit, infer dependencies, choose an owning family or stage from prose, or repeat independent review itself.

### Stage workers

Design, architecture, implementation, migration, and review each run in a fresh isolated worker context and own their semantic decisions.

Each worker:

- reads its stage skill, applicable `AGENTS.md`, canonical upstream artifacts, and task-relevant workspace files;
- validates the semantic correctness of its own inputs and output;
- writes exactly its owned artifact and owned runtime changes;
- records fixed control fields and required sections;
- returns a compact stage result to the orchestrator.

A later stage does not repair an earlier stage. It records the exact return family and stage, then stops.

The review worker is independent from workers that authored or corrected architecture, implementation, or migration for the reviewed result.

### Runtime independence

Rules define required isolation, not vendor-specific syntax. Use the current runtime’s supported subagent or clean-context mechanism. Do not require Claude-, Codex-, or another vendor-specific frontmatter.

If the runtime cannot create a fresh isolated worker, the workflow is blocked. Do not simulate isolation by continuing in one reasoning context.

Workers use readable workspace files and documented project commands only. They must not depend on:

- Git history, diff, index, branch, or worktree state;
- commit identifiers;
- pull-request metadata or review threads;
- GitHub checks or another external publication system.

Those facts are outside the coding workflow and must not appear in family artifacts.

## Fixed field grammar

Control fields use exact standalone values. Explanatory prose must not be appended to an enum or routing line.

Canonical family names in control fields are exact family path segments under `components/`, for example `button` or `loadingIndicator`.

Routing fields obey both invariants:

```text
Required return family: none
Required return stage: none
```

or:

```text
Required return family: self | <canonical-family>
Required return stage: design | architecture | implementation | migration
```

`self` resolves to the family that owns the artifact. A non-`none` family with stage `none`, or family `none` with a non-`none` stage, is mechanically invalid.

An existing artifact missing a required field or required heading, using an invalid enum, or violating a field invariant is mechanically invalid and routes to its owning stage. No parser framework, registry, digest, hash, or workflow database is required.

## DESIGN.md contract

```text
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

- `Status: current`;
- valid source revision and dates;
- current date is before `Refresh check after`;
- no blockers;
- return family and stage are both `none`;
- every required heading exists.

When the current date is on or after `Refresh check after`, run the design stage before using the artifact. Age triggers a source refresh check; it does not itself change status to `stale` or `blocked`.

## ARCHITECTURE.md contract

```text
Status: ready | stale | blocked
DESIGN.md reference: <path and source revision>
Renderer revision: @m3e/web@<lockfile-resolved-version>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return family: none | self | <canonical-family>
Required return stage: none | design | architecture | implementation | migration
Implementation readiness: ready | awaiting-dependencies | blocked
Dependency queue: none | <canonical-family>@<gate>[; <canonical-family>@<gate>...]
```

Allowed dependency gates:

```text
design | architecture | implementation | migration | review
```

Queue grammar and lifecycle:

- entries use exact `<canonical-family>@<gate>` form;
- multiple entries are separated by semicolon plus one space: `; `;
- entries are unique and processed left to right;
- the queue contains only dependencies whose required gate is not yet satisfied;
- pending dependencies use `Status: ready`, no blockers, no return target, and `Implementation readiness: awaiting-dependencies`;
- after all queued dependencies reach their gates, rerun the parent architecture worker;
- the rerun removes satisfied entries, recomputes dependency handoffs, and sets readiness to `ready` only when the queue is `none`.

The orchestrator derives the installed renderer revision mechanically from the root `pnpm-lock.yaml` importer entry, strips peer-resolution suffixes, and compares the result with `Renderer revision`. A mismatch routes the family to architecture and makes every downstream stage pending.

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

- `Status: ready`;
- design reference matches the current successful design;
- renderer revision matches the lockfile-resolved revision;
- no blockers or return target;
- dependency queue is `none`;
- implementation readiness is `ready`;
- every required heading exists.

A syntactically valid ready architecture with `Implementation readiness: awaiting-dependencies` and a non-empty queue is not rerun immediately. Dependency processing has priority.

## IMPLEMENTATION.md contract

```text
Status: complete | partial | stale | blocked
DESIGN.md reference: <path>
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

Success gate: `Status: complete`, current design and architecture references, no blockers or return target, no architecture deviations, migration readiness `ready`, and every required heading present.

## MIGRATION.md contract

```text
Status: complete | partial | stale | blocked
DESIGN.md reference: <path>
ARCHITECTURE.md reference: <path>
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

Success gate: `Status: complete`, current upstream references, no blockers or return target, review readiness `ready`, and every required heading present.

## REVIEW.md contract

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

Success gate:

- verdict `compliant` or `compliant-with-listed-risks`;
- return family and stage are both `none`;
- completion status `complete`;
- final workflow verification readiness `ready`;
- no blockers, major issues, or minor issues;
- no unresolved operator-reported defect;
- every required heading exists.

`compliant-with-listed-risks` is allowed only when all mandatory work, proof, and stage verification are complete and the listed items are real accepted non-blocking limitations such as bounded platform coverage, a controlled renderer workaround, or documented upstream uncertainty.

It must not represent an unrun required check, stale or missing artifact, warning introduced by current work, unresolved finding, unknown consumer state, or deferred required work.

## Mechanical state machine

The orchestrator performs these steps without semantic interpretation:

1. Resolve the requested family.
2. Validate `DESIGN.md` fields and headings. If missing or invalid, or its refresh date is due, run design.
3. Validate `ARCHITECTURE.md` fields and headings and compare `Renderer revision` with `pnpm-lock.yaml`.
4. If architecture has a valid non-empty dependency queue with readiness `awaiting-dependencies`, pause the parent and process each queue entry left to right before any parent architecture retry.
5. After all dependency gates are reached, rerun parent architecture once to clear or recompute the queue and finalize implementation readiness.
6. For every artifact in stage order:
   - if its exact return target is non-`none`, launch that family and stage;
   - if it is mechanically invalid, launch its owning family and stage;
   - if it does not satisfy its success gate, launch its owning family and stage.
7. After any stage changes or refreshes an artifact, mark every later stage for that family pending and execute those stages in order, regardless of previous labels.
8. Continue until parent and every affected dependency have successful current reviews.
9. Run the one final workflow verification.
10. Complete only when that command passes on the unchanged workspace.

The orchestrator validates field syntax, required headings, dates, exact revisions, queue grammar, and success gates only. Semantic validation belongs to stage workers.

## Routing by stage workers

A worker that discovers an earlier-stage or dependency defect writes the exact target family and earliest owning stage, records the exact blocker or issue, and returns.

Examples:

```text
Required return family: self
Required return stage: architecture
```

```text
Required return family: loadingIndicator
Required return stage: implementation
```

The orchestrator launches that exact family and stage. It does not reinterpret the finding.

Ownership examples:

- missing official fact → design;
- unresolved API, ownership, dependency, renderer strategy, token selection, or proof plan → architecture;
- component code, token declaration, renderer mapping, export, or component-owned proof defect → implementation;
- consumer, legacy-removal, product-scenario, or migration-proof defect → migration.

After a target stage changes, every downstream stage for that target family runs again in order. The parent resumes only after the target reaches the required gate and any parent architecture dependency queue is recomputed.

## Durable invalidation

When a durable workflow or stage rule invalidates existing family artifacts, the rule change must also make the earliest affected stage explicit in `roadmap.md` and, when practical, set the affected artifact’s control fields to `stale`.

The orchestrator does not infer semantic invalidation by comparing prose across rules. Artifacts created before the current control-field and required-heading contract are invalid mechanically because required fields or headings are absent.

Renderer revision changes invalidate architecture and all downstream artifacts mechanically. A due design refresh invalidates use of design and all downstream artifacts until design completes its source check.

## Dependency processing

Architecture alone identifies official component dependencies and writes the ordered queue.

The orchestrator:

- reads only exact queue entries;
- processes each dependency as its own family through separate fresh workers;
- stops each dependency at the exact required gate;
- records the result in the compact execution ledger;
- reruns parent architecture after all entries reach their gates;
- runs no separate final workflow verification for a dependency.

One final command verifies the parent and every affected dependency together.

## Implementation preflight

Before production edits, the implementation worker runs `implementation-preflight` using the current `DESIGN.md` and ready `ARCHITECTURE.md` as the deterministic contract.

Before consumer edits, the migration worker runs `implementation-preflight` using the accepted migration plan and complete `IMPLEMENTATION.md`.

Preflight resolves exact files, pass order, `TEST IMPACT`, and focused verifier scopes. It does not reopen architecture decisions.

## Stage verification

Implementation and migration run only verifier-managed focused proof for their owned changes. Review inspects the resulting evidence and may rerun focused checks where required for independent evaluation.

The pending top-level final command is not a stage blocker, issue, accepted risk, or next action.

## Compact execution ledger

After each worker returns, the orchestrator retains only this compact record plus the durable artifact path:

```text
family: <canonical-family>
stage: design | architecture | implementation | migration | review
result: complete | blocked
artifact: <path>
return target: none | <canonical-family>/<stage>
verification: not-applicable | passed | failed | blocked
```

Do not copy full worker reports or artifact prose into orchestrator context. Durable details remain in stage artifacts. Correction cycles append another compact record rather than replacing prior entries.

## Final workflow verification

After current successful reviews, the orchestrator runs exactly one read-only final command selected by root policy and the `verification` skill.

For ordinary Material component work:

```text
pnpm verify
```

Use `pnpm verify:release` only when the task itself changes release-sensitive infrastructure and the verification skill classifies it accordingly. Component code is not release-sensitive merely because it will later be released.

### Failure routing

The orchestrator does not classify verifier output.

When final verification fails:

1. preserve the exact command and visible output;
2. launch a fresh independent `material-component-review` worker for the family named by the current review-routing context;
3. let review record an exact return family and stage, or a genuine command blocker with both return fields `none`;
4. follow the resulting target mechanically;
5. after any workspace change, rerun every downstream stage and a fresh independent review for the affected family;
6. rerun the same final command after parent and affected dependencies are current again.

A routable verification failure is correction work, not a listed risk and not a reason to request another operator invocation.

## Operator visual/motion channel

Operator visual/motion inspection is an external defect-reporting channel.

- Absence of a reported defect is `no-reported-defect` and is not a blocker.
- No positive acceptance record is required.
- A concrete reported defect is `defect-reported`, blocks completion, and is routed by a fresh review worker to its exact owning family and stage.
- Automated checks must not claim subjective visual or motion correctness.

## Stop conditions

The outer invocation stops only when fixed control fields record one of these genuine blockers:

- required official content remains unavailable after source fallbacks;
- required source or project tools are unavailable;
- fresh-worker isolation cannot be created;
- architecture records an unresolved material decision;
- a required stage or final project command cannot execute or complete after applicable mechanisms are exhausted;
- a concrete operator-reported defect remains unresolved;
- safety requires operator input.

A completed stage, ordinary finding, failed refresh helper, due refresh check, pending dependency, pending later stage, missing repeated command, or routable verifier failure is not itself a stop condition.

## Completion

A family is complete only when:

- all five artifacts meet their fixed success gates;
- required dependencies meet their explicit gates;
- recorded source and renderer revisions remain current;
- no operator-reported defect remains unresolved;
- the one final workflow verification passes on the unchanged workspace.

The orchestrator’s final report owns the execution ledger and final command result. Family artifacts record durable stage facts, not copied worker reports or the post-review command result.
