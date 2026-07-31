# Material component staged workflow

## Decision

Every official Material family progresses through isolated reasoning stages followed by one workflow-level verification:

```text
official Material sources
  → DESIGN.md
  → ARCHITECTURE.md
  → implementation code + IMPLEMENTATION.md
  → consumer migration + MIGRATION.md
  → independent REVIEW.md
  → final workflow verification
```

The separation is mandatory. It keeps each reasoning step focused and creates durable handoffs that later stages validate instead of reconstructing. Final workflow verification is orchestration closure, not a sixth reasoning stage and not another artifact owner.

## Operator invocation and stage scope

These are different boundaries:

- **Operator invocation** — one `material-component <name>` command. It autonomously orchestrates the full workflow, including the final read-only verification, until completion or a genuine blocker.
- **Stage scope** — one focused execution of design, architecture, implementation, migration, or review in a fresh worker context. It owns one artifact and returns control to the orchestrator.

One operator invocation may execute multiple stage workers sequentially. A stage worker must never absorb work owned by another stage. The operator supplies only the component name.

## Worker isolation

The outer orchestrator may only:

- resolve the family;
- inspect canonical artifact statuses, contents, upstream references, and readable workspace files;
- select the earliest invalid stage;
- launch a fresh stage worker;
- validate the resulting artifact and report against current applicable rules;
- route dependencies, corrections, completion, or a genuine blocker;
- run and interpret the one final workflow verification after all affected artifacts and the independent review are current.

It must not perform official research, architecture decisions, implementation, migration, or review itself. Executing final workflow verification is an orchestration responsibility and does not make the orchestrator a stage worker.

Every stage execution uses a new worker context. The worker receives only:

- the component name and canonical family;
- the selected stage skill;
- applicable workspace rules;
- task-relevant readable workspace files;
- canonical upstream artifact paths;
- explicit return-stage or blocker facts already recorded in artifacts or final-verification output.

Hidden reasoning, conversational summaries, and unwritten conclusions are not inter-stage inputs. The review worker must not be the worker that authored or corrected `ARCHITECTURE.md`, production implementation, or `MIGRATION.md` for the reviewed result.

If a fresh worker cannot be created, the workflow is blocked on orchestration capability. It must not continue all stages in one context and claim isolation.

## Worker scope

Coding workers use task-relevant readable files and documented project commands. Each implementation or migration worker runs only the focused and stage-scoped proof required for its owned changes. Review evaluates those results and may independently rerun focused evidence where needed.

No stage worker owns or defers the top-level final workflow verification. The orchestrator runs it only after the current independent review. Absence of that not-yet-run command is expected during stages and is not a stage blocker or accepted risk.

If a project command fails before reaching its relevant check, complete otherwise safe stage-owned file work, record the exact visible failure, and report verification as blocked only when it remains required for that stage or for final workflow closure.

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

A status label is not authoritative by itself. Every artifact must also be consistent with its current upstream artifacts, readable workspace state, applicable `AGENTS.md`, the current stage skill, and canonical workflow documentation.

### DESIGN.md

Answers only:

```text
What does official Material define?
```

Owner: `material-component-design`.

Contains the complete official component contract and token catalogue. Contains no Mioframe demand, Vue API, renderer mapping, code, tests, migration, or status decisions.

Gate: status `current` and content consistent with current official-source rules.

### ARCHITECTURE.md

Answers:

```text
What must Mioframe implement now, who owns it, how does the renderer participate,
and how will implementation, proof, migration, and workflow closure be performed?
```

Owner: `material-component-architecture`.

Consumes the complete `DESIGN.md`, current scenarios, workspace ownership, exact renderer evidence, and current workflow/verification ownership. Resolves public API, selected tokens, dependencies, gaps, implementation passes, stage proof, migration, and final-workflow-verification ownership. Makes no production edits.

Gate: status `ready`, references the current design, no unresolved coding decision, and no decision forbidden by current workspace or architecture rules. An architecture that delegates the top-level final workflow verification to implementation, migration, review, a dependency, or an unspecified later stage is stale even when labeled `ready`.

