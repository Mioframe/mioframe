# Mioframe Material migration roadmap

This file is the only owner of current Material milestone status, family-stage status, technical blockers, and next operator action. Durable rules live in the other canonical documents.

## Current state

Last updated: 2026-08-01

Current milestone: `M0/M1 — prove the autonomous staged workflow through the Loading Indicator/Button pilot`

Status: `in-progress`

Runtime implementation status: current Loading Indicator and Button runtime corrections are implemented; no runtime redesign is presently identified.

Workflow-rule status: the durable workflow now defines:

- one operator invocation;
- fresh isolated workers for five reasoning stages;
- one state-machine owner;
- fixed control fields and required headings;
- separate design artifact and design contract revisions;
- one fixed 30-calendar-day documentation refresh interval;
- metadata-only source refresh without downstream invalidation;
- exact artifact revisions and invalidating upstream links;
- exact dependency review revisions in parent architecture;
- exact earlier-stage or cross-family correction routes;
- terminal `blocked + none/none` semantics;
- prohibition of same-stage self-routes;
- no terminal `partial` or `stale` worker results;
- stage-contract blocking instead of automatic malformed-result retries;
- durable origin-family resume after cross-family correction;
- gate-free dependency queues and full dependency pipelines through current review;
- active dependency-path cycle detection;
- deterministic no-consumer standalone scenario without speculative state APIs;
- implementation preflight before code and consumer edits;
- Git/PR-independent worker evidence;
- compact execution ledger;
- one final post-review workflow verification;
- visual/motion feedback as a defect-reporting channel.

The workflow remains `implemented-unproven` until one real `material-component Button` invocation completes the pilot.

## Pilot artifact state

All existing pilot artifacts predate the final contract, terminal-state, dependency-cycle, correction-resume, revision-link, and heading rules.

The official design and runtime content remains useful, but both families must refresh from design once to normalize the new fields. Later metadata-only design refreshes must not cascade when contract revision remains unchanged.

### Loading Indicator

```text
DESIGN.md          refresh required for artifact/contract/source metadata
ARCHITECTURE.md    refresh required with exact design contract and renderer revisions
IMPLEMENTATION.md  refresh required with exact architecture revision and terminal status
MIGRATION.md       refresh required with exact implementation revision and terminal status
REVIEW.md          fresh independent review with design contract and downstream revisions
```

Expected renderer revision: `@m3e/web@2.6.3` from the lockfile.

Operator visual status: `no-reported-defect`.

### Button

```text
DESIGN.md          refresh required for artifact/contract/source metadata
ARCHITECTURE.md    refresh required with dependency families, queue, and review revisions
IMPLEMENTATION.md  refresh required with exact architecture revision and terminal status
MIGRATION.md       refresh required with exact implementation revision and terminal status
REVIEW.md          fresh independent review with design contract and downstream revisions
```

Button architecture must list `loadingIndicator` as a dependency, queue it only while its review is not current, and then record the exact Loading Indicator review revision.

Expected renderer revision: `@m3e/web@2.6.3` from the lockfile.

Operator visual status: `no-reported-defect`.

## Pilot scenarios that must be proven

The single invocation must prove:

1. both families receive normalized artifact revisions, design contract revisions, and source-refresh metadata;
2. refresh interval is exactly 30 calendar days;
3. metadata-only design refresh changes artifact revision and dates, preserves design contract revision, and does not run downstream stages;
4. Loading Indicator completes through its full pipeline to current review;
5. Button architecture reruns, clears its queue, and records the exact Loading Indicator review revision;
6. Button completes through current review;
7. a valid correction route targets an earlier stage or another family and executes once;
8. a synthetic terminal `blocked + none/none` result stops orchestration without rerunning the worker;
9. a synthetic same-stage self-route is rejected as a stage-contract blocker without retry;
10. a synthetic terminal `partial` or `stale` worker result is rejected as a stage-contract blocker;
11. when a real cross-family correction occurs, target completion is followed by durable origin validation and fresh origin-stage execution;
12. a dependency-review change forces parent architecture and required downstream stages before parent review is reused;
13. interrupted execution resumes only from durable revision mismatches;
14. a non-production self- or ancestor-dependency simulation is detected through the active path without writing a cyclic artifact;
15. implementation and migration preflight and focused verification are recorded;
16. no worker depends on Git, PR, commit, or external-check state;
17. one final `pnpm verify` passes without a second operator command.

Do not inject a production defect or persist invalid artifacts solely to exercise routing. Terminal-state, malformed-result, and cycle checks may use orchestrator-level synthetic control-field inputs while durable family artifacts remain valid.

## Exit criteria

The pilot is complete only when:

- Loading Indicator and Button satisfy every current artifact gate;
- metadata-only refresh does not invalidate downstream work;
- design contract changes still invalidate architecture correctly;
- dependencies complete through current review before parent implementation;
- parent architecture records current dependency review revisions;
- dependency cycles stop without recursive execution or persisted invalid artifacts;
- terminal blockers stop once without retry;
- same-stage self-routes, terminal `partial`, and terminal `stale` are rejected without loops;
- valid correction routes execute and clear through fresh downstream artifacts;
- cross-family correction resumes the origin through durable validation and fresh origin-stage execution;
- durable revision links recover after invocation-local state is discarded;
- source and renderer revision fields match current workspace facts;
- each reasoning stage uses a fresh isolated worker;
- review uses `compliant-with-listed-risks` only for genuine bounded limitations;
- one final `pnpm verify` passes;
- no operator-reported visual/motion defect remains unresolved.

## Milestones

| ID  | Milestone                           | Status                 | Exit gate                                                                                  |
| --- | ----------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------ |
| M0  | workflow architecture and rules     | `implemented-unproven` | pilot proves terminal states, refresh, dependencies, correction, resume, and final verifier |
| M1a | Loading Indicator dependency family | `refresh-required`     | five successful revision-linked artifacts and no unresolved reported defect               |
| M1  | Button action family                | `refresh-required`     | dependency linkage, terminal-state safety, five current artifacts, final verification     |
| M2  | Switch stateful pilot               | `planned`              | controlled state/event contract and no-consumer/default-scenario behavior through workflow |
| M3  | sequential component migration      | `planned`              | dependency-first autonomous family migrations                                             |

## Next operator action

Run once:

```text
material-component Button
```

The invocation must refresh Loading Indicator through current review, rerun Button architecture, record the dependency review revision, continue Button through review, prove metadata-only refresh, terminal-state safety, route safety, cycle protection, durable resume where applicable, and finish with one final `pnpm verify` without another operator command.

No manual artifact patch, separate dependency command, positive visual acknowledgement, local `verify:release`, dependency pin, worker registry, artifact hash system, workflow database, or generic adapter framework is required.