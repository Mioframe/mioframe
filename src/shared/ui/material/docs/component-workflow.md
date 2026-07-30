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

The separation is mandatory. It keeps each reasoning step focused and creates durable handoffs that later stages can verify instead of reconstructing.

## Operator invocation and stage scope

These are different boundaries:

- **Operator invocation** — one `material-component <name>` command. It autonomously orchestrates the full workflow until completion or a genuine external blocker.
- **Stage scope** — one focused internal execution of design, architecture, implementation, migration, or review. It owns one artifact and then returns control to the orchestrator.

One operator invocation may execute multiple stage scopes sequentially. A stage scope must never absorb work owned by another stage.

The operator supplies only the component name. Repeated manual invocations are not part of the normal workflow.

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

`README.md` is only a short family index and navigation entry. It must not duplicate mutable stage status, milestone status, or next action.

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

Consumes the complete `DESIGN.md`, current scenarios, repository ownership, and exact renderer evidence. Resolves public API, selected tokens, dependencies, gaps, implementation passes, proof, and migration. Makes no production edits.

Gate: status `ready` and no unresolved coding decision.

### IMPLEMENTATION.md

Answers:

```text
Was the accepted component architecture implemented and proven at the component owner?
```

Owner: `material-component-implementation`.

The primary output is code, tokens, tests, stories, exports, and defect records. `IMPLEMENTATION.md` is the durable handoff describing completed passes, proof, verification, deviations, and migration readiness.

Gate: status `complete`, architecture deviations `none`, migration readiness `ready`.

### MIGRATION.md

Answers:

```text
Were all approved consumers migrated, scenarios preserved, and replaced legacy ownership removed?
```

Owner: `material-component-migration`.

Contains the consumer inventory, migrated paths, preserved behavior and failure cases, removed ownership, proof, and final verification.

Gate: status `complete` and review readiness `ready`, except an explicit operator-only visual gate may remain.

### REVIEW.md

Answers:

```text
Does the full resulting family comply with official design, accepted architecture,
repository rules, consumer scenarios, proof, and merge gates?
```

Owner: `material-component-review`.

Review is independent and read-only except for `REVIEW.md`. Findings return work to the earliest owning stage. The outer orchestrator executes that correction stage and repeats review automatically.

Gate: verdict `compliant` or `compliant-with-listed-risks`, required operator acceptance complete, and merge readiness recorded.

## Autonomous state machine

The orchestrator repeatedly selects the earliest condition that applies:

1. missing/stale/blocked/incomplete `DESIGN.md` → design;
2. missing/stale/blocked/not-ready `ARCHITECTURE.md` → architecture;
3. missing/partial/blocked/stale `IMPLEMENTATION.md` or implementation drift → implementation;
4. missing/partial/blocked/stale `MIGRATION.md` or remaining consumer/legacy work → migration;
5. missing/stale/blocked `REVIEW.md`, review ref behind current head, or actionable review findings → review;
6. all gates current → complete.

After every successful stage scope, the orchestrator validates the artifact and immediately selects the next stage within the same operator invocation.

An implementation or review finding that invalidates architecture routes back to architecture. A design omission routes back to design. Ordinary correction work does not require a new operator command.

## Dependency queue

A parent family pauses when it requires another official Material component.

The dependency passes the same stages as a first-class family. The orchestrator processes dependency stages automatically and then resumes the parent. Parent and dependency work remain separate stage scopes and separate artifacts.

Parent architecture cannot be `ready` until dependency design and architecture are ready. Parent implementation cannot complete until dependency implementation is complete. Parent migration and review cannot complete while dependency closure is incomplete.

## Source refresh and design status

A source-cache freshness threshold triggers a refresh attempt; it does not automatically make a complete snapshot stale.

- `current` — all required official content is represented from the newest successfully acquired official revision and there is no evidence of a newer material revision.
- `stale` — there is affirmative evidence that official content or its material revision changed after the recorded snapshot.
- `blocked` — required official content remains missing, contradictory, or incompletely extracted after all available source and cache fallbacks.

A failed refresh helper or route-index request is not itself a blocker when a complete official snapshot and token resource are available and no newer revision is known.

## Genuine external blockers

The outer orchestration may stop only for:

- genuinely missing official content after all fallbacks;
- unavailable permissions or required tools;
- an unresolved material architecture decision that official evidence and repository rules cannot determine;
- required operator visual/motion acceptance;
- an external/infrastructure gate that cannot be retried or diagnosed with available tools;
- safety-required operator input.

A completed stage, ordinary failing test, code finding, cache age, or missing repeated command is not an external blocker.

## Stage ownership rules

- A stage worker must not perform work owned by a later stage.
- A later stage must not rewrite an earlier artifact to make current work easier.
- When new evidence invalidates an earlier artifact, return control to the orchestrator and route backward.
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