### IMPLEMENTATION.md

Answers:

```text
Was the accepted component architecture implemented and proven at the component owner?
```

Owner: `material-component-implementation`.

The primary output is code, tokens, tests, stories, exports, and defect records. `IMPLEMENTATION.md` records completed passes, proof, focused implementation verification, deviations, and migration readiness.

Gate: status `complete`, references the current architecture, architecture deviations `none`, migration readiness `ready`, and content consistent with current implementation rules. An upstream architecture change makes implementation stale until a fresh implementation worker revalidates code and refreshes the artifact, even when no runtime edit is needed.

### MIGRATION.md

Answers:

```text
Were all approved consumers migrated, scenarios preserved, and replaced legacy ownership removed?
```

Owner: `material-component-migration`.

Contains consumer inventory, migrated paths, preserved behavior and failure cases, removed ownership, proof, and migration-scoped verification.

Gate: status `complete`, references current architecture and implementation artifacts, and review readiness `ready`. A not-yet-run top-level final workflow verification is not part of this gate. An upstream architecture or implementation change makes migration stale until a fresh migration worker revalidates consumers and refreshes the artifact.

### REVIEW.md

Answers:

```text
Does the full resulting family comply with official design, accepted architecture,
workspace rules, consumer scenarios, proof, and stage gates?
```

Owner: `material-component-review`.

Review is independent and read-only except for `REVIEW.md`. Findings return work to the earliest owning stage. The orchestrator launches a fresh correction worker and later a new independent review worker.

Gate: verdict `compliant` or `compliant-with-listed-risks`, references the current complete upstream artifacts and workspace, no unresolved concrete operator-reported visual/motion defect, all required focused/stage proof complete, and final-workflow-verification readiness recorded. Absence of an operator-reported defect satisfies this gate; no positive operator acknowledgement is required. The pending top-level final workflow command is not a review finding or risk.

Any workspace, upstream-artifact, or applicable-rule change after review makes `REVIEW.md` stale and requires a fresh independent review.

## Autonomous state machine

The orchestrator repeatedly selects the earliest condition that applies:

1. missing, stale, blocked, incomplete, or rule-invalid `DESIGN.md` → design;
2. missing, stale, blocked, not-ready, upstream-invalid, or rule-invalid `ARCHITECTURE.md` → architecture;
3. missing, partial, blocked, stale, predating current architecture, rule-invalid `IMPLEMENTATION.md`, or implementation drift → implementation;
4. missing, partial, blocked, stale, predating current architecture/implementation `MIGRATION.md`, remaining consumer/legacy work, unresolved migration-scoped proof, or top-level-verification ownership leakage → migration;
5. missing, stale, blocked `REVIEW.md`, review predating workspace/upstream/rule changes, inconsistency with current readable artifacts/code, or actionable findings → review;
6. all affected family artifact gates current → final workflow verification;
7. final workflow verification passed on the unchanged current workspace → complete.

Whenever an earlier stage is stale or changes, every downstream artifact is stale regardless of its self-declared status. The orchestrator must refresh stages in order and must not jump directly to the last visibly incorrect artifact.

For every selected reasoning stage, the orchestrator launches a fresh worker, validates workspace outputs, and discards that worker context before selecting the next stage.

An implementation or review finding that invalidates architecture routes back to architecture. A design omission routes back to design. Ordinary correction work does not require a new operator command, but it always uses a new worker context.

If final workflow verification fails, the orchestrator uses the visible verifier output to route the defect to the earliest owning stage. Any resulting workspace change invalidates every affected downstream artifact, including `REVIEW.md`, so the workflow must refresh them in order and complete a fresh independent review before rerunning the same final gate. A routable failure is correction work, not a deferred family risk and not a reason to ask for another operator command.

## Dependency queue

A parent family pauses when it requires another official Material component.

