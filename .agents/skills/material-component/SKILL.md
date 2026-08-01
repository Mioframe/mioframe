---
name: material-component
description: 'Use with one Material component name to mechanically orchestrate isolated design, architecture, implementation, migration, and review stages, then run one final workflow verification until completion or a recorded genuine blocker.'
---

# Material component

Accept exactly one required operator input: the Material component name.

Examples:

```text
Button
MDButton
Loading indicator
MDLoadingIndicator
```

Do not require an implementation brief, mode, file path, dependency list, verification command, or repeated operator invocation.

## Authority

Read and execute:

- applicable `AGENTS.md` files;
- `src/shared/ui/material/docs/component-workflow.md`;
- the `verification` skill;
- the selected stage skill.

`component-workflow.md` is the single complete state-machine contract. Do not reconstruct or expand it from README files, roadmap prose, code, tests, or conversation context.

## Orchestrator boundary

This skill is a thin mechanical orchestrator. It may only:

- resolve the canonical family;
- validate fixed artifact fields and required headings;
- compare design refresh dates with the current date;
- compare recorded renderer revision with the lockfile-resolved `@m3e/web` version;
- select an exact family and stage through fixed order, return-target fields, or dependency queue entries;
- launch a fresh isolated worker;
- retain a compact execution ledger and which stages changed;
- run final read-only verification;
- send exact verifier output to a fresh review worker for routing;
- report completion or a recorded blocker.

It must not:

- decide whether official design facts are complete;
- evaluate architecture correctness;
- inspect code for implementation drift;
- discover remaining consumers or legacy ownership;
- infer dependencies or correction targets from code or prose;
- review tests, visual output, or migration semantics;
- classify verifier output;
- edit stage artifacts or production files itself.

Those decisions belong to stage workers.

## Worker boundary

Each design, architecture, implementation, migration, and review stage runs in a fresh isolated worker context using the current runtime’s supported mechanism.

A handoff contains only:

- resolved official component and canonical family;
- selected stage skill;
- applicable workspace rules;
- task-relevant readable workspace files;
- canonical upstream artifact paths;
- exact dependency entry, return target, blocker, or verifier output required by that stage.

Do not pass hidden reasoning, prior worker prose, or conversational conclusions between workers.

The review worker must be independent from workers that authored or corrected architecture, implementation, or migration.

If fresh isolation is unavailable, record an orchestration blocker. Do not simulate isolation in one context.

Workers and orchestrator must not depend on Git history, diff, branch, worktree/index state, commit identifiers, pull-request metadata, or GitHub checks.

## Family resolution

Normalize the supplied name against official Material names, existing `MD*` exports, and family paths.

Ask for clarification only when readable workspace and official evidence leave multiple distinct official components unresolved.

Canonical family control values are exact `components/` path segments, such as `button` or `loadingIndicator`.

## Mechanical orchestration

Follow `component-workflow.md` exactly:

1. Validate or refresh parent `DESIGN.md`, including source revision and refresh date.
2. Validate parent `ARCHITECTURE.md`, including renderer revision.
3. When a valid parent architecture has `Implementation readiness: awaiting-dependencies` and a non-empty queue, process the queue before retrying parent architecture.
4. Parse queue entries only in exact `<family>@<gate>[; <family>@<gate>...]` form and process them left to right.
5. After every queued dependency reaches its required gate, rerun parent architecture once to clear or recompute the queue.
6. Follow exact `Required return family` and `Required return stage` values. Never infer a target from prose.
7. After any stage changes, rerun every downstream stage for that family in order.
8. Continue until parent and affected dependencies have successful current reviews.
9. Run one final workflow verification.
10. Complete only when it passes on the unchanged workspace.

Dependency queue processing has priority over a parent architecture retry. A ready parent architecture awaiting dependencies is not `blocked` and must not be launched repeatedly while its queue remains pending.

