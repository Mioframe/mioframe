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
- read the fixed control fields defined below;
- select the stage named by those fields and the fixed stage order;
- launch a fresh isolated worker for that stage;
- process an explicit dependency queue written by architecture;
- retain invocation-local knowledge of which earlier stages changed;
- run the one final read-only verification command;
- pass exact verifier output to a fresh review worker for routing when the command fails;
- stop at completion or a recorded genuine blocker.

The orchestrator does not determine whether design facts, architecture, code, consumers, tests, or findings are semantically correct. It does not inspect implementation drift, rediscover consumers, conduct migration audit, choose an owning stage from prose, or repeat independent review itself.

### Stage workers

Design, architecture, implementation, migration, and review each run in a fresh isolated worker context and own their semantic decisions.

Each worker:

- reads its stage skill, applicable `AGENTS.md`, canonical upstream artifacts, and task-relevant workspace files;
- validates the semantic correctness of its own inputs and output;
- writes exactly its owned artifact and owned runtime changes;
- records fixed control fields;
- returns control to the orchestrator.

A later stage does not repair an earlier stage. It records `Required return stage` and stops.

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

## Fixed control fields

Control fields use exact standalone enum values. Explanatory prose must not be appended to a status line.

An existing artifact missing any required control field or using an invalid value is mechanically invalid and routes to its owning stage. No parser framework, registry, digest, hash, or workflow database is required.

### DESIGN.md

```text
Status: current | stale | blocked
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return stage: none | design
```

Success gate: `Status: current`, `Remaining blockers: none`, `Required return stage: none`.

### ARCHITECTURE.md

```text
Status: ready | stale | blocked
DESIGN.md reference: <path and source revision>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return stage: none | design | architecture
Implementation readiness: ready | blocked
Dependency queue: none | <ordered family and required gate entries>
```

Success gate: `Status: ready`, no blockers, no return stage, implementation readiness `ready`, and every explicit dependency entry at its required gate.

### IMPLEMENTATION.md

```text
Status: complete | partial | stale | blocked
DESIGN.md reference: <path>
ARCHITECTURE.md reference: <path>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return stage: none | design | architecture | implementation
Architecture deviations: none | <exact deviations>
Migration readiness: ready | blocked
```

Success gate: `Status: complete`, no blockers, no return stage, no architecture deviations, migration readiness `ready`.

### MIGRATION.md

```text
Status: complete | partial | stale | blocked
DESIGN.md reference: <path>
ARCHITECTURE.md reference: <path>
IMPLEMENTATION.md reference: <path>
Revision summary: <one concise line>
Remaining blockers: none | <exact blockers>
Required return stage: none | design | architecture | implementation | migration
Review readiness: ready | blocked
```

Success gate: `Status: complete`, no blockers, no return stage, review readiness `ready`.

### REVIEW.md

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

Success gate:

- verdict `compliant` or `compliant-with-listed-risks`;
- required return stage `none`;
- completion status `complete`;
- final workflow verification readiness `ready`;
- no blockers, major issues, or minor issues;
- no unresolved operator-reported defect.

`compliant-with-listed-risks` is allowed only when all mandatory work, proof, and stage verification are complete and the listed items are real accepted non-blocking limitations such as bounded platform coverage, a controlled renderer workaround, or documented upstream uncertainty.

It must not represent an unrun required check, stale or missing artifact, warning introduced by current work, unresolved finding, unknown consumer state, or deferred required work.

## Mechanical state machine

The orchestrator performs these steps without semantic interpretation:

1. Resolve the requested family.
2. For `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` in order:
   - if the artifact is missing, lacks required control fields, or has an invalid enum value, run its owning stage;
   - if `Required return stage` is not `none`, run exactly that stage;
   - if the artifact does not meet its fixed success gate, run its owning stage.
3. When architecture has a non-empty dependency queue, process each named dependency through its explicitly required gate before resuming the parent.
4. When a stage worker changes or refreshes an artifact, mark every later stage pending in the current invocation and execute those later stages in order, regardless of their previous labels.
5. When review reaches its success gate for the parent and every affected dependency, run one final workflow verification.
6. Complete only when that command passes on the unchanged workspace.

