# Material component staged workflow

## Decision

Every official Material component family progresses through isolated stages:

```text
official Material sources
  → DESIGN.md
  → ARCHITECTURE.md
  → implementation code + IMPLEMENTATION.md
  → consumer migration + MIGRATION.md
  → independent REVIEW.md
```

The separation is mandatory. It keeps each agent focused on one type of reasoning and creates durable handoffs that later agents can verify instead of reconstructing.

## One invocation, one stage

`material-component <name>` resolves the earliest incomplete or invalid stage and runs only that stage.

It must stop after writing the stage artifact, even when the next stage could begin immediately.

A later invocation reads the completed artifact and advances one stage. Do not combine research, architecture, coding, migration, and review in one agent run.

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

`README.md` is only a short family index and navigation entry. It is not an official design source, architecture handoff, implementation ledger, migration record, or review result.

### DESIGN.md

Answers:

```text
What does official Material define?
```

Owner: `material-component-design`.

Contains the complete official component contract and token catalogue. Contains no Mioframe demand, Vue API, m3e mapping, code, tests, migration, or status decisions.

Gate: status `current`.

### ARCHITECTURE.md

Answers:

```text
What must Mioframe implement now, who owns it, how does m3e participate,
and how will implementation, proof, and migration be performed?
```

Owner: `material-component-architecture`.

Consumes the complete `DESIGN.md`, current scenarios, repository ownership, and exact renderer evidence. Resolves public API, selected tokens, dependencies, gaps, passes, proof, and migration. Makes no production edits.

Gate: status `ready` and no unresolved coding decision.

### IMPLEMENTATION.md

Answers:

```text
Was the accepted component architecture implemented and proven at the component owner?
```

Owner: `material-component-implementation`.

The real primary output is code, tokens, tests, stories, exports, and defect records. `IMPLEMENTATION.md` is the concise durable handoff describing completed passes, proof, verification, deviations, and migration readiness.

Gate: status `complete`, architecture deviations `none`, migration readiness `ready`.

### MIGRATION.md

Answers:

```text
Were all approved consumers migrated, scenarios preserved, and replaced legacy ownership removed?
```

Owner: `material-component-migration`.

Contains the consumer inventory, migrated paths, preserved behavior/failure cases, removed ownership, proof, and final verification.

Gate: status `complete` and review readiness `ready`, except an explicit operator-only visual gate may remain.

### REVIEW.md

Answers:

```text
Does the full resulting family comply with official design, accepted architecture,
repository rules, consumer scenarios, proof, and merge gates?
```

Owner: `material-component-review`.

Review is independent and read-only except for `REVIEW.md`. Findings return work to the earliest owning stage.

Gate: verdict `compliant` or `compliant-with-listed-risks`, required operator acceptance complete, and merge readiness recorded.

## State machine

The router selects the earliest condition that applies:

1. missing/stale/blocked/incomplete `DESIGN.md` → design;
2. missing/stale/blocked/not-ready `ARCHITECTURE.md` → architecture;
3. missing/partial/blocked/stale `IMPLEMENTATION.md` or implementation drift → implementation;
4. missing/partial/blocked/stale `MIGRATION.md` or remaining consumer/legacy work → migration;
5. missing/stale/blocked `REVIEW.md` or review ref behind current head → review;
6. all gates current → report complete without speculative changes.

An implementation finding that invalidates architecture routes back to architecture. A review finding routes to design, architecture, implementation, migration, or operator according to ownership.

## Dependency queue

A parent family pauses when it requires another official Material component.

The dependency must pass the same stages as a first-class family. The router may select the dependency’s earliest missing stage on a later invocation, but it must not execute multiple dependency or parent stages in one invocation.

Parent architecture cannot be `ready` until dependency design and architecture are ready. Parent implementation cannot complete until dependency implementation is complete. Parent migration and review cannot complete while dependency closure is incomplete.

## Stage ownership rules

- A later stage must not rewrite an earlier artifact to make current work easier.
- When new evidence invalidates an earlier artifact, stop and route backward.
- Do not duplicate the complete content of an earlier artifact in later records; reference exact sections.
- Stage artifacts use explicit statuses and source/ref metadata so staleness is detectable.
- `roadmap.md` remains the only owner of project-wide milestone order and current next action.
- PR title, body, draft state, review threads, and merge remain operator/architect responsibilities.

## Completion

A Material component is not complete because code and CI are green. Completion requires:

- current complete official design;
- ready architecture;
- complete implementation with no deviations;
- complete consumer migration and legacy removal;
- independent review;
- current-head required verification;
- required operator visual/motion acceptance.
