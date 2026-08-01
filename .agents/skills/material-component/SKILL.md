---
name: material-component
description: 'Use with one Material component name to mechanically orchestrate isolated design, architecture, implementation, migration, and review stages, then run one final workflow verification until completion or a recorded genuine blocker.'
---

# Material component

Accept exactly one operator input: the Material component name.

Do not require an implementation brief, mode, files, dependency list, verification command, or repeated invocation.

## Authority

Read applicable `AGENTS.md`, `src/shared/ui/material/docs/component-workflow.md`, `verification`, and the selected stage skill.

`component-workflow.md` is the single complete state-machine contract. Do not reconstruct it from README, roadmap, code, tests, or conversation context.

## Orchestrator boundary

The orchestrator may only:

- resolve canonical family names;
- validate fixed fields, headings, dates, artifact revisions, upstream revisions, and dependency review revisions;
- compare renderer revision with the lockfile;
- select an exact family/stage through fixed order, routing fields, or dependency queue;
- launch fresh isolated workers;
- retain a compact execution ledger and active route origins;
- run final read-only verification;
- pass exact verifier output to a fresh review-routing worker;
- report completion or a recorded blocker.

It must not evaluate design or architecture, inspect code for drift, discover consumers, infer dependencies or correction targets, review proof or visuals, classify verifier output, or edit stage-owned files.

## Worker boundary

Each stage runs in a fresh isolated context.

A handoff contains only the resolved family, selected stage skill, applicable rules, task-relevant workspace files, canonical artifact paths and revisions, and exact dependency, route, blocker, or verifier facts.

Do not pass hidden reasoning, copied worker reports, or conversational conclusions.

Review must be independent from workers that authored or corrected architecture, implementation, or migration.

If fresh isolation is unavailable, record a blocker. Workers and orchestrator do not depend on Git, PR, commit, branch, diff, or external-check state.

## Family resolution

Normalize the supplied name against official Material names, existing `MD*` exports, and family paths.

Ask only when readable workspace and official evidence leave multiple materially different official components unresolved.

Canonical family values are exact `components/` path segments, such as `button` or `loadingIndicator`.

## Mechanical orchestration

Follow `component-workflow.md` exactly.

For each artifact:

1. validate syntax, required headings, dates, renderer revision, upstream revision links, and dependency review revisions;
2. if invalid, run the owning stage before using any route stored in that artifact;
3. if valid and its return target is non-`none`, process the exact route;
4. otherwise run the owning stage when its success gate is not met.

A valid non-empty dependency queue pauses parent implementation. Process every queued dependency through its complete pipeline to successful current review, then rerun parent architecture.

No dependency gates exist.

Artifacts from an older schema, due for source refresh, recording a stale renderer revision, referencing a replaced upstream revision, or recording a replaced dependency review revision are mechanically invalid.

## Stage execution

Launch only:

- `material-component-design`;
- `material-component-architecture`;
- `material-component-implementation`;
- `material-component-migration`;
- `material-component-review`.

Validate only that the worker produced its owned artifact, used valid required fields and headings, wrote a new artifact revision when content changed, and returned a compact result.

Semantic compliance belongs to the worker and later review.

## Dependency lifecycle

Read only these architecture fields:

```text
Dependency families: none | <family>[; <family>...]
Dependency queue: none | <family>[; <family>...]
Dependency review revisions: none | <family>=<review revision>[; <family>=<review revision>...]
```

Validate that queue and review-revision families are disjoint and their union equals dependency families.

For each queued family:

1. pause the parent;
2. process the dependency from its durable state through successful current review;
3. record executions in the compact ledger;
4. continue with the next dependency;
5. rerun parent architecture after the queue is complete.

Before parent implementation or review, compare every recorded dependency review revision with the current dependency `REVIEW.md`. A mismatch runs parent architecture.

Do not infer dependencies from imports or names. Do not run a separate final verification for a dependency.

## Cross-family correction

When a valid artifact routes to another family, retain:

```text
origin: <origin-family>/<origin-stage>
target: <target-family>/<target-stage>
```

Then:

1. run the target family from the requested stage through successful current review;
2. rerun the exact origin stage in a fresh worker;
3. require origin to clear or replace its route;
4. continue from the new origin result.

Do not reread the old route and relaunch the target before origin reruns.

A self-route runs the requested stage and downstream stages normally. Nested routes unwind the most recent origin first.

## Durable continuation

Artifact revisions determine freshness after interruption:

- architecture records current design revision and current dependency review revisions;
- implementation records current architecture revision;
- migration records current implementation revision;
- review records current design, architecture, implementation, and migration revisions.

A mismatch launches the owning downstream stage. Invocation-local changed-stage memory is not required for correctness.

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

Do not retain full worker reports or artifact prose.

## Final workflow verification

After current successful reviews, run one read-only final command through `verification`.

Ordinary Material work uses:

```text
pnpm verify
```

Use `pnpm verify:release` only for actual release-sensitive infrastructure changes.

On failure, send exact command and output plus parent/dependency context to a fresh review-routing worker. Follow its exact route, rerun affected reviews, then rerun the same command.

## Stop conditions

Stop only for a recorded unavailable required source/tool, unavailable fresh isolation, unresolved architecture decision, project command that cannot execute after applicable mechanisms, unresolved concrete operator-reported defect, or safety-required input.

A pending dependency, due refresh, renderer change, dependency review change, stale downstream revision, ordinary finding, routable correction, absent positive visual acknowledgement, or missing repeated command is not a blocker.

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

Do not include full worker reports or copy stage artifacts.

## Forbidden

- Requiring one operator command per stage.
- Performing stage-owned reasoning or edits in the orchestrator.
- Selecting targets from prose.
- Using dependency gates.
- Ignoring changed dependency review revisions.
- Returning to parent without rerunning the route-origin stage.
- Interpreting verifier output without fresh review routing.
- Reusing one worker context for multiple stages.
- Depending on Git, PR, or external checks.
- Retaining full worker reports.
- Marking completion before final verification passes.
