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
- validate fixed fields, headings, dates, artifact revisions, design contract revisions, upstream revisions, and dependency review revisions;
- compare renderer revision with the lockfile;
- select an exact family/stage through fixed order, routing fields, or dependency queue;
- maintain an invocation-local active dependency path;
- detect repeated family names in that path;
- launch fresh isolated workers;
- retain a compact execution ledger and active route origins;
- run final read-only verification;
- pass exact verifier output to a fresh review-routing worker;
- report completion or a recorded blocker.

It must not evaluate design or architecture, inspect code for drift, discover consumers, infer dependencies or correction targets, review proof or visuals, classify verifier output, or edit stage-owned files.

## Worker boundary

Each stage runs in a fresh isolated context.

A handoff contains only the resolved family, selected stage skill, applicable rules, task-relevant workspace files, canonical artifact paths and revisions, active dependency path, and exact dependency, route, blocker, or verifier facts.

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

1. validate syntax, required headings, dates, renderer revision, invalidating upstream revision links, dependency review revisions, and dependency invariants;
2. if invalid, run the owning stage before using any route stored in that artifact;
3. if valid and its return target is non-`none`, process the exact route;
4. otherwise run the owning stage when its success gate is not met.

A valid non-empty dependency queue pauses parent implementation. Process every queued dependency through its complete pipeline to successful current review, then rerun parent architecture.

No dependency gates exist.

A metadata-only design refresh that preserves `Design contract revision` does not invalidate architecture or later stages.

Artifacts from an older schema, recording a changed design contract revision, stale renderer revision, replaced dependency review revision, or replaced direct upstream artifact revision are mechanically invalid.

## Stage execution

Launch only:

- `material-component-design`;
- `material-component-architecture`;
- `material-component-implementation`;
- `material-component-migration`;
- `material-component-review`.

Validate only that the worker produced its owned artifact, used valid required fields and headings, updated the correct revision fields, and returned a compact result.

Semantic compliance belongs to the worker and later review.

## Design refresh

The common refresh interval is 30 calendar days.

Run design when:

- current date is on or after `Refresh check after`;
- design status is `stale` or `blocked`;
- explicit official source-change evidence is provided by the workflow.

After design returns:

- use `Artifact revision` only as the file-update identity;
- use `Design contract revision` as the downstream invalidation identity;
- do not rerun architecture when only artifact/source-check metadata changed and design contract revision stayed exact.

## Dependency lifecycle

Read only these architecture fields:

```text
Dependency families: none | <family>[; <family>...]
Dependency queue: none | <family>[; <family>...]
Dependency review revisions: none | <family>=<review revision>[; <family>=<review revision>...]
```

Validate that queue and review-revision families are disjoint and their union equals dependency families.

Start the active dependency path with the requested parent family.

Before entering a queued family:

- if it equals the current family; or
- if it already exists in the active dependency path;

then a dependency cycle exists.

On cycle:

1. stop descending;
2. construct the exact path, for example `button → loadingIndicator → button`;
3. launch architecture for the family that emitted the cyclic dependency;
4. pass the exact detected path;
5. require architecture to correct dependency ownership or record a genuine blocker;
6. resume through the normal durable state machine.

For a valid queued family:

1. append it to the active dependency path;
2. process it from its durable state through successful current review;
3. record executions in the compact ledger;
4. remove it from the active path when returning;
5. continue with the next dependency;
6. rerun parent architecture after the queue is complete.

Before parent implementation or review, compare every recorded dependency review revision with the current dependency `REVIEW.md`. A mismatch runs parent architecture.

Do not infer dependencies from imports or names. Do not run separate final verification for a dependency.

## Cross-family correction

When a valid artifact routes to another family, retain:

```text
origin: <origin-family>/<origin-stage>
target: <target-family>/<target-stage>
```

Then:

1. run the target family from the requested stage through successful current review;
2. resume the origin family through its ordinary durable state machine from design forward;
3. run any earlier mechanically invalid stage and all required downstream stages;
4. always execute the origin stage in a fresh worker before considering the route resolved;
5. require the fresh origin result to clear or replace its route;
6. continue from that result.

Do not reread the old route and relaunch the target before a fresh origin-stage result exists.

A self-route runs the requested stage and downstream stages normally. Nested routes unwind the most recent origin first.

## Durable continuation

Invalidating revisions determine freshness after interruption:

- architecture records current design contract revision and current dependency review revisions;
- implementation records current architecture artifact revision;
- migration records current implementation artifact revision;
- review records current design contract revision and current architecture, implementation, and migration artifact revisions.

Design artifact revision alone is not an invalidator.

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
dependency path: none | <family>[ → <family>...]
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

On failure, send exact command and output plus parent/dependency context to a fresh review-routing worker. Follow its exact route, resume affected origin families through durable validation, rerun affected reviews, then rerun the same command.

## Stop conditions

Stop only for a recorded unavailable required source/tool, unavailable fresh isolation, unresolved architecture decision, project command that cannot execute after applicable mechanisms, unresolved concrete operator-reported defect, or safety-required input.

A metadata-only design refresh, pending dependency, dependency cycle that can be routed to architecture, renderer change, dependency review change, stale downstream revision, ordinary finding, routable correction, absent positive visual acknowledgement, or missing repeated command is not a blocker.

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
- Treating design metadata refresh as a contract change.
- Ignoring dependency cycles or changed dependency review revisions.
- Returning directly to an origin stage without first applying durable validation to the origin family.
- Interpreting verifier output without fresh review routing.
- Reusing one worker context for multiple stages.
- Depending on Git, PR, or external checks.
- Retaining full worker reports.
- Marking completion before final verification passes.
