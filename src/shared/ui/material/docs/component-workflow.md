# Material component staged workflow

## Decision

Every official Material family progresses through isolated stages:

```text
official Material sources
  → DESIGN.md
  → ARCHITECTURE.md
  → implementation code + IMPLEMENTATION.md
  → consumer migration + MIGRATION.md
  → independent REVIEW.md
```

The separation is mandatory. It keeps each reasoning step focused and creates durable handoffs that later stages validate instead of reconstructing.

## Operator invocation and stage scope

These are different boundaries:

- **Operator invocation** — one `material-component <name>` command. It autonomously orchestrates the full workflow until completion or a genuine blocker.
- **Stage scope** — one focused execution of design, architecture, implementation, migration, or review in a fresh worker context. It owns one artifact and returns control to the orchestrator.

One operator invocation may execute multiple stage workers sequentially. A stage worker must never absorb work owned by another stage. The operator supplies only the component name.

## Worker isolation

The outer orchestrator may only:

- resolve the family;
- inspect canonical artifact statuses and readable workspace files;
- select the earliest invalid stage;
- launch a fresh stage worker;
- validate the resulting artifact and report;
- route dependencies, corrections, completion, or a genuine blocker.

It must not perform official research, architecture decisions, implementation, migration, or review itself.

Every stage execution uses a new worker context. The worker receives only:

- the component name and canonical family;
- the selected stage skill;
- applicable workspace rules;
- task-relevant readable workspace files;
- canonical upstream artifact paths;
- explicit return-stage or blocker facts already recorded in artifacts.

Hidden reasoning, conversational summaries, and unwritten conclusions are not inter-stage inputs. The review worker must not be the worker that authored or corrected `ARCHITECTURE.md`, production implementation, or `MIGRATION.md` for the reviewed result.

If a fresh worker cannot be created, the workflow is blocked on orchestration capability. It must not continue all stages in one context and claim isolation.

## Worker scope

Coding workers use task-relevant readable files and documented project commands. If a project command fails before reaching its relevant check, complete otherwise safe stage-owned file work, record the exact visible failure, and report verification as blocked only when it remains the final gate.

## Family artifacts

```text
src/shared/ui/material/components/<family>/
  DESIGN.md
  ARCHITECTURE.md
  IMPLEMENTATION.md
  MIGRATION.md
  REVIEW.md
  README.md
```

`README.md` is only a short family index. It must not duplicate mutable stage status, milestone status, or next action.

### DESIGN.md

Answers only:

```text
What does official Material define?
```

Owner: `material-component-design`.

Contains the complete official component contract and token catalogue. Contains no Mioframe demand, Vue API, renderer mapping, code, tests, migration, or status decisions.

Gate: status `current`.

### ARCHITECTURE.md

Answers:

```text
What must Mioframe implement now, who owns it, how does the renderer participate,
and how will implementation, proof, and migration be performed?
```

Owner: `material-component-architecture`.

Consumes the complete `DESIGN.md`, current scenarios, workspace ownership, and exact renderer evidence. Resolves public API, selected tokens, dependencies, gaps, implementation passes, proof, and migration. Makes no production edits.

Gate: status `ready` and no unresolved coding decision.

### IMPLEMENTATION.md

Answers:

```text
Was the accepted component architecture implemented and proven at the component owner?
```

Owner: `material-component-implementation`.

The primary output is code, tokens, tests, stories, exports, and defect records. `IMPLEMENTATION.md` records completed passes, proof, verification, deviations, and migration readiness.

Gate: status `complete`, architecture deviations `none`, migration readiness `ready`.

### MIGRATION.md

Answers:

```text
Were all approved consumers migrated, scenarios preserved, and replaced legacy ownership removed?
```

Owner: `material-component-migration`.

Contains consumer inventory, migrated paths, preserved behavior and failure cases, removed ownership, proof, and final verification.

Gate: status `complete` and review readiness `ready`, except an explicit operator-only visual gate may remain.

### REVIEW.md

Answers:

```text
Does the full resulting family comply with official design, accepted architecture,
workspace rules, consumer scenarios, proof, and completion gates?
```

Owner: `material-component-review`.

Review is independent and read-only except for `REVIEW.md`. Findings return work to the earliest owning stage. The orchestrator launches a fresh correction worker and later a new independent review worker.

Gate: verdict `compliant` or `compliant-with-listed-risks`, required operator acceptance complete, and completion readiness recorded.

## Autonomous state machine

The orchestrator repeatedly selects the earliest condition that applies:

1. missing, stale, blocked, or incomplete `DESIGN.md` → design;
2. missing, stale, blocked, or not-ready `ARCHITECTURE.md` → architecture;
3. missing, partial, blocked, stale `IMPLEMENTATION.md`, or implementation drift → implementation;
4. missing, partial, blocked, stale `MIGRATION.md`, or remaining consumer/legacy work → migration;
5. missing, stale, blocked `REVIEW.md`, inconsistency with current readable artifacts/code, or actionable findings → review;
6. all gates current → complete.

For every selected stage, the orchestrator launches a fresh worker, validates workspace outputs, and discards that worker context before selecting the next stage.

An implementation or review finding that invalidates architecture routes back to architecture. A design omission routes back to design. Ordinary correction work does not require a new operator command, but it always uses a new worker context.

## Dependency queue

A parent family pauses when it requires another official Material component.

The dependency passes the same stages as a first-class family. The orchestrator processes dependency stages automatically through separate fresh workers and then resumes the parent. Parent and dependency work remain separate contexts and artifacts.

Parent architecture cannot be `ready` until dependency design and architecture are ready. Parent implementation cannot complete until dependency implementation is complete. Parent migration and review cannot complete while dependency closure is incomplete.

## Source refresh and design status

A source-cache freshness threshold triggers a refresh attempt; it does not automatically make a complete snapshot stale.

- `current` — all required official content is represented from the newest successfully acquired official revision and there is no evidence of a newer material revision.
- `stale` — affirmative evidence shows official content or its material revision changed after the recorded snapshot.
- `blocked` — required official content remains missing, contradictory, or incompletely extracted after all available source and cache fallbacks.

A failed refresh helper is not itself a blocker when a complete official snapshot and token resource remain available and no newer revision is known.

## Stop conditions

The outer orchestration may stop only for:

- genuinely missing official content after all fallbacks;
- unavailable required source tools;
- unavailable fresh-worker orchestration capability;
- an unresolved material architecture decision that official evidence and workspace rules cannot determine;
- required operator visual/motion acceptance;
- a required project verification command that cannot execute or complete after stage-owned edits are done;
- safety-required operator input.

A completed stage, ordinary failing test, code finding, cache age, or missing repeated command is not by itself a blocker.

## Stage ownership rules

- A stage worker must not perform work owned by a later stage.
- A later stage must not rewrite an earlier artifact to make current work easier.
- When new evidence invalidates an earlier artifact, return control to the orchestrator and route backward through a fresh worker.
- Do not duplicate the complete content of an earlier artifact in later records; reference exact sections.
- Stage artifacts use explicit statuses and canonical upstream artifact references so staleness is detectable from workspace files.
- `roadmap.md` remains the only owner of project-wide milestone order and current next action.

## Completion

A Material component is not complete because code and automated checks pass. Completion requires:

- current complete official design;
- ready architecture;
- complete implementation with no deviations;
- complete consumer migration and legacy removal;
- independent review by a fresh worker;
- required project verification;
- required operator visual/motion acceptance.
