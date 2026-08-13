---
name: material-component
description: 'Use with one Material component name to mechanically orchestrate isolated design, architecture, implementation, migration, and review stages, then run one final workflow verification until completion or a genuine blocker.'
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
- validate fixed fields, headings, dates, invalidating revisions, routes, and terminal-state invariants;
- compare renderer and dependency-review revisions with current workspace facts;
- process explicit dependency queues and routes;
- maintain an invocation-local dependency path and route stack;
- launch fresh isolated workers;
- retain a compact execution ledger;
- run final read-only verification;
- pass exact verifier output to a fresh review-routing worker;
- stop on a genuine family blocker, external workspace blocker, or malformed worker result.

It must not evaluate design or architecture, inspect code for drift, discover consumers, infer dependencies or correction targets, review proof or visuals, classify verifier output, or edit stage-owned files.

## Worker boundary

Each stage runs in a fresh isolated context.

A handoff contains only the resolved family, selected stage skill, applicable rules, task-relevant workspace files, canonical artifact paths and revisions, active dependency path, and exact dependency, route, blocker, or verifier facts.

Do not pass hidden reasoning, copied worker reports, or conversational conclusions.

Review must be independent from workers that authored or corrected architecture, implementation, or migration.

If fresh isolation is unavailable, stop with a genuine blocker. Workers and orchestrator do not depend on Git, PR, commit, branch, diff, or external-check state.

## Family resolution

Normalize the supplied name against official Material names, existing `MD*` exports, and family paths.

Ask only when readable workspace and official evidence leave multiple materially different official components unresolved.

Canonical family values are exact `components/` path segments, such as `button` or `loadingIndicator`.

## Stage order and route restrictions

Stage order is:

```text
design < architecture < implementation < migration < review
```

A same-family route must target a strictly earlier stage than the artifact that emits it.

Same-stage self-routes and routes to review are forbidden. A route to another family may target design, architecture, implementation, or migration.

## Executable artifact-time validation

Artifact timestamp validation is an executed gate, not a prose judgment.

After every ordinary stage worker writes its artifact and before the orchestrator accepts that worker result, run the following command with the artifact path as the final argument:

```text
node --input-type=module -e "import fs from 'node:fs'; const p=process.argv[1]; const text=fs.readFileSync(p,'utf8'); const match=text.match(/^Artifact revision: (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)$/m); if (!match) { console.error('Invalid or missing Artifact revision in ' + p); process.exit(2); } const revisionMs=Date.parse(match[1]); const nowMs=Date.now(); if (!Number.isFinite(revisionMs) || revisionMs > nowMs) { console.error('Future or invalid Artifact revision in ' + p + ': ' + match[1] + ' > ' + new Date(nowMs).toISOString()); process.exit(1); }" <artifact-path>
```

The validator reads the stored artifact and a fresh runtime clock independently from the worker. Do not replace it with mental comparison, conversation timestamps, local wall-clock time, Git/commit time, or a worker-reported assertion.

If this command exits non-zero for a worker-produced artifact, treat the returned worker result as malformed and stop with `stage-contract-blocked`. Do not accept the artifact, continue downstream, or run final workflow verification. If an already-stored artifact fails this check before its owning stage runs, it is mechanically invalid and the normal one-stage regeneration rule applies.

The `Z` suffix means UTC. A timestamp produced by taking local time and merely appending `Z` is invalid even when its shape matches the regex; the post-write comparison catches the resulting future value when the local zone is ahead of UTC.

## Mechanical orchestration

For each artifact in stage order:

1. Validate fields, headings, dates, revisions, dependency invariants, route restrictions, status invariants, and the executable artifact-time gate above.
2. If the stored artifact is mechanically invalid or externally `stale`, run the owning stage once.
3. Validate the worker result, including executing the artifact-time gate against the newly written artifact. If malformed, `stale`, `partial`, timestamp-invalid, or routed to the same family and same stage, stop with a stage-contract blocker. Do not rerun the worker automatically.
4. If status/verdict is blocked and route is non-`none`, execute the exact correction route.
5. If status/verdict is blocked and route is `none/none`, stop with the exact genuine blocker.
6. If the success gate passes, continue.
7. Any other combination is a stage-contract blocker; do not infer a retry.

A worker must fix defects owned by its current stage before returning. If the stage remains impossible after available mechanisms are exhausted, it returns terminal `blocked` with route `none/none`.

Old `partial` artifacts are mechanically invalid and cause one owning-stage execution. A worker must never return `partial`.

A metadata-only design refresh that preserves `Design contract revision` does not invalidate downstream stages.

## Stage execution

Launch only:

- `material-component-design`;
- `material-component-architecture`;
- `material-component-implementation`;
- `material-component-migration`;
- `material-component-review`.

After each ordinary stage worker returns, validate only its owned artifact, fixed fields, headings, revisions, route, terminal result, and executable artifact-time gate. Semantic compliance belongs to the worker and later independent review.

Final-verifier routing is a mode of `material-component-review`. For an external workspace blocker it returns a compact routing result without editing a family artifact.

## Design refresh

The common refresh interval is 30 calendar days.

Run design when its refresh date is due, status is externally `stale`, or canonical workflow evidence records a newer official source revision.

After design returns, use `Artifact revision` only as file identity and `Design contract revision` as downstream invalidation identity.