Artifacts created under an older schema, missing required headings, containing invalid routing pairs, due for source refresh, or recording a stale renderer revision are mechanically invalid and return to the owning stage defined by the workflow.

## Stage execution

Launch only the selected stage skill:

- `material-component-design`;
- `material-component-architecture`;
- `material-component-implementation`;
- `material-component-migration`;
- `material-component-review`.

After the worker returns, validate only that it:

- produced its owned artifact;
- used all required fields and headings with valid syntax;
- returned a compact stage result.

Semantic compliance belongs to the stage worker and later independent review.

## Compact execution ledger

Retain one compact record per worker execution:

```text
family: <canonical-family>
stage: design | architecture | implementation | migration | review
result: complete | blocked
artifact: <path>
return target: none | <canonical-family>/<stage>
verification: not-applicable | passed | failed | blocked
```

Do not retain or reproduce full worker reports. Durable details remain in the stage artifact. Correction cycles append a new ledger record.

## Dependencies

Read dependencies only from the architecture artifact’s exact queue.

For each entry:

1. pause the parent;
2. process the named dependency as a first-class family through fresh workers until the requested gate;
3. record the dependency executions in the compact ledger;
4. continue with the next queue entry;
5. rerun parent architecture after all entries are satisfied.

Do not infer dependencies from imports, implementation, or names. Run no separate final workflow verification for a dependency.

## Final workflow verification

After current successful reviews, use the verification skill to run one read-only final command.

Ordinary Material component work uses:

```text
pnpm verify
```

Use `pnpm verify:release` only when the task itself changes release-sensitive infrastructure and the verification skill explicitly selects it.

Do not delegate the final command to implementation, migration, review, or a dependency.

## Verification failure routing

Do not classify verifier output in the orchestrator.

On failure:

1. retain the exact command and visible output;
2. launch a fresh independent `material-component-review` worker with that output and the current parent/dependency family context;
3. require exact `Required return family` and `Required return stage` fields;
4. follow that target mechanically;
5. rerun downstream stages and fresh review for the affected family;
6. resume the parent and rerun the same final command when all affected reviews are current.

If review records a genuine command blocker with both return fields `none`, stop and report it exactly.

## Stop conditions

Stop only for a blocker explicitly recorded by a stage artifact or review-routing pass:

- unavailable required official content or tools;
- unavailable fresh-worker isolation;
- unresolved architecture decision;
- required project command that cannot execute or complete after applicable mechanisms are exhausted;
- unresolved concrete operator-reported defect;
- safety-required operator input.

A pending dependency, due source refresh, renderer revision change, ordinary finding, routable verifier failure, absence of positive visual acknowledgement, or missing repeated operator command is not a blocker.

## Final report

```text
MATERIAL COMPONENT RESULT
Input component:
Resolved official component:
Canonical family:
Execution ledger:
- <compact record per worker execution>
Dependencies processed:
Correction routes:
DESIGN.md status:
ARCHITECTURE.md status:
IMPLEMENTATION.md status:
MIGRATION.md status:
REVIEW.md verdict:
Final workflow verification command:
Final workflow verification result:
Operator visual status: no-reported-defect | defect-reported | not-applicable
Remaining blocker: none | <exact blocker>
Overall family status: complete | blocked
Next operator action: none | <single required action>
```

Do not include full worker reports or copy stage-artifact contents into the final report.

## Forbidden

- Requiring one operator command per stage.
- Performing stage-owned reasoning or edits in the orchestrator.
- Selecting families or stages from prose instead of fixed fields.
- Retrying parent architecture before processing its valid pending dependency queue.
- Inferring dependencies from code.
- Interpreting final verifier output without a fresh review-routing worker.
- Reusing one worker context for multiple reasoning stages.
- Letting an implementation or migration worker conduct independent review.
- Depending on Git, PR, or external check state.
- Treating README, code, tests, snapshots, or renderer artifacts as stage-artifact substitutes.
- Retaining full worker reports in orchestrator context.
- Marking completion before final workflow verification passes.