The dependency passes the same five artifact stages as a first-class family. The orchestrator processes dependency stages automatically through separate fresh workers and then resumes the parent. Parent and dependency work remain separate contexts and artifacts.

Parent architecture cannot be `ready` until dependency design and architecture are current. Parent implementation cannot complete before dependency implementation is current. Parent migration and review cannot complete while the required dependency artifact gates are incomplete or stale.

Do not run a separate top-level final workflow verification after each dependency. Run one final gate after the parent and every affected dependency have current artifacts and reviews, so the complete resulting workspace is verified once.

## Source refresh and design status

A source-cache freshness threshold triggers a refresh attempt; it does not automatically make a complete snapshot stale.

- `current` — all required official content is represented from the newest successfully acquired official revision and there is no evidence of a newer material revision.
- `stale` — affirmative evidence shows official content or its material revision changed after the recorded snapshot.
- `blocked` — required official content remains missing, contradictory, or incompletely extracted after all available source and cache fallbacks.

A failed refresh helper is not itself a blocker when a complete official snapshot and token resource remain available and no newer revision is known.

## Final workflow verification

The top-level `material-component` orchestrator owns exactly one final read-only completion gate after all affected `REVIEW.md` artifacts are current.

- Ordinary Material component work uses `pnpm verify`.
- `pnpm verify:release` is used only when the task itself changes release-sensitive infrastructure and the project verification skill classifies it accordingly.
- Implementation and migration workers run focused verifier-managed checks for their scopes.
- Review inspects the complete family and stage evidence but does not run or require the top-level final gate.
- The final gate validates the complete current workspace, including the review artifacts.
- A passing final command does not replace architecture or review.
- Any later workspace edit invalidates the result and requires the earliest owning stage, every affected downstream artifact, a fresh independent review, and the final command again.

Do not record a pending final workflow command inside `IMPLEMENTATION.md`, `MIGRATION.md`, `REVIEW.md`, or `roadmap.md` as a family blocker, accepted risk, deferred stage action, or next operator action.

## Stop conditions

The outer orchestration may stop only for:

- genuinely missing official content after all fallbacks;
- unavailable required source tools;
- unavailable fresh-worker orchestration capability;
- an unresolved material architecture decision that official evidence and workspace rules cannot determine;
- a concrete unresolved operator-reported visual/motion defect;
- a required stage-scoped or final workflow verification command that cannot execute or complete after applicable correction mechanisms are exhausted;
- safety-required operator input.

A completed stage, ordinary failing test, code finding, cache age, missing repeated command, absence of an operator-reported defect, stale downstream artifact, pending final verification before review closure, or a routable final-verification failure is not by itself a blocker.

## Stage ownership rules

- A stage worker must not perform work owned by a later stage.
- A later stage must not rewrite an earlier artifact to make current work easier.
- When new evidence or current rules invalidate an earlier artifact, return control to the orchestrator and route backward through a fresh worker.
- Every downstream artifact becomes stale when an upstream artifact changes or becomes invalid.
- Do not duplicate the complete content of an earlier artifact in later records; reference exact sections.
- Stage artifacts use explicit statuses and canonical upstream artifact references so staleness is detectable from workspace files.
- The orchestrator validates artifact content against current rules; it must not trust self-declared status alone.
- `roadmap.md` remains the only owner of project-wide milestone order and current next action.
- Final workflow verification state belongs to the orchestrator report, not to a family stage artifact.

## Completion

A Material component is not complete because code and focused checks pass. Completion requires:

- current complete official design;
- ready architecture consistent with current workflow rules;
- complete implementation revalidated against that architecture with no deviations;
- complete consumer migration and legacy removal revalidated against current upstream artifacts;
- independent review by a fresh worker against the current workspace and rules;
- no unresolved concrete operator-reported visual/motion defect;
- the one final workflow verification required by root policy passing on the unchanged current workspace.

Operator visual/motion inspection is an external defect-reporting channel, not a positive-acknowledgement gate: absence of a reported defect satisfies the visual condition and requires no explicit confirmation.