Design terminal states are `current` and `blocked`. A design worker must not return `stale` or `self/design`.

## Dependency lifecycle

Read only:

```text
Dependency families: none | <family>[; <family>...]
Dependency queue: none | <family>[; <family>...]
Dependency review revisions: none | <family>=<review revision>[; <family>=<review revision>...]
```

Queue and review-revision families must be disjoint and their union must equal dependency families.

Start the active dependency path with the requested parent family.

Before entering a queued family, detect whether it equals the current family or already exists in the active path.

On a cycle:

1. stop descending;
2. construct the exact cycle path;
3. run architecture once for the family that emitted the cyclic dependency;
4. require architecture to remove the cycle or return terminal `blocked` with route `none/none`;
5. validate that worker result under the normal rules.

For a valid dependency, append it to the path, process it through current independent review, remove it when returning, then continue. Rerun parent architecture after its queue is complete.

Before parent implementation or review, compare every recorded dependency review revision with current dependency review. A mismatch runs parent architecture.

Do not infer dependencies from imports or names. Do not run separate final verification for dependencies.

## Correction routing

### Same-family route

A valid same-family route targets an earlier stage. Run that stage and normal downstream stages; the emitting stage is naturally executed again.

### Cross-family route

Retain:

```text
origin: <origin-family>/<origin-stage>
target: <target-family>/<target-stage>
```

Run the target from its requested stage through current review. Then resume the origin through durable validation from design forward, execute any earlier invalid stages, and always execute the stored origin stage fresh.

The fresh origin result must clear the route, replace it with a different valid route, or return terminal `blocked`. Do not execute the old target again before that result exists.

Nested routes unwind the most recent origin first.

## Durable continuation

Invalidating links are:

```text
DESIGN contract revision → ARCHITECTURE
Dependency REVIEW revisions → parent ARCHITECTURE
ARCHITECTURE artifact revision → IMPLEMENTATION
IMPLEMENTATION artifact revision → MIGRATION
DESIGN contract + ARCHITECTURE + IMPLEMENTATION + MIGRATION revisions → REVIEW
```

Invocation-local changed-stage memory is not required for correctness.

## Final workflow verification

After current successful reviews, run one read-only final command through `verification`.

Ordinary Material work uses:

```text
pnpm verify
```

On failure, send the exact command, visible output, parent/dependency context, and current family review revisions to a fresh `material-component-review` worker in final-verifier-routing mode.

### Material-owned result

When the routing worker identifies an exact Material family and earliest stage:

1. validate that only the owning family review was changed;
2. follow the exact correction route;
3. resume affected families through durable validation;
4. rerun affected independent reviews;
5. rerun the same final command.

### External workspace blocker

When the routing worker returns:

```text
Classification: external-workspace-blocker
Required return family: none
Required return stage: none
Family reviews changed: none
Status: blocked
```

then:

1. verify that no family `REVIEW.md` changed;
2. preserve all compliant family review revisions and dependency gates;
3. stop the invocation with overall status `blocked`;
4. record the exact command, failed external contract, and evidence in the outer final report;
5. update the mutable roadmap/status owner when the invocation is being durably recorded;
6. set the next action to the verifier-prescribed focused command followed by the original final command;
7. do not rebuild current Material artifacts after the external owner fixes the failure unless a durable revision mismatch independently requires it.

A non-failing external warning does not change a family review. Whether it blocks completion follows the root verification contract.

The outer final-command result never changes a compliant family review merely because the command failed elsewhere.

## Compact execution ledger

Retain one record per worker execution:

```text
family: <canonical-family>
stage: design | architecture | implementation | migration | review
result: complete | blocked | stage-contract-blocked
artifact: <path>
artifact revision: <exact Artifact revision>
origin: none | <canonical-family>/<stage>
target: none | <canonical-family>/<stage>
dependency path: none | <family>[ → <family>...]
verification: not-applicable | passed | failed | blocked
```

For final-verifier routing also retain:

```text
classification: material-owned | external-workspace-blocker
family reviews changed: none | <canonical-family>
```

Do not retain full worker reports or artifact prose.

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
Final verifier classification: none | material-owned | external-workspace-blocker
Operator visual status: no-reported-defect | defect-reported | not-applicable
Remaining blocker: none | <exact blocker>
Overall family status: complete | blocked
Next operator action: none | <single required action>
```

A family may remain `compliant` and ready while the outer result is blocked by an external workspace contract.

## Forbidden

- Requiring one operator command per stage.
- Performing stage-owned reasoning or edits in the orchestrator.
- Selecting routes from prose.
- Retrying terminal `blocked` with route `none/none`.
- Accepting `partial`, terminal `stale`, a timestamp-invalid artifact, or a same-stage self-route from a worker.
- Replacing executable artifact-time validation with mental/prose comparison or worker self-attestation.
- Writing an external verifier failure into a family `REVIEW.md`.
- Invalidating dependency gates because an unrelated workspace test failed.
- Using dependency gates.
- Ignoring dependency cycles or revision mismatches.
- Returning directly to an origin stage without durable validation.
- Interpreting verifier output without fresh review routing.
- Reusing one worker context for multiple stages.
- Depending on Git, PR, or external checks.
- Marking completion before final verification passes.
