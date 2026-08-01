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

`component-workflow.md` is the single complete state-machine contract. Do not reconstruct it from README, roadmap, code, tests, or conversation context.

## Orchestrator boundary

This skill is a thin mechanical orchestrator. It may only:

- resolve the canonical family;
- validate fixed fields, revisions, dates, and required headings;
- compare recorded renderer revision with the lockfile-resolved `@m3e/web` version;
- select an exact family and stage through fixed order, return fields, or dependency queue;
- launch a fresh isolated worker;
- retain a compact execution ledger and active route origin;
- run final read-only verification;
- send exact verifier output to a fresh review-routing worker;
- report completion or a recorded blocker.

It must not evaluate design or architecture, inspect code for drift, discover consumers, infer dependencies, choose correction targets from prose, review tests or visuals, classify verifier output, or edit stage-owned files itself.

## Worker boundary

Each stage runs in a fresh isolated worker context using the runtime’s supported mechanism.

A handoff contains only:

- resolved official component and canonical family;
- selected stage skill;
- applicable workspace rules;
- task-relevant readable workspace files;
- canonical upstream artifact paths and revisions;
- exact dependency, route-origin, route-target, blocker, or verifier-output facts required by that stage.

Do not pass hidden reasoning, copied worker reports, or conversational conclusions between workers.

The review worker must be independent from workers that authored or corrected architecture, implementation, or migration.

If fresh isolation is unavailable, record a blocker. Do not simulate several stages in one context.

Workers and orchestrator must not depend on Git history, diff, branch, worktree/index state, commit identifiers, pull-request metadata, or external checks.

## Family resolution

Normalize the supplied name against official Material names, existing `MD*` exports, and family paths.

Ask for clarification only when readable workspace and official evidence leave multiple materially different official components unresolved.

Canonical family values are exact `components/` path segments, such as `button` or `loadingIndicator`.

## Mechanical orchestration

Follow `component-workflow.md` exactly:

1. Validate or refresh parent design.
2. Validate parent architecture, including exact design and renderer revisions.
3. When parent architecture has a non-empty dependency queue, process each listed dependency through its complete pipeline to successful current independent review.
4. Rerun parent architecture after all queued dependencies are current.
5. Follow exact `Required return family` and `Required return stage` values.
6. Validate every downstream artifact against the exact current upstream revision.
7. Continue parent and dependencies through current review.
8. Run one final workflow verification.
9. Complete only when it passes on the unchanged workspace.

Dependency queue syntax is:

```text
Dependency queue: none | <canonical-family>[; <canonical-family>...]
```

No dependency gates exist. A queued dependency is always processed through current independent review.

Artifacts from an older schema, missing required headings, containing invalid routing pairs, due for source refresh, recording a stale renderer revision, or referencing a replaced upstream revision are mechanically invalid.

## Stage execution

Launch only:

- `material-component-design`;
- `material-component-architecture`;
- `material-component-implementation`;
- `material-component-migration`;
- `material-component-review`.

After a worker returns, validate only that it produced its owned artifact, used valid required fields and headings, wrote a new artifact revision when content changed, and returned a compact stage result.

Semantic compliance belongs to the worker and later independent review.

## Dependency lifecycle

Read dependencies only from architecture fields.

For each queued family:

1. pause the parent;
2. process the dependency from its current durable state through successful current review;
3. record its executions in the compact ledger;
4. continue with the next dependency;
5. rerun parent architecture after the queue is complete.

Parent architecture then clears or recomputes the queue and becomes implementation-ready only when the queue is `none`.

Do not infer dependencies from imports or names. Do not run a separate final workflow verification for a dependency.

## Cross-family correction

When an artifact routes to another family, retain:

```text
origin: <origin-family>/<origin-stage>
target: <target-family>/<target-stage>
```

Then:

1. run the target family from the requested stage through successful current review;
2. rerun the exact origin stage in a fresh worker;
3. require the origin stage to clear or replace its route fields;
4. continue from the new origin result.

Do not reread the old route and relaunch the target before rerunning the origin stage.

A self-route runs the requested stage and all downstream stages normally. Nested cross-family routes use the same rule and unwind the most recent origin first.

## Durable continuation

Artifact revision links, not invocation-local memory, determine downstream freshness.

- architecture must reference current design revision;
- implementation must reference current architecture revision;
- migration must reference current implementation revision;
- review must reference current design, architecture, implementation, and migration revisions.

A mismatch launches the owning downstream stage. This rule applies after interruption or a new invocation.

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
verification: not-applicable | passed | failed | blocked
```

Do not retain or reproduce full worker reports or artifact prose. Correction cycles append another compact record.

## Final workflow verification

After current successful reviews, use the verification skill to run one read-only final command.

Ordinary Material component work uses:

```text
pnpm verify
```

Use `pnpm verify:release` only when the task itself changes release-sensitive infrastructure and verification explicitly selects it.

Do not delegate the final command to a stage or dependency.

## Verification failure routing

Do not classify verifier output in the orchestrator.

On failure:

1. retain the exact command and visible output;
2. launch a fresh independent review-routing worker with parent and dependency family context;
3. require exact return family and stage fields;
4. process the correction through self-route or cross-family origin rules;
5. rerun the same final command after all affected reviews are current.

If review records a genuine command blocker with both return fields `none`, stop and report it exactly.

## Stop conditions

Stop only for a blocker explicitly recorded by a stage artifact or review-routing pass:

- unavailable required official content or tools;
- unavailable fresh-worker isolation;
- unresolved architecture decision;
- required project command that cannot execute after applicable mechanisms are exhausted;
- unresolved concrete operator-reported defect;
- safety-required operator input.

A pending dependency, due source refresh, renderer revision change, stale downstream revision, ordinary finding, routable correction, absent positive visual acknowledgement, or missing repeated operator command is not a blocker.

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

Do not include full worker reports or copy stage-artifact contents.

## Forbidden

- Requiring one operator command per stage.
- Performing stage-owned reasoning or edits in the orchestrator.
- Selecting families or stages from prose.
- Using dependency gates.
- Returning to parent without rerunning the route-origin stage.
- Inferring dependencies from code.
- Interpreting verifier output without a fresh review-routing worker.
- Reusing one worker context for multiple stages.
- Depending on Git, PR, or external check state.
- Retaining full worker reports.
- Marking completion before final workflow verification passes.