The orchestrator validates field presence and exact enum values only. Semantic validation belongs to stage workers.

## Routing by stage workers

A worker that discovers an earlier-stage defect writes the earliest owner to `Required return stage`, records the exact blocker or issue, and returns.

The orchestrator then launches a fresh worker for that exact stage. It does not reinterpret the finding.

Examples:

- missing official fact → design;
- unresolved API, ownership, dependency, renderer strategy, token selection, or proof plan → architecture;
- component code, token declaration, renderer mapping, export, or component-owned test defect → implementation;
- consumer, legacy-removal, product-scenario, or migration-proof defect → migration.

After an earlier stage changes, every downstream stage runs again in order. This is a fixed ordering rule, not a semantic inference.

## Durable rule changes

When a durable workflow or stage rule invalidates existing family artifacts, the rule change must also make the earliest affected stage explicit in `roadmap.md` and, when practical, set the affected artifact’s control fields to `stale`.

The orchestrator does not infer semantic invalidation by comparing prose across rules. Artifacts created before this control-field contract are invalid mechanically because required fields are absent and therefore return to their owning stages.

## Dependency queue

Architecture alone identifies official component dependencies and writes the ordered `Dependency queue`.

The orchestrator:

- reads only those explicit entries;
- pauses the parent;
- processes each dependency as its own family through fresh workers;
- resumes the parent after the required dependency gate;
- runs no separate final workflow verification for the dependency.

One final command verifies the parent and every affected dependency together.

## Implementation preflight

Before production edits, the implementation worker runs `implementation-preflight` using the current `DESIGN.md` and ready `ARCHITECTURE.md` as the deterministic contract.

Before consumer edits, the migration worker runs `implementation-preflight` using the accepted migration plan and complete `IMPLEMENTATION.md`.

Preflight resolves exact files, pass order, `TEST IMPACT`, and focused verifier scopes. It does not reopen architecture decisions.

## Stage verification

Implementation and migration run only verifier-managed focused proof for their owned changes. Review inspects the resulting evidence and may rerun focused checks where required for independent evaluation.

The pending top-level final command is not a stage blocker, issue, accepted risk, or next action.

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
2. launch a fresh independent `material-component-review` worker with that output as additional evidence;
3. let review update `REVIEW.md` with an exact `Required return stage`, or record a genuine command blocker with return stage `none`;
4. follow the resulting control fields mechanically;
5. after any workspace change, rerun every downstream stage and a fresh independent review;
6. rerun the same final command.

A routable verification failure is correction work, not a listed risk and not a reason to request another operator invocation.

## Operator visual/motion channel

Operator visual/motion inspection is an external defect-reporting channel.

- Absence of a reported defect is `no-reported-defect` and is not a blocker.
- No positive acceptance record is required.
- A concrete reported defect is `defect-reported`, blocks completion, and is routed by a fresh review worker to its owning stage.
- Automated checks must not claim subjective visual or motion correctness.

## Stop conditions

The outer invocation stops only when a fixed control field records one of these genuine blockers:

- required official content remains unavailable after source fallbacks;
- required source or project tools are unavailable;
- fresh-worker isolation cannot be created;
- architecture records an unresolved material decision;
- a required stage or final project command cannot execute or complete after applicable mechanisms are exhausted;
- a concrete operator-reported defect remains unresolved;
- safety requires operator input.

A completed stage, ordinary finding, failed refresh helper, cache age, pending later stage, missing repeated command, or routable verifier failure is not itself a stop condition.

## Completion

A family is complete only when:

- all five artifacts meet their fixed success gates;
- required dependencies meet their explicit gates;
- no operator-reported defect remains unresolved;
- the one final workflow verification passes on the unchanged workspace.

The orchestrator’s final report owns the final command and result. Family artifacts record readiness, not the post-review command result.
