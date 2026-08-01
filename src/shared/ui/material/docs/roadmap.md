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
- exact artifact revisions and upstream revision links;
- source refresh and renderer revision invalidation;
- exact return family plus stage;
- cross-family origin-stage rerun after target correction;
- dependency families plus a gate-free dependency queue;
- full dependency pipelines through current independent review;
- parent architecture rerun after dependency completion;
- deterministic no-consumer standalone library scenario;
- implementation preflight before code and consumer edits;
- Git/PR-independent worker evidence;
- compact execution ledger instead of copied worker reports;
- one final post-review workflow verification;
- operator visual/motion feedback as a defect-reporting channel.

The workflow remains `implemented-unproven` until one real `material-component Button` invocation completes the pilot.

## Pilot artifact state

All existing pilot artifacts predate the expanded revision, dependency, routing, and heading contract.

The existing official design and runtime content remains useful, but every family must refresh from design because downstream artifacts do not record exact upstream artifact revisions.

### Loading Indicator

```text
DESIGN.md          refresh required for artifact/source metadata and headings
ARCHITECTURE.md    refresh required with exact design and renderer revisions
IMPLEMENTATION.md  refresh required with exact architecture revision
MIGRATION.md       refresh required with exact implementation revision
REVIEW.md          fresh independent review with all upstream revisions
```

Expected renderer revision: `@m3e/web@2.6.3` from the lockfile.

Operator visual status: `no-reported-defect`.

### Button

```text
DESIGN.md          refresh required for artifact/source metadata and headings
ARCHITECTURE.md    refresh required with dependency families and queue
IMPLEMENTATION.md  refresh required with exact architecture revision
MIGRATION.md       refresh required with exact implementation revision
REVIEW.md          fresh independent review with all upstream revisions
```

Button architecture must list `loadingIndicator` as a dependency and queue it only while its current review is unavailable.

Expected renderer revision: `@m3e/web@2.6.3` from the lockfile.

Operator visual status: `no-reported-defect`.

## Pilot scenarios that must be proven

The single invocation must prove:

1. both families receive normalized artifact revisions and source-refresh metadata;
2. Button architecture emits `Dependency families: loadingIndicator` and a gate-free pending queue;
3. Loading Indicator runs through its complete pipeline to current independent review;
4. Button architecture reruns after dependency completion and clears or recomputes the queue;
5. Button continues through implementation, migration, and independent review;
6. a cross-family correction route records origin and target, completes the target family, then reruns the exact origin stage before continuing;
7. the cross-family route is exercised by an actual finding or controlled routing check without injecting a production defect;
8. after at least one upstream artifact rewrite, invocation-local pending state is deliberately discarded and the next stage is reconstructed only from durable revision mismatches;
9. implementation and migration run preflight where edits or revalidation require it;
10. no worker depends on Git, PR, commit, or external-check state;
11. the compact ledger records workers, revisions, origins, targets, and correction routes without copying full reports;
12. one final `pnpm verify` runs after current reviews;
13. no second operator command is required.

## Exit criteria

The pilot is complete only when:

- Loading Indicator and Button satisfy every current artifact gate;
- dependencies complete through current review before parent implementation;
- parent architecture resume is unambiguous;
- cross-family correction returns to and refreshes its origin stage;
- durable revision links recover correctly after invocation-local state is discarded;
- source and renderer revision fields match current workspace facts;
- each reasoning stage uses a fresh isolated worker;
- preflight and focused verification are recorded where applicable;
- review uses `compliant-with-listed-risks` only for genuine bounded limitations;
- one final `pnpm verify` passes after current reviews;
- no operator-reported visual/motion defect remains unresolved.

## Milestones

| ID  | Milestone                           | Status                 | Exit gate                                                                                  |
| --- | ----------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------ |
| M0  | workflow architecture and rules     | `implemented-unproven` | pilot proves dependencies, routing, durable resume, review, and final verification         |
| M1a | Loading Indicator dependency family | `refresh-required`     | five successful revision-linked artifacts and no unresolved reported defect                |
| M1  | Button action family                | `refresh-required`     | dependency closure, five successful revision-linked artifacts, final verification          |
| M2  | Switch stateful pilot               | `planned`              | controlled state/event contract and no-consumer/default-scenario behavior through workflow |
| M3  | sequential component migration      | `planned`              | dependency-first autonomous family migrations                                              |

## Next operator action

Run once:

```text
material-component Button
```

The invocation must refresh Loading Indicator through current review, rerun Button architecture, continue Button through review, prove correction-origin and durable-resume behavior, and finish with one final `pnpm verify` without another operator command.

No manual artifact patch, separate dependency command, positive visual acknowledgement, local `verify:release`, dependency pin, worker registry, artifact hash system, workflow database, or generic adapter framework is required.